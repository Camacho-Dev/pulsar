"use client";

import { useCallback, useState } from "react";
import type { Place } from "@/lib/places";

/**
 * GPS del pasajero: obtiene lat/lng y resuelve dirección vía /api/maps/reverse
 */
export function useDeviceLocation() {
  const [locating, setLocating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Detectando GPS…");

  const detect = useCallback((): Promise<Place | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError("Tu navegador no soporta geolocalización");
        setStatus("");
        setLocating(false);
        resolve(null);
        return;
      }

      if (!window.isSecureContext) {
        setError("El GPS requiere HTTPS o localhost");
        setStatus("");
        setLocating(false);
        resolve(null);
        return;
      }

      setLocating(true);
      setError(null);
      setStatus("Detectando GPS…");

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;
          setStatus(`GPS obtenido (±${Math.round(accuracy)}m). Buscando dirección…`);

          try {
            const res = await fetch(
              `/api/maps/reverse?lat=${lat}&lng=${lng}&accuracy=${Math.round(accuracy)}`
            );
            setLocating(false);
            setStatus("");
            if (res.ok) {
              resolve(await res.json());
              return;
            }
          } catch {
            /* fallback */
          }

          setLocating(false);
          setStatus("");
          resolve({
            id: "current",
            name: "Tu ubicación",
            address: `Ubicación actual (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
            lat,
            lng,
          });
        },
        (err) => {
          setLocating(false);
          setStatus("");
          const msg =
            err.code === 1
              ? "Permiso denegado: activa Ubicación en el navegador"
              : err.code === 3
                ? "GPS tardó demasiado. Intenta de nuevo"
                : "No se pudo obtener tu ubicación";
          setError(msg);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
      );
    });
  }, []);

  return { detect, locating, error, status };
}
