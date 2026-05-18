import { NextRequest, NextResponse } from "next/server";
import type { TransportMode } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  parsePilotServiceTiers,
  serializePilotServiceTiers,
} from "@/lib/pilot-service-tiers";
import type { CarServiceTier } from "@/lib/car-services";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { pilotProfile: true },
  });

  const profile = user?.pilotProfile;
  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    name: user?.name ?? "",
    email: user?.email ?? "",
    vehicleType: profile.vehicleType,
    transportMode: profile.transportMode,
    avatarEnergy: profile.avatarEnergy,
    licensePlate: profile.licensePlate ?? "",
    licenseNumber: profile.licenseNumber ?? "",
    vehicleColor: profile.vehicleColor ?? "",
    approvalStatus: profile.approvalStatus,
    onboardingNotes: profile.onboardingNotes ?? "",
    auraScore: profile.auraScore,
    punctuality: profile.punctuality,
    smoothness: profile.smoothness,
    safety: profile.safety,
    ambianceFit: profile.ambianceFit,
    cleanliness: profile.cleanliness,
    conversation: profile.conversation,
    isOnline: profile.isOnline,
    serviceTiers: parsePilotServiceTiers(profile.serviceTiers),
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
    vehicleType,
    transportMode,
    avatarEnergy,
    isOnline,
    serviceTiers,
    licensePlate,
    licenseNumber,
    vehicleColor,
  } = body;

  if (typeof name === "string" && name.trim()) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
    });
  }

  const tiersJson =
    Array.isArray(serviceTiers) && serviceTiers.length
      ? serializePilotServiceTiers(serviceTiers as CarServiceTier[])
      : undefined;

  const existing = await prisma.pilotProfile.findUnique({
    where: { userId: session.user.id },
  });

  const onboardingComplete =
    typeof licensePlate === "string" &&
    licensePlate.trim() &&
    typeof licenseNumber === "string" &&
    licenseNumber.trim() &&
    (typeof vehicleType === "string" ? vehicleType : existing?.vehicleType);

  await prisma.pilotProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      vehicleType: vehicleType ?? "Sedan",
      transportMode: (transportMode as TransportMode) ?? "CAR",
      avatarEnergy: avatarEnergy ?? "calm",
      isOnline: typeof isOnline === "boolean" ? isOnline : false,
      licensePlate: licensePlate?.trim() || null,
      licenseNumber: licenseNumber?.trim() || null,
      vehicleColor: vehicleColor?.trim() || null,
      approvalStatus: onboardingComplete ? "PENDING" : "PENDING",
    },
    update: {
      ...(typeof vehicleType === "string" && { vehicleType }),
      ...(transportMode != null && { transportMode: transportMode as TransportMode }),
      ...(typeof avatarEnergy === "string" && { avatarEnergy }),
      ...(typeof isOnline === "boolean" && { isOnline }),
      ...(tiersJson != null && { serviceTiers: tiersJson }),
      ...(typeof licensePlate === "string" && {
        licensePlate: licensePlate.trim() || null,
      }),
      ...(typeof licenseNumber === "string" && {
        licenseNumber: licenseNumber.trim() || null,
      }),
      ...(typeof vehicleColor === "string" && {
        vehicleColor: vehicleColor.trim() || null,
      }),
      ...(onboardingComplete &&
        existing?.approvalStatus === "PENDING" && {
          approvalStatus: "PENDING",
          onboardingNotes: "En revision — datos enviados",
        }),
    },
  });

  return GET();
}
