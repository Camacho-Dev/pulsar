import type { MovementStatus } from "@prisma/client";

export const MOVEMENT_STATUS_LABEL: Record<MovementStatus, string> = {
  SEARCHING_PILOT: "Buscando conductor",
  PILOT_ASSIGNED: "Conductor asignado",
  PILOT_ARRIVING: "Con camino a ti",
  IN_PROGRESS: "Viaje en curso",
  COMPLETED: "Viaje completado",
  CANCELLED: "Viaje cancelado",
};

/** Acciones del conductor según estado */
export const PILOT_ACTION_LABELS = {
  arrive: "Voy en camino",
  notify_arrived: "Avisar que llegué",
  start: "Pasajero a bordo",
  complete: "Finalizar viaje",
} as const;
