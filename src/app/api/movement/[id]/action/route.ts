import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  pilotSetArriving,
  pilotNotifyAtPickup,
  startMovement,
  completeMovement,
  cancelMovement,
} from "@/services/movement.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();
  const isPilot = session.user.role === "PILOT";

  let movement = null;

  switch (action) {
    case "arrive":
      if (!isPilot) break;
      movement = await pilotSetArriving(id, session.user.id);
      break;
    case "notify_arrived":
      if (!isPilot) break;
      movement = await pilotNotifyAtPickup(id, session.user.id);
      break;
    case "start":
      if (!isPilot) break;
      movement = await startMovement(id, session.user.id);
      break;
    case "complete":
      if (!isPilot) break;
      movement = await completeMovement(id, session.user.id);
      break;
    case "cancel":
      movement = await cancelMovement(
        id,
        session.user.id,
        isPilot ? "pilot" : "mover"
      );
      break;
    default:
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  if (!movement) {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 409 });
  }

  return NextResponse.json(movement);
}
