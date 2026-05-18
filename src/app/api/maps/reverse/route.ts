import { NextRequest, NextResponse } from "next/server";
import { reverseGeocodeAddress } from "@/lib/maps/geocoding";
import { locationToCell } from "@/lib/maps/geo-cell";

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
  const accuracy = parseFloat(req.nextUrl.searchParams.get("accuracy") ?? "");

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const place = await reverseGeocodeAddress(lat, lng);
  const h3Cell = locationToCell(lat, lng);

  return NextResponse.json({
    ...place,
    accuracy: Number.isNaN(accuracy) ? undefined : accuracy,
    h3Cell,
  });
}
