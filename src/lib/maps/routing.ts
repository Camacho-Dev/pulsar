import { getDrivingRoute } from "@/lib/routing-api";
import { estimateDurationMin, estimateRoadDistanceKm } from "@/lib/geo";
import { encodePolyline } from "./polyline";
import type { RouteResult } from "./types";

export async function computeRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteResult> {
  const route = await getDrivingRoute(from, to);

  if (route) {
    return {
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      coordinates: route.coordinates,
      encodedPolyline: encodePolyline(route.coordinates),
      source: "mapbox",
    };
  }

  const distanceKm = estimateRoadDistanceKm(
    from.lat,
    from.lng,
    to.lat,
    to.lng
  );
  const coordinates: [number, number][] = [
    [from.lng, from.lat],
    [to.lng, to.lat],
  ];

  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMin: estimateDurationMin(distanceKm),
    coordinates,
    encodedPolyline: encodePolyline(coordinates),
    source: "estimate",
  };
}
