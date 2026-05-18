import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estimateTripFare } from "@/lib/trip-pricing";
import type { TransportMode } from "@prisma/client";
import type { CarServiceTier } from "@/lib/car-services";

/** Estimacion demo de ganancias del conductor (80% del fare estimado) */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const completed = await prisma.movement.findMany({
    where: {
      pilotId: session.user.id,
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      fromLat: true,
      fromLng: true,
      toLat: true,
      toLng: true,
      etaMin: true,
      transportMode: true,
      serviceTier: true,
    },
  });

  let total = 0;
  for (const m of completed) {
    const km = haversineQuick(m.fromLat, m.fromLng, m.toLat, m.toLng);
    const min = m.etaMin ?? 10;
    const fare = estimateTripFare(
      km,
      min,
      m.transportMode as TransportMode,
      m.serviceTier as CarServiceTier | null
    );
    total += Math.round(fare * 0.8);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.movement.count({
    where: {
      pilotId: session.user.id,
      status: "COMPLETED",
      createdAt: { gte: today },
    },
  });

  return NextResponse.json({
    totalEarnings: total,
    completedTrips: completed.length,
    tripsToday: todayCount,
    currency: "RD$",
  });
}

function haversineQuick(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
