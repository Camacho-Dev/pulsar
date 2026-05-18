/** OpenRouteService (HeiGIT) — rutas y geocodificación */
export const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY ?? "";

const BASE = "https://api.openrouteservice.org";

export function hasOrsKey() {
  return ORS_API_KEY.length > 10;
}

function headers() {
  return {
    Authorization: ORS_API_KEY,
    "Content-Type": "application/json",
  };
}
