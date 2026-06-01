/**
 * ═══════════════════════════════════════════════════════════════
 * FORMATEO DE TIMEZONES PARA UI (FRIENDLY)
 * ═══════════════════════════════════════════════════════════════
 *
 * Convierte un IANA timezone ID (ej: "America/Mexico_City") a una
 * etiqueta legible con el offset actual (ej: "Ciudad de México (UTC-6)").
 *
 * El offset se calcula en tiempo real con Intl.DateTimeFormat, por lo
 * que respeta DST automáticamente (Madrid en verano sale UTC+2, en
 * invierno UTC+1).
 *
 * Diseñado para mostrarse junto a un icono Globe en la UI de checkout,
 * sidebar de servicio, etc.
 */

// Diccionario de nombres "bonitos" para las ciudades más comunes que
// aparecen en el marketplace (ES, LATAM, Europa, USA). Si una zona no
// está mapeada, caemos a derivar el nombre del ID.
const CITY_LABELS: Record<string, string> = {
  // España y Europa
  'Europe/Madrid': 'Madrid',
  'Europe/Lisbon': 'Lisboa',
  'Europe/London': 'Londres',
  'Europe/Paris': 'París',
  'Europe/Berlin': 'Berlín',
  'Europe/Rome': 'Roma',
  'Europe/Amsterdam': 'Ámsterdam',
  'Europe/Brussels': 'Bruselas',
  'Europe/Zurich': 'Zúrich',
  'Europe/Vienna': 'Viena',
  'Europe/Dublin': 'Dublín',
  'Europe/Athens': 'Atenas',
  'Europe/Warsaw': 'Varsovia',
  'Europe/Prague': 'Praga',
  'Europe/Stockholm': 'Estocolmo',
  'Europe/Helsinki': 'Helsinki',
  'Europe/Oslo': 'Oslo',
  'Europe/Copenhagen': 'Copenhague',
  'Europe/Bucharest': 'Bucarest',
  'Europe/Budapest': 'Budapest',
  'Europe/Moscow': 'Moscú',
  'Atlantic/Canary': 'Canarias',

  // LATAM
  'America/Mexico_City': 'Ciudad de México',
  'America/Monterrey': 'Monterrey',
  'America/Tijuana': 'Tijuana',
  'America/Cancun': 'Cancún',
  'America/Buenos_Aires': 'Buenos Aires',
  'America/Argentina/Buenos_Aires': 'Buenos Aires',
  'America/Argentina/Cordoba': 'Córdoba',
  'America/Bogota': 'Bogotá',
  'America/Lima': 'Lima',
  'America/Santiago': 'Santiago de Chile',
  'America/Caracas': 'Caracas',
  'America/La_Paz': 'La Paz',
  'America/Montevideo': 'Montevideo',
  'America/Asuncion': 'Asunción',
  'America/Guayaquil': 'Quito',
  'America/Sao_Paulo': 'São Paulo',
  'America/Manaus': 'Manaos',
  'America/Costa_Rica': 'San José (Costa Rica)',
  'America/Panama': 'Panamá',
  'America/Guatemala': 'Guatemala',
  'America/El_Salvador': 'San Salvador',
  'America/Tegucigalpa': 'Tegucigalpa',
  'America/Managua': 'Managua',
  'America/Havana': 'La Habana',
  'America/Santo_Domingo': 'Santo Domingo',
  'America/Puerto_Rico': 'San Juan',

  // USA / Canadá
  'America/New_York': 'Nueva York',
  'America/Chicago': 'Chicago',
  'America/Denver': 'Denver',
  'America/Los_Angeles': 'Los Ángeles',
  'America/Phoenix': 'Phoenix',
  'America/Anchorage': 'Anchorage',
  'America/Toronto': 'Toronto',
  'America/Vancouver': 'Vancouver',

  // Asia / Pacífico
  'Asia/Tokyo': 'Tokio',
  'Asia/Shanghai': 'Shanghái',
  'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Singapore': 'Singapur',
  'Asia/Seoul': 'Seúl',
  'Asia/Dubai': 'Dubái',
  'Asia/Kolkata': 'Calcuta',
  'Asia/Bangkok': 'Bangkok',
  'Asia/Jakarta': 'Yakarta',
  'Australia/Sydney': 'Sídney',
  'Australia/Melbourne': 'Melbourne',
  'Pacific/Auckland': 'Auckland',

  // África
  'Africa/Casablanca': 'Casablanca',
  'Africa/Cairo': 'El Cairo',
  'Africa/Johannesburg': 'Johannesburgo',
  'Africa/Lagos': 'Lagos',
};

