/**
 * Radio de trabajo del experto (ExpertProfiles.WorkRadiusKm).
 *
 * Contrato con la API:
 *   - 0   = solo trabaja en su taller/punto fijo (el cliente se desplaza).
 *   - 200 = máximo permitido.
 *   - El backend lo expone en todos los DTOs públicos del experto; la API
 *     serializa PascalCase, así que se aceptan ambos casings.
 */

export const MAX_WORK_RADIUS_KM = 200;
export const DEFAULT_WORK_RADIUS_KM = 100;

/**
 * Lee WorkRadiusKm de un objeto experto (cualquier casing).
 * Devuelve null si el campo no viene o no es un número válido en [0, 200]
 * (p. ej. respuestas cacheadas anteriores al despliegue del campo).
 */
export function readWorkRadiusKm(expert: unknown): number | null {
  const e = expert as { workRadiusKm?: unknown; WorkRadiusKm?: unknown } | null | undefined;
  const raw = e?.workRadiusKm ?? e?.WorkRadiusKm;
  if (raw === null || raw === undefined) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > MAX_WORK_RADIUS_KM) return null;
  return value;
}

/** Etiqueta corta para badges: "Solo en su taller" o "Hasta 50 km". */
export function formatWorkRadius(km: number): string {
  return km === 0 ? 'Solo en su taller' : `Hasta ${km} km`;
}
