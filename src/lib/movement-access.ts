import { prisma } from "@/lib/prisma";

export async function userParticipatesInMovement(
  movementId: string,
  userId: string
): Promise<"mover" | "pilot" | null> {
  const m = await prisma.movement.findUnique({
    where: { id: movementId },
    select: { moverId: true, pilotId: true },
  });
  if (!m) return null;
  if (m.moverId === userId) return "mover";
  if (m.pilotId === userId) return "pilot";
  return null;
}
