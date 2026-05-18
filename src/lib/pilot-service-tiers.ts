import type { CarServiceTier } from "@/lib/car-services";
import { CAR_SERVICE_TIERS } from "@/lib/car-services";

const ALL = CAR_SERVICE_TIERS.map((t) => t.id);

export function parsePilotServiceTiers(raw: string | null | undefined): CarServiceTier[] {
  if (!raw) return [...ALL];
  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [...ALL];
    return parsed.filter((id): id is CarServiceTier =>
      ALL.includes(id as CarServiceTier)
    );
  } catch {
    return [...ALL];
  }
}

export function serializePilotServiceTiers(tiers: CarServiceTier[]): string {
  const valid = tiers.filter((id) => ALL.includes(id));
  return JSON.stringify(valid.length ? valid : ALL);
}

export function pilotAcceptsServiceTier(
  pilotTiers: CarServiceTier[],
  tripTier: string | null | undefined
): boolean {
  if (!tripTier) return true;
  return pilotTiers.includes(tripTier as CarServiceTier);
}
