import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { activateDetectedRoutine } from "@/services/routine.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const routine = await activateDetectedRoutine(session.user.id, id);
  if (!routine) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json(routine);
}
