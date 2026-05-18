import type { TransportMode } from "@prisma/client";
import type { CarServiceTier } from "@/lib/car-services";
import { estimateTripFare } from "@/lib/trip-pricing";

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fareForMovement(m: {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  etaMin?: number | null;
  transportMode: TransportMode | string;
  serviceTier?: string | null;
}) {
  const km = haversineKm(m.fromLat, m.fromLng, m.toLat, m.toLng);
  const min = m.etaMin ?? Math.max(5, Math.round(km * 3));
  return estimateTripFare(
    km,
    min,
    m.transportMode as TransportMode,
    m.serviceTier as CarServiceTier | null
  );
}
