import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { snapIfNeeded } from "@/lib/maps/map-matching";
import { quickEtaMinutes } from "@/services/eta.service";
import { upsertPilotLocation } from "@/lib/pilot-geo";
import { prisma } from "@/lib/prisma";
import { MovementEvents } from "@/core/events";
import { addTripMessage } from "@/lib/trip-chat";
import { userParticipatesInMovement } from "@/lib/movement-access";
import type { PilotLocation } from "./socket-types";

const pilotLocations = new Map<string, PilotLocation>();

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    path: "/api/socket/io",
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    socket.on("mover:join", (userId: string) => {
      socket.join(`mover:${userId}`);
      socket.data.userId = userId;
      socket.data.role = "mover";
    });

    socket.on("pilot:join", (payload: { userId: string; name: string }) => {
      socket.join("pilots");
      socket.join(`pilot:${payload.userId}`);
      socket.data.userId = payload.userId;
      socket.data.role = "pilot";
      socket.data.name = payload.name;
    });

    socket.on(
      "movement:join",
      (payload: { movementId: string; role: "mover" | "pilot" }) => {
        socket.join(`movement:${payload.movementId}`);
        if (payload.role === "mover") {
          const last = pilotLocations.get(payload.movementId);
          if (last) socket.emit(MovementEvents.PILOT_LOCATION, last);
        }
      }
    );

    socket.on(
      "pilot:location",
      async (payload: {
        userId: string;
        name: string;
        lat: number;
        lng: number;
        movementId?: string;
        accuracy?: number;
        transportMode?: string;
        auraScore?: number;
        avatarEnergy?: string;
      }) => {
        const snapped = await snapIfNeeded({
          lat: payload.lat,
          lng: payload.lng,
          accuracy: payload.accuracy,
        });

        await upsertPilotLocation({
          userId: payload.userId,
          name: payload.name,
          lat: snapped.lat,
          lng: snapped.lng,
          transportMode: payload.transportMode ?? "CAR",
          auraScore: payload.auraScore ?? 4.5,
          avatarEnergy: payload.avatarEnergy ?? "calm",
        });

        const loc: PilotLocation = {
          userId: payload.userId,
          name: payload.name,
          lat: snapped.lat,
          lng: snapped.lng,
          movementId: payload.movementId,
          updatedAt: Date.now(),
        };

        if (payload.movementId) {
          pilotLocations.set(payload.movementId, loc);
          io?.to(`movement:${payload.movementId}`).emit(
            MovementEvents.PILOT_LOCATION,
            loc
          );

          const movement = await prisma.movement.findUnique({
            where: { id: payload.movementId },
          });
          if (movement) {
            const target =
              movement.status === "IN_PROGRESS"
                ? { lat: movement.toLat, lng: movement.toLng }
                : { lat: movement.fromLat, lng: movement.fromLng };
            const etaMin = quickEtaMinutes(
              { lat: loc.lat, lng: loc.lng },
              target
            );
            io?.to(`movement:${payload.movementId}`).emit(
              MovementEvents.ETA_UPDATE,
              { movementId: payload.movementId, etaMin }
            );
          }
        }

        io?.to("pilots").emit(MovementEvents.PILOT_LOCATION, loc);
      }
    );

    socket.on(
      "chat:send",
      async (payload: {
        movementId: string;
        body: string;
        senderName: string;
        senderRole: "mover" | "pilot";
      }) => {
        const userId = socket.data.userId as string | undefined;
        if (!userId || !payload.movementId || !payload.body?.trim()) return;

        const role = await userParticipatesInMovement(
          payload.movementId,
          userId
        );
        if (!role) return;

        const msg = await addTripMessage({
          movementId: payload.movementId,
          senderId: userId,
          senderRole: role,
          senderName: payload.senderName?.trim() || "Usuario",
          body: payload.body,
        });

        io?.to(`movement:${payload.movementId}`).emit(
          MovementEvents.CHAT_MESSAGE,
          msg
        );
      }
    );
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

function withIO(run: (server: Server) => void) {
  if (!io) return;
  try {
    run(io);
  } catch {
    /* socket opcional si el servidor no esta en server.ts */
  }
}

export function emitMovementUpdate(moverId: string, movement: object) {
  withIO((server) => {
    server.to(`mover:${moverId}`).emit(MovementEvents.MOVEMENT_UPDATE, movement);
    const id = (movement as { id?: string }).id;
    if (id) server.to(`movement:${id}`).emit(MovementEvents.MOVEMENT_UPDATE, movement);
  });
}

export function emitMovementOffer(pilotId: string, movement: object) {
  withIO((server) => {
    server.to(`pilot:${pilotId}`).emit(MovementEvents.MOVEMENT_OFFER, movement);
  });
}

export function emitMatching(moverId: string, payload: object) {
  withIO((server) => {
    server.to(`mover:${moverId}`).emit(MovementEvents.MATCHING, payload);
  });
}

export function emitEtaUpdate(
  moverId: string,
  movementId: string,
  etaMin: number,
  label?: string
) {
  const payload = { movementId, etaMin, label };
  withIO((server) => {
    server.to(`mover:${moverId}`).emit(MovementEvents.ETA_UPDATE, payload);
    server.to(`movement:${movementId}`).emit(MovementEvents.ETA_UPDATE, payload);
  });
}

export function emitSharedFlow(payload: object) {
  withIO((server) => {
    server.emit(MovementEvents.SHARED_FLOW, payload);
  });
}

export function emitChatMessage(movementId: string, message: object) {
  withIO((server) => {
    server
      .to(`movement:${movementId}`)
      .emit(MovementEvents.CHAT_MESSAGE, message);
  });
}
