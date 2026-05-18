import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { acceptSuggestion } from "@/services/pulse.service";

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
  const { fromLat, fromLng, fromAddress, transportMode, ambiance, serviceTier } =
    body;

  if (
    typeof fromLat !== "number" ||
    typeof fromLng !== "number" ||
    !fromAddress
  ) {
    return NextResponse.json({ error: "Origen requerido" }, { status: 400 });
  }

  try {
    const movement = await acceptSuggestion(
      session.user.id,
      id,
      fromLat,
      fromLng,
      fromAddress,
      transportMode,
      ambiance,
      serviceTier
    );

    if (!movement) {
      return NextResponse.json(
        { error: "Sugerencia no valida o expirada" },
        { status: 404 }
      );
    }

    return NextResponse.json(movement);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al aceptar sugerencia";
    console.error("[POST accept suggestion]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
