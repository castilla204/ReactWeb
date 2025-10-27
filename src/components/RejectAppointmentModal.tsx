import React, { useState } from 'react';
import { X, AlertTriangle, Send, Calendar, Clock, MapPin, Phone, DoorOpen, User } from 'lucide-react';
import { Appointment } from '../types/appointment';

interface RejectAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  appointment: Appointment | null;
  isLoading?: boolean;
  actionType?: 'reject' | 'cancel'; // Nuevo prop para distinguir entre rechazo y cancelación
  userRole?: 'client' | 'expert'; // Nuevo prop para distinguir entre cliente y experto
}

const RejectAppointmentModal: React.FC<RejectAppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  isLoading = false,
  actionType = 'reject',
  userRole = 'client'
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError(`Por favor, proporciona una razón para la ${actionType === 'cancel' ? 'cancelación' : 'rechazo'}`);
      return;
    }

    if (reason.trim().length < 10) {
      setError('La razón debe tener al menos 10 caracteres');
      return;
    }

    setError('');
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300" onClick={handleClose}></div>
        <div className="relative transform overflow-hidden rounded-t-lg bg-white text-left shadow-xl transition-all duration-500 ease-out translate-y-0 sm:my-8 sm:w-full sm:max-w-2xl sm:rounded-lg sm:translate-y-0 sm:duration-300 sm:ease-out"
             style={{
               animation: 'slideUpBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
             }}>
        {/* Swipe indicator - Mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-400 rounded-full shadow-sm"></div>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              {actionType === 'cancel' ? 'Cancelar Cita' : 'Rechazar Cita'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 pt-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {/* Información de la cita */}
          {appointment && (
            <div className="mb-2 sm:mb-6 p-2 sm:p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Detalles de la cita</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Fecha:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(appointment.proposedDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Hora:</span>
                  <span className="ml-2 text-gray-900">{appointment.proposedTime.substring(0, 5)}</span>
                </div>
                <div className="lg:col-span-2">
                  <span className="text-gray-500">Ubicación:</span>
                  <span className="ml-2 text-gray-900">{appointment.location}</span>
                </div>
                {appointment.doorNumber && (
                  <div>
                    <span className="text-gray-500">Puerta:</span>
                    <span className="ml-2 text-gray-900">{appointment.doorNumber}</span>
                  </div>
                )}
                {appointment.ownerPhone && (
                  <div>
                    <span className="text-gray-500">Teléfono:</span>
                    <span className="ml-2 text-gray-900">{appointment.ownerPhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advertencia sobre rechazos/cancelaciones */}
          <div className="mb-2 sm:mb-6 text-sm">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <p className="font-semibold text-amber-700">
                {actionType === 'cancel' ? 'Cancelaciones' : 'Rechazos'} realizadas: {actionType === 'cancel' ? (userRole === 'client' ? (appointment?.clientCancellationCount || 0) : (appointment?.expertCancellationCount || 0)) : (appointment?.rejectionCount || 0)} de 2 máximo
              </p>
            </div>
            <p className="text-amber-600 leading-relaxed">
              {actionType === 'cancel' ? (
                userRole === 'client' ? (
                  appointment && (appointment.clientCancellationCount || 0) >= 1 ? (
                    <>
                      <strong className="text-amber-800">⚠️ Última cancelación:</strong> Si cancelas esta cita, el servicio se cancelará definitivamente y se aplicarán las políticas de reembolso correspondientes.
                    </>
                  ) : (
                    <>Si cancelas esta cita, podrás proponer una nueva fecha y hora.</>
                  )
                ) : (
                  appointment && (appointment.expertCancellationCount || 0) >= 1 ? (
                    <>
                      <strong className="text-amber-800">⚠️ Última cancelación:</strong> Si cancelas esta cita, el servicio se cancelará definitivamente y se aplicarán las políticas de reembolso correspondientes.
                    </>
                  ) : (
                    <>Si cancelas esta cita, podrás proponer una nueva fecha y hora.</>
                  )
                )
              ) : (
                appointment && appointment.rejectionCount >= 1 ? (
                  <>
                    <strong className="text-amber-800">⚠️ Último rechazo:</strong> Si rechazas esta cita, el servicio se cancelará automáticamente y el cliente recibirá el reembolso completo.
                  </>
                ) : (
                  <>Si rechazas esta cita, el cliente podrá proponer una nueva fecha y hora.</>
                )
              )}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-6">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-3">
                Razón de la {actionType === 'cancel' ? 'cancelación' : 'rechazo'} *
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={actionType === 'cancel' 
                  ? "Explica por qué necesitas cancelar esta cita (mínimo 10 caracteres)..."
                  : "Explica por qué no puedes aceptar esta cita (mínimo 10 caracteres)..."
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-300 resize-none"
                rows={2}
                disabled={isLoading}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {reason.length}/500 caracteres
                </span>
                {error && (
                  <span className="text-xs text-red-600">
                    {error}
                  </span>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !reason.trim()}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{actionType === 'cancel' ? 'Cancelando...' : 'Rechazando...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{actionType === 'cancel' ? 'Cancelar Cita' : 'Rechazar Cita'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

// CSS Animation for mobile swipe up effect
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUpBounce {
    0% {
      transform: translateY(100%);
      opacity: 0;
    }
    60% {
      transform: translateY(-10px);
      opacity: 1;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
if (!document.head.querySelector('style[data-modal-animation]')) {
  style.setAttribute('data-modal-animation', 'true');
  document.head.appendChild(style);
}

export default RejectAppointmentModal;
























