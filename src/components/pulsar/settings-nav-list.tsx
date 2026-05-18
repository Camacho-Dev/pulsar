"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  MOVER_MENU_ITEMS,
  PILOT_MENU_ITEMS,
  type AppMenuItem,
} from "@/lib/app-menu-config";
import { cn } from "@/lib/utils";

export function SettingsNavList({
  role,
  className,
}: {
  role: "mover" | "pilot";
  className?: string;
}) {
  const router = useRouter();
  const items = role === "pilot" ? PILOT_MENU_ITEMS : MOVER_MENU_ITEMS;

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => (
        <SettingsNavRow
          key={item.id}
          item={item}
          onClick={() => router.push(item.href)}
        />
      ))}
    </ul>
  );
}

function SettingsNavRow({
  item,
  onClick,
}: {
  item: AppMenuItem;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-violet-500/30 hover:bg-white/[0.07]"
      >
        <span className="text-violet-300">{item.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-zinc-100">
            {item.label}
          </span>
          <span className="block text-xs text-zinc-500">{item.desc}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
      </button>
    </li>
  );
}
