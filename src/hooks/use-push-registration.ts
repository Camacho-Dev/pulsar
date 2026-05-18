"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/** Registra token push (web: id estable en localStorage; nativo: Capacitor si existe). */
export function usePushRegistration() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    async function register() {
      let token: string | null = null;
      let platform = "web";

      try {
        const cap = await import("@capacitor/core").then((m) => m.Capacitor);
        if (cap.isNativePlatform()) {
          const push = await import("@capacitor/push-notifications");
          const perm = await push.PushNotifications.requestPermissions();
          if (perm.receive !== "granted") return;
          await push.PushNotifications.register();
          platform = cap.getPlatform();
          push.PushNotifications.addListener("registration", (ev) => {
            if (ev.value) {
              void fetch("/api/push/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: ev.value, platform }),
              });
            }
          });
          return;
        }
      } catch {
        /* Capacitor no instalado en web pura */
      }

      const key = `pulsar_push_${session!.user!.id}`;
      token = localStorage.getItem(key);
      if (!token) {
        token = `web_${session!.user!.id}_${crypto.randomUUID()}`;
        localStorage.setItem(key, token);
      }

      await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform }),
      });
    }

    void register();
  }, [status, session?.user?.id]);
}
