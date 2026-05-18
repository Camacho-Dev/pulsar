/** Mensaje corto para mostrar en UI (sin volcar Prisma completo) */
export function friendlyApiError(raw: string | undefined, hint?: string): string {
  if (!raw) {
    return hint ?? "Algo salio mal. Intenta de nuevo.";
  }
  if (raw.includes("serviceTier") || raw.includes("Unknown argument")) {
    return (
      "La app necesita reiniciarse tras una actualizacion. " +
      "Deten el servidor (Ctrl+C), ejecuta npm run dev y vuelve a intentar."
    );
  }
  if (raw.includes("Ya tienes un viaje activo")) return raw;
  if (raw.length > 180) {
    return hint ?? "No se pudo completar la accion. Revisa la consola del servidor.";
  }
  return hint ? `${raw} ${hint}` : raw;
}
