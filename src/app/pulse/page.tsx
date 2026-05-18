"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { Ambiance, TransportMode } from "@prisma/client";
import { AppMenuTrigger } from "@/components/pulsar/app-menu-sheet";
import { AppHeader } from "@/components/pulsar/app-header";
import { LivingMap } from "@/components/pulsar/map-dynamic";
import { PulsePanel, type PulseSuggestion } from "@/components/pulsar/pulse-panel";
import {
  MovementTracker,
  type MovementView,
} from "@/components/pulsar/movement-tracker";
import { RatingPanel } from "@/components/pulsar/rating-panel";
import { useDeviceLocation } from "@/gps/use-device-location";
import { useSocket } from "@/lib/socket-client";
import { MovementEvents } from "@/core/events";
import { friendlyApiError } from "@/lib/api-errors";
import type { PilotLocation } from "@/lib/socket-types";
import type { Place } from "@/lib/places";
import { decodePolyline } from "@/lib/maps/polyline";
import { TripPreferences } from "@/components/pulsar/trip-preferences";
import { ManualTripPlanner } from "@/components/pulsar/manual-trip-planner";
import {
  TripCheckoutSheet,
  type TripCheckoutTarget,
} from "@/components/pulsar/trip-checkout-sheet";
import {
  DEFAULT_CAR_SERVICE,
  type CarServiceTier,
} from "@/lib/car-services";

