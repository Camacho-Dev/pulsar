import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMovement } from "@/services/movement.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const movement = await getMovement(id);
  if (!movement) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(movement);
}
