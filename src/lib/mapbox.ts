/** Token en build (puede quedar vacío o placeholder si Docker buildó sin el secret). */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Estilo oscuro Pulsar — console.mapbox.com */
export const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11";

export function isValidMapboxToken(token: string) {
  return (
    token.startsWith("pk.") &&
    token.length > 20 &&
    !token.includes("placeholder") &&
    !token.includes("build-")
  );
}

export function hasMapboxToken(token: string = MAPBOX_TOKEN) {
  return isValidMapboxToken(token);
}
