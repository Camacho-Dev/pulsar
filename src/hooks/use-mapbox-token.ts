"use client";

import { useEffect, useState } from "react";
import { useMapboxConfig } from "@/components/providers/mapbox-config-provider";
import { isValidMapboxToken, MAPBOX_TOKEN } from "@/lib/mapbox";

function pickToken(...candidates: string[]) {
  for (const t of candidates) {
    if (isValidMapboxToken(t)) return t;
  }
  return "";
}

export function useMapboxToken() {
  const { token: serverToken } = useMapboxConfig();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const fromServer = pickToken(serverToken);
      if (fromServer) {
        if (!cancelled) {
          setToken(fromServer);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/config/public");
        if (res.ok) {
          const data = await res.json();
          const fromApi = pickToken(
            typeof data?.mapboxToken === "string" ? data.mapboxToken : ""
          );
          if (fromApi && !cancelled) {
            setToken(fromApi);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* fallback abajo */
      }

      if (!cancelled) {
        setToken(pickToken(MAPBOX_TOKEN));
        setLoading(false);
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [serverToken]);

  return { token, loading, ready: !loading && isValidMapboxToken(token) };
}
