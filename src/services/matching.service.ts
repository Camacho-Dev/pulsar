import type { TransportMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findNearbyPilots } from "@/lib/pilot-geo";
import { emitMovementOffer, emitMatching } from "@/lib/socket-server";

const OFFER_MS = 12_000;
const MAX_ROUNDS = 5;

export async function startMatching(movementId: string) {
  const movement = await prisma.movement.findUnique({
    where: { id: movementId },
    include: { mover: true },
  });
  if (!movement || movement.status !== "SEARCHING_PILOT") return;

  const tripMode = movement.transportMode as TransportMode;
  let pilots = await findNearbyPilots(
    movement.fromLat,
    movement.fromLng,
    12,
    tripMode
  );

  if (pilots.length === 0) {
    emitMatching(movement.moverId, {
      movementId,
      phase: "no_pilots",
      etaMin: movement.etaMin ?? undefined,
      message:
        "No hay conductores con tu tipo de vehiculo cerca. Seguimos buscando…",
    });
    void scheduleOfferWave(movementId, 1);
    return;
  }

  await offerToPilots(movementId, movement.moverId, pilots, tripMode, 1);
}

async function offerToPilots(
  movementId: string,
  moverId: string,
  pilots: Awaited<ReturnType<typeof findNearbyPilots>>,
  tripMode: TransportMode,
  wave: number
) {
  const movement = await prisma.movement.findUnique({
    where: { id: movementId },
    include: { mover: true, sharedFlow: true },
  });
  if (!movement || movement.status !== "SEARCHING_PILOT") return;

  const batch = pilots.slice(0, MAX_ROUNDS);

  if (batch.length === 0) {
    emitMatching(moverId, {
      movementId,
      phase: "waiting",
      message:
        "Esperando que un conductor acepte tu viaje. Puedes cancelar cuando quieras.",
    });
    return;
  }

  emitMatching(moverId, {
    movementId,
    phase: "offering",
    etaMin: movement.etaMin ?? undefined,
    message: `Enviando solicitud a ${batch.length} conductor(es)…`,
  });

  for (let i = 0; i < batch.length; i++) {
    const pilot = batch[i];
    const current = await prisma.movement.findUnique({
      where: { id: movementId },
    });
    if (!current || current.status !== "SEARCHING_PILOT") return;

    emitMatching(moverId, {
      movementId,
      phase: "offering",
      pilotName: pilot.name,
      round: i + 1,
      totalRounds: batch.length,
      message: `Oferta enviada a ${pilot.name} (${Math.round((pilot.distanceKm ?? 0) * 10) / 10} km)…`,
    });

    emitMovementOffer(pilot.userId, {
      ...movement,
      distanceKm: pilot.distanceKm,
    });

    await sleep(OFFER_MS);

    const after = await prisma.movement.findUnique({ where: { id: movementId } });
    if (after?.status !== "SEARCHING_PILOT") return;
  }

  emitMatching(moverId, {
    movementId,
    phase: "waiting",
    message:
      "Ningun conductor ha aceptado aun. Reenviando oferta en unos segundos…",
  });

  if (wave < 3) {
    void scheduleOfferWave(movementId, wave + 1);
  } else {
    emitMatching(moverId, {
      movementId,
      phase: "waiting",
      message:
        "Sigue en espera. Los conductores cercanos pueden aceptar en cualquier momento.",
    });
  }
}

async function scheduleOfferWave(movementId: string, wave: number) {
  await sleep(20_000);
  const movement = await prisma.movement.findUnique({
    where: { id: movementId },
  });
  if (!movement || movement.status !== "SEARCHING_PILOT") return;

  const tripMode = movement.transportMode as TransportMode;
  const pilots = await findNearbyPilots(
    movement.fromLat,
    movement.fromLng,
    15,
    tripMode
  );
  await offerToPilots(movementId, movement.moverId, pilots, tripMode, wave);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
