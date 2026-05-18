import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pilotAcceptMovement } from "@/services/movement.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PILOT") {
    return NextResponse.json({ error: "Solo pilots" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const movement = await pilotAcceptMovement(id, session.user.id);
    return NextResponse.json(movement);
  } catch {
    return NextResponse.json({ error: "Movimiento no disponible" }, { status: 409 });
  }
}
