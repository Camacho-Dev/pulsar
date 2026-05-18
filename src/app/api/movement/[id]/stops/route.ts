import { NextRequest, NextResponse } from "next/server";
import type { StopType } from "@prisma/client";
import { auth } from "@/auth";
import { addMovementStop } from "@/services/movement.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { type, address, lat, lng } = body;

  if (!type || !address || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const movement = await addMovementStop(id, session.user.id, {
    type: type as StopType,
    address,
    lat,
    lng,
  });

  if (!movement) {
    return NextResponse.json({ error: "Movimiento no editable" }, { status: 409 });
  }

  return NextResponse.json(movement);
}
