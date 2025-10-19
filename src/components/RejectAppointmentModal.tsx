import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { Appointment } from '../types/appointment';

interface RejectAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  appointment: Appointment | null;
  isLoading?: boolean;
}

const RejectAppointmentModal: React.FC<RejectAppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Por favor, proporciona una razón para el rechazo');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Rechazar Cita
              </h3>
              <p className="text-sm text-gray-500">
                Cita #{appointment?.id}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Información de la cita */}
          {appointment && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Detalles de la cita
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Fecha:</strong> {new Date(appointment.proposedDate).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p>
                  <strong>Hora:</strong> {appointment.proposedTime.substring(0, 5)}
                </p>
                <p>
                  <strong>Ubicación:</strong> {appointment.location}
                </p>
                {appointment.doorNumber && (
                  <p>
                    <strong>Puerta:</strong> {appointment.doorNumber}
                  </p>
                )}
                {appointment.ownerPhone && (
                  <p>
                    <strong>Teléfono:</strong> {appointment.ownerPhone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Advertencia sobre rechazos */}
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-800 mb-1">
                  Rechazos realizados: {appointment?.rejectionCount || 0} de 2 máximo
                </p>
                <p className="text-orange-700">
                  {appointment && appointment.rejectionCount >= 1 ? (
                    <>
                      <strong>⚠️ Último rechazo:</strong> Si rechazas esta cita, el servicio se cancelará automáticamente y el cliente recibirá el reembolso completo.
                    </>
                  ) : (
                    <>
                      Si rechazas esta cita, el cliente podrá proponer una nueva fecha y hora.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Razón del rechazo *
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explica por qué no puedes aceptar esta cita (mínimo 10 caracteres)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                disabled={isLoading}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
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
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !reason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Rechazando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Rechazar Cita</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RejectAppointmentModal;





















