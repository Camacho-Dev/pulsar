export type TripChatMessage = {
  id: string;
  movementId: string;
  senderId: string;
  senderRole: "mover" | "pilot";
  senderName: string;
  body: string;
  createdAt: string;
};

const byMovement = new Map<string, TripChatMessage[]>();
const MAX_PER_TRIP = 200;

export function listTripMessages(movementId: string): TripChatMessage[] {
  return [...(byMovement.get(movementId) ?? [])];
}

export function addTripMessage(input: {
  movementId: string;
  senderId: string;
  senderRole: "mover" | "pilot";
  senderName: string;
  body: string;
}): TripChatMessage {
  const msg: TripChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    movementId: input.movementId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    senderName: input.senderName,
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
  };
  const list = byMovement.get(input.movementId) ?? [];
  list.push(msg);
  if (list.length > MAX_PER_TRIP) list.splice(0, list.length - MAX_PER_TRIP);
  byMovement.set(input.movementId, list);
  return msg;
}
