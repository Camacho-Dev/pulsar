"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Radio } from "lucide-react";
import { AppMenuTrigger } from "@/components/pulsar/app-menu-sheet";
import { AppHeader } from "@/components/pulsar/app-header";
import { LivingMap } from "@/components/pulsar/map-dynamic";
import {
  PilotActiveTripPanel,
  type PilotActiveTrip,
} from "@/components/pulsar/pilot-active-trip";
import {
  PilotOfferCard,
  type PilotOffer,
} from "@/components/pulsar/pilot-offer-card";
import { useDriverGps } from "@/gps/use-driver-gps";
import { useSocket } from "@/lib/socket-client";
import { MovementEvents } from "@/core/events";

export default function PilotDrivePage() {
  const { data: session } = useSession();
  const socketRef = useSocket();
  const { position, syncPosition, locating, error } = useDriverGps();
  const [online, setOnline] = useState(true);
  const [hint, setHint] = useState("Leyendo demanda en tu zona…");
  const [offers, setOffers] = useState<PilotOffer[]>([]);
  const [active, setActive] = useState<PilotActiveTrip | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const positionRef = useRef(position);
  positionRef.current = position;

  const onlineRef = useRef(online);
  onlineRef.current = online;

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const posKey = position
    ? `${position.lat.toFixed(4)},${position.lng.toFixed(4)}`
    : null;

  const pushLocation = useCallback(async () => {
    const coords = await syncPosition();
    const sess = sessionRef.current;
    if (!coords || !sess?.user?.id) return;

    await fetch("/api/pilots/online", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isOnline: onlineRef.current,
        lat: coords.lat,
        lng: coords.lng,
      }),
    });

    socketRef.current?.emit("pilot:location", {
      userId: sess.user.id,
      name: sess.user.name ?? "Conductor",
      lat: coords.lat,
      lng: coords.lng,
      accuracy: coords.accuracy,
      movementId: activeIdRef.current ?? undefined,
    });
  }, [syncPosition, socketRef]);

  const refreshMarket = useCallback(async (lat: number, lng: number) => {
    const [offersRes, demandRes] = await Promise.all([
      fetch(`/api/pilots/offers?lat=${lat}&lng=${lng}`),
      fetch(`/api/pilots/demand?lat=${lat}&lng=${lng}`),
    ]);
    if (offersRes.ok) {
      const list: PilotOffer[] = await offersRes.json();
      const seen = new Set<string>();
      setOffers(
        list.filter((o) => {
          if (seen.has(o.id)) return false;
          seen.add(o.id);
          return true;
        })
      );
    }
    if (demandRes.ok) {
      const d = await demandRes.json();
      setHint(d.message);
    }
  }, []);

  const loadActive = useCallback(async () => {
    const res = await fetch("/api/pilots/active");
    if (res.ok) {
      const m = await res.json();
      if (m?.id) {
        setActive(m);
        activeIdRef.current = m.id;
        socketRef.current?.emit("movement:join", {
          movementId: m.id,
          role: "pilot",
        });
      }
    }
  }, [socketRef]);

  useEffect(() => {
    fetch("/api/pilots/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p && typeof p.isOnline === "boolean") setOnline(p.isOnline);
      });
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    socketRef.current?.emit("pilot:join", {
      userId: session.user.id,
      name: session.user.name ?? "Conductor",
    });
    void loadActive();
  }, [session, socketRef, loadActive]);

  useEffect(() => {
    void syncPosition();
  }, [syncPosition]);

  useEffect(() => {
    if (!online) return;
    void pushLocation();
    const id = setInterval(() => {
      if (onlineRef.current) void pushLocation();
    }, 6000);
    return () => clearInterval(id);
  }, [online, pushLocation]);

  useEffect(() => {
    if (!posKey || !online) return;
    const [lat, lng] = posKey.split(",").map(Number);
    void refreshMarket(lat, lng);
    const t = setInterval(() => {
      const p = positionRef.current;
      if (p && onlineRef.current) void refreshMarket(p.lat, p.lng);
    }, 15000);
    return () => clearInterval(t);
  }, [posKey, online, refreshMarket]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onOffer = (m: PilotOffer) => {
      setOffers((prev) => {
        if (prev.some((o) => o.id === m.id)) return prev;
        return [m, ...prev].slice(0, 10);
      });
    };

    socket.on(MovementEvents.MOVEMENT_OFFER, onOffer);
    return () => {
      socket.off(MovementEvents.MOVEMENT_OFFER, onOffer);
    };
  }, [socketRef]);

  async function acceptOffer(id: string) {
    setAcceptingId(id);
    setAcceptError(null);
    const res = await fetch(`/api/movement/${id}/accept`, { method: "POST" });
    setAcceptingId(null);
    if (res.ok) {
      const m = await res.json();
      setActive(m);
      activeIdRef.current = m.id;
      setOffers((o) => o.filter((x) => x.id !== id));
      socketRef.current?.emit("movement:join", {
        movementId: m.id,
        role: "pilot",
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setAcceptError(data.error ?? "No se pudo aceptar el viaje");
    }
  }

  async function cancelActive() {
    if (!active) return;
    if (!window.confirm("Cancelar este viaje?")) return;
    const res = await fetch(`/api/movement/${active.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    if (res.ok) {
      setActive(null);
      activeIdRef.current = null;
      const p = positionRef.current;
      if (p) void refreshMarket(p.lat, p.lng);
    }
  }

  function handleBack() {
    if (active) {
      if (window.confirm("Tienes un viaje activo. Cancelarlo y volver al inicio?")) {
        void cancelActive();
      }
      return;
    }
    window.location.href = "/pilot";
  }

  async function tripAction(
    action: "arrive" | "notify_arrived" | "start" | "complete"
  ) {
    if (!active) return;
    const res = await fetch(`/api/movement/${active.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const m = await res.json();
      setActive(m);
      if (m.status === "COMPLETED") {
        activeIdRef.current = null;
        setActive(null);
        const p = positionRef.current;
        if (p) void refreshMarket(p.lat, p.lng);
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        title="Pulsar · En linea"
        onBack={handleBack}
        switchToMover
        right={<AppMenuTrigger role="pilot" />}
      />

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-4 p-4 lg:grid-cols-2">
        <LivingMap className="min-h-[320px]" userPosition={position ?? undefined} />

        <div className="flex flex-col gap-4">
          <div className="glass rounded-2xl p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-cyan-300">
              <Radio className="h-4 w-4" />
              Pulso de la zona
            </p>
            <p className="mt-2 text-sm text-zinc-400">{hint}</p>
          </div>

          <div className="glass rounded-2xl p-4">
            <label className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-200">
                Disponible para viajes
              </span>
              <input
                type="checkbox"
                checked={online}
                onChange={(e) => setOnline(e.target.checked)}
                className="h-5 w-5 accent-cyan-500"
              />
            </label>
            {!online && (
              <p className="mt-2 text-xs text-zinc-500">
                Activa para recibir solicitudes. Configura tu vehiculo en el menu
                (tuerca).
              </p>
            )}
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            {locating && (
              <p className="mt-2 text-xs text-zinc-500">Obteniendo ubicacion…</p>
            )}
          </div>

          {acceptError && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {acceptError}
            </p>
          )}

          {active ? (
            <PilotActiveTripPanel
              trip={active}
              pilotId={session?.user?.id ?? ""}
              pilotName={session?.user?.name ?? "Conductor"}
              onAction={tripAction}
              onCancel={cancelActive}
            />
          ) : (
            <div className="glass rounded-2xl p-4">
              <p className="text-sm font-medium text-zinc-200">
                Viajes disponibles
              </p>
              <p className="mb-3 text-xs text-zinc-500">
                Pasajeros buscando conductor compatible con tu vehiculo
              </p>
              {offers.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  {online
                    ? "No hay solicitudes ahora. Mantente en linea."
                    : "Activa disponible para ver solicitudes."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {offers.map((o) => (
                    <PilotOfferCard
                      key={o.id}
                      offer={o}
                      onAccept={acceptOffer}
                      accepting={acceptingId === o.id}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
