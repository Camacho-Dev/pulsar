const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

export function formatRoutineSchedule(
  dayOfWeek: number,
  hourStart: number,
  hourEnd: number
) {
  const day = DAY_NAMES[dayOfWeek] ?? "Hoy";
  return `${day}, ${hourStart}:00–${hourEnd}:00`;
}

export function formatConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

export function buildPulseWhy(
  label: string,
  confidence: number,
  address: string
) {
  return `Sueles ir a ${label} (${formatConfidence(confidence)} de confianza). Destino: ${address}.`;
}
