import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateMovement } from "@/services/reputation.service";

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

  const rating = await rateMovement(id, session.user.id, {
    punctuality: body.punctuality ?? 5,
    smoothness: body.smoothness ?? 5,
    safety: body.safety ?? 5,
    cleanliness: body.cleanliness ?? 5,
    ambiance: body.ambiance ?? 5,
    conversation: body.conversation ?? 5,
    comment: body.comment,
  });

  if (!rating) {
    return NextResponse.json({ error: "No se puede calificar" }, { status: 409 });
  }

  return NextResponse.json(rating);
}
