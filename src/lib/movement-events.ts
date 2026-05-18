import { prisma } from "@/lib/prisma";

export async function logMovementEvent(
  movementId: string,
  type: string,
  payload?: Record<string, unknown>
) {
  await prisma.movementEvent.create({
    data: {
      movementId,
      type,
      payload: payload ? JSON.stringify(payload) : null,
    },
  });
}

export async function listMovementEvents(movementId: string, limit = 50) {
  return prisma.movementEvent.findMany({
    where: { movementId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
