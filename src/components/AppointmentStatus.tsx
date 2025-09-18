import React from 'react';
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle, XCircle, Timer } from 'lucide-react';
import { Appointment } from '../types/appointment';
import { 
  useAppointmentTimers, 
  useAppointmentLock, 
  getAppointmentStatusText, 
  getAppointmentStatusColor,
  calculateMoneyDistribution 
} from '../hooks/useAppointments';

interface AppointmentStatusProps {
  appointment: Appointment;
  userRole: 'client' | 'expert';
  onAction: (action: string, data: any) => void;
}

const AppointmentStatus: React.FC<AppointmentStatusProps> = ({ 
  appointment, 
  userRole, 
  onAction 
}) => {
  const isLocked = useAppointmentLock(appointment);
  const { activeTimer, timeRemaining, formatTimeRemaining } = useAppointmentTimers(appointment);
  const moneyDistribution = calculateMoneyDistribution(appointment);
  
  const statusText = getAppointmentStatusText(appointment.status);
  const statusColor = getAppointmentStatusColor(appointment.status);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'appointment_completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'appointment_cancelled_by_client':
      case 'appointment_cancelled_by_client_second':
      case 'appointment_cancelled_by_expert':
      case 'appointment_cancelled_by_no_response':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'appointment_rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getActionButtons = () => {
    const buttons = [];

    // Botón para proponer cita (solo clientes)
    if (userRole === 'client' && ['awaiting_appointment', 'appointment_rejected', 'appointment_cancelled_by_client'].includes(appointment.status) && !isLocked) {
      buttons.push(
        <button
          key="propose"
          onClick={() => onAction('propose', appointment)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          Proponer Cita
        </button>
      );
    }

    // Botón para confirmar (solo expertos)
    if (userRole === 'expert' && appointment.status === 'appointment_proposed' && !isLocked) {
      buttons.push(
        <button
          key="confirm"
          onClick={() => onAction('confirm', appointment)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
        >
          Confirmar
        </button>
      );
    }

    // Botón para rechazar (solo expertos)
    if (userRole === 'expert' && appointment.status === 'appointment_proposed' && !isLocked) {
      buttons.push(
        <button
          key="reject"
          onClick={() => onAction('reject', appointment)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          Rechazar
        </button>
      );
    }

    // Botón para cancelar
    if (appointment.status === 'appointment_confirmed' && !isLocked) {
      buttons.push(
        <button
          key="cancel"
          onClick={() => onAction('cancel', appointment)}
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm"
        >
          Cancelar
        </button>
      );
    }

    // Botón para marcar como completada
    if (appointment.status === 'appointment_confirmed') {
      buttons.push(
        <button
          key="markCompleted"
          onClick={() => onAction('markCompleted', appointment)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
        >
          Marcar Completada
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Header con estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon(appointment.status)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cita #{appointment.id}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
              {statusText}
            </span>
          </div>
        </div>
        
        {isLocked && (
          <div className="flex items-center text-orange-600 text-sm">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Bloqueada
          </div>
        )}
      </div>

      {/* Información de la cita */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {new Date(appointment.proposedDate).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {appointment.proposedTime.substring(0, 5)}
            </span>
          </div>
          
          <div className="flex items-start space-x-2 text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5" />
            <span className="text-sm">{appointment.location}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm">
            <span className="text-gray-500">Cliente:</span>
            <span className="ml-2 font-medium">{appointment.clientName}</span>
          </div>
          
          <div className="text-sm">
            <span className="text-gray-500">Experto:</span>
            <span className="ml-2 font-medium">{appointment.expertName}</span>
          </div>
          
          <div className="text-sm">
            <span className="text-gray-500">Monto:</span>
            <span className="ml-2 font-medium text-green-600">€{appointment.amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Timer activo */}
      {activeTimer && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {activeTimer.timerType === 'proposal' && 'Tiempo para proponer cita:'}
              {activeTimer.timerType === 'response' && 'Tiempo para responder:'}
              {activeTimer.timerType === 'reprogram' && 'Tiempo para reprogramar:'}
              {activeTimer.timerType === 'auto_awaiting_client_decision' && 'Tiempo hasta cambio automático:'}
            </span>
            <span className="text-sm font-bold text-blue-900">
              {formatTimeRemaining(timeRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Distribución de dinero */}
      {appointment.status !== 'awaiting_appointment' && (
        <div className="bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Distribución del Dinero</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-500">Cliente</div>
              <div className="font-medium">€{moneyDistribution.client.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Experto</div>
              <div className="font-medium">€{moneyDistribution.expert.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Plataforma</div>
              <div className="font-medium">€{moneyDistribution.platform.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      {getActionButtons().length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {getActionButtons()}
        </div>
      )}

      {/* Información adicional */}
      {(appointment.rejectionCount > 0 || appointment.cancellationCount > 0) && (
        <div className="text-xs text-gray-500 space-y-1">
          {appointment.rejectionCount > 0 && (
            <div>Rechazos: {appointment.rejectionCount}</div>
          )}
          {appointment.cancellationCount > 0 && (
            <div>Cancelaciones: {appointment.cancellationCount}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentStatus;
