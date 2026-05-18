import type { Ambiance, TransportMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { quickEtaMinutes } from "@/services/eta.service";
import { DEFAULT_CENTER } from "@/lib/constants";
import {
  createMovement,
  getActiveMovementForMover,
} from "@/services/movement.service";
import {
  buildPulseWhy,
  formatConfidence,
  formatRoutineSchedule,
} from "@/lib/pulse-format";

export type PulseSuggestionDto = {
  id: string;
  title: string;
  message: string;
  toAddress: string;
  toLat: number;
  toLng: number;
  etaMin: number;
  ambiance: string;
  confidence: number | null;
  routineLabel: string | null;
  scheduleHint: string | null;
  why: string;
  suggestedByRoutine: boolean;
};

export async function generatePulseSuggestions(userId: string) {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  const profile = await prisma.moverProfile.findUnique({ where: { userId } });
  if (profile && !profile.autoPulseEnabled) return [];

  const ambiance = profile?.preferredAmbiance ?? "LOFI";

  const routines = await prisma.routine.findMany({
    where: {
      userId,
      userScheduled: true,
      enabled: true,
      dayOfWeek: day,
      hourStart: { lte: hour },
      hourEnd: { gt: hour },
    },
    orderBy: { confidence: "desc" },
    take: 3,
  });

  const lastLog = await prisma.movementLog.findFirst({
    where: { userId },
    orderBy: { visitedAt: "desc" },
  });

  const from = lastLog
    ? { lat: lastLog.lat, lng: lastLog.lng }
    : DEFAULT_CENTER;

  const created = [];

  for (const routine of routines) {
    const existing = await prisma.pulseSuggestion.findFirst({
      where: {
        userId,
        status: "pending",
        toLat: routine.lat,
        createdAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      },
    });
    if (existing) continue;

    const etaMin = quickEtaMinutes(from, {
      lat: routine.lat,
      lng: routine.lng,
    });

    const scheduleHint = formatRoutineSchedule(
      routine.dayOfWeek,
      routine.hourStart,
      routine.hourEnd
    );

    const suggestion = await prisma.pulseSuggestion.create({
      data: {
        userId,
        routineId: routine.id,
        title: routine.label,
        message: buildPulseWhy(routine.label, routine.confidence, routine.address),
        toLat: routine.lat,
        toLng: routine.lng,
        toAddress: routine.address,
        ambiance,
        etaMin,
        validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });
    created.push({ suggestion, routine, scheduleHint });
  }

  return created;
}

async function serializeSuggestion(
  row: {
    id: string;
    title: string;
    message: string;
    toAddress: string;
    toLat: number;
    toLng: number;
    etaMin: number;
    ambiance: string;
    routineId: string | null;
  },
  routine?: {
    label: string;
    confidence: number;
    dayOfWeek: number;
    hourStart: number;
    hourEnd: number;
    address: string;
  } | null
): Promise<PulseSuggestionDto> {
  const confidence = routine?.confidence ?? null;
  const routineLabel = routine?.label ?? null;
  const scheduleHint = routine
    ? formatRoutineSchedule(
        routine.dayOfWeek,
        routine.hourStart,
        routine.hourEnd
      )
    : null;

  const why = routine
    ? buildPulseWhy(routine.label, routine.confidence, row.toAddress)
    : row.message;

  return {
    id: row.id,
    title: row.title,
    message: row.message,
    toAddress: row.toAddress,
    toLat: row.toLat,
    toLng: row.toLng,
    etaMin: row.etaMin,
    ambiance: row.ambiance,
    confidence,
    routineLabel,
    scheduleHint,
    why,
    suggestedByRoutine: !!row.routineId,
  };
}

export async function getActiveSuggestions(
  userId: string
): Promise<PulseSuggestionDto[]> {
  await generatePulseSuggestions(userId);

  const rows = await prisma.pulseSuggestion.findMany({
    where: {
      userId,
      status: "pending",
      validUntil: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const routineIds = rows
    .map((r) => r.routineId)
    .filter((id): id is string => !!id);

  const routines =
    routineIds.length > 0
      ? await prisma.routine.findMany({
          where: { id: { in: routineIds } },
        })
      : [];

  const routineMap = new Map(routines.map((r) => [r.id, r]));

  const result: PulseSuggestionDto[] = [];
  for (const row of rows) {
    const routine = row.routineId ? routineMap.get(row.routineId) : null;
    result.push(await serializeSuggestion(row, routine ?? null));
  }

  return result.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
}

export async function acceptSuggestion(
  userId: string,
  suggestionId: string,
  fromLat: number,
  fromLng: number,
  fromAddress: string,
  transportMode?: TransportMode,
  ambiance?: Ambiance,
  serviceTier?: string | null
) {
  const suggestion = await prisma.pulseSuggestion.findFirst({
    where: { id: suggestionId, userId, status: "pending" },
  });
  if (!suggestion) return null;

  const existing = await getActiveMovementForMover(userId);
  if (existing) return existing;

  const movement = await createMovement({
    moverId: userId,
    ambiance: ambiance ?? suggestion.ambiance,
    transportMode,
    serviceTier:
      (transportMode ?? "CAR") === "CAR" ? serviceTier ?? "PULSAR" : null,
    fromAddress,
    toAddress: suggestion.toAddress,
    fromLat,
    fromLng,
    toLat: suggestion.toLat,
    toLng: suggestion.toLng,
    suggestedByPulse: true,
  });

  await prisma.pulseSuggestion.update({
    where: { id: suggestionId },
    data: { status: "accepted" },
  });

  await prisma.pulseSuggestion.updateMany({
    where: {
      userId,
      status: "pending",
      id: { not: suggestionId },
    },
    data: { status: "dismissed" },
  });

  return movement;
}
