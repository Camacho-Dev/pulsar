import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { emitChatMessage } from "@/lib/socket-server";
import { addTripMessage, listTripMessages } from "@/lib/trip-chat";
import { userParticipatesInMovement } from "@/lib/movement-access";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const role = await userParticipatesInMovement(id, session.user.id);
  if (!role) {
    return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });
  }

  const messages = await listTripMessages(id);
  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const role = await userParticipatesInMovement(id, session.user.id);
  if (!role) {
    return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });
  }

  const { body } = await req.json();
  if (typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "Mensaje vacio" }, { status: 400 });
  }

  const msg = await addTripMessage({
    movementId: id,
    senderId: session.user.id,
    senderRole: role,
    senderName: session.user.name ?? (role === "pilot" ? "Conductor" : "Pasajero"),
    body,
  });

  emitChatMessage(id, msg);
  return NextResponse.json(msg);
}
