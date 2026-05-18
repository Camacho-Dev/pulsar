/** Punto GPS del dispositivo */
export type GpsPoint = {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
};

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm?: number;
};

export type RouteResult = {
  distanceKm: number;
  durationMin: number;
  /** Coordenadas GeoJSON [lng, lat] */
  coordinates: [number, number][];
  /** Polyline codificada (Google/Mapbox) para transferencia ligera */
  encodedPolyline: string;
  source: "mapbox" | "ors" | "estimate";
};

export type MatchedPoint = {
  lat: number;
  lng: number;
  street?: string;
  confidence: number;
};
