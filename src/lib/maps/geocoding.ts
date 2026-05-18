import { searchPlaces, reverseGeocode } from "@/lib/routing-api";
import type { PlaceResult } from "./types";

export type { PlaceResult };

/** Autocomplete: texto → lugares (con sesgo por proximidad) */
export async function autocompletePlaces(
  query: string,
  proximity?: { lat: number; lng: number }
): Promise<PlaceResult[]> {
  return searchPlaces(query, proximity);
}

/** Reverse geocoding: GPS → dirección legible */
export async function reverseGeocodeAddress(
  lat: number,
  lng: number
): Promise<PlaceResult> {
  const place = await reverseGeocode(lat, lng);
  return {
    id: place.id,
    name: place.name,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
  };
}
