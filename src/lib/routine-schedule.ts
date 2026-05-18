export const DAY_OPTIONS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
];

export function dayLabel(dayOfWeek: number) {
  return DAY_OPTIONS.find((d) => d.value === dayOfWeek)?.label ?? "Dia";
}

export function hourOptions() {
  return Array.from({ length: 24 }, (_, h) => ({
    value: h,
    label: `${String(h).padStart(2, "0")}:00`,
  }));
}

export function isRoutineActiveNow(
  dayOfWeek: number,
  hourStart: number,
  hourEnd: number,
  now = new Date()
) {
  const day = now.getDay();
  const hour = now.getHours();
  return day === dayOfWeek && hour >= hourStart && hour < hourEnd;
}
