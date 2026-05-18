"use client";

import { AppMenuTrigger } from "@/components/pulsar/app-menu-sheet";
import { AppHeader } from "@/components/pulsar/app-header";
import { MoverLobby } from "@/components/pulsar/mover-lobby";

export default function MoverLobbyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        title="Pulsar · Inicio"
        backHref="/"
        switchToPilot
        right={<AppMenuTrigger />}
      />
      <main className="flex-1 p-4">
        <MoverLobby />
      </main>
    </div>
  );
}
