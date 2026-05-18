import { NextRequest, NextResponse } from "next/server";
import { computeRoute } from "@/lib/maps/routing";
import { estimateTripFareWithSurge } from "@/lib/surge-pricing";
import type { TransportMode } from "@prisma/client";
import type { CarServiceTier } from "@/lib/car-services";

export async function GET(req: NextRequest) {
  const fromLat = parseFloat(req.nextUrl.searchParams.get("fromLat") ?? "");
  const fromLng = parseFloat(req.nextUrl.searchParams.get("fromLng") ?? "");
  const toLat = parseFloat(req.nextUrl.searchParams.get("toLat") ?? "");
  const toLng = parseFloat(req.nextUrl.searchParams.get("toLng") ?? "");
  const transportMode =
    (req.nextUrl.searchParams.get("transportMode") as TransportMode) || "CAR";
  const serviceTier = req.nextUrl.searchParams.get(
    "serviceTier"
  ) as CarServiceTier | null;

  if ([fromLat, fromLng, toLat, toLng].some(Number.isNaN)) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const route = await computeRoute(
    { lat: fromLat, lng: fromLng },
    { lat: toLat, lng: toLng }
  );

  const pricing = await estimateTripFareWithSurge(
    route.distanceKm,
    route.durationMin,
    transportMode,
    fromLat,
    fromLng,
    toLat,
    toLng,
    transportMode === "CAR" ? serviceTier : null
  );

  return NextResponse.json({
    ...route,
    fare: pricing.finalFare,
    baseFare: pricing.baseFare,
    surge: pricing.surge,
  });
}