export default function PulsePage() {
  const { data: session } = useSession();
  const socketRef = useSocket();
  const { detect, locating, error: geoError, status: geoStatus } =
    useDeviceLocation();

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [pickup, setPickup] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [ambiance, setAmbiance] = useState<Ambiance>("LOFI");
  const [transportMode, setTransportMode] = useState<TransportMode>("CAR");
  const [carService, setCarService] =
    useState<CarServiceTier>(DEFAULT_CAR_SERVICE);
  const [suggestions, setSuggestions] = useState<PulseSuggestion[]>([]);
  const [pulseLoading, setPulseLoading] = useState(true);
  const [movement, setMovement] = useState<MovementView | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [pilotPos, setPilotPos] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [liveEta, setLiveEta] = useState<number | null>(null);
  const [matchingMsg, setMatchingMsg] = useState<string | null>(null);
  const [etaLabel, setEtaLabel] = useState<string | null>(null);
  const [sharedHint, setSharedHint] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [previewDest, setPreviewDest] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] =
    useState<TripCheckoutTarget | null>(null);
  const [checkoutKind, setCheckoutKind] = useState<"pulse" | "manual">("manual");
  const [pendingPulseId, setPendingPulseId] = useState<string | null>(null);
  const movementIdRef = useRef<string | null>(null);

  const loadPulse = useCallback(async () => {
    setPulseLoading(true);
    const res = await fetch("/api/pulse/suggestions");
    if (res.ok) setSuggestions(await res.json());
    setPulseLoading(false);
  }, []);

  const applyActiveMovement = useCallback((m: MovementView) => {
    setMovement(m);
    movementIdRef.current = m.id;
    if (m.toLat != null && m.toLng != null) {
      setDestination({
        id: "dest",
        name: m.toAddress,
        address: m.toAddress,
        lat: m.toLat,
        lng: m.toLng,
      });
    }
    if (m.status === "SEARCHING_PILOT") {
      setMatchingMsg("Buscando conductor? Enviando solicitud a conductores cercanos.");
      setLiveEta(m.etaMin ?? null);
      setEtaLabel("trip");
    }
  }, []);

  const loadActive = useCallback(async () => {
    const res = await fetch("/api/movement");
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) return;
    if (data?.id && data.status !== "COMPLETED" && data.status !== "CANCELLED") {
      applyActiveMovement(data);
    } else if (data?.status === "COMPLETED" && !data.rating) {
      setMovement(data);
      movementIdRef.current = data.id;
    }
  }, [applyActiveMovement]);

  const logVisit = useCallback(async (place: Place) => {
    await fetch("/api/movement/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: place.lat,
        lng: place.lng,
        address: place.address,
      }),
    });
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p?.preferredAmbiance) setAmbiance(p.preferredAmbiance);
      });
  }, []);

  useEffect(() => {
    detect().then(async (place) => {
      if (!place) return;
      setPickup(place);
      setPosition({ lat: place.lat, lng: place.lng });
      await logVisit(place);
      await loadPulse();
      await loadActive();
    });
  }, [detect, logVisit, loadPulse, loadActive]);

  useEffect(() => {
    const socket = socketRef.current;
    const userId = session?.user?.id;
    if (!socket || !userId) return;

    socket.emit("mover:join", userId);

    const onUpdate = (m: MovementView) => {
      setMovement(m);
      movementIdRef.current = m.id;
      if (m.status === "PILOT_ASSIGNED" && m.pilot) {
        setMatchingMsg(`${m.pilot.name} acepto tu viaje. Va en camino a recogerte.`);
        setEtaLabel("pickup");
      } else if (m.status === "PILOT_ARRIVING") {
        setMatchingMsg("Tu conductor esta llegando al punto de recogida.");
        setEtaLabel("pickup");
      } else if (m.status === "IN_PROGRESS") {
        setMatchingMsg("Viaje en curso.");
        setEtaLabel("destination");
      }
      if (m.etaMin != null) setLiveEta(m.etaMin);
      if (m.status === "COMPLETED" || m.status === "CANCELLED") {
        setPilotPos(null);
        setMatchingMsg(null);
      }
    };
    const onMatching = (p: {
      movementId?: string;
      message?: string;
      etaMin?: number;
    }) => {
      if (p.movementId && p.movementId !== movementIdRef.current) return;
      if (p.message) setMatchingMsg(p.message);
      if (p.etaMin != null) setLiveEta(p.etaMin);
    };
    const onPilotLoc = (loc: PilotLocation) => {
      if (loc.movementId === movementIdRef.current) {
        setPilotPos({ lat: loc.lat, lng: loc.lng });
      }
    };
    const onEta = (p: {
      movementId: string;
      etaMin: number;
      label?: string;
    }) => {
      if (p.movementId !== movementIdRef.current) return;
      setLiveEta(p.etaMin);
      if (p.label) setEtaLabel(p.label);
    };
    const onShared = (p: { message?: string }) => {
      if (p.message) setSharedHint(p.message);
    };

    socket.on(MovementEvents.MOVEMENT_UPDATE, onUpdate);
    socket.on(MovementEvents.MATCHING, onMatching);
    socket.on(MovementEvents.PILOT_LOCATION, onPilotLoc);
    socket.on(MovementEvents.ETA_UPDATE, onEta);
    socket.on(MovementEvents.SHARED_FLOW, onShared);

    return () => {
      socket.off(MovementEvents.MOVEMENT_UPDATE, onUpdate);
      socket.off(MovementEvents.MATCHING, onMatching);
      socket.off(MovementEvents.PILOT_LOCATION, onPilotLoc);
      socket.off(MovementEvents.ETA_UPDATE, onEta);
      socket.off(MovementEvents.SHARED_FLOW, onShared);
    };
  }, [session?.user?.id, socketRef]);

  useEffect(() => {
    if (!movement?.id) return;
    socketRef.current?.emit("movement:join", {
      movementId: movement.id,
      role: "mover",
    });
  }, [movement?.id, socketRef]);

  useEffect(() => {
    if (!movement?.id || movement.status !== "SEARCHING_PILOT") return;

    const id = movement.id;
    const poll = setInterval(async () => {
      const res = await fetch(`/api/movement/${id}`);
      if (!res.ok) return;
      const m: MovementView = await res.json();
      setMovement(m);
      if (m.etaMin != null) setLiveEta(m.etaMin);
      if (m.status !== "SEARCHING_PILOT") {
        if (m.status === "PILOT_ASSIGNED" && m.pilot) {
          setMatchingMsg(`${m.pilot.name} acepto tu viaje. Va en camino a recogerte.`);
          setEtaLabel("pickup");
        }
      }
    }, 8000);

    return () => clearInterval(poll);
  }, [movement?.id, movement?.status]);

  useEffect(() => {
    const dest = destination
      ? { lat: destination.lat, lng: destination.lng }
      : previewDest
        ? { lat: previewDest.lat, lng: previewDest.lng }
        : null;

    if (!pickup || !dest) {
      setRouteCoords([]);
      return;
    }
    const params = new URLSearchParams({
      fromLat: String(pickup.lat),
      fromLng: String(pickup.lng),
      toLat: String(dest.lat),
      toLng: String(dest.lng),
    });
    fetch(`/api/maps/directions?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((route) => {
        if (!route) return;
        const coords: [number, number][] =
          route.coordinates?.length >= 2
            ? route.coordinates
            : route.encodedPolyline
              ? decodePolyline(route.encodedPolyline)
              : [];
        setRouteCoords(coords);
      });
  }, [pickup, destination, previewDest]);

  async function saveAmbiance(a: Ambiance) {
    setAmbiance(a);
    await fetch("/api/profile/ambiance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ambiance: a }),
    });
  }

  function hasActiveTrip() {
    return (
      movement != null &&
      !["COMPLETED", "CANCELLED"].includes(movement.status)
    );
  }

  function openCheckout(
    kind: "pulse" | "manual",
    target: TripCheckoutTarget,
    pulseId?: string
  ) {
    if (hasActiveTrip()) {
      setMatchingMsg(
        "Ya tienes un viaje en curso. Cancelalo abajo o espera al conductor."
      );
      return;
    }
    setCheckoutError(null);
    setCheckoutKind(kind);
    setCheckoutTarget(target);
    setPendingPulseId(pulseId ?? null);
    setCheckoutOpen(true);
  }

  function requestPulseTrip(id: string) {
    if (!pickup) return;
    const s = suggestions.find((x) => x.id === id);
    if (!s) return;
    openCheckout(
      "pulse",
      {
        fromAddress: pickup.address,
        toAddress: s.toAddress,
        fromLat: pickup.lat,
        fromLng: pickup.lng,
        toLat: s.toLat,
        toLng: s.toLng,
        title: s.title,
      },
      id
    );
  }

  function requestManualTrip() {
    if (!pickup || !destination) return;
    openCheckout("manual", {
      fromAddress: pickup.address,
      toAddress: destination.address,
      fromLat: pickup.lat,
      fromLng: pickup.lng,
      toLat: destination.lat,
      toLng: destination.lng,
    });
  }

  async function finalizeTripRequest(payload: {
    ambiance: Ambiance;
    paymentMethod: string;
    fare: number;
  }) {
    if (!pickup || !checkoutTarget) return;

    if (payload.paymentMethod === "WALLET") {
      const { getWalletBalance, deductWallet } = await import(
        "@/lib/payment-storage"
      );
      if (getWalletBalance() < payload.fare) {
        setCheckoutError(
          "Saldo insuficiente en billetera. Recarga en Ajustes ? Metodo de pago."
        );
        return;
      }
      if (!deductWallet(payload.fare)) {
        setCheckoutError("No se pudo descontar de la billetera.");
        return;
      }
    }

    setSyncing(true);
    await saveAmbiance(payload.ambiance);

    const res =
      checkoutKind === "pulse" && pendingPulseId
        ? await fetch(`/api/pulse/suggestions/${pendingPulseId}/accept`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromLat: pickup.lat,
              fromLng: pickup.lng,
              fromAddress: pickup.address,
              transportMode,
              serviceTier: transportMode === "CAR" ? carService : undefined,
              ambiance: payload.ambiance,
            }),
          })
        : await fetch("/api/movement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ambiance: payload.ambiance,
              transportMode,
              serviceTier: transportMode === "CAR" ? carService : undefined,
              fromAddress: pickup.address,
              toAddress: checkoutTarget.toAddress,
              fromLat: pickup.lat,
              fromLng: pickup.lng,
              toLat: checkoutTarget.toLat,
              toLng: checkoutTarget.toLng,
            }),
          });

    setSyncing(false);

    const data = await res.json().catch(() => ({}));

    if (res.status === 409 && data.movement) {
      applyActiveMovement(data.movement);
      setCheckoutOpen(false);
      setCheckoutTarget(null);
      setPendingPulseId(null);
      setPreviewDest(null);
      setCheckoutError(null);
      return;
    }

    if (!res.ok) {
      setCheckoutError(
        friendlyApiError(data.error, data.hint) ||
          "No se pudo crear el viaje. Usa npm run dev y reinicia el servidor."
      );
      return;
    }

    applyActiveMovement(data);
    setPreviewDest(null);
    setCheckoutOpen(false);
    setCheckoutTarget(null);
    setPendingPulseId(null);
    setCheckoutError(null);
    if (checkoutKind === "pulse") loadPulse();
  }

  function handlePreviewSuggestion(s: PulseSuggestion) {
    setPreviewDest({
      lat: s.toLat,
      lng: s.toLng,
      label: s.toAddress,
    });
  }

  async function cancelMovement() {
    if (!movement) return;
    if (
      !window.confirm(
        "Cancelar este viaje? Podras solicitar otro despues."
      )
    ) {
      return;
    }
    await fetch(`/api/movement/${movement.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    setMovement(null);
    movementIdRef.current = null;
    setPilotPos(null);
    setMatchingMsg(null);
    setLiveEta(null);
    setEtaLabel(null);
    setSharedHint(null);
    loadPulse();
  }

  function handleBack() {
    if (
      movement &&
      !["COMPLETED", "CANCELLED"].includes(movement.status)
    ) {
      if (
        window.confirm(
          "Tienes un viaje activo. Quieres cancelarlo y volver?"
        )
      ) {
        void cancelMovement();
      }
      return;
    }
    window.location.href = "/lobby";
  }

  const showPlanner = !movement || movement.status === "CANCELLED";
  const showRating = movement?.status === "COMPLETED";
  const mapDestination =
    destination ??
    (previewDest
      ? { lat: previewDest.lat, lng: previewDest.lng }
      : undefined);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        title="Pedir viaje"
        onBack={handleBack}
        switchToPilot
        right={<AppMenuTrigger />}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 lg:flex-row">
        <div className="h-72 shrink-0 lg:h-auto lg:min-h-[520px] lg:flex-1">
          <LivingMap
            className="h-full min-h-[288px]"
            userPosition={pilotPos ?? position ?? undefined}
            destination={mapDestination}
            routeCoordinates={routeCoords.length > 0 ? routeCoords : undefined}
          />
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-[400px]">
          {sharedHint && (
            <p className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
              {sharedHint}
            </p>
          )}

          {movement && !showRating && (
            <MovementTracker
              movement={movement}
              moverId={session?.user?.id ?? ""}
              moverName={session?.user?.name ?? "Pasajero"}
              liveEta={liveEta}
              etaLabel={etaLabel}
              matchingMessage={matchingMsg}
              onCancel={cancelMovement}
              cancelLabel="Cancelar viaje"
            />
          )}

          {showRating && movement && (
            <RatingPanel
              movementId={movement.id}
              onDone={() => {
                setMovement(null);
                loadPulse();
              }}
            />
          )}

          {showPlanner && !showRating && (
            <>
              <TripPreferences
                transportMode={transportMode}
                carService={carService}
                onTransportChange={setTransportMode}
                onCarServiceChange={setCarService}
              />

              <PulsePanel
                suggestions={suggestions}
                loading={pulseLoading}
                transportMode={transportMode}
                carService={transportMode === "CAR" ? carService : undefined}
                onRequestTrip={requestPulseTrip}
                onPreview={handlePreviewSuggestion}
                onDismiss={async (id) => {
                  await fetch(`/api/pulse/suggestions/${id}/dismiss`, {
                    method: "POST",
                  });
                  loadPulse();
                  setPreviewDest(null);
                }}
              />

              {previewDest && !destination && (
                <p className="text-xs text-cyan-400">
                  Vista previa en mapa: {previewDest.label}
                </p>
              )}

              <ManualTripPlanner
                pickup={pickup}
                destination={destination}
                onPickupChange={setPickup}
                onDestinationChange={(p) => {
                  setDestination(p);
                  setPreviewDest(null);
                }}
                onUseMyLocation={async () => {
                  const p = await detect();
                  if (p) {
                    setPickup(p);
                    setPosition({ lat: p.lat, lng: p.lng });
                    await logVisit(p);
                    loadPulse();
                  }
                }}
                locating={locating}
                geoError={geoError}
                geoStatus={geoStatus}
                proximity={position ?? undefined}
                onRequestTrip={requestManualTrip}
                submitting={syncing}
                defaultOpen={suggestions.length === 0 && !pulseLoading}
              />
            </>
          )}
        </aside>
      </div>

      <TripCheckoutSheet
        open={checkoutOpen}
        target={checkoutTarget}
        transportMode={transportMode}
        carService={transportMode === "CAR" ? carService : null}
        defaultAmbiance={ambiance}
        submitting={syncing}
        submitError={checkoutError}
        onClose={() => {
          if (syncing) return;
          setCheckoutOpen(false);
          setCheckoutTarget(null);
          setPendingPulseId(null);
          setCheckoutError(null);
        }}
        onConfirm={(payload) => void finalizeTripRequest(payload)}
      />
    </div>
  );
}
