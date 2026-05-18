"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Activity,
  ArrowRight,
  Calendar,
  ChevronRight,
  CreditCard,
  History,
  Map,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import type { PulseSuggestion } from "@/components/pulsar/pulse-panel";
import { LivingMap } from "@/components/pulsar/map-dynamic";
import { MOVEMENT_STATUS_LABEL } from "@/lib/movement-labels";
import { getDefaultPayment, getWalletBalance } from "@/lib/payment-storage";
import { formatFare } from "@/lib/trip-pricing";
import { useDeviceLocation } from "@/gps/use-device-location";
import { cn } from "@/lib/utils";

type ActiveTrip = {
  id: string;
  status: string;
  toAddress: string;
};

type HistoryRow = {
  id: string;
  status: string;
  toAddress: string;
  createdAt: string;
};

type LiveZone = {
  id: string;
  name: string;
  type: string;
  intensity: number;
};

const SHORTCUTS = [
  {
    href: "/pulse/settings/automaticos",
    label: "Automaticos",
    desc: "Rutinas programadas",
    icon: Calendar,
    color: "text-violet-400",
  },
  {
    href: "/pulse/settings/actividad",
    label: "Actividad",
    desc: "Historial de viajes",
    icon: History,
    color: "text-cyan-400",
  },
  {
    href: "/pulse/settings/pago",
    label: "Pago",
    desc: "Tarjeta y billetera",
    icon: CreditCard,
    color: "text-emerald-400",
  },
  {
    href: "/pulse/settings/preferencias",
    label: "Preferencias",
    desc: "Ambiente y confort",
    icon: Sparkles,
    color: "text-amber-400",
  },
];

function greeting(name: string) {
  const h = new Date().getHours();
  const sal =
    h < 12 ? "Buenos dias" : h < 19 ? "Buenas tardes" : "Buenas noches";
  return `${sal}, ${name.split(" ")[0]}`;
}

export function MoverLobby() {
  const { data: session } = useSession();
  const { detect } = useDeviceLocation();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [active, setActive] = useState<ActiveTrip | null>(null);
  const [suggestions, setSuggestions] = useState<PulseSuggestion[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [zones, setZones] = useState<LiveZone[]>([]);
  const [wallet, setWallet] = useState(0);
  const [payment, setPayment] = useState("CARD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void detect().then((place) => {
      if (place) setMapCenter({ lat: place.lat, lng: place.lng });
    });
    setWallet(getWalletBalance());
    setPayment(getDefaultPayment());

    Promise.all([
      fetch("/api/movement").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/pulse/suggestions").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/movement/history").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/zones/live").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([mov, sug, hist, z]) => {
        if (mov?.id && !["COMPLETED", "CANCELLED"].includes(mov.status)) {
          setActive({
            id: mov.id,
            status: mov.status,
            toAddress: mov.toAddress,
          });
        }
        setSuggestions(Array.isArray(sug) ? sug.slice(0, 3) : []);
        setHistory(Array.isArray(hist) ? hist.slice(0, 3) : []);
        setZones(Array.isArray(z) ? z.slice(0, 4) : []);
      })
      .finally(() => setLoading(false));
  }, [detect]);

  const name = session?.user?.name ?? "Viajero";

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      <section className="glass overflow-hidden rounded-2xl">
        <div className="relative h-36">
          <LivingMap
            className="h-full min-h-0 rounded-none border-0"
            userPosition={mapCenter ?? undefined}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-xs font-medium uppercase tracking-widest text-violet-300">
              Tu ciudad ahora
            </p>
            <h2 className="text-xl font-bold text-white">{greeting(name)}</h2>
          </div>
        </div>
      </section>

      {active && (
        <Link
          href="/pulse"
          className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-4 transition hover:bg-cyan-500/15"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-cyan-300">Viaje en curso</p>
            <p className="truncate text-sm text-zinc-200">{active.toAddress}</p>
            <p className="mt-1 text-[10px] text-zinc-500">
              {MOVEMENT_STATUS_LABEL[
                active.status as keyof typeof MOVEMENT_STATUS_LABEL
              ] ?? active.status}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-cyan-400" />
        </Link>
      )}

      <Link
        href="/pulse"
        className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 p-5 shadow-lg shadow-violet-900/30 transition hover:opacity-95"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
          <Zap className="h-6 w-6 text-white" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold text-white">
            Pedir un viaje
          </span>
          <span className="block text-sm text-white/80">
            Elige destino, ambiente y conductor
          </span>
        </span>
        <ChevronRight className="h-6 w-6 text-white/70 transition group-hover:translate-x-0.5" />
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase text-zinc-500">
            <Wallet className="h-3 w-3" /> Billetera
          </p>
          <p className="mt-1 text-lg font-bold text-emerald-300">
            {formatFare(wallet)}
          </p>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase text-zinc-500">
            <CreditCard className="h-3 w-3" /> Pago default
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-200">
            {payment === "CARD"
              ? "Tarjeta"
              : payment === "WALLET"
                ? "Billetera"
                : "Efectivo"}
          </p>
        </div>
      </div>

      <section className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Activity className="h-4 w-4 text-violet-400" />
            Pulso para ti
          </h3>
          <Link href="/pulse" className="text-xs text-violet-300 hover:underline">
            Ver todo
          </Link>
        </div>
        {loading ? (
          <p className="text-xs text-zinc-500">Cargando sugerencias…</p>
        ) : suggestions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-500">
            Sin sugerencias ahora. Programa una rutina o pide un viaje manual.
          </p>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li key={s.id}>
                <Link
                  href="/pulse"
                  className="block rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-violet-500/30"
                >
                  <p className="text-sm font-medium text-zinc-100">{s.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                    {s.message}
                  </p>
                  <p className="mt-1 text-[10px] text-violet-400">
                    ~{s.etaMin} min · {s.toAddress}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {zones.length > 0 && (
        <section className="glass rounded-2xl p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Map className="h-4 w-4 text-cyan-400" />
            Zonas vivas
          </h3>
          <div className="flex flex-wrap gap-2">
            {zones.map((z) => (
              <span
                key={z.id}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
              >
                {z.name}
                <span className="ml-1 text-zinc-600">· {z.type}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="glass rounded-2xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Accesos rapidos</h3>
        <div className="grid grid-cols-2 gap-2">
          {SHORTCUTS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-white/20"
            >
              <item.icon className={cn("mt-0.5 h-4 w-4 shrink-0", item.color)} />
              <span>
                <span className="block text-xs font-medium text-zinc-200">
                  {item.label}
                </span>
                <span className="block text-[10px] text-zinc-500">
                  {item.desc}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recientes</h3>
            <Link
              href="/pulse/settings/actividad"
              className="text-xs text-zinc-500 hover:text-white"
            >
              Ver historial
            </Link>
          </div>
          <ul className="space-y-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs"
              >
                <span className="truncate text-zinc-300">{h.toAddress}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px]",
                    h.status === "COMPLETED"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-zinc-500/20 text-zinc-400"
                  )}
                >
                  {MOVEMENT_STATUS_LABEL[
                    h.status as keyof typeof MOVEMENT_STATUS_LABEL
                  ] ?? h.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
