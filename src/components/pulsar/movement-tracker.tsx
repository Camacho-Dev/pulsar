"use client";

import { MOVEMENT_STATUS_LABEL } from "@/lib/movement-labels";
import { carServiceLabel } from "@/lib/car-services";
import { AMBIANCE_LABELS, TRANSPORT_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Loader2, MapPin, User, Users, XCircle } from "lucide-react";
import { TripChat } from "@/components/pulsar/trip-chat";

export type MovementView = {
  id: string;
  status: keyof typeof MOVEMENT_STATUS_LABEL;
  toAddress: string;
  toLat?: number;
  toLng?: number;
  fromAddress: string;
  ambiance: string;
  transportMode?: string;
  serviceTier?: string | null;
  etaMin?: number | null;
  pilot?: {
    id: string;
    name: string;
    pilotProfile?: { auraScore: number; vehicleType?: string } | null;
  } | null;
  sharedFlow?: { label: string; maxMovers: number } | null;
  stops?: { id: string; type: string; address: string }[];
  modularHint?: string;
};

type Props = {
  movement: MovementView;
  moverId: string;
  moverName: string;
  liveEta?: number | null;
  etaLabel?: string | null;
  matchingMessage?: string | null;
  onCancel?: () => void;
  cancelLabel?: string;
};

const CANCELLABLE = [
  "SEARCHING_PILOT",
  "PILOT_ASSIGNED",
  "PILOT_ARRIVING",
  "IN_PROGRESS",
];

function etaCaption(status: MovementView["status"], etaLabel?: string | null) {
  if (etaLabel === "pickup") return "Llegada del conductor";
  if (etaLabel === "trip" || status === "SEARCHING_PILOT") {
    return "Duracion estimada del viaje";
  }
  if (status === "IN_PROGRESS") return "Llegada al destino";
  return "Tiempo estimado";
}

export function MovementTracker({
  movement,
  moverId,
  moverName,
  liveEta,
  etaLabel,
  matchingMessage,
  onCancel,
  cancelLabel = "Cancelar viaje",
}: Props) {
  const canCancel = CANCELLABLE.includes(movement.status) && onCancel;
  const searching = movement.status === "SEARCHING_PILOT";
  const eta =
    liveEta != null
      ? liveEta
      : movement.etaMin != null
        ? movement.etaMin
        : null;

  const statusMessage =
    matchingMessage ??
    (searching
      ? "Conectando con conductores disponibles en tu zona…"
      : null);

  return (
    <div
      className={cn(
        "glass space-y-4 rounded-2xl p-4",
        searching && "pulse-glow border border-violet-500/30"
      )}
    >
      {searching ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20">
              <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400/20" />
            </span>
            <div>
              <p className="text-lg font-semibold text-white">Buscando conductor</p>
              <p className="text-xs text-zinc-500">
                Hasta que alguien acepte tu viaje
              </p>
            </div>
          </div>

          {eta != null && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-center">
              <p className="text-3xl font-bold tabular-nums text-cyan-300">
                ~{eta} min
              </p>
              <p className="mt-1 text-xs text-cyan-200/80">
                {etaCaption(movement.status, etaLabel)}
              </p>
            </div>
          )}

          {statusMessage && (
            <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2.5">
              <p className="text-sm leading-relaxed text-violet-200">
                {statusMessage}
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs uppercase tracking-widest text-cyan-400">
            {MOVEMENT_STATUS_LABEL[movement.status]}
          </p>
          {statusMessage && (
            <p
              className={
                statusMessage.toLowerCase().includes("llego") ||
                statusMessage.toLowerCase().includes("esperando")
                  ? "rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-sm text-amber-100"
                  : "text-sm text-violet-300"
              }
            >
              {statusMessage}
            </p>
          )}
          {eta != null && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
              <p className="text-2xl font-bold tabular-nums text-white">~{eta} min</p>
              <p className="text-xs text-zinc-500">
                {etaCaption(movement.status, etaLabel)}
              </p>
            </div>
          )}
        </>
      )}

      {movement.sharedFlow && (
        <p className="flex items-center gap-2 text-xs text-violet-400">
          <Users className="h-3 w-3 shrink-0" />
          {movement.sharedFlow.label} — otros pasajeros en la misma zona
        </p>
      )}
      {movement.modularHint && (
        <p className="text-xs text-cyan-300">{movement.modularHint}</p>
      )}

      <div className="rounded-xl border border-white/5 bg-black/20 p-3">
        <p className="flex items-center gap-1 text-xs text-zinc-500">
          <MapPin className="h-3 w-3" /> Destino
        </p>
        <p className="mt-0.5 text-sm font-medium text-zinc-100">
          {movement.toAddress}
        </p>
        <p className="mt-2 text-xs text-zinc-500">Recogida</p>
        <p className="text-sm text-zinc-400">{movement.fromAddress}</p>
      </div>

      <p className="text-xs text-zinc-500">
        {AMBIANCE_LABELS[movement.ambiance] ?? movement.ambiance}
        {movement.transportMode && (
          <>
            {" · "}
            {TRANSPORT_LABELS[movement.transportMode] ?? movement.transportMode}
            {movement.transportMode === "CAR" && movement.serviceTier && (
              <> · {carServiceLabel(movement.serviceTier)}</>
            )}
          </>
        )}
      </p>

      {movement.pilot && (
        <>
          <p className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm text-zinc-200">
            <User className="h-4 w-4 shrink-0 text-violet-400" />
            <span>
              {movement.pilot.name}
              {movement.pilot.pilotProfile && (
                <span className="ml-2 text-xs text-violet-400">
                  ★ {movement.pilot.pilotProfile.auraScore.toFixed(1)}
                  {movement.pilot.pilotProfile.vehicleType &&
                    ` · ${movement.pilot.pilotProfile.vehicleType}`}
                </span>
              )}
            </span>
          </p>
          <TripChat
            movementId={movement.id}
            userId={moverId}
            userName={moverName}
            role="mover"
            otherPartyName={movement.pilot.name}
            disabled={
              movement.status === "COMPLETED" || movement.status === "CANCELLED"
            }
          />
        </>
      )}

      {movement.stops && movement.stops.length > 0 && (
        <ul className="rounded-lg border border-white/5 bg-black/20 p-2 text-xs text-zinc-400">
          <li className="mb-1 font-medium text-zinc-500">Paradas</li>
          {movement.stops.map((s) => (
            <li key={s.id}>· {s.address}</li>
          ))}
        </ul>
      )}

      {canCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-sm font-medium text-red-300 hover:bg-red-500/20"
        >
          <XCircle className="h-4 w-4" />
          {cancelLabel}
        </button>
      )}
    </div>
  );
}

