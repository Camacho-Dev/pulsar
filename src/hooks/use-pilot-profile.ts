"use client";

import { useCallback, useEffect, useState } from "react";
import type { TransportMode } from "@prisma/client";
import type { CarServiceTier } from "@/lib/car-services";

export type PilotProfile = {
  name: string;
  email: string;
  vehicleType: string;
  transportMode: TransportMode;
  avatarEnergy: string;
  auraScore: number;
  punctuality: number;
  smoothness: number;
  safety: number;
  ambianceFit: number;
  cleanliness: number;
  conversation: number;
  isOnline: boolean;
  serviceTiers: CarServiceTier[];
};

export function usePilotProfile() {
  const [profile, setProfile] = useState<PilotProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/pilots/me");
    if (res.ok) setProfile(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(data: Partial<PilotProfile>) {
    setSaving(true);
    const res = await fetch("/api/pilots/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) setProfile(await res.json());
  }

  return { profile, loading, saving, patch, reload: load };
}
