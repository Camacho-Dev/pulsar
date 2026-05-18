"use client";

import dynamic from "next/dynamic";

export const RideMap = dynamic(
  () => import("./ride-map").then((m) => m.RideMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-zinc-900 text-sm text-zinc-500">
        Cargando mapa…
      </div>
    ),
  }
);
