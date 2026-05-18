"use client";

import { useCallback, useRef, useState } from "react";

export type GpsCoords = {
  lat: number;
  lng: number;
  accuracy?: number;
};

/**
 * GPS del conductor: lectura periódica de posición (sin reverse geocoding).
 */
export function useDriverGps() {
  const [position, setPosition] = useState<GpsCoords | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const positionRef = useRef<GpsCoords | null>(null);

  const syncPosition = useCallback((): Promise<GpsCoords | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError("GPS no disponible");
        resolve(null);
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: GpsCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          positionRef.current = coords;
          setPosition(coords);
          setLocating(false);
          setError(null);
          resolve(coords);
        },
        () => {
          setLocating(false);
          setError("Activa el permiso de ubicación");
          resolve(positionRef.current);
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 20_000 }
      );
    });
  }, []);

  return { position, setPosition, syncPosition, locating, error };
}
