"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { ScheduledRoutineForm } from "@/components/pulsar/scheduled-routine-form";
import { SettingsShell } from "@/components/pulsar/settings-shell";
import { useDeviceLocation } from "@/gps/use-device-location";
import { formatRoutineSchedule } from "@/lib/pulse-format";
import { dayLabel, isRoutineActiveNow } from "@/lib/routine-schedule";
import { cn } from "@/lib/utils";

type Routine = {
  id: string;
  label: string;
  address: string;
  dayOfWeek: number;
  hourStart: number;
  hourEnd: number;
  enabled: boolean;
  userScheduled: boolean;
};

export default function AutomaticosSettingsPage() {
  const { detect } = useDeviceLocation();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [proximity, setProximity] = useState<{ lat: number; lng: number }>();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/routines");
    if (res.ok) setRoutines(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    detect().then((p) => {
      if (p) setProximity({ lat: p.lat, lng: p.lng });
    });
  }, [load, detect]);

  async function toggleRoutine(r: Routine) {
    await fetch(`/api/routines/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !r.enabled }),
    });
    load();
  }

  async function deleteRoutine(id: string) {
    if (!window.confirm("Eliminar esta programacion?")) return;
    await fetch(`/api/routines/${id}`, { method: "DELETE" });
    load();
  }

  async function activateDetected(id: string) {
    await fetch(`/api/routines/${id}/activate`, { method: "POST" });
    load();
  }

  const scheduled = routines.filter((r) => r.userScheduled);
  const detected = routines.filter((r) => !r.userScheduled);

  return (
    <SettingsShell title="Viajes automaticos">
      <p className="mb-4 text-xs text-zinc-500">
        Programa dia, hora y destino. En inicio solo aparece dentro de esa franja.
      </p>

      <ScheduledRoutineForm proximity={proximity} onCreated={load} />

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">Cargando...</p>
      ) : scheduled.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-zinc-500">
          Sin automaticas. Crea la primera arriba.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {scheduled.map((r) => {
            const active = isRoutineActiveNow(
              r.dayOfWeek,
              r.hourStart,
              r.hourEnd
            );
            return (
              <li
                key={r.id}
                className={cn(
                  "rounded-xl border p-3",
                  r.enabled
                    ? "border-violet-500/30 bg-violet-500/5"
                    : "border-white/10 bg-white/5 opacity-70"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-200">{r.label}</p>
                    <p className="text-xs text-violet-300">
                      {formatRoutineSchedule(
                        r.dayOfWeek,
                        r.hourStart,
                        r.hourEnd
                      )}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {r.address}
                    </p>
                    {active && r.enabled && (
                      <span className="mt-2 inline-block rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300">
                        Activa ahora
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => void toggleRoutine(r)}
                      className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-zinc-400 hover:text-white"
                    >
                      {r.enabled ? "Pausar" : "Activar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteRoutine(r.id)}
                      className="rounded-lg p-1 text-zinc-500 hover:text-red-400"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {detected.length > 0 && (
        <section className="mt-6 glass rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-zinc-300">
            Rutinas detectadas
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Patrones aprendidos. Activalos para programarlos.
          </p>
          <ul className="mt-3 space-y-2">
            {detected.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-zinc-300">{r.label}</p>
                  <p className="text-xs text-zinc-500">
                    {dayLabel(r.dayOfWeek)} - {r.address}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void activateDetected(r.id)}
                  className="shrink-0 rounded-lg bg-white/10 px-2 py-1 text-xs text-violet-300 hover:bg-white/15"
                >
                  Programar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </SettingsShell>
  );
}