/**
 * Deriva un nombre legible a partir de un IANA ID desconocido.
 * "America/Argentina/Buenos_Aires" → "Buenos Aires"
 * "Europe/Madrid" → "Madrid"
 */
const cityFromTimezoneId = (timezone: string): string => {
  const parts = timezone.split('/');
  const last = parts[parts.length - 1] || timezone;
  return last.replace(/_/g, ' ');
};

/**
 * Calcula el offset UTC de un timezone para un instante dado con Intl.DateTimeFormat.
 * Devuelve un string tipo "UTC+1", "UTC-6", "UTC+5:30".
 *
 * Usa la parte "shortOffset" del formato; respeta DST automáticamente para `atDate`.
 *
 * 🛡️ Round 27 — R27-T27-1-9 FIX: antes este helper usaba `new Date()` (instante actual),
 * lo que mostraba el offset de HOY incluso cuando la etiqueta describía una cita en otra
 * fecha del año. Cross-DST (cliente BA + experto Madrid, cita en noviembre desde verano)
 * mostraba "Madrid (UTC+2)" en lugar del correcto "UTC+1" → cliente se equivocaba ±1h.
 * Ahora `atDate` es opcional; por defecto sigue siendo el instante actual (back-compat).
 */
const computeUtcOffset = (timezone: string, atDate: Date = new Date()): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(atDate);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (!tzPart) return 'UTC';

    // Salidas típicas: "GMT-6", "GMT+5:30", "GMT" (para UTC).
    const raw = tzPart.value.trim();
    if (raw === 'GMT' || raw === 'UTC') return 'UTC';
    return raw.replace(/^GMT/, 'UTC');
  } catch {
    return 'UTC';
  }
};

/**
 * Convierte un IANA timezone ID a una etiqueta amigable con offset.
 *
 * 🛡️ Round 27 — R27-T27-1-9 FIX: `atDate` opcional para que el offset refleje el
 * DST de la FECHA DE LA CITA, no del instante de renderizado. Sin él, una cita
 * Nov 15 16:00 Madrid mostraba "(UTC+2)" en agosto y "(UTC+1)" en diciembre.
 *
 * Ejemplos:
 *  - formatTimezoneFriendly("America/Mexico_City")               → "Ciudad de México (UTC-6)"
 *  - formatTimezoneFriendly("Europe/Madrid", appointmentDate)    → "Madrid (UTC+1)" en noviembre
 *  - formatTimezoneFriendly("Asia/Kolkata")                      → "Calcuta (UTC+5:30)"
 *  - formatTimezoneFriendly(null)                                → ""
 *  - formatTimezoneFriendly("Invalid/Zone")                      → "Invalid Zone (UTC)"
 */
export const formatTimezoneFriendly = (
  timezone?: string | null,
  atDate?: Date | string | null,
): string => {
  if (!timezone) return '';
  const trimmed = timezone.trim();
  if (!trimmed) return '';

  let resolvedDate: Date | undefined;
  if (atDate instanceof Date) {
    resolvedDate = Number.isNaN(atDate.getTime()) ? undefined : atDate;
  } else if (typeof atDate === 'string' && atDate.length > 0) {
    const parsed = new Date(atDate);
    resolvedDate = Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const city = CITY_LABELS[trimmed] || cityFromTimezoneId(trimmed);
  const offset = computeUtcOffset(trimmed, resolvedDate);
  return `${city} (${offset})`;
};

export default formatTimezoneFriendly;
