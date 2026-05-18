import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listOpenMovementsForPilot } from "@/services/movement.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "18.4861");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "-69.9312");

  const offers = await listOpenMovementsForPilot(
    lat,
    lng,
    session.user.id
  );
  return NextResponse.json(offers);
}
