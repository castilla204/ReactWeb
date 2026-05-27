/**
 * ═══════════════════════════════════════════════════════════════
 * SERVICIO DE FECHAS Y TIMEZONE
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ IMPORTANTE: El backend maneja automáticamente todas las conversiones de timezone.
 * El frontend solo necesita:
 * 1. Enviar fechas/horas en hora LOCAL del experto (sin conversión)
 * 2. Mostrar fechas/horas usando los campos *Local que el backend proporciona
 * 3. NO hacer conversiones manuales - el backend lo hace todo
 * 
 * REGLA DE ORO:
 * - Backend convierte Local → UTC al recibir fechas del frontend
 * - Backend convierte UTC → Local al devolver fechas al frontend
 * - Frontend usa proposedDateLocal/proposedTimeLocal para mostrar
 * - Frontend envía proposedDate/proposedTime en hora LOCAL (sin conversión)
 * - Usar IANA timezone IDs (Europe/Madrid, America/Mexico_City)
 */

import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment } from '../types/appointment';

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const TIMEZONE_STORAGE_KEY = 'userTimezone';
const DEFAULT_TIMEZONE = 'UTC';

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE TIMEZONE
// ═══════════════════════════════════════════════════════════════

/**
 * Detecta la zona horaria del navegador
 */
export const detectBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

/**
 * Obtiene el timezone del localStorage o detecta del navegador
 */
export const getStoredTimezone = (): string => {
  if (typeof window === 'undefined') return DEFAULT_TIMEZONE;
  const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
  return stored || detectBrowserTimezone();
};

/**
 * Guarda el timezone en localStorage
 */
export const saveTimezoneToStorage = (timezone: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
  }
};

/**
 * Obtiene el timezone actual del usuario
 * Se puede sobreescribir pasando un timezone específico
 */
export const getUserTimezone = (overrideTimezone?: string): string => {
  return overrideTimezone || getStoredTimezone();
};

// ═══════════════════════════════════════════════════════════════
// CONVERSIONES DE FECHA/HORA
// ═══════════════════════════════════════════════════════════════

/**
 * Convierte una fecha UTC a la hora local del usuario
 * 
 * @param utcDateString - Fecha en formato ISO UTC (ej: "2025-03-15")
 * @param utcTimeString - Hora en formato TimeSpan (ej: "16:00:00")
 * @param timezone - Zona horaria IANA (ej: "Europe/Madrid")
 * @returns Date en hora local
 */
export const utcToLocal = (
  utcDateString: string,
  utcTimeString: string,
  timezone?: string
): Date => {
  const tz = getUserTimezone(timezone);
  const utcDateTime = `${utcDateString}T${utcTimeString}Z`;
  const utcDate = parseISO(utcDateTime);
  return toZonedTime(utcDate, tz);
};

/**
 * Convierte una fecha local a UTC
 * 
 * @param localDate - Fecha local (Date object)
 * @param timezone - Zona horaria IANA del usuario
 * @returns Date en UTC
 */
export const localToUtc = (localDate: Date, timezone?: string): Date => {
  const tz = getUserTimezone(timezone);
  return fromZonedTime(localDate, tz);
};

/**
 * Prepara fecha/hora para enviar al backend
 * 
 * ✅ IMPORTANTE: Envía fecha/hora en hora LOCAL del experto (sin conversión).
 * El backend convierte automáticamente Local → UTC antes de guardar.
 * 
 * @param date - Fecha seleccionada por el usuario (en hora local del experto)
 * @param time - Hora seleccionada (formato "HH:mm" o "HH:mm:ss")
 * @param timezone - Zona horaria IANA (opcional, el backend usa el del experto automáticamente)
 * @returns Objeto con proposedDate, proposedTime (y timezone opcional) para enviar al backend
 */
export const prepareForBackend = (
  date: Date,
  time: string,
  timezone?: string
): { proposedDate: string; proposedTime: string; timezone?: string } => {
  // ✅ CORRECTO: Formatear fecha/hora en hora LOCAL (sin conversión a UTC)
  // El backend detecta automáticamente el timezone del experto y convierte Local → UTC
  
  // Formatear la fecha en formato YYYY-MM-DD (hora local)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Asegurar que el tiempo tenga formato HH:mm:ss (hora local)
  const timeStr = time.includes(':') && time.split(':').length === 2 
    ? `${time}:00` 
    : time;
  
  const result: { proposedDate: string; proposedTime: string; timezone?: string } = {
    proposedDate: dateStr,  // ✅ Hora LOCAL (formato: "YYYY-MM-DD")
    proposedTime: timeStr    // ✅ Hora LOCAL (formato: "HH:mm:ss")
  };
  
  // ✅ OPCIONAL: Solo enviar timezone si se proporciona explícitamente
  // El backend usa automáticamente el timezone del experto guardado en SearchHire.ExpertTimezone
  if (timezone) {
    result.timezone = timezone;
  }
  
  return result;
};

// ═══════════════════════════════════════════════════════════════
// FORMATEO PARA MOSTRAR EN UI
// ═══════════════════════════════════════════════════════════════

interface FormattedAppointmentDate {
  date: string;           // "15/03/2025"
  time: string;           // "10:00"
  fullDateTime: string;   // "Sábado, 15 marzo 2025, 10:00"
  relative: string;       // "en 2 días" (aproximado)
  dayOfWeek: string;      // "Sábado"
}

/**
 * Formatea la fecha de una cita para mostrar en la UI
 * 
 * ✅ IMPORTANTE: Usa los campos *Local que el backend proporciona.
 * NO hace conversiones manuales - el backend ya convirtió UTC → Local.
 * 
 * @param appointment - Cita con campos de fecha
 * @param timezone - Zona horaria IANA (opcional, solo para mostrar info)
 * @returns Objeto con fechas formateadas
 */
