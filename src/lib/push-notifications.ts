import { prisma } from "@/lib/prisma";

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function registerPushToken(
  userId: string,
  token: string,
  platform = "web"
) {
  if (!token.trim()) return;
  await prisma.devicePushToken.upsert({
    where: {
      userId_token: { userId, token: token.trim() },
    },
    create: { userId, token: token.trim(), platform },
    update: { platform, updatedAt: new Date() },
  });
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const tokens = await prisma.devicePushToken.findMany({
    where: { userId },
    select: { token: true, platform: true },
  });

  if (!tokens.length) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[push]", userId, payload.title, payload.body);
    }
    return;
  }

  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey) {
    console.info("[push:sin-fcm]", userId, payload.title);
    return;
  }

  for (const { token } of tokens) {
    try {
      await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          Authorization: `key=${serverKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data ?? {},
        }),
      });
    } catch (err) {
      console.warn("[push] fallo envio", err);
    }
  }
}

export async function notifyMovementStatus(
  movementId: string,
  moverId: string,
  pilotId: string | null | undefined,
  status: string,
  extra?: { pilotName?: string }
) {
  const pilotName = extra?.pilotName ?? "Tu conductor";

  const moverMessages: Record<string, PushPayload> = {
    PILOT_ASSIGNED: {
      title: "Conductor asignado",
      body: `${pilotName} aceptó tu viaje y va en camino.`,
      data: { movementId, type: "movement" },
    },
    PILOT_ARRIVING: {
      title: "Conductor en camino",
      body: `${pilotName} se acerca al punto de recogida.`,
      data: { movementId, type: "movement" },
    },
    IN_PROGRESS: {
      title: "Viaje iniciado",
      body: "¡Buen viaje! Llegarás pronto a tu destino.",
      data: { movementId, type: "movement" },
    },
    COMPLETED: {
      title: "Viaje completado",
      body: "Califica tu experiencia en Pulsar.",
      data: { movementId, type: "movement" },
    },
    CANCELLED: {
      title: "Viaje cancelado",
      body: "El viaje fue cancelado.",
      data: { movementId, type: "movement" },
    },
  };

  const pilotMessages: Record<string, PushPayload> = {
    SEARCHING_PILOT: {
      title: "Nueva solicitud",
      body: "Hay un viaje disponible cerca de ti.",
      data: { movementId, type: "offer" },
    },
  };

  const moverMsg = moverMessages[status];
  if (moverMsg) void sendPushToUser(moverId, moverMsg);

  if (pilotId && status === "SEARCHING_PILOT") {
    const offer = pilotMessages.SEARCHING_PILOT;
    if (offer) void sendPushToUser(pilotId, offer);
  }
}
