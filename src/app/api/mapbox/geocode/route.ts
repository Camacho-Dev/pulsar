import { NextRequest, NextResponse } from "next/server";
import { autocompletePlaces } from "@/lib/maps/geocoding";

/** @deprecated Usa /api/maps/autocomplete */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");
  const proximity =
    lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;
  const places = await autocompletePlaces(q, proximity);
  return NextResponse.json(places);
}
