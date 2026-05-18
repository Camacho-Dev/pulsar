"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SettingsShell } from "@/components/pulsar/settings-shell";
import { MOVEMENT_STATUS_LABEL } from "@/lib/movement-labels";
import { carServiceLabel } from "@/lib/car-services";
import { formatFare } from "@/lib/trip-pricing";
import { AMBIANCE_LABELS, TRANSPORT_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  status: string;
  fromAddress: string;
  toAddress: string;
  createdAt: string;
  transportMode: string;
  serviceTier: string | null;
  ambiance: string;
  fareEstimate: number;
  pilotEarnings: number | null;
  mover: { name: string };
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-DO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PilotActividadPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/pilots/history");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SettingsShell title="Actividad" backHref="/pilot">
      <p className="mb-4 text-xs text-zinc-500">
        Viajes donde fuiste conductor asignado.
      </p>
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">
          Aun no tienes viajes como conductor.
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
                    <span className="text-sm font-medium text-zinc-200">
                      {m.mover.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px]",
                          m.status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-zinc-500/20 text-zinc-400"
                        )}
                      >
                        {MOVEMENT_STATUS_LABEL[
                          m.status as keyof typeof MOVEMENT_STATUS_LABEL
                        ] ?? m.status}
                      </span>
                      {open ? (
                        <ChevronUp className="h-3 w-3 text-zinc-600" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-zinc-600" />
                      )}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {m.fromAddress} → {m.toAddress}
                  </p>
                  {m.status === "COMPLETED" && m.pilotEarnings != null && (
                    <p className="mt-1 text-xs text-emerald-400">
                      +{formatFare(m.pilotEarnings)}
                    </p>
                  )}
                </button>
                {open && (
                  <div className="mt-2 border-t border-white/10 pt-2 text-[10px] text-zinc-600">
                    {formatDate(m.createdAt)}
                    <br />
                    {TRANSPORT_LABELS[m.transportMode]}
                    {m.serviceTier && ` · ${carServiceLabel(m.serviceTier)}`}
                    {" · "}
                    {AMBIANCE_LABELS[m.ambiance]}
                    <br />
                    Tarifa viaje: {formatFare(m.fareEstimate)}
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
