"use client";

import Link from "next/link";
import { Calendar, Settings, Sparkles, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatConfidence } from "@/lib/pulse-format";
import { carServiceLabel } from "@/lib/car-services";
import { TRANSPORT_LABELS } from "@/lib/copy";

export type PulseSuggestion = {
  id: string;
  title: string;
  message: string;
  toAddress: string;
  toLat: number;
  toLng: number;
  etaMin: number;
  ambiance: string;
  confidence: number | null;
  routineLabel: string | null;
  scheduleHint: string | null;
  why: string;
  suggestedByRoutine: boolean;
};

type PulsePanelProps = {
  suggestions: PulseSuggestion[];
  loading?: boolean;
  transportMode: string;
  carService?: string;
  onRequestTrip: (id: string) => void;
  onDismiss: (id: string) => void;
  onPreview?: (s: PulseSuggestion) => void;
};

export function PulsePanel({
  suggestions,
  loading,
  transportMode,
  carService,
  onRequestTrip,
  onDismiss,
  onPreview,
}: PulsePanelProps) {
  if (loading) {
    return (
      <div className="glass animate-pulse rounded-2xl border border-violet-500/30 p-6 text-sm text-zinc-500">
        Leyendo tu pulso y rutinas…
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="glass rounded-2xl border border-dashed border-white/15 p-6 text-sm text-zinc-400">
        <p className="flex items-center gap-2 font-medium text-zinc-300">
          <Sparkles className="h-5 w-5 text-violet-400" />
          Sin automaticas activas ahora
        </p>
        <p className="mt-2 text-xs leading-relaxed">
          Programa viajes en Configuracion (dia, hora y destino). Solo aparecen
          aqui dentro de esa franja. O usa Plan B para ir ya.
        </p>
        <Link
          href="/pulse/settings/automaticos"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 py-2.5 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
        >
          <Settings className="h-4 w-4" />
          Programar automaticas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-600/20 to-cyan-600/10 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-400" />
          </span>
          Tu pulso ahora
        </p>
        <p className="mt-1 text-xs text-violet-200/90">
          Elige destino y confirma precio. Vehiculo:{" "}
          {TRANSPORT_LABELS[transportMode] ?? transportMode}
          {transportMode === "CAR" && carService && (
            <> · {carServiceLabel(carService)}</>
          )}
        </p>
      </div>

      {suggestions.map((s) => (
        <article
          key={s.id}
          className="glass group rounded-2xl border border-violet-500/25 p-4 transition hover:border-violet-400/50"
          onMouseEnter={() => onPreview?.(s)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-white">{s.title}</h3>
              {s.scheduleHint && (
                <p className="mt-1 flex items-center gap-1 text-xs text-violet-300">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {s.scheduleHint}
                  {s.confidence != null && (
                    <span className="text-violet-400">
                      · {formatConfidence(s.confidence)}
                    </span>
                  )}
                </p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.why}</p>
              <p className="mt-2 text-xs text-cyan-400">
                ~{s.etaMin} min en auto · {s.toAddress}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(s.id)}
              className="shrink-0 text-zinc-500 hover:text-zinc-300"
              aria-label="Descartar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRequestTrip(s.id)}
            className={cn(
              "mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold",
              "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-900/30",
              "hover:opacity-95 transition"
            )}
          >
            <Zap className="h-4 w-4" />
            Pedir viaje
          </button>
        </article>
      ))}
    </div>
  );
}
