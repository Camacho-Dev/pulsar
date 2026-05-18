import { NextRequest, NextResponse } from "next/server";
import { calculateEta } from "@/services/eta.service";

export async function GET(req: NextRequest) {
  const fromLat = parseFloat(req.nextUrl.searchParams.get("fromLat") ?? "");
  const fromLng = parseFloat(req.nextUrl.searchParams.get("fromLng") ?? "");
  const toLat = parseFloat(req.nextUrl.searchParams.get("toLat") ?? "");
  const toLng = parseFloat(req.nextUrl.searchParams.get("toLng") ?? "");

  if ([fromLat, fromLng, toLat, toLng].some(Number.isNaN)) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const eta = await calculateEta(
    { lat: fromLat, lng: fromLng },
    { lat: toLat, lng: toLng }
  );

  return NextResponse.json(eta);
}
