import type { Ambiance, MovementStatus, StopType, TransportMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { locationToCell } from "@/lib/maps/geo-cell";
import { computeRoute } from "@/lib/maps/routing";
import {
  emitMovementUpdate,
  emitMatching,
  emitEtaUpdate,
} from "@/lib/socket-server";
import { startMatching } from "@/services/matching.service";
import { tryAttachSharedFlow } from "@/services/shared-flow.service";
import {
  parsePilotServiceTiers,
  pilotAcceptsServiceTier,
} from "@/lib/pilot-service-tiers";
import { transportCompatible } from "@/lib/transport-match";
import { haversineKm } from "@/lib/geo";

export type CreateMovementInput = {
  moverId: string;
  ambiance: Ambiance;
  transportMode?: TransportMode;
  fromAddress: string;
  toAddress: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  suggestedByPulse?: boolean;
  serviceTier?: string | null;
};

const movementInclude = {
  pilot: { select: { id: true, name: true, pilotProfile: true } },
  mover: { select: { id: true, name: true } },
  stops: { orderBy: { sortOrder: "asc" as const } },
  sharedFlow: true,
  rating: true,
};

export async function createMovement(input: CreateMovementInput) {
  const route = await computeRoute(
    { lat: input.fromLat, lng: input.fromLng },
    { lat: input.toLat, lng: input.toLng }
  );

  const movement = await prisma.movement.create({
    data: {
      moverId: input.moverId,
      status: "SEARCHING_PILOT",
      ambiance: input.ambiance,
      transportMode: input.transportMode ?? "CAR",
      serviceTier:
        (input.transportMode ?? "CAR") === "CAR"
          ? input.serviceTier ?? "PULSAR"
          : null,
      fromAddress: input.fromAddress,
      toAddress: input.toAddress,
      fromLat: input.fromLat,
      fromLng: input.fromLng,
      toLat: input.toLat,
      toLng: input.toLng,
      etaMin: route.durationMin,
      suggestedByPulse: input.suggestedByPulse ?? false,
      h3Origin: locationToCell(input.fromLat, input.fromLng),
      h3Dest: locationToCell(input.toLat, input.toLng),
    },
    include: movementInclude,
  });

  try {
    await tryAttachSharedFlow(movement.id);
  } catch {
    /* flujo compartido opcional */
  }

  const updated =
    (await prisma.movement.findUnique({
      where: { id: movement.id },
      include: movementInclude,
    })) ?? movement;

  try {
    void startMatching(updated.id);
    emitMatching(input.moverId, {
      movementId: movement.id,
      phase: "searching",
      message: "Buscando conductor… Enviando solicitud a conductores cercanos.",
      etaMin: route.durationMin,
    });
    emitEtaUpdate(input.moverId, movement.id, route.durationMin, "trip");
  } catch {
    /* matching en segundo plano; el viaje ya existe */
  }

  return updated;
}

export async function getMovement(id: string) {
  return prisma.movement.findUnique({
    where: { id },
    include: movementInclude,
  });
}

/** Viajes en busqueda sin conductor se cancelan solos tras 45 min */
const STALE_SEARCHING_MS = 45 * 60 * 1000;

export async function cancelStaleSearchingMovements(moverId?: string) {
  await prisma.movement.updateMany({
    where: {
      ...(moverId ? { moverId } : {}),
      status: "SEARCHING_PILOT",
      createdAt: { lt: new Date(Date.now() - STALE_SEARCHING_MS) },
    },
    data: { status: "CANCELLED" },
  });
}

export async function getActiveMovementForMover(moverId: string) {
  await cancelStaleSearchingMovements(moverId);

  return prisma.movement.findFirst({
    where: {
      moverId,
      status: {
        in: [
          "SEARCHING_PILOT",
          "PILOT_ASSIGNED",
          "PILOT_ARRIVING",
          "IN_PROGRESS",
        ],
      },
    },
    include: movementInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function pilotAcceptMovement(movementId: string, pilotId: string) {
  const open = await prisma.movement.findFirst({
    where: { id: movementId, status: "SEARCHING_PILOT" },
  });
  if (!open) throw new Error("Movimiento no disponible");

  const movement = await prisma.movement.update({
    where: { id: movementId },
    data: {
      pilotId,
      status: "PILOT_ASSIGNED",
    },
    include: movementInclude,
  });

  emitMovementUpdate(movement.moverId, movement);
  const pickupEta = movement.etaMin ?? 5;
  emitMatching(movement.moverId, {
    movementId,
    phase: "assigned",
    pilotName: movement.pilot?.name,
    message: `${movement.pilot?.name} acepto tu viaje. Va en camino a recogerte.`,
    etaMin: pickupEta,
  });
  emitEtaUpdate(movement.moverId, movementId, pickupEta, "pickup");

  return movement;
}

export async function pilotSetArriving(movementId: string, pilotId: string) {
  const movement = await prisma.movement.updateMany({
    where: { id: movementId, pilotId, status: "PILOT_ASSIGNED" },
    data: { status: "PILOT_ARRIVING" },
  });
  if (!movement.count) return null;
  const m = await getMovement(movementId);
  if (m) {
    emitMovementUpdate(m.moverId, m);
    emitMatching(m.moverId, {
      movementId,
      phase: "arriving",
      pilotName: m.pilot?.name,
      message: `${m.pilot?.name ?? "Tu conductor"} va en camino al punto de recogida.`,
      etaMin: m.etaMin ?? 5,
    });
  }
  return m;
}

/** Aviso al pasajero de que el conductor ya esta en el punto de recogida */
export async function pilotNotifyAtPickup(movementId: string, pilotId: string) {
  const m = await prisma.movement.findFirst({
    where: {
      id: movementId,
      pilotId,
      status: { in: ["PILOT_ASSIGNED", "PILOT_ARRIVING"] },
    },
    include: movementInclude,
  });
  if (!m) return null;

  if (m.status === "PILOT_ASSIGNED") {
    await prisma.movement.update({
      where: { id: movementId },
      data: { status: "PILOT_ARRIVING" },
    });
  }

  const updated = await getMovement(movementId);
  if (!updated) return null;

  emitMovementUpdate(updated.moverId, updated);
  emitMatching(updated.moverId, {
    movementId,
    phase: "at_pickup",
    pilotName: updated.pilot?.name,
    message: `${updated.pilot?.name ?? "Tu conductor"} llego. Te esta esperando en el punto de recogida.`,
    etaMin: 0,
  });

  return updated;
}

export async function startMovement(movementId: string, pilotId: string) {
  const movement = await prisma.movement.updateMany({
    where: {
      id: movementId,
      pilotId,
      status: { in: ["PILOT_ASSIGNED", "PILOT_ARRIVING"] },
    },
    data: { status: "IN_PROGRESS" },
  });
  if (!movement.count) return null;
  const m = await getMovement(movementId);
  if (m) emitMovementUpdate(m.moverId, m);
  return m;
}

export async function completeMovement(movementId: string, pilotId: string) {
  const movement = await prisma.movement.updateMany({
    where: { id: movementId, pilotId, status: "IN_PROGRESS" },
    data: { status: "COMPLETED" },
  });
  if (!movement.count) return null;
  const m = await getMovement(movementId);
  if (m) emitMovementUpdate(m.moverId, m);
  return m;
}

export async function cancelMovement(
  movementId: string,
  userId: string,
  role: "mover" | "pilot"
) {
  const where =
    role === "mover"
      ? { id: movementId, moverId: userId }
      : { id: movementId, pilotId: userId };

  const movement = await prisma.movement.updateMany({
    where: {
      ...where,
      status: {
        notIn: ["COMPLETED", "CANCELLED"],
      },
    },
    data: { status: "CANCELLED" },
  });
  if (!movement.count) return null;
  const m = await getMovement(movementId);
  if (m) emitMovementUpdate(m.moverId, m);
  return m;
}

export async function addMovementStop(
  movementId: string,
  moverId: string,
  stop: {
    type: StopType;
    address: string;
    lat: number;
    lng: number;
  }
) {
  const movement = await prisma.movement.findFirst({
    where: {
      id: movementId,
      moverId,
      status: { in: ["PILOT_ARRIVING", "IN_PROGRESS"] },
    },
    include: { stops: true },
  });
  if (!movement) return null;

  const sortOrder = movement.stops.length + 1;
  await prisma.movementStop.create({
    data: {
      movementId,
      type: stop.type,
      address: stop.address,
      lat: stop.lat,
      lng: stop.lng,
      sortOrder,
    },
  });

  if (stop.type === "NEW_DEST") {
    await prisma.movement.update({
      where: { id: movementId },
      data: {
        toLat: stop.lat,
        toLng: stop.lng,
        toAddress: stop.address,
        h3Dest: locationToCell(stop.lat, stop.lng),
      },
    });
  }

  const updated = await getMovement(movementId);
  if (updated) {
    emitMovementUpdate(moverId, {
      ...updated,
      modularHint:
        stop.type === "PICKUP_FRIEND"
          ? "Parada añadida: recoger amigo en ruta"
          : "Ruta actualizada",
    });
  }
  return updated;
}

export async function listOpenMovementsForPilot(
  lat: number,
  lng: number,
  pilotUserId: string
) {
  const pilot = await prisma.pilotProfile.findUnique({
    where: { userId: pilotUserId },
  });
  const pilotMode = pilot?.transportMode ?? "CAR";

  const rows = await prisma.movement.findMany({
    where: { status: "SEARCHING_PILOT" },
    include: {
      mover: { select: { id: true, name: true } },
      sharedFlow: true,
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const pilotTiers = parsePilotServiceTiers(pilot?.serviceTiers);

  return rows
    .filter(
      (m) =>
        transportCompatible(m.transportMode, pilotMode) &&
        pilotAcceptsServiceTier(pilotTiers, m.serviceTier)
    )
    .map((m) => ({
      ...m,
      distanceKm: Math.round(
        haversineKm(lat, lng, m.fromLat, m.fromLng) * 10
      ) / 10,
    }))
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .slice(0, 15);
}
