"use client";

import type { TransportMode } from "@prisma/client";
import {
  CAR_SERVICE_TIERS,
  DEFAULT_CAR_SERVICE,
  type CarServiceTier,
} from "@/lib/car-services";
import { TRANSPORT_OPTIONS } from "@/lib/constants";
import { formatFare, estimateTripFare } from "@/lib/trip-pricing";
import { cn } from "@/lib/utils";

type Props = {
  transportMode: TransportMode;
  carService: CarServiceTier;
  onTransportChange: (t: TransportMode) => void;
  onCarServiceChange: (tier: CarServiceTier) => void;
  /** Precio estimado rapido si hay ruta (opcional) */
  previewFare?: { km: number; min: number } | null;
};

export function TripPreferences({
  transportMode,
  carService,
  onTransportChange,
  onCarServiceChange,
  previewFare,
}: Props) {
  const isCar = transportMode === "CAR";

  function handleVehicleChange(mode: TransportMode) {
    onTransportChange(mode);
    if (mode === "CAR" && !carService) {
      onCarServiceChange(DEFAULT_CAR_SERVICE);
    }
  }

  return (
    <div className="glass space-y-4 rounded-2xl p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Tipo de vehiculo
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Elige antes de pedir el viaje
        </p>
        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Tipo de vehiculo"
        >
          {TRANSPORT_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={transportMode === t.id}
              title={t.hint}
              onClick={() => handleVehicleChange(t.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs transition",
                transportMode === t.id
                  ? "bg-violet-600 text-white"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isCar && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Servicio en auto
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Confort, Select y mas — como en apps de movilidad
          </p>
          <ul className="mt-3 space-y-2" role="listbox" aria-label="Tipo de servicio">
            {CAR_SERVICE_TIERS.map((tier) => {
              const selected = carService === tier.id;
              const fare =
                previewFare != null
                  ? estimateTripFare(
                      previewFare.km,
                      previewFare.min,
                      "CAR",
                      tier.id
                    )
                  : null;
              return (
                <li key={tier.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onCarServiceChange(tier.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition",
                      selected
                        ? "border-violet-500/50 bg-violet-500/15 shadow-md shadow-violet-900/20"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-zinc-100">
                        {tier.label}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {tier.desc}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-cyan-500/90">
                        {tier.etaHint} de espera
                      </span>
                    </span>
                    {fare != null && (
                      <span className="shrink-0 text-sm font-medium text-violet-300">
                        {formatFare(fare)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

