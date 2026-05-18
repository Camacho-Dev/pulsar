"use client";

import { useEffect, useState } from "react";
import { Bell, Music2, Thermometer } from "lucide-react";
import { SettingsShell } from "@/components/pulsar/settings-shell";
import { useMoverProfile } from "@/hooks/use-mover-profile";
import { cn } from "@/lib/utils";

const DRIVING_STYLES = [
  { id: "smooth", label: "Suave", desc: "Aceleracion gradual" },
  { id: "standard", label: "Normal", desc: "Equilibrio confort y tiempo" },
  { id: "fast", label: "Directo", desc: "Rutas mas rapidas" },
];

export default function PreferenciasSettingsPage() {
  const { profile, loading, saving, patch } = useMoverProfile();
  const [music, setMusic] = useState("");

  useEffect(() => {
    if (profile) setMusic(profile.musicNote ?? "");
  }, [profile?.musicNote]);

  return (
    <SettingsShell title="Preferencias">
      {loading || !profile ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : (
        <div className="space-y-4">
          <section className="glass rounded-2xl p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Bell className="h-4 w-4 text-cyan-400" />
              Pulso automatico
            </h2>
            <p className="mt-2 text-xs text-zinc-500">
              Muestra sugerencias en inicio solo en la franja que programaste.
            </p>
            <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <span className="text-sm text-zinc-300">Activar sugerencias</span>
              <input
                type="checkbox"
                checked={profile.autoPulseEnabled}
                disabled={saving}
                onChange={(e) => void patch({ autoPulseEnabled: e.target.checked })}
                className="h-5 w-5 rounded accent-violet-500"
              />
            </label>
          </section>

          <section className="glass rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white">Estilo de viaje</h2>
            <ul className="mt-3 space-y-2">
              {DRIVING_STYLES.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void patch({ drivingStyle: s.id })}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left text-sm transition",
                      profile.drivingStyle === s.id
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <span className="font-medium text-zinc-200">{s.label}</span>
                    <span className="block text-xs text-zinc-500">{s.desc}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass rounded-2xl p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Thermometer className="h-4 w-4 text-amber-400" />
              Temperatura
            </h2>
            <label className="mt-3 block text-xs text-zinc-500">
              {profile.tempPreference} °C
              <input
                type="range"
                min={18}
                max={26}
                value={profile.tempPreference}
                disabled={saving}
                onChange={(e) =>
                  void patch({ tempPreference: Number(e.target.value) })
                }
                className="mt-2 w-full accent-violet-500"
              />
            </label>
          </section>

          <section className="glass rounded-2xl p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Music2 className="h-4 w-4 text-violet-400" />
              Musica preferida
            </h2>
            <input
              type="text"
              value={music}
              disabled={saving}
              onChange={(e) => setMusic(e.target.value)}
              onBlur={() => {
                if (music !== (profile.musicNote ?? "")) {
                  void patch({ musicNote: music });
                }
              }}
              placeholder="Ej. Jazz suave, sin reggaeton"
              className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            />
          </section>
        </div>
      )}
    </SettingsShell>
  );
}
