"use client";

import { SettingsShell } from "@/components/pulsar/settings-shell";
import { SettingsNavList } from "@/components/pulsar/settings-nav-list";

export default function PilotSettingsHubPage() {
  return (
    <SettingsShell title="Ajustes conductor" backHref="/pilot">
      <p className="mb-4 text-xs text-zinc-500">
        Perfil, vehiculo, ganancias y preferencias.
      </p>
      <SettingsNavList role="pilot" />
    </SettingsShell>
  );
}
