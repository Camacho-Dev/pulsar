import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

const mover = await prisma.user.findUnique({
  where: { email: "mover@pulsar.app" },
});
if (!mover) {
  console.log("No mover user - run db:seed");
  process.exit(1);
}

try {
  const m = await prisma.movement.create({
    data: {
      moverId: mover.id,
      status: "SEARCHING_PILOT",
      ambiance: "LOFI",
      transportMode: "CAR",
      serviceTier: "CONFORT",
      fromAddress: "Test A",
      toAddress: "Test B",
      fromLat: 18.48,
      fromLng: -69.93,
      toLat: 18.47,
      toLng: -69.94,
      etaMin: 12,
    },
  });
  console.log("OK", m.id, m.serviceTier);
  await prisma.movement.delete({ where: { id: m.id } });
} catch (e) {
  console.error("FAIL", e.message);
}
await prisma.$disconnect();
