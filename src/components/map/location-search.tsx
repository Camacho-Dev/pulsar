"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";
import type { Place } from "@/lib/places";
import { DEFAULT_CENTER } from "@/lib/geo";
import { cn } from "@/lib/utils";

interface LocationSearchProps {
  label: string;
  placeholder: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
  proximity?: { lat: number; lng: number };
  pinColor?: string;
  onUseMyLocation?: () => void;
  locating?: boolean;
}

export function LocationSearch({
  label,
  placeholder,
  value,
  onChange,
  proximity,
  pinColor = "text-violet-400",
  onUseMyLocation,
  locating,
}: LocationSearchProps) {
  const [query, setQuery] = useState(value?.address ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setQuery(value.address);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function search(text: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const focus = proximity ?? DEFAULT_CENTER;
      const params = new URLSearchParams({
        q: text,
        lat: String(focus.lat),
        lng: String(focus.lng),
      });
      const res = await fetch(`/api/maps/autocomplete?${params}`);
      if (res.ok) {
        const places = await res.json();
        setResults(places);
        setOpen(places.length > 0);
      }
      setLoading(false);
    }, 320);
  }

  function select(place: Place) {
    onChange(place);
    setQuery(place.address);
    setOpen(false);
    setResults([]);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setResults([]);
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-1 flex items-center justify-between text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <MapPin className={cn("h-3 w-3", pinColor)} />
          {label}
        </span>
        {onUseMyLocation && (
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={locating}
            className="flex items-center gap-1 text-violet-400 hover:text-violet-300 disabled:opacity-50"
          >
            {locating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Navigation className="h-3 w-3" />
            )}
            Mi ubicación
          </button>
        )}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={
            locating && !value ? "Obteniendo tu ubicación GPS…" : placeholder
          }
          disabled={locating && !value}
          onChange={(e) => {
            const text = e.target.value;
            setQuery(text);
            if (!text) clear();
            else search(text);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 pr-9 text-sm outline-none focus:border-violet-500/50"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl">
          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => select(place)}
                className="w-full px-3 py-2 text-left hover:bg-white/5"
              >
                <p className="flex items-center justify-between gap-2 text-sm font-medium">
                  <span className="truncate">{place.name}</span>
                  {place.distanceKm != null && (
                    <span className="shrink-0 text-xs text-violet-400">
                      {place.distanceKm < 1
                        ? `${Math.round(place.distanceKm * 1000)} m`
                        : `${place.distanceKm} km`}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">{place.address}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
