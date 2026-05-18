import type { ZoneType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/geo";
import { estimateTripFare } from "@/lib/trip-pricing";
import type { TransportMode } from "@prisma/client";
import type { CarServiceTier } from "@/lib/car-services";

const ZONE_MULT: Record<ZoneType, number> = {
  TRAFFIC: 1.12,
  SAFE: 1.0,
  PREMIUM: 1.18,
  EVENT: 1.22,
  FLOW: 1.08,
};

export type SurgeBreakdown = {
  multiplier: number;
  surgePercent: number;
  zoneName?: string;
  peakHour: boolean;
  searchingNearby: number;
  label: string;
};

function isPeakHour(date = new Date()) {
  const day = date.getDay();
  const hour = date.getHours();
  const weekday = day >= 1 && day <= 5;
  if (!weekday) {
    return hour >= 11 && hour <= 23;
  }
  return (
    (hour >= 7 && hour <= 9) ||
    (hour >= 12 && hour <= 14) ||
    (hour >= 17 && hour <= 20)
  );
}

async function zoneMultiplierAt(lat: number, lng: number) {
  const zones = await prisma.liveZone.findMany({
    where: {
      OR: [{ activeUntil: null }, { activeUntil: { gt: new Date() } }],
    },
  });

  let bestName: string | undefined;
  let bestMult = 1;

  for (const z of zones) {
    const dist = haversineKm(lat, lng, z.lat, z.lng);
    if (dist > z.radiusKm + 0.3) continue;
    const mult = 1 + (ZONE_MULT[z.type] - 1) * z.intensity;
    if (mult > bestMult) {
      bestMult = mult;
      bestName = z.name;
    }
  }

  return { multiplier: bestMult, zoneName: bestName };
}

export async function computeSurgeBreakdown(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<SurgeBreakdown> {
  const midLat = (fromLat + toLat) / 2;
  const midLng = (fromLng + toLng) / 2;

  const [originZone, destZone, searchingNearby] = await Promise.all([
    zoneMultiplierAt(fromLat, fromLng),
    zoneMultiplierAt(toLat, toLng),
    prisma.movement.count({ where: { status: "SEARCHING_PILOT" } }),
  ]);

  const zoneMult = Math.max(originZone.multiplier, destZone.multiplier);
  const zoneName =
    originZone.multiplier >= destZone.multiplier
      ? originZone.zoneName
      : destZone.zoneName;

  const peak = isPeakHour();
  const peakMult = peak ? 1.1 : 1;
  const demandMult = 1 + Math.min(searchingNearby * 0.03, 0.25);

  const multiplier = Math.round(zoneMult * peakMult * demandMult * 100) / 100;
  const surgePercent = Math.round((multiplier - 1) * 100);

  let label = "Tarifa estándar";
  if (surgePercent > 0) {
    const parts: string[] = [];
    if (zoneName) parts.push(zoneName);
    if (peak) parts.push("hora pico");
    if (searchingNearby >= 3) parts.push("alta demanda");
    label = parts.length
      ? `Tarifa dinámica · ${parts.join(", ")}`
      : `Tarifa dinámica +${surgePercent}%`;
  }

  return {
    multiplier,
    surgePercent,
    zoneName,
    peakHour: peak,
    searchingNearby,
    label,
  };
}

export async function estimateTripFareWithSurge(
  distanceKm: number,
  durationMin: number,
  mode: TransportMode,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  serviceTier?: CarServiceTier | null
) {
  const base = estimateTripFare(distanceKm, durationMin, mode, serviceTier);
  const surge = await computeSurgeBreakdown(fromLat, fromLng, toLat, toLng);
  const finalFare = Math.round(base * surge.multiplier);
  return { baseFare: base, finalFare, surge };
}
