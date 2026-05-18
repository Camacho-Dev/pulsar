import { prisma } from "@/lib/prisma";

export type RoutineDto = {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  dayOfWeek: number;
  hourStart: number;
  hourEnd: number;
  confidence: number;
  enabled: boolean;
  userScheduled: boolean;
};

function toDto(r: {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  dayOfWeek: number;
  hourStart: number;
  hourEnd: number;
  confidence: number;
  enabled: boolean;
  userScheduled: boolean;
}): RoutineDto {
  return {
    id: r.id,
    label: r.label,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    dayOfWeek: r.dayOfWeek,
    hourStart: r.hourStart,
    hourEnd: r.hourEnd,
    confidence: r.confidence,
    enabled: r.enabled,
    userScheduled: r.userScheduled,
  };
}

export async function listRoutines(userId: string) {
  const rows = await prisma.routine.findMany({
    where: { userId },
    orderBy: [{ userScheduled: "desc" }, { dayOfWeek: "asc" }, { hourStart: "asc" }],
  });
  return rows.map(toDto);
}

export async function createScheduledRoutine(
  userId: string,
  data: {
    label: string;
    address: string;
    lat: number;
    lng: number;
    dayOfWeek: number;
    hourStart: number;
    hourEnd: number;
  }
) {
  if (data.hourEnd <= data.hourStart) {
    throw new Error("La hora de fin debe ser mayor que la de inicio");
  }

  const row = await prisma.routine.create({
    data: {
      userId,
      label: data.label.trim(),
      address: data.address.trim(),
      lat: data.lat,
      lng: data.lng,
      dayOfWeek: data.dayOfWeek,
      hourStart: data.hourStart,
      hourEnd: data.hourEnd,
      confidence: 1,
      enabled: true,
      userScheduled: true,
    },
  });

  return toDto(row);
}

export async function updateRoutine(
  userId: string,
  id: string,
  data: Partial<{
    label: string;
    address: string;
    lat: number;
    lng: number;
    dayOfWeek: number;
    hourStart: number;
    hourEnd: number;
    enabled: boolean;
    userScheduled: boolean;
  }>
) {
  const existing = await prisma.routine.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const hourStart = data.hourStart ?? existing.hourStart;
  const hourEnd = data.hourEnd ?? existing.hourEnd;
  if (hourEnd <= hourStart) {
    throw new Error("La hora de fin debe ser mayor que la de inicio");
  }

  const row = await prisma.routine.update({
    where: { id },
    data: {
      ...(data.label != null && { label: data.label.trim() }),
      ...(data.address != null && { address: data.address.trim() }),
      ...(data.lat != null && { lat: data.lat }),
      ...(data.lng != null && { lng: data.lng }),
      ...(data.dayOfWeek != null && { dayOfWeek: data.dayOfWeek }),
      ...(data.hourStart != null && { hourStart: data.hourStart }),
      ...(data.hourEnd != null && { hourEnd: data.hourEnd }),
      ...(data.enabled != null && { enabled: data.enabled }),
      ...(data.userScheduled != null && { userScheduled: data.userScheduled }),
    },
  });

  return toDto(row);
}

export async function deleteRoutine(userId: string, id: string) {
  const existing = await prisma.routine.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.routine.delete({ where: { id } });
  return true;
}

export async function activateDetectedRoutine(userId: string, id: string) {
  return updateRoutine(userId, id, {
    enabled: true,
    userScheduled: true,
  });
}
