import { NextResponse } from "next/server";
import { listFormingFlows } from "@/services/shared-flow.service";

export async function GET() {
  const flows = await listFormingFlows();
  return NextResponse.json(flows);
}
