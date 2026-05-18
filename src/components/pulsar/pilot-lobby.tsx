"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Car,
  ChevronRight,
  History,
  Radio,
  Star,
  Wallet,
  Zap,
} from "lucide-react";
import { formatFare } from "@/lib/trip-pricing";
import { MOVEMENT_STATUS_LABEL } from "@/lib/movement-labels";
import { cn } from "@/lib/utils";

type Earnings = {
  totalEarnings: number;
  completedTrips: number;
  tripsToday: number;
};

type ActiveTrip = {
  id: string;
  status: string;
  mover: { name: string };
  toAddress: string;
};

const SHORTCUTS = [
  { href: "/pilot/settings/vehiculo", label: "Vehiculo", icon: Car },
  { href: "/pilot/settings/ganancias", label: "Ganancias", icon: Wallet },
  { href: "/pilot/settings/actividad", label: "Actividad", icon: History },
  { href: "/pilot/settings/perfil", label: "Perfil", icon: Star },
];

export function PilotLobby() {
  const { data: session } = useSession();
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [active, setActive] = useState<ActiveTrip | null>(null);
  const [aura, setAura] = useState(4.5);
  const [vehicle, setVehicle] = useState("Sedan");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/pilots/earnings").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/pilots/active").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/pilots/me").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([earn, act, profile]) => {
        setEarnings(earn);
        if (act?.id) setActive(act);
        if (profile) {
          setAura(profile.auraScore ?? 4.5);
          setVehicle(profile.vehicleType ?? "Sedan");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const name = session?.user?.name ?? "Conductor";

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      <section className="glass rounded-2xl p-5">
        <p className="text-xs uppercase tracking-widest text-cyan-400">
          Centro de conductores
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">Hola, {name}</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Revisa tu resumen y entra a trabajar cuando estes listo.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="flex items-center gap-1 rounded-lg bg-amber-500/15 px-3 py-1.5 text-amber-300">
            <Star className="h-4 w-4 fill-amber-400" />
            {aura.toFixed(1)} aura
          </span>
          <span className="rounded-lg bg-white/5 px-3 py-1.5 text-zinc-300">
            {vehicle}
          </span>
        </div>
      </section>

      {active && (
        <Link
          href="/pilot/drive"
          className="flex items-center justify-between gap-3 rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-violet-300">Viaje activo</p>
            <p className="text-sm text-zinc-200">
              {active.mover.name} · {active.toAddress}
            </p>
            <p className="mt-1 text-[10px] text-zinc-500">
              {MOVEMENT_STATUS_LABEL[
                active.status as keyof typeof MOVEMENT_STATUS_LABEL
              ] ?? active.status}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-violet-400" />
        </Link>
      )}

      <Link
        href="/pilot/drive"
        className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-violet-600 p-5"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
          <Zap className="h-6 w-6 text-white" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold text-white">
            Entrar a trabajar
          </span>
          <span className="block text-sm text-white/80">
            Mapa, ofertas y viajes en vivo
          </span>
        </span>
        <ChevronRight className="h-6 w-6 text-white/70" />
      </Link>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass col-span-1 rounded-xl p-3 text-center sm:col-span-1">
          <p className="text-[10px] uppercase text-zinc-500">Hoy</p>
          <p className="mt-1 text-xl font-bold text-cyan-300">
            {loading ? "—" : (earnings?.tripsToday ?? 0)}
          </p>
          <p className="text-[10px] text-zinc-600">viajes</p>
        </div>
        <div className="glass col-span-2 rounded-xl p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase text-zinc-500">
            <Wallet className="h-3 w-3" /> Ganancias (demo)
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-300">
            {loading ? "—" : formatFare(earnings?.totalEarnings ?? 0)}
          </p>
          <p className="text-[10px] text-zinc-600">
            {earnings?.completedTrips ?? 0} viajes completados
          </p>
        </div>
      </div>

      <section className="glass rounded-2xl p-4">
        <p className="flex items-center gap-2 text-sm text-zinc-400">
          <Radio className="h-4 w-4 text-cyan-400" />
          Consejo: activa &quot;Disponible&quot; al entrar a trabajar para recibir
          solicitudes cerca de ti.
        </p>
      </section>

      <section className="glass rounded-2xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Accesos rapidos</h3>
        <div className="grid grid-cols-2 gap-2">
          {SHORTCUTS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-300 hover:border-white/20"
            >
              <item.icon className="h-4 w-4 text-cyan-400" />
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
