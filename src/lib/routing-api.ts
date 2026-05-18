import type { Place } from "./places";
import {
  DEFAULT_CENTER,
  SD_METRO_BBOX,
  enhanceLocalQuery,
  normalizeDominicanAddressQuery,
  sortPlacesByDistance,
} from "./geo";
import { matchKnownPlace } from "./known-places";
import { hasOrsKey, ORS_API_KEY } from "./ors";
import { MAPBOX_TOKEN } from "./mapbox";

const SEARCH_RADIUS_KM = 55;

const BASE_ORS = "https://api.openrouteservice.org";
const BASE_MAPBOX = "https://api.mapbox.com";

export interface DirectionsResult {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
}

function orsHeaders() {
  return { Authorization: ORS_API_KEY };
}

function fallbackPlace(lat: number, lng: number): Place {
  return {
    id: "current",
    name: "Tu ubicación",
    address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    lat,
    lng,
  };
}

type OrsFeature = {
  geometry: { coordinates: [number, number] | string };
  properties: { label?: string; name?: string };
};

function parseOrsCoords(coords: [number, number] | string): { lng: number; lat: number } {
  if (Array.isArray(coords)) {
    return { lng: coords[0], lat: coords[1] };
  }
  const [lng, lat] = String(coords).split(/\s+/).map(Number);
  return { lng, lat };
}

async function orsSearch(
  query: string,
  proximity?: { lng: number; lat: number }
): Promise<Place[]> {
  const focus = proximity ?? DEFAULT_CENTER;
  const searchText = enhanceLocalQuery(query);

  const params = new URLSearchParams({
    text: searchText,
    "boundary.country": "DO",
    size: "12",
    lang: "es",
    "focus.point.lon": String(focus.lng),
    "focus.point.lat": String(focus.lat),
    "boundary.circle.lon": String(focus.lng),
    "boundary.circle.lat": String(focus.lat),
    "boundary.circle.radius": String(SEARCH_RADIUS_KM),
  });

  const res = await fetch(`${BASE_ORS}/geocode/search?${params}`, {
    headers: orsHeaders(),
  });
  if (!res.ok) return [];

  const data = await res.json();
  const places = (data.features as OrsFeature[]).map((f, i) => {
    const { lng, lat } = parseOrsCoords(f.geometry.coordinates);
    return {
      id: `ors-${i}-${lng},${lat}`,
      name: f.properties.name ?? f.properties.label?.split(",")[0] ?? "Lugar",
      address: f.properties.label ?? f.properties.name ?? "",
      lng,
      lat,
    };
  });

  return rankPlaces(places, focus, query);
}

async function orsReverse(lat: number, lng: number): Promise<Place> {
  const params = new URLSearchParams({
    "point.lon": String(lng),
    "point.lat": String(lat),
    lang: "es",
  });

  const res = await fetch(`${BASE_ORS}/geocode/reverse?${params}`, {
    headers: orsHeaders(),
  });

  if (!res.ok) return fallbackPlace(lat, lng);

  const data = await res.json();
  const f = data.features?.[0] as OrsFeature | undefined;
  if (!f) return fallbackPlace(lat, lng);

  const parsed = parseOrsCoords(f.geometry.coordinates);
  return {
    id: "current",
    name: f.properties.name ?? "Tu ubicación",
    address: f.properties.label ?? "Ubicación actual",
    lng: parsed.lng,
    lat: parsed.lat,
  };
}

