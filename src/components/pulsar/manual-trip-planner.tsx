"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import type { Place } from "@/lib/places";
import { LocationSearch } from "@/components/map/location-search";
import { cn } from "@/lib/utils";

type Props = {
  pickup: Place | null;
  destination: Place | null;
  onPickupChange: (p: Place | null) => void;
  onDestinationChange: (p: Place | null) => void;
  onUseMyLocation: () => void;
  locating?: boolean;
  geoError?: string | null;
  geoStatus?: string | null;
  proximity?: { lat: number; lng: number };
  onRequestTrip: () => void;
  submitting?: boolean;
  defaultOpen?: boolean;
};

export function ManualTripPlanner({
  pickup,
  destination,
  onPickupChange,
  onDestinationChange,
  onUseMyLocation,
  locating,
  geoError,
  geoStatus,
  proximity,
  onRequestTrip,
  submitting,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass overflow-hidden rounded-2xl border border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-white/5"
      >
        <span className="flex items-center gap-2 text-zinc-300">
          <MapPin className="h-4 w-4 text-cyan-400" />
          Plan B: otro destino
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-500 transition",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-white/10 px-4 pb-4 pt-3">
          <p className="text-xs text-zinc-500">
            Usa esto solo si ninguna sugerencia del pulso encaja contigo.
          </p>
          {geoError && <p className="text-xs text-red-400">{geoError}</p>}
          {geoStatus && <p className="text-xs text-cyan-400">{geoStatus}</p>}
          <LocationSearch
            label="Origen"
            placeholder="Tu ubicacion"
            value={pickup}
            onChange={onPickupChange}
            proximity={proximity}
            onUseMyLocation={onUseMyLocation}
            locating={locating}
          />
          <LocationSearch
            label="Destino"
            placeholder="A donde vas?"
            value={destination}
            onChange={onDestinationChange}
            proximity={pickup ?? proximity}
            pinColor="text-cyan-400"
          />
          <button
            type="button"
            disabled={!pickup || !destination || submitting}
            onClick={onRequestTrip}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-40"
          >
            Pedir viaje
          </button>
        </div>
      )}
    </div>
  );
}
