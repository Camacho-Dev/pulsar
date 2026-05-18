import { NextRequest, NextResponse } from "next/server";
import type { Ambiance, TransportMode } from "@prisma/client";
import { auth } from "@/auth";
import {
  createMovement,
  getActiveMovementForMover,
} from "@/services/movement.service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  if (body.force === true) {
    await prisma.movement.updateMany({
      where: {
        moverId: session.user.id,
        status: {
          in: ["SEARCHING_PILOT", "PILOT_ASSIGNED", "PILOT_ARRIVING"],
        },
      },
      data: { status: "CANCELLED" },
    });
  }

  const active = await getActiveMovementForMover(session.user.id);
  if (active) {
    return NextResponse.json(
      {
        error: "Ya tienes un viaje activo. Cancelalo o usa el enlace de abajo.",
        movement: active,
      },
      { status: 409 }
    );
  }
  const {
    ambiance,
    transportMode,
    serviceTier,
    fromAddress,
    toAddress,
    fromLat,
    fromLng,
    toLat,
    toLng,
  } = body;

  if (
    !ambiance ||
    !fromAddress ||
    !toAddress ||
    [fromLat, fromLng, toLat, toLng].some((v) => typeof v !== "number")
  ) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  try {
    const movement = await createMovement({
      moverId: session.user.id,
      ambiance: ambiance as Ambiance,
      transportMode: transportMode as TransportMode | undefined,
      serviceTier: typeof serviceTier === "string" ? serviceTier : null,
      fromAddress,
      toAddress,
      fromLat,
      fromLng,
      toLat,
      toLng,
    });

    return NextResponse.json(movement);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al crear el viaje";
    const hint = message.includes("serviceTier")
      ? "Deten npm run dev, ejecuta npm run db:setup y vuelve a iniciar."
      : undefined;
    console.error("[POST /api/movement]", err);
    return NextResponse.json(
      {
        error: message.includes("serviceTier")
          ? "Base de datos desactualizada (serviceTier)."
          : "Error al crear el viaje",
        hint,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const active = await getActiveMovementForMover(session.user.id);
  if (active) {
    return NextResponse.json(active);
  }

  const movements = await prisma.movement.findMany({
    where: { moverId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { pilot: { select: { id: true, name: true } } },
  });

  return NextResponse.json(movements);
}
