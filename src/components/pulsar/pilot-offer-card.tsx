"use client";

import { Zap } from "lucide-react";
import { carServiceLabel } from "@/lib/car-services";
import { AMBIANCE_LABELS, TRANSPORT_LABELS } from "@/lib/utils";

export type PilotOffer = {
  id: string;
  fromAddress: string;
  toAddress: string;
  ambiance: string;
  transportMode?: string;
  serviceTier?: string | null;
  distanceKm?: number;
  etaMin?: number;
  mover: { name: string };
  sharedFlow?: { label: string } | null;
};

type Props = {
  offer: PilotOffer;
  onAccept: (id: string) => void;
  accepting?: boolean;
};

export function PilotOfferCard({ offer, onAccept, accepting }: Props) {
  return (
    <li className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition hover:border-cyan-500/30">
      <p className="font-medium text-zinc-100">{offer.mover.name}</p>
      <p className="mt-1 text-xs text-zinc-500">Recoger: {offer.fromAddress}</p>
      <p className="text-xs text-zinc-500">Destino: {offer.toAddress}</p>
      <p className="mt-2 text-xs text-cyan-400/90">
        {TRANSPORT_LABELS[offer.transportMode ?? "CAR"] ?? offer.transportMode}
        {offer.serviceTier && ` · ${carServiceLabel(offer.serviceTier)}`}
        {" · "}
        {AMBIANCE_LABELS[offer.ambiance] ?? offer.ambiance}
        {offer.distanceKm != null && ` · ${offer.distanceKm} km`}
        {offer.etaMin != null && ` · ~${offer.etaMin} min`}
      </p>
      {offer.sharedFlow && (
        <p className="mt-1 text-xs text-violet-400">{offer.sharedFlow.label}</p>
      )}
      <button
        type="button"
        disabled={accepting}
        onClick={() => onAccept(offer.id)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
      >
        <Zap className="h-4 w-4" />
        Aceptar viaje
      </button>
    </li>
  );
}
