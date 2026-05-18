import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { upsertPilotLocation } from "@/lib/pilot-geo";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { isOnline, lat, lng } = body;

  const profile = await prisma.pilotProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "No es pilot" }, { status: 403 });
  }

  await prisma.pilotProfile.update({
    where: { userId: session.user.id },
    data: {
      isOnline: isOnline ?? true,
      lat: typeof lat === "number" ? lat : profile.lat,
      lng: typeof lng === "number" ? lng : profile.lng,
    },
  });

  if (isOnline !== false && typeof lat === "number" && typeof lng === "number") {
    await upsertPilotLocation({
      userId: session.user.id,
      name: profile.user.name,
      lat,
      lng,
      transportMode: profile.transportMode,
      auraScore: profile.auraScore,
      avatarEnergy: profile.avatarEnergy,
    });
  }

  return NextResponse.json({ ok: true });
}
