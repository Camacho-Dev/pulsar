import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cancelStaleSearchingMovements } from "@/services/movement.service";

/** Cancela viajes atascados en busqueda para poder pedir uno nuevo */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await cancelStaleSearchingMovements(session.user.id);

  const result = await prisma.movement.updateMany({
    where: {
      moverId: session.user.id,
      status: {
        in: ["SEARCHING_PILOT", "PILOT_ASSIGNED", "PILOT_ARRIVING"],
      },
    },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ cancelled: result.count });
}
