import { NextResponse } from "next/server";
import { getLiveZones } from "@/services/zones.service";

export async function GET() {
  const zones = await getLiveZones();
  return NextResponse.json(zones);
}
