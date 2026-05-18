import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPilotDemandHint } from "@/services/demand.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "GPS requerido" }, { status: 400 });
  }

  const hint = await getPilotDemandHint(lat, lng);
  return NextResponse.json(hint);
}