export const formatAppointmentForDisplay = (
  appointment: Appointment,
  timezone?: string
): FormattedAppointmentDate => {
  // ✅ CORRECTO: Usar campos *Local que el backend proporciona (ya están en hora local)
  if (appointment.proposedDateLocal && appointment.proposedTimeLocal) {
    // El backend ya convirtió UTC → Local, solo formatear para mostrar
    const localDateTime = parseISO(`${appointment.proposedDateLocal}T${appointment.proposedTimeLocal}`);
    
    return {
      date: format(localDateTime, 'dd/MM/yyyy'),
      time: format(localDateTime, 'HH:mm'),
      fullDateTime: format(localDateTime, "EEEE, d 'de' MMMM yyyy, HH:mm", { locale: es }),
      dayOfWeek: format(localDateTime, 'EEEE', { locale: es }),
      relative: getRelativeTime(localDateTime)
    };
  }
  
  // ⚠️ FALLBACK: Si no hay campos *Local, usar UTC (no debería pasar si el backend está correcto)
  // Esto es solo para compatibilidad con datos antiguos
  console.warn('[dateService] Appointment sin campos *Local, usando UTC como fallback');
  const utcDateTime = `${appointment.proposedDateUtc || appointment.proposedDate}T${appointment.proposedTimeUtc || appointment.proposedTime}Z`;
  const utcDate = parseISO(utcDateTime);
  
  // Usar timezone del appointment si está disponible
  const appointmentTimezone = appointment.timezone || appointment.userTimezone;
  const tz = appointmentTimezone && appointmentTimezone !== 'UTC' 
    ? appointmentTimezone 
    : (timezone || getUserTimezone());
  
  return {
    date: formatInTimeZone(utcDate, tz, 'dd/MM/yyyy'),
    time: formatInTimeZone(utcDate, tz, 'HH:mm'),
    fullDateTime: formatInTimeZone(utcDate, tz, "EEEE, d 'de' MMMM yyyy, HH:mm", { locale: es }),
    dayOfWeek: formatInTimeZone(utcDate, tz, 'EEEE', { locale: es }),
    relative: getRelativeTime(toZonedTime(utcDate, tz))
  };
};

/**
 * Formatea una fecha UTC simple para mostrar
 * 
 * @param utcDateString - Fecha UTC en formato ISO
 * @param formatStr - Formato deseado (date-fns format)
 * @param timezone - Zona horaria IANA
 */
export const formatUtcDate = (
  utcDateString: string,
  formatStr: string = 'dd/MM/yyyy HH:mm',
  timezone?: string
): string => {
  const tz = getUserTimezone(timezone);
  const utcDate = parseISO(utcDateString);
  return formatInTimeZone(utcDate, tz, formatStr, { locale: es });
};

/**
 * Obtiene tiempo relativo aproximado (sin dependencia externa)
 */
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  
  if (diffMs < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return 'hoy';
    if (absDays === 1) return 'ayer';
    return `hace ${absDays} días`;
  }
  
  if (diffDays === 0) {
    if (diffHours <= 1) return 'en menos de 1 hora';
    return `en ${diffHours} horas`;
  }
  if (diffDays === 1) return 'mañana';
  if (diffDays <= 7) return `en ${diffDays} días`;
  if (diffDays <= 30) return `en ${Math.ceil(diffDays / 7)} semanas`;
  return `en ${Math.ceil(diffDays / 30)} meses`;
};

// ═══════════════════════════════════════════════════════════════
// VALIDACIONES
// ═══════════════════════════════════════════════════════════════

/**
 * Verifica si una fecha/hora está en el futuro (mínimo X horas)
 * 
 * @param date - Fecha a verificar
 * @param time - Hora a verificar
 * @param minHoursAhead - Mínimo de horas en el futuro (default: 24)
 * @returns true si la fecha/hora está al menos minHoursAhead en el futuro
 */
export const isValidFutureDateTime = (
  date: string,
  time: string,
  minHoursAhead: number = 24,
  timezone?: string
): boolean => {
  // 🔧 FIX D12: si se pasa el huso del experto, interpretar la fecha/hora en ESE huso (epoch UTC correcto).
  // Fallback: sin huso → se interpreta en el huso del navegador (comportamiento anterior, no rompe nada).
  const dateTime = timezone
    ? fromZonedTime(`${date}T${time}`, timezone)
    : new Date(`${date}T${time}`);
  const now = new Date();
  const minTime = new Date(now.getTime() + minHoursAhead * 60 * 60 * 1000);
  return dateTime > minTime;
};

/**
 * Obtiene la fecha mínima permitida (ahora + X horas)
 */
export const getMinAllowedDate = (minHoursAhead: number = 24): Date => {
  return new Date(Date.now() + minHoursAhead * 60 * 60 * 1000);
};

// ═══════════════════════════════════════════════════════════════
// EXPORT OBJETO ÚNICO (opcional, para compatibilidad)
// ═══════════════════════════════════════════════════════════════

export const dateService = {
  // Timezone
  detectBrowserTimezone,
  getStoredTimezone,
  saveTimezoneToStorage,
  getUserTimezone,
  
  // Conversiones
  utcToLocal,
  localToUtc,
  prepareForBackend,
  
  // Formateo
  formatAppointmentForDisplay,
  formatUtcDate,
  
  // Validaciones
  isValidFutureDateTime,
  getMinAllowedDate,
};

export default dateService;

