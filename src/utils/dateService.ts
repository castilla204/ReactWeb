/**
 * ═══════════════════════════════════════════════════════════════
 * SERVICIO DE FECHAS Y TIMEZONE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Este servicio maneja todas las conversiones de fecha/hora entre
 * UTC y la zona horaria local del usuario.
 * 
 * REGLA DE ORO:
 * - Backend siempre almacena y procesa en UTC
 * - Frontend convierte UTC ↔ Local para mostrar/enviar
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
 * @param date - Fecha seleccionada por el usuario (en su hora local)
 * @param time - Hora seleccionada (formato "HH:mm" o "HH:mm:ss")
 * @param timezone - Zona horaria IANA (opcional, usa la almacenada)
 * @returns Objeto con proposedDate, proposedTime y timezone para enviar al backend
 */
export const prepareForBackend = (
  date: Date,
  time: string,
  timezone?: string
): { proposedDate: string; proposedTime: string; timezone: string } => {
  const tz = getUserTimezone(timezone);
  
  // Formatear la fecha en formato YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Asegurar que el tiempo tenga formato HH:mm:ss
  const timeStr = time.includes(':') && time.split(':').length === 2 
    ? `${time}:00` 
    : time;
  
  return {
    proposedDate: `${dateStr}T${timeStr}`,
    proposedTime: timeStr,
    timezone: tz
  };
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
 * @param appointment - Cita con campos de fecha
 * @param timezone - Zona horaria IANA (opcional, usa la almacenada)
 * @returns Objeto con fechas formateadas
 */
export const formatAppointmentForDisplay = (
  appointment: Appointment,
  timezone?: string
): FormattedAppointmentDate => {
  // ✅ INTERNACIONALIZACIÓN: Priorizar timezone del appointment, luego el parámetro, luego userTimezone
  const appointmentTimezone = appointment.timezone || appointment.userTimezone;
  const tz = appointmentTimezone && appointmentTimezone !== 'UTC' 
    ? appointmentTimezone 
    : (timezone || getUserTimezone());
  
  // Si el backend ya devolvió la conversión y tenemos campos locales, usar directamente
  if (appointment.proposedDateLocal && appointment.proposedTimeLocal) {
    const localDateTime = parseISO(`${appointment.proposedDateLocal}T${appointment.proposedTimeLocal}`);
    
    return {
      date: format(localDateTime, 'dd/MM/yyyy'),
      time: format(localDateTime, 'HH:mm'),
      fullDateTime: format(localDateTime, "EEEE, d 'de' MMMM yyyy, HH:mm", { locale: es }),
      dayOfWeek: format(localDateTime, 'EEEE', { locale: es }),
      relative: getRelativeTime(localDateTime)
    };
  }
  
  // Si no hay campos locales, convertir desde UTC
  const utcDateTime = `${appointment.proposedDateUtc || appointment.proposedDate}T${appointment.proposedTimeUtc || appointment.proposedTime}Z`;
  const utcDate = parseISO(utcDateTime);
  
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
  minHoursAhead: number = 24
): boolean => {
  const dateTime = new Date(`${date}T${time}`);
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

