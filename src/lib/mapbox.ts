/** Token público de Mapbox (pk.*) — seguro en el frontend */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Estilo oscuro Pulsar — console.mapbox.com */
export const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11";

export function hasMapboxToken() {
  return MAPBOX_TOKEN.startsWith("pk.");
}
