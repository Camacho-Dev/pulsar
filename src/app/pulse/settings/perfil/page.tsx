"use client";

import { User } from "lucide-react";
import { AccountNameForm } from "@/components/pulsar/account-name-form";
import { SettingsShell } from "@/components/pulsar/settings-shell";
import { useMoverProfile } from "@/hooks/use-mover-profile";

export default function PerfilSettingsPage() {
  const { profile, loading, saving, patch } = useMoverProfile();

  return (
    <SettingsShell title="Perfil">
      {loading || !profile ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : (
        <section className="glass rounded-2xl p-4">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <User className="h-4 w-4 text-violet-400" />
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
              <dd className="mt-1 text-zinc-100">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Rol</dt>
              <dd className="mt-1 text-zinc-400">Pasajero</dd>
            </div>
          </dl>
        </section>
      )}
    </SettingsShell>
  );
}
