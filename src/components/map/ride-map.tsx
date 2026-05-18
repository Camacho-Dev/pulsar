"use client";

import { useEffect, useMemo, useRef } from "react";
import Map, { Layer, MapRef, Marker, Source } from "react-map-gl/mapbox";
import { Car } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { DEFAULT_CENTER } from "@/lib/geo";
import { MAPBOX_STYLE } from "@/lib/mapbox";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  sublabel?: string;
};

interface RideMapProps {
  pickup?: { lat: number; lng: number; label?: string };
  dropoff?: { lat: number; lng: number; label?: string };
  driver?: { lat: number; lng: number; label?: string };
  nearbyDrivers?: MapMarker[];
  passengerRequests?: MapMarker[];
  routeCoordinates?: [number, number][];
  className?: string;
}

function Pin({ color, label }: { color: string; label?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="block h-4 w-4 rounded-full border-2 border-white shadow-lg"
        style={{ background: color, boxShadow: `0 0 12px ${color}` }}
      />
      {label && (
        <span className="mt-1 max-w-[140px] truncate rounded bg-black/80 px-2 py-0.5 text-[10px] text-white">
          {label}
        </span>
      )}
    </div>
  );
}

function DriverPin({ label, sublabel }: { label?: string; sublabel?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 shadow-lg shadow-violet-600/40 ring-2 ring-white">
        <Car className="h-4 w-4 text-white" />
      </span>
      {label && (
        <span className="mt-1 rounded bg-violet-900/90 px-2 py-0.5 text-[10px] font-medium text-violet-100">
          {label}
          {sublabel && (
            <span className="block text-[9px] text-violet-300">{sublabel}</span>
          )}
        </span>
      )}
    </div>
  );
}

function RequestPin({ label, sublabel }: { label?: string; sublabel?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black ring-2 ring-white shadow-lg">
        !
      </span>
      {label && (
        <span className="mt-1 max-w-[130px] truncate rounded bg-amber-950/90 px-2 py-0.5 text-[10px] text-amber-100">
          {label}
          {sublabel && (
            <span className="block text-[9px] text-amber-300">{sublabel}</span>
          )}
        </span>
      )}
    </div>
  );
}

export function RideMap({
  pickup,
  dropoff,
  driver,
  nearbyDrivers = [],
  passengerRequests = [],
  routeCoordinates,
  className,
}: RideMapProps) {
  const mapRef = useRef<MapRef>(null);
  const { token, loading: tokenLoading, ready } = useMapboxToken();
  const center = pickup ?? DEFAULT_CENTER;

  const route = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length >= 2) {
      return {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: routeCoordinates,
        },
      };
    }
    return null;
  }, [routeCoordinates]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const points: [number, number][] = [];
    if (pickup) points.push([pickup.lng, pickup.lat]);
    if (dropoff) points.push([dropoff.lng, dropoff.lat]);
    nearbyDrivers.forEach((d) => points.push([d.lng, d.lat]));
    passengerRequests.forEach((p) => points.push([p.lng, p.lat]));
    if (routeCoordinates) routeCoordinates.forEach((c) => points.push(c));

    if (points.length >= 2) {
      const lngs = points.map((p) => p[0]);
      const lats = points.map((p) => p[1]);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 72, duration: 800, maxZoom: 15 }
      );
    } else if (pickup) {
      map.flyTo({ center: [pickup.lng, pickup.lat], zoom: 14, duration: 800 });
    }
  }, [pickup, dropoff, routeCoordinates, nearbyDrivers, passengerRequests]);

  if (tokenLoading) {
    return (
      <div
        className={`flex min-h-[200px] items-center justify-center rounded-2xl bg-zinc-900 text-sm text-zinc-500 ${className ?? ""}`}
      >
        Cargando mapa…
      </div>
    );
  }

  if (!ready) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-violet-500/40 bg-zinc-900 p-6 text-center ${className ?? ""}`}
      >
        <p className="text-sm font-medium text-violet-300">Mapbox no configurado</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Map
        key={token}
        ref={mapRef}
        mapboxAccessToken={token}
        mapStyle={MAPBOX_STYLE}
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: 14,
        }}
        style={{ width: "100%", height: "100%", borderRadius: "1rem" }}
        attributionControl={false}
      >
        {route && (
          <Source id="route" type="geojson" data={route}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#8b5cf6",
                "line-width": 5,
                "line-opacity": 0.9,
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </Source>
        )}

        {nearbyDrivers.map((d) => (
          <Marker key={d.id} longitude={d.lng} latitude={d.lat} anchor="center">
            <DriverPin label={d.label} sublabel={d.sublabel} />
          </Marker>
        ))}

        {passengerRequests.map((p) => (
          <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="center">
            <RequestPin label={p.label} sublabel={p.sublabel} />
          </Marker>
        ))}

        {pickup && (
          <Marker longitude={pickup.lng} latitude={pickup.lat} anchor="center">
            <Pin color="#34d399" label={pickup.label} />
          </Marker>
        )}
        {dropoff && (
          <Marker longitude={dropoff.lng} latitude={dropoff.lat} anchor="center">
            <Pin color="#f87171" label={dropoff.label} />
          </Marker>
        )}
        {driver && (
          <Marker longitude={driver.lng} latitude={driver.lat} anchor="center">
            <DriverPin label={driver.label ?? "Tu conductor"} />
          </Marker>
        )}
      </Map>
    </div>
  );
}
