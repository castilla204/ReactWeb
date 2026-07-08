import { SystemStatusDto } from '../types/searchDetails';

import { DISPUTE_RESOLVED_STATUSES, TERMINAL_SEARCH_HIRE_STATUSES } from '../constants/hireStatuses';

// Utilidades para manejar información de estados
export const getStatusColor = (statusInfo: SystemStatusDto): string => {
  return statusInfo.color || '#6C757D';
};

export const getStatusDisplayName = (statusInfo: SystemStatusDto): string => {
  return statusInfo.displayName || statusInfo.statusValue;
};

export const getStatusDescription = (statusInfo: SystemStatusDto): string => {
  return statusInfo.description || statusInfo.displayName || statusInfo.statusValue;
};

export const isFinalizationStatus = (statusInfo: SystemStatusDto): boolean => {
  return statusInfo.isFinalizationStatus;
};

// Función para obtener información de estado con fallback
export const getStatusInfoWithFallback = (
  statusInfo: SystemStatusDto | undefined,
  fallbackStatus: string
): SystemStatusDto => {
  if (statusInfo) {
    return statusInfo;
  }
  
  // Crear un objeto de fallback básico
  return {
    id: 0,
    statusType: 'Unknown',
    statusName: fallbackStatus,
    statusValue: fallbackStatus,
    displayName: fallbackStatus.replace(/_/g, ' '),
    description: null,
    color: '#6C757D',
    isActive: true,
    isFinalizationStatus: false,
    sortOrder: 999,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// ───────────────────────────────────────────────────────────────────────────
// Tono semántico de un estado. Fuente de verdad del COLOR de los badges de
// estado en el front: el hex que manda el backend (statusInfo.color) es un
// dato de seed y NO decide la UI. Un solo hue por severidad:
//   success #0F6A3E · danger rojo · warning ámbar · info azul marca · neutral gris
// ───────────────────────────────────────────────────────────────────────────

export type StatusTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export const getStatusTone = (statusInfo: Pick<SystemStatusDto, 'statusValue'>): StatusTone => {
  const v = statusInfo.statusValue || '';

  if (
    v === 'cancelled' ||
    v === 'rejected' ||
    v === 'disputed' ||
    v === 'transfer_failed' ||
    v === 'appointment_rejected' ||
    v.startsWith('cancelled_by_') ||
    v.startsWith('appointment_cancelled')
  ) {
    return 'danger';
  }

  if (
    v === 'completed' ||
    v === 'appointment_confirmed' ||
    v === 'appointment_report_sent' ||
    v.startsWith('dispute_resolved') ||
    v.startsWith('appointment_completed')
  ) {
    return 'success';
  }

  // Estados con reloj corriendo: alguien debe actuar o algo puede expirar.
  if (
    v === 'awaiting_client_decision' ||
    v === 'awaiting_report' ||
    v === 'appointment_awaiting_report' ||
    v === 'appointment_pending_expert_confirmation'
  ) {
    return 'warning';
  }

  if (v === 'pending' || v === 'awaiting_appointment' || v === 'appointment_proposed') {
    return 'info';
  }

  return 'neutral';
};

/** Tinte + texto + hairline por tono (AA ≥4.5:1 verificado sobre su fondo). */
export const STATUS_TONE_BADGE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-[#ecf6f0] text-[#0F6A3E] border-[#d8ebdf]',
  danger: 'bg-[#fdf2f2] text-[#b42318] border-[#f5dada]',
  warning: 'bg-[#fdf6e7] text-[#8a5a10] border-[#f3e6c8]',
  info: 'bg-[#eef4fb] text-[#0059b3] border-[#dbe7f7]',
  neutral: 'bg-[#f4f4f4] text-[#4a4a4a] border-[#e8e8e8]',
};

// Función para determinar si un estado es "positivo" (verde)
export const isPositiveStatus = (statusInfo: SystemStatusDto): boolean => {
  const positiveStatuses = [
    'completed',
    ...DISPUTE_RESOLVED_STATUSES,
    'appointment_confirmed',
    'appointment_report_sent',
  ];
  
  return positiveStatuses.includes(statusInfo.statusValue) || 
         statusInfo.isFinalizationStatus;
};

// Función para determinar si un estado es "negativo" (rojo)
export const isNegativeStatus = (statusInfo: SystemStatusDto): boolean => {
  const negativeStatuses = [
    'cancelled',
    'rejected',
    'disputed',
    'appointment_cancelled',
    'appointment_rejected'
  ];
  
  return negativeStatuses.includes(statusInfo.statusValue);
};

// Función para determinar si un estado es "neutral" (gris/azul)
export const isNeutralStatus = (statusInfo: SystemStatusDto): boolean => {
  const neutralStatuses = [
    'pending',
    'awaiting_client_decision',
    'appointment_proposed',
    'appointment_report_sent',
    'awaiting_appointment',
    'appointment_awaiting_report',
  ];
  
  return neutralStatuses.includes(statusInfo.statusValue);
};

// Función para obtener prioridad del estado
export const getStatusPriority = (statusInfo: SystemStatusDto): 'low' | 'medium' | 'high' => {
  if (statusInfo.isFinalizationStatus) return 'high';
  if (statusInfo.statusValue.includes('pending') || statusInfo.statusValue.includes('awaiting')) return 'medium';
  return 'low';
};

// Función de compatibilidad para migración gradual
export const getStatusInfo = (item: any): SystemStatusDto | null => {
  return item.statusInfo || null;
};

// ✅ NUEVA FUNCIÓN: Obtener el valor del estado correcto (usa statusInfo.statusValue si está disponible, sino usa status)
export const getStatusValue = (item: { status: string; statusInfo?: SystemStatusDto }): string => {
  return item.statusInfo?.statusValue || item.status;
};
