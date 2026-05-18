import { prisma } from "@/lib/prisma";

export type TripChatMessage = {
  id: string;
  movementId: string;
  senderId: string;
  senderRole: "mover" | "pilot";
  senderName: string;
  body: string;
  createdAt: string;
};

function toDto(row: {
  id: string;
  movementId: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  body: string;
  createdAt: Date;
}): TripChatMessage {
  return {
    id: row.id,
    movementId: row.movementId,
    senderId: row.senderId,
    senderRole: row.senderRole as "mover" | "pilot",
    senderName: row.senderName,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listTripMessages(
  movementId: string
): Promise<TripChatMessage[]> {
  const rows = await prisma.tripChatMessage.findMany({
    where: { movementId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return rows.map(toDto);
}

export async function addTripMessage(input: {
  movementId: string;
  senderId: string;
  senderRole: "mover" | "pilot";
  senderName: string;
  body: string;
}): Promise<TripChatMessage> {
  const row = await prisma.tripChatMessage.create({
    data: {
      movementId: input.movementId,
      senderId: input.senderId,
      senderRole: input.senderRole,
      senderName: input.senderName.trim() || "Usuario",
      body: input.body.trim(),
    },
  });
  return toDto(row);
}
