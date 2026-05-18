import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

const r = await prisma.movement.updateMany({
  where: { status: "SEARCHING_PILOT" },
  data: { status: "CANCELLED" },
});
console.log("Viajes en busqueda cancelados:", r.count);
await prisma.$disconnect();
