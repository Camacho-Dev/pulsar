import type { TransportMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/geo";
import { locationToCell } from "@/lib/maps/geo-cell";
import { transportCompatible } from "@/lib/transport-match";

export type PilotPoint = {
  userId: string;
  name: string;
  lat: number;
  lng: number;
  h3Cell?: string;
  transportMode: string;
  auraScore: number;
  avatarEnergy: string;
  distanceKm?: number;
};

const memory = new Map<string, PilotPoint>();

export async function upsertPilotLocation(point: PilotPoint) {
  const enriched = {
    ...point,
    h3Cell: locationToCell(point.lat, point.lng),
  };
  memory.set(point.userId, enriched);

  await prisma.pilotProfile.update({
    where: { userId: point.userId },
    data: {
      lat: enriched.lat,
      lng: enriched.lng,
      h3Cell: enriched.h3Cell,
      isOnline: true,
    },
  });
}

export async function findNearbyPilots(
  lat: number,
  lng: number,
  radiusKm = 8,
  tripTransportMode?: TransportMode
): Promise<PilotPoint[]> {
  const busy = await prisma.movement.findMany({
    where: {
      status: { in: ["PILOT_ASSIGNED", "PILOT_ARRIVING", "IN_PROGRESS"] },
      pilotId: { not: null },
    },
    select: { pilotId: true },
  });
  const busyIds = new Set(busy.map((m) => m.pilotId!));

  const online = await prisma.pilotProfile.findMany({
    where: {
      isOnline: true,
      approvalStatus: "APPROVED",
      lat: { not: null },
      lng: { not: null },
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return online
    .filter((p) => !busyIds.has(p.userId))
    .filter(
      (p) =>
        !tripTransportMode ||
        transportCompatible(tripTransportMode, p.transportMode)
    )
    .map((p) => {
      const distanceKm = haversineKm(lat, lng, p.lat!, p.lng!);
      return {
        userId: p.userId,
        name: p.user.name,
        lat: p.lat!,
        lng: p.lng!,
        h3Cell: p.h3Cell ?? locationToCell(p.lat!, p.lng!),
        transportMode: p.transportMode,
        auraScore: p.auraScore,
        avatarEnergy: p.avatarEnergy,
        distanceKm: Math.round(distanceKm * 100) / 100,
      };
    })
    .filter((p) => (p.distanceKm ?? 99) <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

export function getPilotMemory(userId: string) {
  return memory.get(userId);
}
