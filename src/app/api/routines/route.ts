import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createScheduledRoutine,
  listRoutines,
} from "@/services/routine.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const routines = await listRoutines(session.user.id);
  return NextResponse.json(routines);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { label, address, lat, lng, dayOfWeek, hourStart, hourEnd } = body;

  if (
    !label ||
    !address ||
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    typeof dayOfWeek !== "number" ||
    typeof hourStart !== "number" ||
    typeof hourEnd !== "number"
  ) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  try {
    const routine = await createScheduledRoutine(session.user.id, {
      label,
      address,
      lat,
      lng,
      dayOfWeek,
      hourStart,
      hourEnd,
    });
    return NextResponse.json(routine);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
