import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/geo";
import { locationToCell } from "@/lib/maps/geo-cell";

const MIN_VISITS = 3;
const LOCATION_RADIUS_KM = 0.35;

export async function logMovementVisit(
  userId: string,
  lat: number,
  lng: number,
  address?: string
) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hourOfDay = now.getHours();

  await prisma.movementLog.create({
    data: {
      userId,
      lat,
      lng,
      address,
      h3Cell: locationToCell(lat, lng),
      dayOfWeek,
      hourOfDay,
    },
  });

  await detectRoutinesForUser(userId);
}

export async function detectRoutinesForUser(userId: string) {
  const logs = await prisma.movementLog.findMany({
    where: { userId },
    orderBy: { visitedAt: "desc" },
    take: 200,
  });

  if (logs.length < MIN_VISITS) return;

  const clusters: {
    lat: number;
    lng: number;
    address: string;
    day: number;
    hours: number[];
  }[] = [];

  for (const log of logs) {
    const existing = clusters.find(
      (c) =>
        c.day === log.dayOfWeek &&
        haversineKm(c.lat, c.lng, log.lat, log.lng) < LOCATION_RADIUS_KM
    );
    if (existing) {
      existing.hours.push(log.hourOfDay);
      if (log.address) existing.address = log.address;
    } else {
      clusters.push({
        lat: log.lat,
        lng: log.lng,
        address: log.address ?? "Destino frecuente",
        day: log.dayOfWeek,
        hours: [log.hourOfDay],
      });
    }
  }

  for (const c of clusters) {
    if (c.hours.length < MIN_VISITS) continue;

    const hourStart = Math.min(...c.hours);
    const hourEnd = Math.max(...c.hours) + 1;
    const label = inferLabel(c.address, hourStart);
    const confidence = Math.min(0.95, 0.4 + c.hours.length * 0.12);

    const match = await prisma.routine.findFirst({
      where: {
        userId,
        dayOfWeek: c.day,
        lat: { gte: c.lat - 0.002, lte: c.lat + 0.002 },
      },
    });

    if (match) {
      await prisma.routine.update({
        where: { id: match.id },
        data: {
          confidence,
          hourStart,
          hourEnd,
          lastSeenAt: new Date(),
          address: c.address,
        },
      });
    } else {
      await prisma.routine.create({
        data: {
          userId,
          label,
          lat: c.lat,
          lng: c.lng,
          address: c.address,
          dayOfWeek: c.day,
          hourStart,
          hourEnd,
          confidence,
          enabled: false,
          userScheduled: false,
        },
      });
    }
  }
}

function inferLabel(address: string, hour: number): string {
  const a = address.toLowerCase();
  if (a.includes("gym") || a.includes("gimnasio")) return "Gym";
  if (a.includes("mall") || a.includes("plaza")) return "Compras";
  if (hour >= 7 && hour <= 10) return "Mañana";
  if (hour >= 17 && hour <= 20) return "Salida";
  if (hour >= 6 && hour <= 9) return "Trabajo";
  return "Rutina";
}
