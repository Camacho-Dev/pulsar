"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SettingsShell } from "@/components/pulsar/settings-shell";
import { TripRatingForm } from "@/components/pulsar/trip-rating-form";
import { MOVEMENT_STATUS_LABEL } from "@/lib/movement-labels";
import { carServiceLabel } from "@/lib/car-services";
import { formatFare } from "@/lib/trip-pricing";
import { AMBIANCE_LABELS, TRANSPORT_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";

type HistoryItem = {
  id: string;
  status: string;
  fromAddress: string;
  toAddress: string;
  createdAt: string;
  etaMin: number | null;
  suggestedByPulse: boolean;
  transportMode: string;
  serviceTier: string | null;
  ambiance: string;
  fareEstimate: number;
  rated: boolean;
  pilot: { name: string } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-DO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActividadSettingsPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/movement/history");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SettingsShell title="Actividad">
      <p className="mb-4 text-xs text-zinc-500">
        Historial de movimientos recientes.
      </p>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">
          Aun no hay viajes registrados.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => {
            const open = expandedId === m.id;
            return (
              <li
                key={m.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpandedId(open ? null : m.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        m.status === "COMPLETED"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : m.status === "CANCELLED"
                            ? "bg-zinc-500/20 text-zinc-400"
                            : "bg-violet-500/20 text-violet-300"
                      )}
                    >
                      {MOVEMENT_STATUS_LABEL[
                        m.status as keyof typeof MOVEMENT_STATUS_LABEL
                      ] ?? m.status}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                      {formatDate(m.createdAt)}
                      {open ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm text-zinc-200">
                    {m.toAddress}
                  </p>
                  <p className="text-xs text-cyan-400/90">
                    {formatFare(m.fareEstimate)}
                  </p>
                </button>

                {open && (
                  <div className="mt-3 border-t border-white/10 pt-3 text-xs text-zinc-500">
                    <p>Desde: {m.fromAddress}</p>
                    <p className="mt-1">
                      {TRANSPORT_LABELS[m.transportMode] ?? m.transportMode}
                      {m.serviceTier && ` · ${carServiceLabel(m.serviceTier)}`}
                      {" · "}
                      {AMBIANCE_LABELS[m.ambiance] ?? m.ambiance}
                      {m.suggestedByPulse && " · Pulso"}
                      {m.pilot && ` · ${m.pilot.name}`}
                    </p>
                    {m.status === "COMPLETED" && !m.rated && m.pilot && (
                      <TripRatingForm movementId={m.id} onRated={load} />
                    )}
                    {m.rated && (
                      <p className="mt-2 text-emerald-400">Ya calificaste este viaje</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SettingsShell>
  );
}
