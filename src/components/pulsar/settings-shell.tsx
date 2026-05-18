"use client";

import { AppHeader } from "@/components/pulsar/app-header";

export function SettingsShell({
  title,
  children,
  backHref = "/lobby",
}: {
  title: string;
  children: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title={title} backHref={backHref} />
      <main className="mx-auto w-full max-w-lg flex-1 p-4 pb-10">{children}</main>
    </div>
  );
}
