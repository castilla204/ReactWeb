import { useMemo } from 'react';
import { Appointment } from '../types/appointment';

export interface CancellationInfo {
  clientCancellationCount: number;
  expertCancellationCount: number;
  lastClientCancellationAt?: string;
  lastExpertCancellationAt?: string;
  totalCancellations: number;
  hasClientCancelled: boolean;
  hasExpertCancelled: boolean;
  isSecondCancellation: boolean;
  shouldProcessMoney: boolean;
  cancellationSummary: string;
}

export const useCancellationInfo = (appointment: Appointment): CancellationInfo => {
  return useMemo(() => {
    const {
      clientCancellationCount = 0,
      expertCancellationCount = 0,
      lastClientCancellationAt,
      lastExpertCancellationAt
    } = appointment;

    const totalCancellations = clientCancellationCount + expertCancellationCount;
    const hasClientCancelled = clientCancellationCount > 0;
    const hasExpertCancelled = expertCancellationCount > 0;
    const isSecondCancellation = clientCancellationCount >= 2 || expertCancellationCount >= 2;
    const shouldProcessMoney = isSecondCancellation;

    // Crear resumen de cancelaciones
    let cancellationSummary = '';
    if (totalCancellations === 0) {
      cancellationSummary = 'Sin cancelaciones';
    } else if (clientCancellationCount > 0 && expertCancellationCount > 0) {
      cancellationSummary = `${clientCancellationCount} cancelación(es) del cliente, ${expertCancellationCount} del experto`;
    } else if (clientCancellationCount > 0) {
      cancellationSummary = `${clientCancellationCount} cancelación(es) del cliente`;
    } else if (expertCancellationCount > 0) {
      cancellationSummary = `${expertCancellationCount} cancelación(es) del experto`;
    }

    return {
      clientCancellationCount,
      expertCancellationCount,
      lastClientCancellationAt,
      lastExpertCancellationAt,
      totalCancellations,
      hasClientCancelled,
      hasExpertCancelled,
      isSecondCancellation,
      shouldProcessMoney,
      cancellationSummary
    };
  }, [
    appointment.clientCancellationCount,
    appointment.expertCancellationCount,
    appointment.lastClientCancellationAt,
    appointment.lastExpertCancellationAt
  ]);
};

// Utilidades adicionales para formatear fechas
export const formatCancellationDate = (dateString?: string): string => {
  if (!dateString) return 'Nunca';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
};

// Utilidades para determinar el estado de cancelación
export const getCancellationStatus = (cancellationInfo: CancellationInfo): {
  status: 'none' | 'first' | 'second' | 'multiple';
  color: string;
  message: string;
} => {
  const { totalCancellations } = cancellationInfo;

  if (totalCancellations === 0) {
    return {
      status: 'none',
      color: 'green',
      message: 'Sin cancelaciones'
    };
  }

  if (totalCancellations === 1) {
    return {
      status: 'first',
      color: 'yellow',
      message: 'Primera cancelación - Sin procesamiento de dinero'
    };
  }

  if (totalCancellations === 2) {
    return {
      status: 'second',
      color: 'orange',
      message: 'Segunda cancelación - Se procesará el dinero'
    };
  }

  return {
    status: 'multiple',
    color: 'red',
    message: 'Múltiples cancelaciones - Dinero procesado'
  };
};
