import { prisma } from "@/lib/prisma";
import { locationToCell, neighborCells } from "@/lib/maps/geo-cell";
import { haversineKm } from "@/lib/geo";

export type DemandHint = {
  message: string;
  direction: string;
  demandBoost: number;
  lat: number;
  lng: number;
};

/** IA operativa: sugiere dónde moverse según demanda y zonas vivas */
export async function getPilotDemandHint(
  lat: number,
  lng: number
): Promise<DemandHint> {
  const cell = locationToCell(lat, lng);
  const neighbors = neighborCells(cell, 1);

  const searchingHere = await prisma.movement.count({
    where: {
      status: "SEARCHING_PILOT",
      OR: [{ h3Origin: { in: neighbors } }, { h3Dest: { in: neighbors } }],
    },
  });

  const zones = await prisma.liveZone.findMany({
    where: {
      OR: [{ activeUntil: null }, { activeUntil: { gt: new Date() } }],
    },
  });

  let best = zones[0];
  let bestScore = -1;

  for (const z of zones) {
    const dist = haversineKm(lat, lng, z.lat, z.lng);
    const demand =
      (z.type === "EVENT" ? 1.4 : z.type === "PREMIUM" ? 1.2 : 1) *
      z.intensity *
      (1 / (dist + 0.3));
    if (demand > bestScore) {
      bestScore = demand;
      best = z;
    }
  }

  const boost = Math.round(
    (searchingHere * 12 + (best?.intensity ?? 0.5) * 40) 
  );

  if (best && haversineKm(lat, lng, best.lat, best.lng) > 0.5) {
    const dir =
      best.lat > lat ? "norte" : best.lat < lat ? "sur" : best.lng > lng ? "este" : "oeste";
    return {
      message: `Muévete hacia ${best.name} (${dir}). Demanda +${boost}% en ~7 min.`,
      direction: dir,
      demandBoost: boost,
      lat: best.lat,
      lng: best.lng,
    };
  }

  return {
    message: `Zona activa. ${searchingHere} movimiento(s) buscando pilot cerca.`,
    direction: "aquí",
    demandBoost: boost,
    lat,
    lng,
  };
}
