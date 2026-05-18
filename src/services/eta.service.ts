import { computeRoute } from "@/lib/maps/routing";
import { haversineKm } from "@/lib/geo";

export type EtaResult = {
  distanceKm: number;
  durationMin: number;
  etaMin: number;
  source: "routing" | "estimate";
};

/** ETA conductor → pickup o pickup → destino (recalcula con tráfico vía routing API) */
export async function calculateEta(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  useFullRoute = true
): Promise<EtaResult> {
  if (useFullRoute) {
    const route = await computeRoute(from, to);
    return {
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      etaMin: route.durationMin,
      source: route.source === "estimate" ? "estimate" : "routing",
    };
  }

  const distanceKm = haversineKm(from.lat, from.lng, to.lat, to.lng);
  const etaMin = Math.max(2, Math.round((distanceKm / 32) * 60));
  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMin: etaMin,
    etaMin,
    source: "estimate",
  };
}

/** ETA rápido para sockets (sin llamar API cada 2s) */
export function quickEtaMinutes(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  return Math.max(2, Math.round((km / 30) * 60));
}
