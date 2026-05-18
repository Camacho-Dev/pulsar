import { prisma } from "@/lib/prisma";
import { locationToCell, neighborCells } from "@/lib/maps/geo-cell";
import { emitSharedFlow } from "@/lib/socket-server";

const WINDOW_MS = 20 * 60 * 1000;

/** Micro-ruta compartida: agrupa movers con destino H3 compatible */
export async function tryAttachSharedFlow(movementId: string) {
  const movement = await prisma.movement.findUnique({ where: { id: movementId } });
  if (!movement) return null;

  const h3Dest = movement.h3Dest ?? locationToCell(movement.toLat, movement.toLng);
  const since = new Date(Date.now() - WINDOW_MS);

  const candidates = await prisma.movement.findMany({
    where: {
      id: { not: movementId },
      status: "SEARCHING_PILOT",
      createdAt: { gte: since },
      h3Dest,
    },
    take: 3,
  });

  const cells = neighborCells(h3Dest, 1);
  const nearby = await prisma.movement.findMany({
    where: {
      id: { not: movementId },
      status: "SEARCHING_PILOT",
      createdAt: { gte: since },
      h3Dest: { in: cells },
    },
    take: 3,
  });

  const group = [...candidates, ...nearby];
  if (group.length === 0) return null;

  let flow = await prisma.sharedFlow.findFirst({
    where: {
      h3Cell: h3Dest,
      status: "forming",
      departureMin: { gte: new Date() },
    },
  });

  if (!flow) {
    flow = await prisma.sharedFlow.create({
      data: {
        label: `Viaje compartido · zona ${h3Dest.slice(-4).toUpperCase()}`,
        h3Cell: h3Dest,
        status: "forming",
        maxMovers: 4,
        departureMin: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
  }

  const count = await prisma.movement.count({
    where: { sharedFlowId: flow.id },
  });
  if (count >= flow.maxMovers) return null;

  await prisma.movement.update({
    where: { id: movementId },
    data: { sharedFlowId: flow.id },
  });

  const payload = {
    flowId: flow.id,
    label: flow.label,
    moversInFlow: count + 1,
    maxMovers: flow.maxMovers,
    message: `Micro-ruta: ${count + 1} personas hacia zona compatible`,
  };

  emitSharedFlow(payload);
  return payload;
}

export async function listFormingFlows() {
  return prisma.sharedFlow.findMany({
    where: { status: "forming" },
    include: {
      movements: {
        include: { mover: { select: { name: true } } },
      },
    },
    orderBy: { departureMin: "asc" },
    take: 10,
  });
}
