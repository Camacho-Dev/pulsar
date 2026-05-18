import { autocompletePlaces, reverseGeocodeAddress } from "@/lib/maps/geocoding";
import { computeRoute } from "@/lib/maps/routing";
import { snapIfNeeded, snapToRoad } from "@/lib/maps/map-matching";
import { encodePolyline, decodePolyline } from "@/lib/maps/polyline";
import { locationToCell, neighborCells } from "@/lib/maps/geo-cell";
import { calculateEta, quickEtaMinutes } from "@/services/eta.service";

export {
  autocompletePlaces,
  reverseGeocodeAddress,
  computeRoute,
  snapIfNeeded,
  snapToRoad,
  encodePolyline,
  decodePolyline,
  locationToCell,
  neighborCells,
  calculateEta,
  quickEtaMinutes,
};

/** Cotización de ruta para pricing y creación de viaje */
export async function quoteRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) {
  const route = await computeRoute(from, to);
  return {
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    coordinates: route.coordinates,
    encodedPolyline: route.encodedPolyline,
    source: route.source,
  };
}
