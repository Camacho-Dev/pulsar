"use client";

import { useEffect, useState } from "react";
import { Car, ShieldCheck } from "lucide-react";
import type { CarServiceTier } from "@/lib/car-services";
import { SettingsShell } from "@/components/pulsar/settings-shell";
import { usePilotProfile } from "@/hooks/use-pilot-profile";
import { TRANSPORT_OPTIONS } from "@/lib/constants";
import { CAR_SERVICE_TIERS } from "@/lib/car-services";
import { cn } from "@/lib/utils";

export default function PilotVehiculoPage() {
  const { profile, loading, saving, patch } = usePilotProfile();
  const [vehicleModel, setVehicleModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [tiers, setTiers] = useState<CarServiceTier[]>([]);

  useEffect(() => {
    if (profile) {
      setVehicleModel(profile.vehicleType);
      setLicensePlate(profile.licensePlate ?? "");
      setLicenseNumber(profile.licenseNumber ?? "");
      setVehicleColor(profile.vehicleColor ?? "");
      setTiers(profile.serviceTiers ?? []);
    }
  }, [profile]);

  function toggleTier(id: CarServiceTier) {
    setTiers((prev) => {
      const next = prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id];
      return next.length ? next : prev;
    });
  }

  async function saveTiers() {
    if (tiers.length) await patch({ serviceTiers: tiers });
  }

  return (
    <SettingsShell title="Vehiculo y servicios" backHref="/pilot">
      {loading || !profile ? (
        <p className="text-sm text-zinc-500">Cargando...</p>
      ) : (
        <div className="space-y-4">
          <section className="glass rounded-2xl p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              Registro de conductor
            </h2>
            <p
              className={cn(
                "mb-3 rounded-lg px-3 py-2 text-xs",
                profile.approvalStatus === "APPROVED"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : profile.approvalStatus === "REJECTED"
                    ? "bg-red-500/15 text-red-300"
                    : "bg-amber-500/15 text-amber-200"
              )}
            >
              {profile.approvalStatus === "APPROVED"
                ? "Cuenta aprobada — puedes conectarte y recibir viajes."
                : profile.approvalStatus === "REJECTED"
                  ? "Registro rechazado. Contacta soporte."
                  : "Pendiente de revision. Completa placa y licencia."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-zinc-500">
                Placa
                <input
                  type="text"
                  value={licensePlate}
                  disabled={saving}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  onBlur={() => {
                    if (licensePlate !== (profile.licensePlate ?? "")) {
                      void patch({ licensePlate });
                    }
                  }}
                  placeholder="A123456"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Licencia
                <input
                  type="text"
                  value={licenseNumber}
                  disabled={saving}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  onBlur={() => {
                    if (licenseNumber !== (profile.licenseNumber ?? "")) {
                      void patch({ licenseNumber });
                    }
                  }}
                  placeholder="402-0000000-0"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-xs text-zinc-500 sm:col-span-2">
                Color del vehiculo
                <input
                  type="text"
                  value={vehicleColor}
                  disabled={saving}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  onBlur={() => {
                    if (vehicleColor !== (profile.vehicleColor ?? "")) {
                      void patch({ vehicleColor });
                    }
                  }}
                  placeholder="Ej. Blanco perla"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>
            </div>
          </section>

          <section className="glass rounded-2xl p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Car className="h-4 w-4 text-violet-400" />
              Tipo de vehiculo
            </h2>
            <p className="mb-3 text-xs text-zinc-500">
              Solo recibes viajes compatibles con tu vehiculo.
            </p>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={saving}
                  onClick={() => void patch({ transportMode: t.id })}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs transition",
                    profile.transportMode === t.id
                      ? "bg-violet-600 text-white"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          <section className="glass rounded-2xl p-4">
            <label className="block text-xs text-zinc-500">
              Modelo / descripcion
              <input
                type="text"
                value={vehicleModel}
                disabled={saving}
                onChange={(e) => setVehicleModel(e.target.value)}
                onBlur={() => {
                  if (vehicleModel !== profile.vehicleType) {
                    void patch({ vehicleType: vehicleModel });
                  }
                }}
                placeholder="Ej. Toyota Corolla 2022"
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </label>
          </section>

          {profile.transportMode === "CAR" && (
            <section className="glass rounded-2xl p-4">
              <p className="text-sm font-medium text-zinc-200">
                Servicios que ofreces
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Solo veras solicitudes de los niveles activos.
              </p>
              <ul className="mt-3 space-y-2">
                {CAR_SERVICE_TIERS.map((tier) => {
                  const on = tiers.includes(tier.id);
                  return (
                    <li key={tier.id}>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => toggleTier(tier.id)}
                        className={cn(
                          "w-full rounded-lg border px-3 py-2 text-left text-sm transition",
                          on
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-white/10 bg-white/5 opacity-60"
                        )}
                      >
                        <span className="font-medium text-zinc-200">
                          {tier.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-zinc-500">
                          {tier.desc}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveTiers()}
                className="mt-3 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white disabled:opacity-40"
              >
                Guardar servicios
              </button>
            </section>
          )}
        </div>
      )}
    </SettingsShell>
  );
}
