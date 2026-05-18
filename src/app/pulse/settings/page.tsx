"use client";

import { SettingsShell } from "@/components/pulsar/settings-shell";
import { SettingsNavList } from "@/components/pulsar/settings-nav-list";

export default function PulseSettingsHubPage() {
  return (
    <SettingsShell title="Ajustes">
      <p className="mb-4 text-xs text-zinc-500">
        Perfil, pagos, viajes automaticos y mas.
      </p>
      <SettingsNavList role="mover" />
    </SettingsShell>
  );
}
