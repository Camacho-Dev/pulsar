import { prisma } from "@/lib/prisma";

export async function getLiveZones() {
  const zones = await prisma.liveZone.findMany({
    where: {
      OR: [{ activeUntil: null }, { activeUntil: { gt: new Date() } }],
    },
  });

  const searching = await prisma.movement.count({
    where: { status: "SEARCHING_PILOT" },
  });

  return zones.map((z) => ({
    ...z,
    intensity: Math.min(1, z.intensity + searching * 0.02),
  }));
}
