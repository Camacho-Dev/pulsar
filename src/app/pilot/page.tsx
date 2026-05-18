"use client";

import { AppMenuTrigger } from "@/components/pulsar/app-menu-sheet";
import { AppHeader } from "@/components/pulsar/app-header";
import { PilotLobby } from "@/components/pulsar/pilot-lobby";

export default function PilotLobbyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        title="Pulsar · Conductor"
        backHref="/"
        switchToMover
        right={<AppMenuTrigger role="pilot" />}
      />
      <main className="flex-1 p-4">
        <PilotLobby />
      </main>
    </div>
  );
}