async function orsDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<DirectionsResult | null> {
  const res = await fetch(`${BASE_ORS}/v2/directions/driving-car/geojson`, {
    method: "POST",
    headers: { ...orsHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  const summary = feature.properties?.summary;
  return {
    coordinates: feature.geometry.coordinates as [number, number][],
    distanceKm: Math.round((summary.distance / 1000) * 100) / 100,
    durationMin: Math.max(1, Math.round(summary.duration / 60)),
  };
}

type MapboxFeature = {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
};

function relevanceScore(originalQuery: string, place: Place): number {
  const q = originalQuery.toLowerCase();
  const name = place.name.toLowerCase();
  const addr = place.address.toLowerCase();
  let score = place.id.startsWith("known-") ? 500 : 0;

  if (
    /^santo domingo$/i.test(place.name.trim()) &&
    /residencial|urbanización|los\s+hidalgos|barrio|sector|edificio/i.test(q)
  ) {
    score -= 200;
  }

  if (/hidalgos/i.test(q)) {
    if (addr.includes("alcarrizos") || name.includes("hidalgos")) score += 90;
    if (addr.includes("puerto plata") || name.includes("puerto plata")) score -= 200;
  }

  if (/navieros/i.test(q)) {
    if (addr.includes("ciudad real") || name.includes("navieros")) score += 70;
    if (addr.includes("haina") && !/haina/i.test(q)) score -= 40;
  }

  const tokens = q.split(/[\s,]+/).filter((t) => t.length > 3);
  for (const token of tokens) {
    if (name.includes(token) || addr.includes(token)) score += 10;
  }

  return score;
}

function rankPlaces(
  places: Place[],
  focus: { lat: number; lng: number },
  originalQuery: string
): Place[] {
  const ranked = sortPlacesByDistance(places, focus, SEARCH_RADIUS_KM);
  return ranked
    .map((p) => ({
      ...p,
      distanceKm: Math.round(p.distanceKm * 10) / 10,
      _score: relevanceScore(originalQuery, p) - p.distanceKm,
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 8)
    .map(({ _score, ...p }) => p);
}

async function mapboxSearch(
  query: string,
  proximity?: { lng: number; lat: number }
): Promise<Place[]> {
  if (!MAPBOX_TOKEN || query.trim().length < 2) return [];

  const focus = proximity ?? DEFAULT_CENTER;
  const searchText = enhanceLocalQuery(query);
  const encoded = encodeURIComponent(searchText);
  const bbox = `${SD_METRO_BBOX.minLng},${SD_METRO_BBOX.minLat},${SD_METRO_BBOX.maxLng},${SD_METRO_BBOX.maxLat}`;

  const url =
    `${BASE_MAPBOX}/geocoding/v5/mapbox.places/${encoded}.json?` +
    `access_token=${MAPBOX_TOKEN}&country=do&language=es&limit=10` +
    `&proximity=${focus.lng},${focus.lat}&bbox=${bbox}` +
    `&types=address,neighborhood,poi,place`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const places = (data.features as MapboxFeature[]).map((f) => ({
    id: f.id,
    name: f.text,
    address: f.place_name,
    lng: f.center[0],
    lat: f.center[1],
  }));

  const ranked = rankPlaces(places, focus, query);
  if (ranked.length > 0) return ranked;

  // Sin resultados en el bbox: reintentar solo con país + proximidad
  const fallbackUrl =
    `${BASE_MAPBOX}/geocoding/v5/mapbox.places/${encoded}.json?` +
    `access_token=${MAPBOX_TOKEN}&country=do&language=es&limit=10` +
    `&proximity=${focus.lng},${focus.lat}`;

  const fallbackRes = await fetch(fallbackUrl);
  if (!fallbackRes.ok) return [];

  const fallbackData = await fallbackRes.json();
  const fallbackPlaces = (fallbackData.features as MapboxFeature[]).map((f) => ({
    id: f.id,
    name: f.text,
    address: f.place_name,
    lng: f.center[0],
    lat: f.center[1],
  }));

  return rankPlaces(fallbackPlaces, focus, query);
}

async function mapboxReverse(lat: number, lng: number): Promise<Place> {
  if (!MAPBOX_TOKEN) return fallbackPlace(lat, lng);

  const url =
    `${BASE_MAPBOX}/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
    `access_token=${MAPBOX_TOKEN}&language=es&limit=1`;

  const res = await fetch(url);
  if (!res.ok) return fallbackPlace(lat, lng);

  const data = await res.json();
  const f = data.features?.[0] as MapboxFeature | undefined;
  if (!f) return fallbackPlace(lat, lng);

  return {
    id: "current",
    name: f.text,
    address: f.place_name,
    lat,
    lng,
  };
}

async function mapboxDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<DirectionsResult | null> {
  if (!MAPBOX_TOKEN) return null;

  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url =
    `${BASE_MAPBOX}/directions/v5/mapbox/driving/${coords}?` +
    `access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;

  return {
    coordinates: route.geometry.coordinates,
    distanceKm: Math.round((route.distance / 1000) * 100) / 100,
    durationMin: Math.max(1, Math.round(route.duration / 60)),
  };
}

/** ORS (HeiGIT) primero; Mapbox como respaldo */
export async function searchPlaces(
  query: string,
  proximity?: { lng: number; lat: number }
): Promise<Place[]> {
  if (query.trim().length < 2) return [];
  const focus = proximity ?? DEFAULT_CENTER;

  const known = matchKnownPlace(query);
  const knownList = known ? [known] : [];

  if (hasOrsKey()) {
    const results = await orsSearch(query, proximity);
    if (results.length > 0) {
      return mergeKnownFirst(knownList, results, focus, query);
    }
  }

  const mapbox = await mapboxSearch(query, proximity);
  return mergeKnownFirst(knownList, mapbox, focus, query);
}

function mergeKnownFirst(
  known: Place[],
  apiResults: Place[],
  focus: { lat: number; lng: number },
  originalQuery: string
): Place[] {
  const merged = [...known];
  for (const p of apiResults) {
    if (merged.some((k) => k.id === p.id || haversineSame(k, p))) continue;

    const addr = p.address.toLowerCase();
    if (
      known.some((k) => k.id === "known-navieros-cr") &&
      /navieros/i.test(originalQuery) &&
      addr.includes("haina") &&
      !/haina/i.test(originalQuery)
    ) {
      continue;
    }

    merged.push(p);
  }
  return rankPlaces(merged, focus, originalQuery);
}

function haversineSame(a: Place, b: Place): boolean {
  return Math.abs(a.lat - b.lat) < 0.002 && Math.abs(a.lng - b.lng) < 0.002;
}

export async function reverseGeocode(lat: number, lng: number): Promise<Place> {
  if (hasOrsKey()) return orsReverse(lat, lng);
  return mapboxReverse(lat, lng);
}

export async function getDrivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<DirectionsResult | null> {
  if (hasOrsKey()) {
    const route = await orsDirections(from, to);
    if (route) return route;
  }
  return mapboxDirections(from, to);
}
