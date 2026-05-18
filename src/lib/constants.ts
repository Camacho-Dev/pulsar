import type { Ambiance, TransportMode } from "@prisma/client";

export const AMBIANCE_OPTIONS: {
  id: Ambiance;
  label: string;
  desc: string;
  icon: string;
}[] = [
  { id: "SILENT", label: "Silencio", desc: "Viaje tranquilo, sin charla", icon: "🤫" },
  { id: "LOFI", label: "Lofi", desc: "Música suave de fondo", icon: "🎧" },
  {
    id: "NETWORKING",
    label: "Networking",
    desc: "Conversación profesional ligera",
    icon: "💼",
  },
  { id: "BUSINESS", label: "Negocios", desc: "Enfocado y productivo", icon: "📊" },
  { id: "ENERGY", label: "Energía", desc: "Ambiente animado", icon: "⚡" },
  { id: "GAMER", label: "Relax", desc: "Casual y distendido", icon: "🎮" },
];

export const DEFAULT_CENTER = { lat: 18.4861, lng: -69.9312 };

/** Vehículos que el conductor puede cubrir en el matching */
export const TRANSPORT_OPTIONS: {
  id: TransportMode;
  label: string;
  hint: string;
}[] = [
  { id: "CAR", label: "Auto", hint: "Sedán o SUV" },
  { id: "MOTO", label: "Moto", hint: "Rápido en ciudad" },
  { id: "SHARED_VAN", label: "Van", hint: "Grupo o equipaje" },
];
