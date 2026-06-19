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
/** Rango por defecto en búsquedas (SearchParameterForm). */
export const SEARCH_DEFAULT_RADIUS_KM = 25;

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

/** Legacy locationRange del experto o del servicio. */
export function readLegacyLocationRange(source: unknown): number | null {
  const s = source as {
    locationRange?: unknown;
    LocationRange?: unknown;
    expert?: { locationRange?: unknown; LocationRange?: unknown } | null;
  } | null | undefined;
  const raw =
    s?.locationRange ??
    s?.LocationRange ??
    s?.expert?.locationRange ??
    s?.expert?.LocationRange;
  if (raw === null || raw === undefined) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

/**
 * Rango efectivo: WorkRadiusKm → locationRange legacy → fallback de búsqueda.
 * Acepta el servicio completo o el objeto experto.
 */
export function resolveExpertWorkRadiusKm(
  source: unknown,
  fallbackKm: number = SEARCH_DEFAULT_RADIUS_KM,
): number {
  const expert = (source as { expert?: unknown } | null | undefined)?.expert ?? source;
  const workRadius = readWorkRadiusKm(expert);
  if (workRadius !== null) return workRadius;
  const legacy =
    readLegacyLocationRange(source) ?? readLegacyLocationRange(expert);
  if (legacy !== null) return legacy;
  return fallbackKm;
}

/** Etiqueta de cobertura para filas de checkout / ficha. */
export function formatWorkRadiusCoverageLabel(km: number): string {
  return km === 0 ? 'Solo en su taller' : `${Math.max(5, km)} km de radio`;
}

/** Etiqueta corta para badges: "Solo en su taller" o "Hasta 50 km". */
export function formatWorkRadius(km: number): string {
  return km === 0 ? 'Solo en su taller' : `Hasta ${km} km`;
}

/**
 * Frase explicativa de cómo trabaja el experto según su radio:
 *   - 0  → ubicación fija (el cliente se desplaza a su taller).
 *   - >0 → el experto se desplaza dentro de un radio.
 * Pensada para la ficha de servicio (texto, no badge).
 */
export function formatWorkRadiusExplanation(km: number): string {
  return km === 0
    ? 'Ubicación fija · el cliente acude a su taller'
    : `Se desplaza en un radio de ${Math.max(5, km)} km desde su ubicación`;
}

/** Ubicación + rango de cobertura (una línea). */
export function formatLocationWithWorkRadius(
  locationName: string,
  rangeKm: number,
): string {
  return `${locationName} · ${formatWorkRadiusCoverageLabel(rangeKm)}`;
}
