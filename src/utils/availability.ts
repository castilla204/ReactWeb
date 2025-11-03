/**
 * Utilidades para formatear y trabajar con horarios de disponibilidad del experto
 */

export interface CurrentExpertAvailabilityDto {
  id: number;
  daysOfWeek: string[]; // Ej: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  startTime: string; // Formato: "HH:mm:ss" (ej: "09:00:00")
  endTime: string; // Formato: "HH:mm:ss" (ej: "18:00:00")
  effectiveFrom: string; // ISO 8601 date (ej: "2025-01-15T00:00:00Z")
}

/**
 * Formatea los días de la semana en español
 */
export function formatDaysOfWeek(days: string[]): string {
  const daysMap: Record<string, string> = {
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes',
    'Saturday': 'Sábado',
    'Sunday': 'Domingo'
  };
  
  return days.map(day => daysMap[day] || day).join(', ');
}

/**
 * Formatea TimeSpan a hora legible (ej: "09:00:00" -> "09:00")
 */
export function formatTimeSpan(timeSpan: string): string {
  const [hours, minutes] = timeSpan.split(':');
  return `${hours}:${minutes}`;
}

/**
 * Formatea el rango horario completo (ej: "Lunes a Viernes, 09:00 - 18:00")
 */
export function formatAvailabilityRange(
  availability: CurrentExpertAvailabilityDto | null
): string {
  if (!availability) {
    return 'Horarios no disponibles';
  }
  
  const days = formatDaysOfWeek(availability.daysOfWeek);
  const startTime = formatTimeSpan(availability.startTime);
  const endTime = formatTimeSpan(availability.endTime);
  
  return `${days}, ${startTime} - ${endTime}`;
}

/**
 * Verifica si un día específico está disponible
 */
export function isDayAvailable(
  availability: CurrentExpertAvailabilityDto | null,
  day: string
): boolean {
  if (!availability) return false;
  return availability.daysOfWeek.includes(day);
}

/**
 * Verifica si un experto está disponible ahora mismo
 */
export function isExpertAvailableNow(
  availability: CurrentExpertAvailabilityDto | null
): boolean {
  if (!availability) return false;
  
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.toTimeString().slice(0, 8); // "HH:mm:ss"
  
  if (!isDayAvailable(availability, currentDay)) {
    return false;
  }
  
  return currentTime >= availability.startTime && currentTime <= availability.endTime;
}

