import { NextRequest, NextResponse } from "next/server";
import { snapIfNeeded } from "@/lib/maps/map-matching";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lat, lng, accuracy, speed, heading } = body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat/lng requeridos" }, { status: 400 });
  }

  const snapped = await snapIfNeeded({
    lat,
    lng,
    accuracy,
    speed,
    heading,
    timestamp: Date.now(),
  });

  return NextResponse.json(snapped);
}
