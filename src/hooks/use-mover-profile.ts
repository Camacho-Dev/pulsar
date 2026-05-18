"use client";

import { useCallback, useEffect, useState } from "react";
import type { Ambiance } from "@prisma/client";

export type MoverProfile = {
  name: string;
  email: string;
  preferredAmbiance: Ambiance;
  autoPulseEnabled: boolean;
  tempPreference: number;
  drivingStyle: string;
  musicNote: string;
};

export function useMoverProfile() {
  const [profile, setProfile] = useState<MoverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/profile");
    if (res.ok) setProfile(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(patch: Partial<MoverProfile>) {
    if (!profile) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (res.ok) setProfile(await res.json());
  }

  return { profile, loading, saving, patch, reload: load };
}
