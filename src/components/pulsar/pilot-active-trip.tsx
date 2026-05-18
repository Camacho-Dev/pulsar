"use client";

import { useState } from "react";
import { Bell, MapPin, User, XCircle } from "lucide-react";
import { TripChat } from "@/components/pulsar/trip-chat";
import {
  MOVEMENT_STATUS_LABEL,
  PILOT_ACTION_LABELS,
} from "@/lib/movement-labels";
import { carServiceLabel } from "@/lib/car-services";
import { AMBIANCE_LABELS, TRANSPORT_LABELS } from "@/lib/utils";

export type PilotActiveTrip = {
  id: string;
  status: string;
  fromAddress: string;
  toAddress: string;
  ambiance?: string;
  transportMode?: string;
  serviceTier?: string | null;
  mover: { id?: string; name: string };
};

type PilotAction = "arrive" | "notify_arrived" | "start" | "complete";

type Props = {
  trip: PilotActiveTrip;
  pilotId: string;
  pilotName: string;
  onAction: (action: PilotAction) => void;
  onCancel: () => void;
};

export function PilotActiveTripPanel({
  trip,
  pilotId,
  pilotName,
  onAction,
  onCancel,
}: Props) {
  const [pickupNotified, setPickupNotified] = useState(false);

  const statusLabel =
    MOVEMENT_STATUS_LABEL[trip.status as keyof typeof MOVEMENT_STATUS_LABEL] ??
    trip.status;

  const showNotify =
    (trip.status === "PILOT_ASSIGNED" || trip.status === "PILOT_ARRIVING") &&
    !pickupNotified;

  function handleNotify() {
    onAction("notify_arrived");
    setPickupNotified(true);
  }

  return (
    <div className="glass pulse-glow space-y-4 rounded-2xl border border-cyan-500/30 p-4">
      <p className="text-xs uppercase tracking-widest text-cyan-400">
        {statusLabel}
      </p>
      <p className="flex items-center gap-2 text-lg font-semibold text-white">
        <User className="h-5 w-5 text-violet-400" />
        {trip.mover.name}
      </p>

      <TripChat
        movementId={trip.id}
        userId={pilotId}
        userName={pilotName}
        role="pilot"
        otherPartyName={trip.mover.name}
        disabled={trip.status === "COMPLETED" || trip.status === "CANCELLED"}
      />

      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
        <p className="flex items-center gap-1 text-xs text-zinc-500">
          <MapPin className="h-3 w-3" /> Recogida
        </p>
        <p className="mt-0.5 text-zinc-200">{trip.fromAddress}</p>
        <p className="mt-2 text-xs text-zinc-500">Destino</p>
        <p className="text-zinc-300">{trip.toAddress}</p>
      </div>

      {(trip.ambiance || trip.transportMode) && (
        <p className="text-xs text-zinc-500">
          {trip.transportMode &&
            (TRANSPORT_LABELS[trip.transportMode] ?? trip.transportMode)}
          {trip.serviceTier && ` · ${carServiceLabel(trip.serviceTier)}`}
          {trip.ambiance && (
            <> · {AMBIANCE_LABELS[trip.ambiance] ?? trip.ambiance}</>
          )}
        </p>
      )}

      {pickupNotified && trip.status !== "IN_PROGRESS" && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          Avisaste al pasajero. Espera a que salga o escribele por el chat.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {trip.status === "PILOT_ASSIGNED" && (
          <button
            type="button"
            onClick={() => onAction("arrive")}
            className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white"
          >
            {PILOT_ACTION_LABELS.arrive}
          </button>
        )}

        {showNotify && (
          <button
            type="button"
            onClick={handleNotify}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/15 py-2.5 text-sm font-medium text-amber-200"
          >
            <Bell className="h-4 w-4" />
            {PILOT_ACTION_LABELS.notify_arrived}
          </button>
        )}

        {(trip.status === "PILOT_ARRIVING" ||
          (trip.status === "PILOT_ASSIGNED" && pickupNotified)) && (
          <button
            type="button"
            onClick={() => onAction("start")}
            className="w-full rounded-xl bg-cyan-600 py-2.5 text-sm font-medium text-white"
          >
            {PILOT_ACTION_LABELS.start}
          </button>
        )}

        {trip.status === "IN_PROGRESS" && (
          <button
            type="button"
            onClick={() => onAction("complete")}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white"
          >
            {PILOT_ACTION_LABELS.complete}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-sm text-red-300"
      >
        <XCircle className="h-4 w-4" />
        Cancelar viaje
      </button>
    </div>
  );
}
