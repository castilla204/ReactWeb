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
