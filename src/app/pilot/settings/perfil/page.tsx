"use client";

import { Star, User } from "lucide-react";
import { AccountNameForm } from "@/components/pulsar/account-name-form";
import { SettingsShell } from "@/components/pulsar/settings-shell";
import { usePilotProfile } from "@/hooks/use-pilot-profile";
import { TRANSPORT_LABELS } from "@/lib/utils";

export default function PilotPerfilPage() {
  const { profile, loading, saving, patch } = usePilotProfile();

  return (
    <SettingsShell title="Perfil conductor" backHref="/pilot">
      {loading || !profile ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : (
        <div className="space-y-4">
          <section className="glass rounded-2xl p-4">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <User className="h-4 w-4 text-cyan-400" />
              Tu cuenta
            </h2>
            <AccountNameForm
              initialName={profile.name}
              saving={saving}
              onSave={async (name) => {
                await patch({ name });
              }}
            />
            <dl className="mt-4 space-y-3 border-t border-white/10 pt-4 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Correo</dt>
                <dd className="text-zinc-100">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Vehiculo</dt>
                <dd className="text-zinc-300">
                  {TRANSPORT_LABELS[profile.transportMode]} · {profile.vehicleType}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Aura</dt>
                <dd className="flex items-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" />
                  {profile.auraScore.toFixed(1)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white">Reputacion</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
              {[
                ["Puntualidad", profile.punctuality],
                ["Suavidad", profile.smoothness],
                ["Seguridad", profile.safety],
                ["Ambiente", profile.ambianceFit],
                ["Limpieza", profile.cleanliness],
                ["Conversacion", profile.conversation],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-white/5 p-2">
                  <p className="text-zinc-500">{k}</p>
                  <p className="font-medium text-cyan-400">
                    {Number(v).toFixed(1)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </SettingsShell>
  );
}
