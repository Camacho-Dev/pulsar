"use client";

import { useState } from "react";
import type { Place } from "@/lib/places";
import { LocationSearch } from "@/components/map/location-search";
import { DAY_OPTIONS, hourOptions } from "@/lib/routine-schedule";

type Props = {
  proximity?: { lat: number; lng: number };
  onCreated: () => void;
};

export function ScheduledRoutineForm({ proximity, onCreated }: Props) {
  const [label, setLabel] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [hourStart, setHourStart] = useState(8);
  const [hourEnd, setHourEnd] = useState(9);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hours = hourOptions();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !place) {
      setError("Nombre y destino son obligatorios");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.trim(),
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        dayOfWeek,
        hourStart,
        hourEnd,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar");
      return;
    }
    setLabel("");
    setPlace(null);
    setDayOfWeek(1);
    setHourStart(8);
    setHourEnd(9);
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-medium text-zinc-200">Nueva automatica</p>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Ej. Gym, Trabajo, Casa"
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
      />
      <LocationSearch
        label="Destino"
        placeholder="Donde vas en esta rutina?"
        value={place}
        onChange={setPlace}
        proximity={proximity}
        pinColor="text-violet-400"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="block text-xs text-zinc-500">
          Dia
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-zinc-500">
          Desde
          <select
            value={hourStart}
            onChange={(e) => setHourStart(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
          >
            {hours.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-zinc-500">
          Hasta
          <select
            value={hourEnd}
            onChange={(e) => setHourEnd(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
          >
            {hours.map((h) => (
              <option key={h.value} value={h.value} disabled={h.value <= hourStart}>
                {h.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
      >
        {saving ? "Guardando…" : "Programar automatica"}
      </button>
    </form>
  );
}
