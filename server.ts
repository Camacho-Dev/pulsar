import "dotenv/config";
import { execSync } from "child_process";
import { mkdirSync } from "fs";
import { createServer } from "http";
import path from "path";
import next from "next";
import { initSocketServer } from "./src/lib/socket-server";

const dev = process.env.NODE_ENV !== "production";

if (dev) {
  try {
    execSync("npx prisma db push", { stdio: "pipe" });
    execSync("npx prisma generate", { stdio: "pipe" });
  } catch {
    console.warn(
      "[pulsar] No se pudo sincronizar Prisma al arrancar. Ejecuta: npm run db:setup"
    );
  }
} else {
  try {
    const dbUrl = process.env.DATABASE_URL ?? "";
    const match = dbUrl.match(/^file:(.+)$/);
    if (match?.[1]) {
      mkdirSync(path.dirname(path.resolve(match[1])), { recursive: true });
    }
    execSync("npx prisma db push", { stdio: "pipe" });
    execSync("npx tsx prisma/seed.ts", { stdio: "pipe" });
  } catch {
    console.warn("[pulsar] Migracion/seed en arranque (puede ser normal si ya existe BD)");
  }
}
const hostname = process.env.HOST ?? "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  initSocketServer(server);

  server.listen(port, () => {
    console.log(`> Pulsar listo en http://${hostname}:${port}`);
    console.log(`> Socket.IO en /api/socket/io`);
  });
});
