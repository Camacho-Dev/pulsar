import { prisma } from "@/lib/prisma";

export async function rateMovement(
  movementId: string,
  moverId: string,
  scores: {
    punctuality: number;
    smoothness: number;
    safety: number;
    cleanliness: number;
    ambiance: number;
    conversation: number;
    comment?: string;
  }
) {
  const movement = await prisma.movement.findFirst({
    where: { id: movementId, moverId, status: "COMPLETED" },
  });
  if (!movement?.pilotId) return null;

  const existing = await prisma.movementRating.findUnique({
    where: { movementId },
  });
  if (existing) return existing;

  const rating = await prisma.movementRating.create({
    data: {
      movementId,
      moverId,
      ...scores,
    },
  });

  const all = await prisma.movementRating.findMany({
    where: { movement: { pilotId: movement.pilotId } },
  });

  const n = all.length;
  const avg = (key: keyof typeof scores) =>
    all.reduce((s, r) => s + (r[key] as number), 0) / n;

  await prisma.pilotProfile.update({
    where: { userId: movement.pilotId },
    data: {
      punctuality: avg("punctuality"),
      smoothness: avg("smoothness"),
      safety: avg("safety"),
      cleanliness: avg("cleanliness"),
      ambianceFit: avg("ambiance"),
      conversation: avg("conversation"),
      auraScore:
        (avg("punctuality") +
          avg("smoothness") +
          avg("safety") +
          avg("ambiance")) /
        4,
    },
  });

  return rating;
}
