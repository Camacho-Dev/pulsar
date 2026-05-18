import type { TransportMode } from "@prisma/client";
import type { CarServiceTier } from "@/lib/car-services";
import { CAR_SERVICE_TIERS } from "@/lib/car-services";

const BASE_RD = { CAR: 150, MOTO: 90, SHARED_VAN: 220 } as const;
const PER_KM_RD = { CAR: 38, MOTO: 28, SHARED_VAN: 48 } as const;
const PER_MIN_RD = { CAR: 9, MOTO: 7, SHARED_VAN: 11 } as const;

const DEFAULT_MODE = "CAR" as const;

function ratesFor(mode: TransportMode) {
  const key =
    mode in BASE_RD ? (mode as keyof typeof BASE_RD) : DEFAULT_MODE;
  return {
    base: BASE_RD[key],
    perKm: PER_KM_RD[key],
    perMin: PER_MIN_RD[key],
  };
}

function tierMultiplier(mode: TransportMode, serviceTier?: CarServiceTier | null) {
  if (mode !== "CAR" || !serviceTier) return 1;
  return CAR_SERVICE_TIERS.find((t) => t.id === serviceTier)?.multiplier ?? 1;
}

export function estimateTripFare(
  distanceKm: number,
  durationMin: number,
  mode: TransportMode,
  serviceTier?: CarServiceTier | null
): number {
  const { base, perKm, perMin } = ratesFor(mode);
  const raw =
    (base + distanceKm * perKm + durationMin * perMin) *
    tierMultiplier(mode, serviceTier);
  return Math.max(Math.round(raw), Math.round(base * tierMultiplier(mode, serviceTier)));
}

export function formatFare(amount: number): string {
  return `RD$${amount.toLocaleString("es-DO")}`;
}
