import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AMBIANCE_LABELS: Record<string, string> = {
  SILENT: "Silencio",
  LOFI: "Lofi",
  NETWORKING: "Networking",
  BUSINESS: "Negocios",
  ENERGY: "Energía",
  GAMER: "Relax",
};

export { ZONE_LABELS, TRANSPORT_LABELS } from "@/lib/copy";

export const ZONE_COLORS: Record<string, string> = {
  TRAFFIC: "#ef4444",
  SAFE: "#3b82f6",
  PREMIUM: "#fbbf24",
  EVENT: "#a855f7",
  FLOW: "#22c55e",
};
