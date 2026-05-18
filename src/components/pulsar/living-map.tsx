"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, MapRef, Marker, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { DEFAULT_CENTER } from "@/lib/constants";
import { MAPBOX_STYLE } from "@/lib/mapbox";
import { ZONE_COLORS, ZONE_LABELS, cn } from "@/lib/utils";

export type LiveZone = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  radiusKm: number;
  intensity: number;
};

type LivingMapProps = {
  userPosition?: { lat: number; lng: number };
  destination?: { lat: number; lng: number; label?: string };
  routeCoordinates?: [number, number][];
  className?: string;
};

function zoneGeoJSON(zones: LiveZone[]) {
  return {
    type: "FeatureCollection" as const,
    features: zones.map((z) => ({
      type: "Feature" as const,
      properties: {
        color: ZONE_COLORS[z.type] ?? "#8b5cf6",
        intensity: z.intensity,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [z.lng, z.lat],
      },
    })),
  };
}

export function LivingMap({
  userPosition,
  destination,
  routeCoordinates,
  className,
}: LivingMapProps) {
  const mapRef = useRef<MapRef>(null);
  const { token, loading: tokenLoading, ready } = useMapboxToken();
  const [mapError, setMapError] = useState<string | null>(null);
  const [zones, setZones] = useState<LiveZone[]>([]);
  const center = userPosition ?? DEFAULT_CENTER;

  useEffect(() => {
    fetch("/api/zones/live")
      .then((r) => (r.ok ? r.json() : []))
      .then(setZones);
  }, []);

  const route = useMemo(() => {
    if (!routeCoordinates || routeCoordinates.length < 2) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: routeCoordinates,
      },
    };
  }, [routeCoordinates]);

  const zoneData = useMemo(() => zoneGeoJSON(zones), [zones]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !userPosition) return;
    map.flyTo({
      center: [userPosition.lng, userPosition.lat],
      zoom: destination ? 13 : 14,
      duration: 1200,
    });
  }, [userPosition, destination]);

  useEffect(() => {
    if (!ready) return;
    mapRef.current?.getMap()?.resize();
  }, [ready, token]);

  if (tokenLoading) {
    return (
      <div
        className={cn(
          "flex min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-[#0a0e17] text-sm text-zinc-500",
          className
        )}
      >
        Cargando mapa…
      </div>
    );
  }

  if (!ready) {
    return (
      <div
        className={cn(
          "flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-[#0a0e17] p-6 text-center text-sm text-amber-200",
          className
        )}
      >
        <p>Mapbox no configurado en el servidor.</p>
        <p className="text-xs text-zinc-500">
          Render → Environment →{" "}
          <code className="text-violet-300">NEXT_PUBLIC_MAPBOX_TOKEN</code> y
          redeploy.
        </p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div
        className={cn(
          "flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-[#0a0e17] p-6 text-center text-sm text-red-300",
          className
        )}
      >
        <p>{mapError}</p>
        <p className="text-xs text-zinc-500">
          Revisa el token en Mapbox y permisos de URL para Render.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e17]",
        className
      )}
    >
      <Map
        key={token}
        ref={mapRef}
        mapboxAccessToken={token}
        mapStyle={MAPBOX_STYLE}
        onError={() =>
          setMapError("No se pudieron cargar las calles del mapa.")
        }
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: 13,
        }}
        style={{ width: "100%", height: "100%", minHeight: 280 }}
        attributionControl={false}
      >
        <Source id="zones" type="geojson" data={zoneData}>
          <Layer
            id="zone-glow"
            type="circle"
            paint={{
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["get", "intensity"],
                0,
                40,
                1,
                120,
              ],
              "circle-color": ["get", "color"],
              "circle-opacity": 0.35,
              "circle-blur": 0.8,
            }}
          />
        </Source>

        {route && (
          <Source id="route" type="geojson" data={route}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#22d3ee",
                "line-width": 4,
                "line-opacity": 0.9,
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </Source>
        )}

        {zones.map((z) => (
          <Marker key={z.id} longitude={z.lng} latitude={z.lat} anchor="center">
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-medium backdrop-blur-md"
              style={{
                background: `${ZONE_COLORS[z.type]}33`,
                color: ZONE_COLORS[z.type],
                boxShadow: `0 0 20px ${ZONE_COLORS[z.type]}66`,
              }}
            >
              {z.name}
            </span>
          </Marker>
        ))}

        {userPosition && (
          <Marker
            longitude={userPosition.lng}
            latitude={userPosition.lat}
            anchor="center"
          >
            <span className="relative flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-cyan-400 ring-2 ring-white" />
            </span>
          </Marker>
        )}

        {destination && (
          <Marker
            longitude={destination.lng}
            latitude={destination.lat}
            anchor="center"
          >
            <span className="block h-4 w-4 rounded-full bg-violet-500 ring-2 ring-white shadow-lg shadow-violet-500/50" />
          </Marker>
        )}
      </Map>

      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2">
        {Object.entries(ZONE_COLORS).map(([key, color]) => (
          <span
            key={key}
            className="rounded-full px-2 py-0.5 text-[10px] backdrop-blur-md"
            style={{ background: `${color}22`, color }}
          >
            {ZONE_LABELS[key] ?? key}
          </span>
        ))}
      </div>
    </div>
  );
}
