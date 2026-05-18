import "dotenv/config";
import { createMovement } from "../src/services/movement.service.ts";

const mover = { id: "test" };
try {
  const m = await createMovement({
    moverId: (await import("@prisma/client")).PrismaClient
      ? (await (async () => {
          const path = await import("path");
          const { PrismaClient } = await import("@prisma/client");
          const { PrismaBetterSqlite3 } = await import(
            "@prisma/adapter-better-sqlite3"
          );
          const url = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
          const p = new PrismaClient({
            adapter: new PrismaBetterSqlite3({ url }),
          });
          const u = await p.user.findUnique({
            where: { email: "mover@pulsar.app" },
          });
          await p.$disconnect();
          return u?.id;
        })())
      : null,
    ambiance: "LOFI",
    transportMode: "CAR",
    serviceTier: "SELECT",
    fromAddress: "Edificio Navieros",
    toAddress: "Piantini",
    fromLat: 18.4861,
    fromLng: -69.9312,
    toLat: 18.472,
    toLng: -69.942,
  });
  console.log("OK", m?.id);
} catch (e) {
  console.error("FAIL", e?.message ?? e);
  console.error(e?.stack);
}
