import { NextRequest, NextResponse } from "next/server";
import type { Ambiance } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { moverProfile: true },
  });

  const profile = user?.moverProfile;

  return NextResponse.json({
    name: user?.name ?? "",
    email: user?.email ?? "",
    preferredAmbiance: profile?.preferredAmbiance ?? "LOFI",
    autoPulseEnabled: profile?.autoPulseEnabled ?? true,
    tempPreference: profile?.tempPreference ?? 22,
    drivingStyle: profile?.drivingStyle ?? "smooth",
    musicNote: profile?.musicNote ?? "",
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    preferredAmbiance,
    autoPulseEnabled,
    tempPreference,
    drivingStyle,
    musicNote,
  } = body;

  if (typeof name === "string" && name.trim()) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
    });
  }

  await prisma.moverProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      preferredAmbiance: preferredAmbiance ?? "LOFI",
      autoPulseEnabled: autoPulseEnabled ?? true,
      tempPreference: tempPreference ?? 22,
      drivingStyle: drivingStyle ?? "smooth",
    },
    update: {
      ...(preferredAmbiance != null && {
        preferredAmbiance: preferredAmbiance as Ambiance,
      }),
      ...(typeof autoPulseEnabled === "boolean" && { autoPulseEnabled }),
      ...(typeof tempPreference === "number" && { tempPreference }),
      ...(typeof drivingStyle === "string" && { drivingStyle }),
      ...(typeof musicNote === "string" && { musicNote: musicNote || null }),
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { moverProfile: true },
  });
  const profile = user?.moverProfile;

  return NextResponse.json({
    name: user?.name ?? "",
    email: user?.email ?? "",
    preferredAmbiance: profile?.preferredAmbiance ?? "LOFI",
    autoPulseEnabled: profile?.autoPulseEnabled ?? true,
    tempPreference: profile?.tempPreference ?? 22,
    drivingStyle: profile?.drivingStyle ?? "smooth",
    musicNote: profile?.musicNote ?? "",
  });
}
