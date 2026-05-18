import { latLngToCell, cellToLatLng, gridDisk } from "h3-js";

const H3_RESOLUTION = 9;

/** Celda H3 (~174m) para indexar conductores y zonas de demanda */
export function locationToCell(lat: number, lng: number): string {
  return latLngToCell(lat, lng, H3_RESOLUTION);
}

export function cellCenter(cell: string): { lat: number; lng: number } {
  const [lat, lng] = cellToLatLng(cell);
  return { lat, lng };
}

/** Celdas vecinas (k=1 → 7 hexágonos incluyendo el centro) */
export function neighborCells(cell: string, k = 1): string[] {
  return gridDisk(cell, k);
}
