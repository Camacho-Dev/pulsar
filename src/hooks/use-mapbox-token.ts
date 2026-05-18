"use client";

import { useEffect, useState } from "react";
import { isValidMapboxToken, MAPBOX_TOKEN } from "@/lib/mapbox";

export function useMapboxToken() {
  const [token, setToken] = useState<string | null>(() =>
    isValidMapboxToken(MAPBOX_TOKEN) ? MAPBOX_TOKEN : null
  );
  const [loading, setLoading] = useState(!isValidMapboxToken(MAPBOX_TOKEN));

  useEffect(() => {
    if (isValidMapboxToken(MAPBOX_TOKEN)) {
      setToken(MAPBOX_TOKEN);
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetch("/api/config/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const t = typeof data?.mapboxToken === "string" ? data.mapboxToken : "";
        setToken(isValidMapboxToken(t) ? t : "");
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setToken("");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { token: token ?? "", loading, ready: !loading && isValidMapboxToken(token ?? "") };
}
