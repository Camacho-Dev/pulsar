import { NextRequest, NextResponse } from "next/server";
import { computeRoute } from "@/lib/maps/routing";

/** @deprecated Usa /api/maps/directions */
export async function GET(req: NextRequest) {
  const fromLat = parseFloat(req.nextUrl.searchParams.get("fromLat") ?? "");
  const fromLng = parseFloat(req.nextUrl.searchParams.get("fromLng") ?? "");
  const toLat = parseFloat(req.nextUrl.searchParams.get("toLat") ?? "");
  const toLng = parseFloat(req.nextUrl.searchParams.get("toLng") ?? "");

  if ([fromLat, fromLng, toLat, toLng].some(Number.isNaN)) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const route = await computeRoute(
    { lat: fromLat, lng: fromLng },
    { lat: toLat, lng: toLng }
  );

  return NextResponse.json({
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    coordinates: route.coordinates,
    encodedPolyline: route.encodedPolyline,
    source: route.source,
  });
}
