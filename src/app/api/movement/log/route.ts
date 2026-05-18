import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { logMovementVisit } from "@/services/pattern.service";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { lat, lng, address } = await req.json();
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  await logMovementVisit(session.user.id, lat, lng, address);
  return NextResponse.json({ ok: true });
}
