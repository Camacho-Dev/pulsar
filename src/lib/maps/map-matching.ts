import { MAPBOX_TOKEN } from "@/lib/mapbox";
import type { GpsPoint, MatchedPoint } from "./types";

const BASE = "https://api.mapbox.com/matching/v5/mapbox/driving";

/**
 * Map matching: “pega” el GPS a la calle más cercana (Mapbox Map Matching API).
 */
export async function snapToRoad(point: GpsPoint): Promise<MatchedPoint | null> {
  if (!MAPBOX_TOKEN) return { ...point, confidence: 0.5 };

  const coord = `${point.lng},${point.lat}`;
  const url =
    `${BASE}/${coord}.json?` +
    `access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&radiuses=25`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const match = data.matchings?.[0];
    const snapped = match?.geometry?.coordinates?.at(-1) as
      | [number, number]
      | undefined;

    if (!snapped) return null;

    const street = data.tracepoints?.[0]?.name as string | undefined;

    return {
      lng: snapped[0],
      lat: snapped[1],
      street,
      confidence: match.confidence ?? 0.8,
    };
  } catch {
    return null;
  }
}

/** Snap solo si la precisión GPS es mala (> umbral metros) */
export async function snapIfNeeded(
  point: GpsPoint,
  accuracyThresholdM = 25
): Promise<GpsPoint & { matched?: boolean }> {
  if (point.accuracy != null && point.accuracy <= accuracyThresholdM) {
    return point;
  }

  const matched = await snapToRoad(point);
  if (!matched) return point;

  return {
    lat: matched.lat,
    lng: matched.lng,
    accuracy: point.accuracy,
    speed: point.speed,
    heading: point.heading,
    timestamp: point.timestamp,
    matched: true,
  };
}
