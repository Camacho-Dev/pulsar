import "dotenv/config";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function resolveDbUrl() {
  const raw = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (raw.startsWith("file:./")) {
    const relative = raw.replace("file:", "");
    return `file:${path.join(process.cwd(), relative)}`;
  }
  return raw;
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: resolveDbUrl() }),
});

const SD_ZONES = [
  { name: "Piantini", type: "PREMIUM" as const, lat: 18.472, lng: -69.942, intensity: 0.85 },
  { name: "Av. Winston Churchill", type: "FLOW" as const, lat: 18.465, lng: -69.938, intensity: 0.7 },
  { name: "Malecón", type: "EVENT" as const, lat: 18.455, lng: -69.914, intensity: 0.9 },
  { name: "Los Prados", type: "SAFE" as const, lat: 18.49, lng: -69.97, intensity: 0.75 },
  { name: "27 de Febrero", type: "TRAFFIC" as const, lat: 18.468, lng: -69.925, intensity: 0.8 },
];

async function main() {
  await prisma.liveZone.deleteMany();
  await prisma.pulseSuggestion.deleteMany();
  await prisma.movement.deleteMany();
  await prisma.movementLog.deleteMany();
  await prisma.routine.deleteMany();

  const hash = await bcrypt.hash("pulsar123", 10);

  const mover = await prisma.user.upsert({
    where: { email: "mover@pulsar.app" },
    update: { passwordHash: hash, name: "Alex Mover", role: "MOVER" },
    create: {
      email: "mover@pulsar.app",
      name: "Alex Mover",
      passwordHash: hash,
      role: "MOVER",
      moverProfile: { create: { preferredAmbiance: "LOFI" } },
    },
  });

  const pilotUser = await prisma.user.upsert({
    where: { email: "pilot@pulsar.app" },
    update: { passwordHash: hash, name: "Nova Pilot", role: "PILOT" },
    create: {
      email: "pilot@pulsar.app",
      name: "Nova Pilot",
      passwordHash: hash,
      role: "PILOT",
      pilotProfile: {
        create: {
          avatarEnergy: "vibrant",
          vehicleType: "Tesla Model 3",
          licensePlate: "A123456",
          licenseNumber: "402-0000000-0",
          vehicleColor: "Blanco",
          approvalStatus: "APPROVED",
          auraScore: 4.9,
          isOnline: true,
          lat: 18.48,
          lng: -69.93,
        },
      },
    },
  });

  await prisma.pilotProfile.upsert({
    where: { userId: pilotUser.id },
    update: {
      licensePlate: "A123456",
      licenseNumber: "402-0000000-0",
      vehicleColor: "Blanco",
      approvalStatus: "APPROVED",
    },
    create: {
      userId: pilotUser.id,
      licensePlate: "A123456",
      licenseNumber: "402-0000000-0",
      vehicleColor: "Blanco",
      approvalStatus: "APPROVED",
    },
  });

  for (const z of SD_ZONES) {
    await prisma.liveZone.create({ data: z });
  }

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  await prisma.routine.create({
    data: {
      userId: mover.id,
      label: "Gym",
      address: "Agora Mall, Santo Domingo",
      lat: 18.472,
      lng: -69.939,
      dayOfWeek: 4,
      hourStart: 18,
      hourEnd: 20,
      confidence: 0.88,
      enabled: true,
      userScheduled: true,
    },
  });

  await prisma.routine.create({
    data: {
      userId: mover.id,
      label: "Trabajo",
      address: "Piantini, Santo Domingo",
      lat: 18.472,
      lng: -69.942,
      dayOfWeek: day,
      hourStart: Math.max(7, hour),
      hourEnd: Math.max(8, hour + 1),
      confidence: 0.82,
      enabled: false,
      userScheduled: false,
    },
  });

  for (let i = 0; i < 5; i++) {
    await prisma.movementLog.create({
      data: {
        userId: mover.id,
        lat: 18.472 + i * 0.001,
        lng: -69.939,
        address: "Agora Mall",
        dayOfWeek: 4,
        hourOfDay: 18,
        visitedAt: new Date(Date.now() - i * 86400000 * 7),
      },
    });
  }

  console.log("Pulsar seed OK");
  console.log("  mover@pulsar.app / pulsar123");
  console.log("  pilot@pulsar.app / pulsar123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
