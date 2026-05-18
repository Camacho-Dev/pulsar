"use client";

import dynamic from "next/dynamic";

export const LivingMap = dynamic(
  () => import("./living-map").then((m) => m.LivingMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-[#0a0e17] text-sm text-zinc-500">
        Cargando mapa vivo…
      </div>
    ),
  }
);
