import type { Place } from "./places";

/** Lugares frecuentes en SD que los geocoders suelen resolver mal */
const CURATED: { pattern: RegExp; place: Place }[] = [
  {
    pattern: /residencial\s+los\s+hidalgos|los\s+hidalgos/i,
    place: {
      id: "known-los-hidalgos",
      name: "Residencial Los Hidalgos",
      address: "Residencial Los Hidalgos, Los Alcarrizos, Santo Domingo Oeste",
      lat: 18.5032,
      lng: -70.0128,
    },
  },
  {
    pattern: /edificio\s+navieros|navieros.*ciudad\s+real/i,
    place: {
      id: "known-navieros-cr",
      name: "Edificio Navieros",
      address: "Edificio Navieros, Ciudad Real, Santo Domingo",
      lat: 18.477,
      lng: -69.946,
    },
  },
  {
    pattern: /blue\s*mall/i,
    place: {
      id: "known-blue-mall",
      name: "Blue Mall",
      address: "Av. Winston Churchill, Piantini, Santo Domingo",
      lat: 18.4882,
      lng: -69.9401,
    },
  },
];

export function matchKnownPlace(query: string): Place | null {
  const q = query.trim();
  if (q.length < 3) return null;
  for (const { pattern, place } of CURATED) {
    if (pattern.test(q)) return { ...place };
  }
  return null;
}
