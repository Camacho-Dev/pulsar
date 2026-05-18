import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/** Incrementar si el schema cambia y hay que invalidar cliente cacheado en dev */
const PRISMA_GLOBAL_KEY = "pulsar_prisma_v4";
const globalForPrisma = globalThis as unknown as {
  [PRISMA_GLOBAL_KEY]?: PrismaClient;
};

function resolveDbUrl() {
  const raw = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (raw.startsWith("file:./")) {
    const relative = raw.replace("file:", "");
    return `file:${path.join(process.cwd(), relative)}`;
  }
  if (raw.startsWith("file:") && !raw.startsWith("file:/")) {
    return `file:${path.join(process.cwd(), raw.slice(5))}`;
  }
  return raw;
}

function createPrisma() {
  const url = resolveDbUrl();
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma[PRISMA_GLOBAL_KEY] ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma[PRISMA_GLOBAL_KEY] = prisma;
}
