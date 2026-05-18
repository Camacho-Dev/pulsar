export type CarServiceTier = "PULSAR" | "CONFORT" | "SELECT" | "BLACK";

export const CAR_SERVICE_TIERS: {
  id: CarServiceTier;
  label: string;
  desc: string;
  etaHint: string;
  multiplier: number;
}[] = [
  {
    id: "PULSAR",
    label: "Pulsar",
    desc: "Viaje estandar, buen precio",
    etaHint: "~3 min",
    multiplier: 1,
  },
  {
    id: "CONFORT",
    label: "Confort",
    desc: "Vehiculos mas amplios y suaves",
    etaHint: "~5 min",
    multiplier: 1.25,
  },
  {
    id: "SELECT",
    label: "Select",
    desc: "Conductores mejor calificados",
    etaHint: "~6 min",
    multiplier: 1.45,
  },
  {
    id: "BLACK",
    label: "Black",
    desc: "Premium, ejecutivo",
    etaHint: "~8 min",
    multiplier: 1.85,
  },
];

export const DEFAULT_CAR_SERVICE: CarServiceTier = "PULSAR";

export function carServiceLabel(tier: string | null | undefined) {
  return (
    CAR_SERVICE_TIERS.find((t) => t.id === tier)?.label ?? tier ?? "Pulsar"
  );
}
