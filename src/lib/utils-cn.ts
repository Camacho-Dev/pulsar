/** Solo `cn()` — dependencia mínima para componentes de mapa */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
