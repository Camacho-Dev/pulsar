import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const movement = await prisma.movement.findFirst({
    where: {
      pilotId: session.user.id,
      status: {
        in: ["PILOT_ASSIGNED", "PILOT_ARRIVING", "IN_PROGRESS"],
      },
    },
    include: {
      mover: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(movement);
}
