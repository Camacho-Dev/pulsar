"use client";

import { SettingsShell } from "@/components/pulsar/settings-shell";
import { usePilotProfile } from "@/hooks/use-pilot-profile";

const ENERGY_OPTIONS = [
  { id: "calm", label: "Calma", desc: "Estilo relajado" },
  { id: "vibrant", label: "Vibrante", desc: "Energia positiva" },
  { id: "focused", label: "Enfocado", desc: "Profesional" },
];

export default function PilotPreferenciasPage() {
  const { profile, loading, saving, patch } = usePilotProfile();

  return (
    <SettingsShell title="Preferencias" backHref="/pilot">
      {loading || !profile ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : (
        <div className="space-y-4">
          <section className="glass rounded-2xl p-4">
            <p className="text-sm font-medium text-zinc-200">
              Disponible al abrir la app
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Si esta activo, apareces en linea al entrar al modo conductor.
            </p>
            <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <span className="text-sm text-zinc-300">Iniciar en linea</span>
              <input
                type="checkbox"
                checked={profile.isOnline}
                disabled={saving}
                onChange={(e) => void patch({ isOnline: e.target.checked })}
                className="h-5 w-5 accent-violet-500"
              />
            </label>
          </section>

          <section className="glass rounded-2xl p-4">
            <p className="text-sm font-medium text-zinc-200">Estilo de conduccion</p>
            <p className="mt-1 mb-3 text-xs text-zinc-500">
              Como te ven los pasajeros en tu perfil.
            </p>
            <ul className="space-y-2">
              {ENERGY_OPTIONS.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void patch({ avatarEnergy: opt.id })}
                    className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                      profile.avatarEnergy === opt.id
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <span className="font-medium text-zinc-200">{opt.label}</span>
                    <span className="block text-xs text-zinc-500">{opt.desc}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </SettingsShell>
  );
}
