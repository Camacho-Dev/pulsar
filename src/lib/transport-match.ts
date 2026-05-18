import type { TransportMode } from "@prisma/client";

/** El conductor solo recibe viajes compatibles con su vehiculo */
export function transportCompatible(
  tripMode: TransportMode,
  pilotMode: TransportMode
): boolean {
  if (tripMode === pilotMode) return true;
  if (tripMode === "CAR" && pilotMode === "SHARED_VAN") return true;
  if (tripMode === "SHARED_VAN" && pilotMode === "CAR") return true;
  return false;
}
