import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fareForMovement } from "@/lib/movement-fare";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const movements = await prisma.movement.findMany({
    where: { moverId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      status: true,
      fromAddress: true,
      toAddress: true,
      fromLat: true,
      fromLng: true,
      toLat: true,
      toLng: true,
      createdAt: true,
      etaMin: true,
      suggestedByPulse: true,
      transportMode: true,
      serviceTier: true,
      ambiance: true,
      pilot: { select: { name: true } },
      rating: { select: { id: true } },
    },
  });

  return NextResponse.json(
    movements.map((m) => ({
      ...m,
      fareEstimate: fareForMovement(m),
      rated: Boolean(m.rating),
      rating: undefined,
    }))
  );
}
