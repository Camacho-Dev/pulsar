"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { SettingsShell } from "@/components/pulsar/settings-shell";
import { carServiceLabel } from "@/lib/car-services";
import { formatFare } from "@/lib/trip-pricing";
import { AMBIANCE_LABELS, TRANSPORT_LABELS } from "@/lib/utils";

type Earnings = {
  totalEarnings: number;
  completedTrips: number;
  tripsToday: number;
  currency: string;
};

type TripRow = {
  id: string;
  status: string;
  toAddress: string;
  createdAt: string;
  transportMode: string;
  serviceTier: string | null;
  ambiance: string;
  mover: { name: string };
  pilotEarnings: number | null;
};

export default function PilotGananciasPage() {
  const [data, setData] = useState<Earnings | null>(null);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/pilots/earnings").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/pilots/history").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([earnings, history]) => {
        setData(earnings);
        setTrips(
          (history as TripRow[]).filter(
            (t) => t.status === "COMPLETED" && t.pilotEarnings != null
          )
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsShell title="Ganancias" backHref="/pilot">
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : data ? (
        <div className="space-y-4">
          <section className="glass rounded-2xl p-4">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Wallet className="h-4 w-4 text-emerald-400" />
              Resumen
            </h2>
            <p className="text-3xl font-bold text-emerald-300">
              {formatFare(data.totalEarnings)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Estimado al 80% del precio del viaje
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-2xl font-semibold text-white">
                  {data.completedTrips}
                </p>
                <p className="text-xs text-zinc-500">Completados</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-2xl font-semibold text-cyan-300">
                  {data.tripsToday}
                </p>
                <p className="text-xs text-zinc-500">Hoy</p>
              </div>
            </div>
          </section>

          <section className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-zinc-200">
              Ultimos viajes pagados
            </h3>
            {trips.length === 0 ? (
              <p className="mt-3 text-xs text-zinc-500">
                Completa viajes para ver ganancias aqui.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {trips.slice(0, 15).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-200">
                        {t.mover.name}
                      </p>
                      <p className="truncate text-[10px] text-zinc-500">
                        {t.toAddress}
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        {TRANSPORT_LABELS[t.transportMode]}
                        {t.serviceTier && ` · ${carServiceLabel(t.serviceTier)}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-emerald-300">
                      +{formatFare(t.pilotEarnings ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No hay datos aun.</p>
      )}
    </SettingsShell>
  );
}
