/**
 * Polyline encoding (Google/Mapbox).
 * Coordenadas internas: [lng, lat] (GeoJSON).
 * El algoritmo codifica lat,lng en ese orden.
 */

function encodeValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let encoded = "";
  while (v >= 0x20) {
    encoded += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  encoded += String.fromCharCode(v + 63);
  return encoded;
}

/** [lng, lat][] → string compacto */
export function encodePolyline(coordinates: [number, number][]): string {
  if (coordinates.length === 0) return "";

  let lastLat = 0;
  let lastLng = 0;
  let result = "";

  for (const [lng, lat] of coordinates) {
    const latE5 = Math.round(lat * 1e5);
    const lngE5 = Math.round(lng * 1e5);
    result += encodeValue(latE5 - lastLat);
    result += encodeValue(lngE5 - lastLng);
    lastLat = latE5;
    lastLng = lngE5;
  }

  return result;
}

function decodeValue(encoded: string, index: { i: number }): number {
  let result = 0;
  let shift = 0;
  let b: number;

  do {
    b = encoded.charCodeAt(index.i++) - 63;
    result |= (b & 0x1f) << shift;
    shift += 5;
  } while (b >= 0x20);

  return result & 1 ? ~(result >> 1) : result >> 1;
}

/** string → [lng, lat][] */
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded) return [];

  const coordinates: [number, number][] = [];
  const index = { i: 0 };
  let lat = 0;
  let lng = 0;

  while (index.i < encoded.length) {
    lat += decodeValue(encoded, index);
    lng += decodeValue(encoded, index);
    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}
