const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Velocidad media urbana SD (fallback si falla la ruta por carretera) */
export function estimateDurationMin(distanceKm: number): number {
  const avgSpeedKmh = 35;
  return Math.max(3, Math.round((distanceKm / avgSpeedKmh) * 60));
}

/** Línea recta × factor vial típico en ciudad */
export function estimateRoadDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return haversineKm(lat1, lng1, lat2, lng2) * 1.32;
}

/** Centro aproximado: Santo Domingo, RD */
export const DEFAULT_CENTER = { lat: 18.4861, lng: -69.9312 };

/** Área metropolitana Santo Domingo (lng/lat) para acotar búsquedas locales */
export const SD_METRO_BBOX = {
  minLng: -70.12,
  minLat: 18.38,
  maxLng: -69.72,
  maxLat: 18.58,
};

export function sortPlacesByDistance<T extends { lat: number; lng: number }>(
  places: T[],
  focus: { lat: number; lng: number },
  maxKm = 80
): (T & { distanceKm: number })[] {
  return places
    .map((p) => ({
      place: p,
      distanceKm: haversineKm(focus.lat, focus.lng, p.lat, p.lng),
    }))
    .filter(({ distanceKm }) => distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .map(({ place, distanceKm }) => ({ ...place, distanceKm }));
}

/**
 * Normaliza abreviaturas dominicanas y evita confusiones (CR ≠ Costa Rica).
 */
export function normalizeDominicanAddressQuery(query: string): string {
  let q = query.trim();
  if (q.length < 2) return q;

  q = q.replace(/,\s*CR\b/gi, ", Ciudad Real, Santo Domingo");
  q = q.replace(/\bCR,\s*/gi, "Ciudad Real, ");
  q = q.replace(/\bSD\b/gi, "Santo Domingo");

  if (/los\s+hidalgos/i.test(q) && !/alcarrizos|santo domingo oeste/i.test(q)) {
    q = q.replace(
      /residencial\s+los\s+hidalgos|los\s+hidalgos/gi,
      "Residencial Los Hidalgos, Los Alcarrizos, Santo Domingo Oeste"
    );
  }

  if (/navieros/i.test(q) && !/ciudad real|haina|república/i.test(q)) {
    q = `${q}, Ciudad Real, Santo Domingo`;
  }

  return q;
}

/** Si el usuario no escribe ciudad, priorizar Santo Domingo, RD */
export function enhanceLocalQuery(query: string): string {
  const q = normalizeDominicanAddressQuery(query);
  if (q.length < 2) return q;

  const hasLocality =
    /santo domingo|distrito nacional|república dominicana|rep\.?\s*dom|,\s*rd\b/i.test(
      q
    ) || /\bDN\b/i.test(q);

  if (!hasLocality && q.length < 48) {
    return `${q}, Santo Domingo, República Dominicana`;
  }
  return q;
}

export const DEMO_LOCATIONS = [
  { name: "Zona Colonial", lat: 18.4734, lng: -69.8842 },
  { name: "Piantini", lat: 18.4719, lng: -69.9422 },
  { name: "Aeropuerto Las Américas", lat: 18.4297, lng: -69.6689 },
  { name: "Blue Mall", lat: 18.4882, lng: -69.9401 },
  { name: "Universidad APEC", lat: 18.5078, lng: -69.9556 },
];
