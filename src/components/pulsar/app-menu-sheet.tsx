"use client";

import { useEffect, useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Settings2, X } from "lucide-react";
import {
  MOVER_MENU_ITEMS,
  PILOT_MENU_ITEMS,
  type AppMenuItem,
} from "@/lib/app-menu-config";
import { cn } from "@/lib/utils";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  role?: "mover" | "pilot";
  items?: AppMenuItem[];
  subtitle?: string;
};

export function AppMenuSheet({
  open,
  onClose,
  role = "mover",
  items,
  subtitle,
}: SheetProps) {
  const menuItems =
    items ?? (role === "pilot" ? PILOT_MENU_ITEMS : MOVER_MENU_ITEMS);
  const menuSubtitle =
    subtitle ?? (role === "pilot" ? "Pulsar conductor" : "Pulsar pasajero");
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open && !mounted) return null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-end transition-opacity duration-300",
        open ? "bg-black/60 opacity-100" : "pointer-events-none opacity-0"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "glass flex h-full w-full max-w-sm flex-col border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de la app"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-violet-400" />
            <div>
              <p className="text-sm font-semibold text-white">Menu</p>
              <p className="text-xs text-zinc-500">{menuSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => go(item.href)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-zinc-100">
                      {item.label}
                    </span>
                    <span className="block text-xs text-zinc-500">{item.desc}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() =>
              go(role === "pilot" ? "/pilot/settings" : "/pulse/settings")
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            Ver todos los ajustes
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              void signOut({ callbackUrl: "/" });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm text-red-300 hover:bg-red-500/15"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppMenuTrigger({
  className,
  role = "mover",
}: {
  className?: string;
  role?: "mover" | "pilot";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "rounded-lg border border-white/10 p-2 text-zinc-400 hover:bg-white/5 hover:text-white",
          className
        )}
        aria-label="Abrir menu"
        aria-expanded={open}
      >
        <Settings2 className="h-4 w-4" />
      </button>
      <AppMenuSheet
        open={open}
        onClose={() => setOpen(false)}
        role={role}
      />
    </>
  );
}
