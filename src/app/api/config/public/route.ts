import { NextResponse } from "next/server";

/** Config pública en runtime (Render: NEXT_PUBLIC_* del panel, no solo del build Docker). */
export async function GET() {
  return NextResponse.json({
    mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
  });
}
