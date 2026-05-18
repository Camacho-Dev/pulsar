import { execSync } from "child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_URL = "file:./prisma/test-flow.db";

const PRISMA_GLOBAL_KEY = "pulsar_prisma_v4";

describe("movement flow", () => {
  let prisma: Awaited<typeof import("@/lib/prisma")>["prisma"];
  let addTripMessage: typeof import("@/lib/trip-chat")["addTripMessage"];
  let listTripMessages: typeof import("@/lib/trip-chat")["listTripMessages"];
  let pilotAcceptMovement: typeof import("@/services/movement.service")["pilotAcceptMovement"];
  let moverId: string;
  let pilotId: string;

  beforeAll(async () => {
    execSync("npx prisma generate", { stdio: "pipe" });
    execSync("npx prisma db push", {
      env: process.env,
      stdio: "pipe",
    });

    const g = globalThis as Record<string, unknown>;
    delete g[PRISMA_GLOBAL_KEY];

    const lib = await import("@/lib/prisma");
    prisma = lib.prisma;
    const chat = await import("@/lib/trip-chat");
    addTripMessage = chat.addTripMessage;
    listTripMessages = chat.listTripMessages;
    const movement = await import("@/services/movement.service");
    pilotAcceptMovement = movement.pilotAcceptMovement;

    await prisma.tripChatMessage.deleteMany();
    await prisma.movementEvent.deleteMany();
    await prisma.movement.deleteMany();
    await prisma.user.deleteMany();

    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("test", 4);
    const mover = await prisma.user.create({
      data: {
        email: "test-mover@pulsar.app",
        name: "Test Mover",
        passwordHash: hash,
        role: "MOVER",
        moverProfile: { create: {} },
      },
    });
    const pilot = await prisma.user.create({
      data: {
        email: "test-pilot@pulsar.app",
        name: "Test Pilot",
        passwordHash: hash,
        role: "PILOT",
        pilotProfile: {
          create: {
            approvalStatus: "APPROVED",
            licensePlate: "T000001",
            licenseNumber: "402-1111111-1",
            isOnline: true,
            lat: 18.48,
            lng: -69.93,
          },
        },
      },
    });
    moverId = mover.id;
    pilotId = pilot.id;
  }, 60_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("acepta piloto y persiste chat en BD", async () => {
    const movement = await prisma.movement.create({
      data: {
        moverId,
        status: "SEARCHING_PILOT",
        ambiance: "LOFI",
        transportMode: "CAR",
        serviceTier: "PULSAR",
        fromAddress: "Origen",
        toAddress: "Destino",
        fromLat: 18.48,
        fromLng: -69.93,
        toLat: 18.47,
        toLng: -69.94,
      },
    });

    const accepted = await pilotAcceptMovement(movement.id, pilotId);
    expect(accepted.status).toBe("PILOT_ASSIGNED");

    await addTripMessage({
      movementId: movement.id,
      senderId: moverId,
      senderRole: "mover",
      senderName: "Mover",
      body: "Hola conductor",
    });

    const messages = await listTripMessages(movement.id);
    expect(messages).toHaveLength(1);
    expect(messages[0].body).toBe("Hola conductor");

    const events = await prisma.movementEvent.findMany({
      where: { movementId: movement.id },
    });
    expect(events.some((e) => e.type === "PILOT_ASSIGNED")).toBe(true);
  }, 30_000);

  it("registra evento al cancelar", async () => {
    const movement = await prisma.movement.create({
      data: {
        moverId,
        status: "SEARCHING_PILOT",
        ambiance: "SILENT",
        transportMode: "CAR",
        fromAddress: "A",
        toAddress: "B",
        fromLat: 18.49,
        fromLng: -69.92,
        toLat: 18.46,
        toLng: -69.95,
      },
    });

    await prisma.movement.update({
      where: { id: movement.id },
      data: { status: "CANCELLED" },
    });
    await prisma.movementEvent.create({
      data: { movementId: movement.id, type: "CANCELLED" },
    });

    const row = await prisma.movement.findUnique({ where: { id: movement.id } });
    expect(row?.status).toBe("CANCELLED");
  });
});
