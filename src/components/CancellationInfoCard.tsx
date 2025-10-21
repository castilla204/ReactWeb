import React from 'react';
import { AlertTriangle, Clock, User, UserCheck, DollarSign } from 'lucide-react';
import { Appointment } from '../types/appointment';
import { useCancellationInfo, formatCancellationDate, getCancellationStatus } from '../hooks/useCancellationInfo';

interface CancellationInfoCardProps {
  appointment: Appointment;
  showDetails?: boolean;
  className?: string;
}

export const CancellationInfoCard: React.FC<CancellationInfoCardProps> = ({
  appointment,
  showDetails = true,
  className = ''
}) => {
  const cancellationInfo = useCancellationInfo(appointment);
  const status = getCancellationStatus(cancellationInfo);

  if (cancellationInfo.totalCancellations === 0) {
    return null; // No mostrar si no hay cancelaciones
  }

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-50 border-green-200';
      case 'yellow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'orange': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'red': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(status.color)} ${className}`}>
      {/* Header con estado */}
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4" />
        <h3 className="font-semibold text-sm">Historial de Cancelaciones</h3>
        {cancellationInfo.shouldProcessMoney && (
          <div className="flex items-center gap-1 ml-auto">
            <DollarSign className="w-3 h-3" />
            <span className="text-xs font-medium">Dinero procesado</span>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="mb-3">
        <p className="text-sm font-medium">{status.message}</p>
        <p className="text-xs text-gray-600 mt-1">{cancellationInfo.cancellationSummary}</p>
      </div>

      {/* Detalles si se solicitan */}
      {showDetails && (
        <div className="space-y-2">
          {/* Cancelaciones del cliente */}
          {cancellationInfo.hasClientCancelled && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Cliente:</span>
                <span className="font-medium">{cancellationInfo.clientCancellationCount} vez(es)</span>
              </div>
              {cancellationInfo.lastClientCancellationAt && (
                <span className="text-gray-500">
                  {formatCancellationDate(cancellationInfo.lastClientCancellationAt)}
                </span>
              )}
            </div>
          )}

          {/* Cancelaciones del experto */}
          {cancellationInfo.hasExpertCancelled && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>Experto:</span>
                <span className="font-medium">{cancellationInfo.expertCancellationCount} vez(es)</span>
              </div>
              {cancellationInfo.lastExpertCancellationAt && (
                <span className="text-gray-500">
                  {formatCancellationDate(cancellationInfo.lastExpertCancellationAt)}
                </span>
              )}
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-current border-opacity-20">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="font-medium">Total:</span>
              <span className="font-bold">{cancellationInfo.totalCancellations} cancelación(es)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente compacto para mostrar solo el resumen
export const CancellationSummary: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  const cancellationInfo = useCancellationInfo(appointment);
  const status = getCancellationStatus(cancellationInfo);

  if (cancellationInfo.totalCancellations === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <AlertTriangle className="w-3 h-3" />
      <span className="font-medium">{cancellationInfo.cancellationSummary}</span>
      {cancellationInfo.shouldProcessMoney && (
        <div className="flex items-center gap-1 text-orange-600">
          <DollarSign className="w-3 h-3" />
          <span>Dinero procesado</span>
        </div>
      )}
    </div>
  );
};
