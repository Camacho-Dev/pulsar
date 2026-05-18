export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Distancia al punto de referencia (km), solo en resultados de búsqueda */
  distanceKm?: number;
}
