"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowLeft, Car, User } from "lucide-react";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  title: string;
  backHref?: string;
  onBack?: () => void;
  /** Cerrar sesión y abrir login como conductor (cuenta distinta en demo) */
  switchToPilot?: boolean;
  /** Cerrar sesión y abrir login como pasajero */
  switchToMover?: boolean;
  right?: React.ReactNode;
};

export function AppHeader({
  title,
  backHref = "/",
  onBack,
  switchToPilot,
  switchToMover,
  right,
}: AppHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }
    router.push(backHref);
  }

  function switchRole(role: "mover" | "pilot") {
    void signOut({ callbackUrl: `/login?role=${role}` });
  }

  return (
    <header className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
      <button
        type="button"
        onClick={handleBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white"
        aria-label="Volver"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h1>

      <HeaderActions
        switchToPilot={switchToPilot}
        switchToMover={switchToMover}
        switchRole={switchRole}
        right={right}
      />
    </header>
  );
}

function HeaderActions({
  switchToPilot,
  switchToMover,
  switchRole,
  right,
}: {
  switchToPilot?: boolean;
  switchToMover?: boolean;
  switchRole: (role: "mover" | "pilot") => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {switchToPilot && (
        <button
          type="button"
          onClick={() => switchRole("pilot")}
          title="Cambiar a cuenta de conductor (cierra sesión)"
          className={cn(
            "hidden items-center gap-1 rounded-lg border border-cyan-500/30 px-2.5 py-1.5 text-xs text-cyan-300 sm:flex",
            "hover:bg-cyan-500/10"
          )}
        >
          <Car className="h-3.5 w-3.5" />
          Modo conductor
        </button>
      )}
      {switchToMover && (
        <button
          type="button"
          onClick={() => switchRole("mover")}
          title="Cambiar a cuenta de pasajero (cierra sesión)"
          className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
          aria-label="Modo pasajero"
        >
          <User className="h-4 w-4" />
        </button>
      )}
      {right}
    </div>
  );
}
