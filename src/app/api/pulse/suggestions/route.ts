import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActiveSuggestions } from "@/services/pulse.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const suggestions = await getActiveSuggestions(session.user.id);
  return NextResponse.json(suggestions);
}
