import "dotenv/config";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { createMovement } from "../src/services/movement.service";

const url = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

const user = await prisma.user.findUnique({
  where: { email: "mover@pulsar.app" },
});
if (!user) throw new Error("seed first");

await prisma.movement.updateMany({
  where: { moverId: user.id, status: "SEARCHING_PILOT" },
  data: { status: "CANCELLED" },
});

try {
  const m = await createMovement({
    moverId: user.id,
    ambiance: "LOFI",
    transportMode: "CAR",
    serviceTier: "CONFORT",
    fromAddress: "Edificio Navieros",
    toAddress: "Piantini",
    fromLat: 18.4861,
    fromLng: -69.9312,
    toLat: 18.472,
    toLng: -69.942,
  });
  console.log("OK", m.id, m.serviceTier);
  await prisma.movement.delete({ where: { id: m.id } });
} catch (e) {
  console.error("FAIL", e instanceof Error ? e.message : e);
  if (e instanceof Error) console.error(e.stack);
}
await prisma.$disconnect();
