export type PilotLocation = {
  userId: string;
  name: string;
  lat: number;
  lng: number;
  movementId?: string;
  updatedAt: number;
};

export type MovementPayload = {
  id: string;
  status: string;
  etaMin?: number | null;
  pilot?: { id: string; name: string } | null;
  [key: string]: unknown;
};
