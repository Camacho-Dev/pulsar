import { NextRequest, NextResponse } from "next/server";
import { reverseGeocodeAddress } from "@/lib/maps/geocoding";
import { locationToCell } from "@/lib/maps/geo-cell";

/** @deprecated Usa /api/maps/reverse */
export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }
  const place = await reverseGeocodeAddress(lat, lng);
  return NextResponse.json({ ...place, h3Cell: locationToCell(lat, lng) });
}
