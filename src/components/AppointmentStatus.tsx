import React, { useMemo } from 'react';
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle, XCircle, Timer, Home, Phone, FileText, MessageCircle, RefreshCw, Globe } from 'lucide-react';
import { Appointment } from '../types/appointment';
import { 
  useAppointmentTimers, 
  useAppointmentLock
} from '../hooks/useAppointments';
import { 
  useAppointmentStatuses, 
  getAppointmentStatusText, 
  getAppointmentStatusColor, 
  getAppointmentStatusIcon 
} from '../hooks/useAppointmentStatuses';
import { 
  useMoneyDistributionConfig, 
  calculateMoneyDistribution,
  shouldShowMoneyDistribution 
} from '../hooks/useMoneyDistributionConfig';
import { useExpertReport } from '../hooks/useExpertReport';
import { CancellationInfoCard } from './CancellationInfoCard';
import { AccountDeletionInfo } from './AccountDeletionInfo';
import { formatAppointmentForDisplay, getStoredTimezone } from '../utils/dateService';
import { formatPriceNumber } from '../utils/priceUtils';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatTimezoneFriendly } from '../utils/timezoneFormat';

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

  // Round 24: helper para mostrar importes en EUR (charge currency) + conversion a preferred.
  const { formatPriceWithSource, preferredCurrency } = useCurrency();
  const chargeCurrency = (appointment as any).chargeCurrency || (appointment as any).sourceCurrency || 'EUR';
  const renderMoney = (eurAmount: number, classNamePrimary?: string, classNameSource?: string) => {
    const info = formatPriceWithSource(eurAmount, chargeCurrency, preferredCurrency);
    if (!info.wasConverted) {
      return <span className={classNamePrimary}>{info.display}</span>;
    }
    return (
      <span className={classNamePrimary}>
        ≈ {info.converted}
        <span className={classNameSource ?? 'ml-1 text-xs text-gray-500'}>({info.sourceFormatted})</span>
      </span>
    );
  };
  
  // ✅ USAR HOOKS DINÁMICOS
  const { data: statuses } = useAppointmentStatuses();
  const { data: moneyConfig } = useMoneyDistributionConfig(
    appointment.status,
    undefined, // categoryId no está disponible en Appointment
    undefined  // serviceTypeCategoryId no está disponible en Appointment
  );
  
  const moneyDistribution = moneyConfig 
    ? calculateMoneyDistribution(appointment.amount, moneyConfig)
    : { client: 0, expert: 0, platform: 0 };
  
  
  const statusText = statuses ? getAppointmentStatusText(appointment.status, statuses) : appointment.status;
  const statusColor = statuses ? getAppointmentStatusColor(appointment.status, statuses) : 'gray';

  // Hook para manejar el envío de reportes
  const { isSubmitting } = useExpertReport();

  const getStatusIcon = (status: string) => {
    if (!statuses) return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    
    const iconName = getAppointmentStatusIcon(status, statuses);
    
    switch (iconName) {
      case 'check-circle':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'x-circle':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-purple-600" />;
      case 'calendar':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const actionButtons = useMemo(() => {
    const buttons = [];

    // 🧟 LEGACY (2026-06-19): flujo antiguo proponer/aceptar/rechazar RETIRADO (endpoints /api/Appointment/propose|confirm|reject en #if false).
    // Los estados que activaban estos botones (awaiting_appointment / appointment_proposed) ya NO los produce el flujo Calendly,
    // así que nunca se renderizaban; se desactivan con `false &&` para dejar el flujo antiguo 100% inerte también en frontend.
    // Botón para proponer cita (solo clientes) - NO mostrar si ya hay sección específica para rechazada
    if (false && userRole === 'client' && ['awaiting_appointment', 'appointment_cancelled_by_client'].includes(appointment.status) && !isLocked) {
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

    // 🧟 LEGACY (2026-06-19): confirmar propuesta — flujo retirado (#if false), estado appointment_proposed ya no se produce. Desactivado.
    if (false && userRole === 'expert' && appointment.status === 'appointment_proposed' && !isLocked) {
      buttons.push(
        <button
          key="confirm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[AppointmentStatus] Confirm button clicked!', { appointmentId: appointment.id, userRole, status: appointment.status });
            onAction('confirm', appointment);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
        >
          Confirmar
        </button>
      );
    }

    // 🧟 LEGACY (2026-06-19): rechazar propuesta — flujo retirado (#if false), estado appointment_proposed ya no se produce. Desactivado.
    if (false && userRole === 'expert' && appointment.status === 'appointment_proposed' && !isLocked) {
      buttons.push(
        <button
          key="reject"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAction('reject', appointment);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          Rechazar
        </button>
      );
    }

    // Botón para cancelar (clientes)
    if (appointment.status === 'appointment_confirmed' && !isLocked && userRole === 'client') {
      buttons.push(
        <div key="cancel-section" className="flex flex-col space-y-3">
          <button
            onClick={() => onAction('cancel', appointment)}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            Cancelar Cita
          </button>
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 max-w-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
              <div className="text-xs text-orange-800">
                <p className="font-medium mb-2">Política de cancelación:</p>
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">1ª cancelación:</span> Dinero retenido (puedes reprogramar)
                  </p>
                  <p>
                    <span className="font-medium">2ª cancelación:</span> 90% reembolso, 8% experto, 2% plataforma
                  </p>
                </div>
                {appointment.cancellationCount > 0 && (
                  <div className="mt-2 p-2 bg-orange-100 rounded border border-orange-300">
                    <p className="font-medium text-orange-900">
                      Cancelaciones realizadas: {appointment.cancellationCount} de 2 máximo
                    </p>
                    {appointment.cancellationCount === 1 ? (
                      <p className="text-orange-800">
                        ⚠️ Próxima cancelación: Recibirás 90% de reembolso
                      </p>
                    ) : (
                      <p className="text-orange-800">
                        ✅ Has usado tu cancelación gratuita
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Botón para cancelar (expertos)
    if (appointment.status === 'appointment_confirmed' && !isLocked && userRole === 'expert') {
      buttons.push(
        <button
          key="cancel"
          onClick={() => onAction('cancel', appointment)}
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
        >
          Cancelar Cita
        </button>
      );
    }

    // Botón para enviar reporte (expertos)
    if (appointment.status === 'appointment_awaiting_report' && userRole === 'expert') {
      buttons.push(
        <button
          key="submit-report"
          onClick={() => onAction('submit-report', appointment)}
          disabled={isSubmitting}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enviando...
            </>
          ) : (
            'Enviar Reporte'
          )}
        </button>
      );
    }

    return buttons;
  }, [userRole, appointment.status, isLocked, appointment.id, onAction, isSubmitting]);


  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Header con estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon(appointment.status)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cita #{appointment.id}</h3>
            {/* 🛡️ Round 15 — R10 FIX: Tailwind JIT PURGA clases dinámicas tipo
                `bg-${statusColor}-100` (no las encuentra en el scan estático del fuente)
                → el badge se renderizaba SIN fondo ni color. Mapeo estático garantiza
                que las clases existan en el bundle final. */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColor === 'green' ? 'bg-green-100 text-green-800' :
                statusColor === 'red' ? 'bg-red-100 text-red-800' :
                statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                statusColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                statusColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                statusColor === 'amber' ? 'bg-amber-100 text-amber-800' :
                statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                statusColor === 'rose' ? 'bg-rose-100 text-rose-800' :
                'bg-gray-100 text-gray-800'
            }`}>
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

      {/* Mensaje específico para esperando reporte del experto - VISTA EXPERTO */}
      {appointment.status === 'appointment_awaiting_report' && userRole === 'expert' && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-purple-800 mb-2">
                Envía el reporte del trabajo realizado
              </h4>
              <p className="text-sm text-purple-700 mb-3">
                Tienes 24 horas para subir los archivos requeridos y enviar el reporte. Una vez enviado, el cliente tendrá 24 horas para aprobar o rechazar el trabajo.
              </p>
              <div className="text-xs text-purple-600">
                💡 Asegúrate de subir todos los archivos requeridos antes de enviar el reporte.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje específico para esperando reporte del experto - VISTA CLIENTE */}
      {appointment.status === 'appointment_awaiting_report' && userRole === 'client' && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-purple-800 mb-2">
                Esperando reporte del experto
              </h4>
              <p className="text-sm text-purple-700 mb-3">
                El experto tiene 24 horas para enviar el reporte del trabajo realizado. Una vez enviado, tendrás 24 horas para aprobar o rechazar el trabajo.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => onAction('chat', appointment)}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contactar por Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje específico para cita completada - VISTA EXPERTO */}
      {(appointment.status === 'appointment_report_sent' || appointment.status === 'appointment_completed_without_client_approval') && userRole === 'expert' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800 mb-2">
                ¡Cita completada exitosamente!
              </h4>
              <p className="text-sm text-green-700 mb-3">
                Has completado tu trabajo y enviado el reporte. Ahora el cliente tiene 24 horas para revisar y aprobar o rechazar el trabajo.
              </p>
              <div className="text-xs text-green-600">
                💡 El cliente puede aprobar el trabajo, rechazarlo, o iniciar una disputa si no está conforme.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje específico para cita completada - VISTA CLIENTE */}
      {(appointment.status === 'appointment_report_sent' || appointment.status === 'appointment_completed_without_client_approval') && userRole === 'client' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800 mb-2">
                ¡El experto completó su trabajo!
              </h4>
              <p className="text-sm text-green-700">
                El experto ha enviado el reporte del trabajo realizado. Tienes 24 horas para revisar y aprobar o rechazar el trabajo.
              </p>
            </div>
          </div>
        </div>
      )}


      {/* 🧟 LEGACY (2026-06-19): bloque "cita rechazada por el experto" + botón "Proponer Nueva Cita" del flujo
          antiguo de propuesta (retirado, endpoints en #if false). El estado appointment_rejected ya no se produce
          en el flujo Calendly; se desactiva con `false &&` (nunca se renderizaba). */}
      {false && appointment.status === 'appointment_rejected' && userRole === 'client' && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-orange-800 mb-2">
                Cita rechazada por el experto
              </h4>
              <p className="text-sm text-orange-700 mb-3">
                El experto no pudo aceptar esta cita. Puedes proponer una nueva fecha y hora, o comunicarte con él para coordinar mejor.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => onAction('propose', appointment)}
                  className="inline-flex items-center px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Proponer Nueva Cita
                </button>
                <button
                  onClick={() => onAction('chat', appointment)}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contactar por Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje específico para cancelado por no enviar reporte */}
      {appointment.status === 'appointment_cancelled_by_no_report' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                {userRole === 'expert' ? 'Servicio cancelado - No enviaste el reporte' : 'Servicio cancelado - Experto no envió reporte'}
              </h4>
              <div className="space-y-2 text-sm text-red-700">
                <p>
                  <strong>Razón:</strong> El experto no envió el reporte en el tiempo establecido (24 horas)
                </p>
                {userRole === 'client' && (
                  <p>
                    <strong>Reembolso:</strong> Recibirás el 100% del dinero de vuelta
                  </p>
                )}
                {userRole === 'expert' && (
                  <p>
                    <strong>Consecuencia:</strong> No recibirás pago por este servicio
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje específico para servicio cancelado por rechazos del experto */}
      {appointment.status === 'appointment_cancelled_by_expert_rejection' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                {userRole === 'expert' ? 'Servicio cancelado por rechazos' : 'Servicio cancelado - Experto rechazó 2 veces'}
              </h4>
              <div className="space-y-2 text-sm text-red-700">
                <p>
                  <strong>Rechazos realizados:</strong> {appointment.rejectionCount} de 2 máximo
                </p>
                <p>
                  <strong>Estado:</strong> El servicio ha sido cancelado automáticamente
                </p>
                {userRole === 'client' && (
                  <p>
                    <strong>Reembolso:</strong> Recibirás el 100% del dinero de vuelta
                  </p>
                )}
                {appointment.lastRejectionAt && (
                  <p className="text-xs text-red-600">
                    {/* 🛡️ N28: timeZoneName:short añade abreviatura (CET/EST/etc.) para que
                        clientes en otras zonas vean el contexto sin confundirse con su hora local. */}
                    Último rechazo: {new Date(appointment.lastRejectionAt).toLocaleString('es-ES', { timeZoneName: 'short' })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información para el experto sobre cancelaciones del cliente */}
      {appointment.status === 'appointment_confirmed' && userRole === 'expert' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Información sobre cancelaciones del cliente
              </h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p>
                  <strong>El cliente puede cancelar esta cita:</strong>
                </p>
                <div className="ml-4 space-y-1">
                  <p>
                    • <strong>1ª cancelación:</strong> Dinero retenido (puede reprogramar en 24h) - Tú recibes 0%
                  </p>
                  <p>
                    • <strong>2ª cancelación:</strong> Cliente recibe 90%, tú recibes 8%, plataforma 2%
                  </p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  ⚠️ <strong>Restricción:</strong> El cliente NO puede cancelar menos de 12 horas antes de la cita
                </p>
                {appointment.cancellationCount > 0 && (
                  <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                    <p className="font-medium text-blue-900 text-xs">
                      Cancelaciones del cliente: {appointment.cancellationCount} de 2 máximo
                    </p>
                    {appointment.cancellationCount === 1 ? (
                      <div className="space-y-1">
                        <p className="text-blue-800 text-xs">
                          ⚠️ Si cancela otra vez: Recibirás 8% del dinero
                        </p>
                        <p className="text-blue-800 text-xs">
                          ⏰ Cliente tiene 24h para reprogramar la cita
                        </p>
                      </div>
                    ) : (
                      <p className="text-blue-800 text-xs">
                        ✅ Cliente ha usado su cancelación gratuita
                      </p>
                    )}
                  </div>
                )}
                <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-300">
                  <p className="font-medium text-blue-900 text-xs mb-2">
                    <strong>Si tú cancelas la cita:</strong>
                  </p>
                  <p className="text-blue-800 text-xs">
                    • Cliente recibe 90% de reembolso
                  </p>
                  <p className="text-blue-800 text-xs">
                    • Tú recibes 8% del dinero
                  </p>
                  <p className="text-blue-800 text-xs">
                    • Plataforma recibe 2%
                  </p>
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                  <p className="font-medium text-blue-900 text-xs mb-1">
                    <strong>Si el cliente no reprograma en 24h:</strong>
                  </p>
                  <p className="text-blue-800 text-xs">
                    • Servicio cancelado automáticamente
                  </p>
                  <p className="text-blue-800 text-xs">
                    • Cliente recibe 90%, tú recibes 8%, plataforma 2%
                  </p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 El cliente tiene 2 oportunidades de cancelación. Después de la segunda, el servicio se cancela definitivamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Mensaje específico para cita rechazada por el experto - VISTA EXPERTO */}
      {appointment.status === 'appointment_rejected' && userRole === 'expert' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Has rechazado esta cita
              </h4>
              <div className="space-y-2 text-sm text-red-700">
                <p>
                  <strong>Rechazos realizados:</strong> {appointment.rejectionCount} de 2 máximo
                </p>
                <p>
                  <strong>Rechazos restantes:</strong> {Math.max(0, 2 - appointment.rejectionCount)}
                </p>
                {appointment.rejectionCount >= 2 ? (
                  <div className="p-2 bg-red-100 rounded border border-red-300">
                    <p className="font-medium text-red-800">
                      ⚠️ Has alcanzado el límite de rechazos. El servicio se ha cancelado automáticamente.
                    </p>
                  </div>
                ) : (
                  <p>
                    <strong>Próximo rechazo:</strong> Cancelará automáticamente el servicio
                  </p>
                )}
                <p>
                  <strong>Tiempo del cliente:</strong> Tiene 48 horas para proponer una nueva cita
                </p>
                {appointment.lastRejectionAt && (
                  <p className="text-xs text-red-600">
                    Rechazado el: {new Date(appointment.lastRejectionAt).toLocaleString('es-ES')}
                  </p>
                )}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => onAction('chat', appointment)}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contactar al Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de la cita */}
      {/* ✅ INTERNACIONALIZACIÓN: Usar formatAppointmentForDisplay para fechas */}
      {/* ✅ CORRECTO: formatAppointmentForDisplay usa proposedDateLocal/proposedTimeLocal automáticamente */}
      {(() => {
        const formattedDate = formatAppointmentForDisplay(appointment);
        // ✅ CORRECTO: Usar timezone del appointment (del experto), no del navegador del usuario
        const appointmentTimezone = appointment.timezone || appointment.userTimezone || 'UTC';

        // 🛡️ Round 25 — TZ inline disclosure:
        // El campo `proposedTimeLocal` representa la hora EN LA ZONA DEL PROPONENTE
        // (el experto). Si el cliente está mirando esto desde otro timezone, la cifra
        // "10:00" puede leerse como 10:00 de su propia zona — error caro (puede
        // perder la cita o llegar 8h tarde). Mostramos la etiqueta inline solo cuando
        // las zonas difieren para no añadir ruido al caso común.
        let viewerTz = 'UTC';
        try {
          viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone || getStoredTimezone() || 'UTC';
        } catch {
          viewerTz = getStoredTimezone() || 'UTC';
        }
        const tzDiffers = appointmentTimezone && viewerTz && appointmentTimezone !== viewerTz;
        // 🛡️ Round 27 — R27-T27-1-9 FIX: pasar la fecha del appointment para que el offset
        // refleje el DST correcto de la fecha real (no del momento de renderizado). Cross-DST
        // (cita en noviembre vista desde agosto) mostraba "(UTC+2)" en lugar del correcto
        // "(UTC+1)" para Madrid → cliente ±1h off. `proposedDate` viene del backend; si está
        // ausente o no parsea, formatTimezoneFriendly cae a new Date() (back-compat).
        const friendlyTzLabel = formatTimezoneFriendly(
          appointmentTimezone,
          appointment.proposedDate ?? appointment.proposedDateLocal ?? null,
        );
        // Para el inline al lado de la hora queremos solo la ciudad, sin "(UTC±X)" repetido.
        const friendlyCityOnly = friendlyTzLabel.replace(/\s*\([^)]*\)\s*$/, '');

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm capitalize">
                  {formattedDate.fullDateTime}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {formattedDate.time}
                  {tzDiffers && friendlyCityOnly && (
                    <span className="ml-1 text-xs text-orange-700 font-medium">
                      (hora de {friendlyCityOnly})
                    </span>
                  )}
                </span>
              </div>

              {/* ✅ Mostrar zona horaria del experto (no del navegador del usuario) */}
              <div className="flex items-center space-x-2 text-gray-500 text-xs">
                <Globe className="w-3 h-3" />
                <span>Zona horaria: {friendlyTzLabel || appointmentTimezone}</span>
              </div>
              
              <div className="flex items-start space-x-2 text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span className="text-sm">{appointment.location}</span>
              </div>
              
              {appointment.doorNumber && (
                <div className="flex items-start space-x-2 text-gray-600">
                  <Home className="w-4 h-4 mt-0.5" />
                  <span className="text-sm">{appointment.doorNumber}</span>
                </div>
              )}
              
              {appointment.ownerPhone && (
                <div className="flex items-start space-x-2 text-gray-600">
                  <Phone className="w-4 h-4 mt-0.5" />
                  <span className="text-sm">{appointment.ownerPhone}</span>
                </div>
              )}
              
              {appointment.siteDetails && (
                <div className="flex items-start space-x-2 text-gray-600">
                  <FileText className="w-4 h-4 mt-0.5" />
                  <span className="text-sm">{appointment.siteDetails}</span>
                </div>
              )}
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
            <span className="ml-2 font-medium text-green-600">
              {renderMoney(Number(appointment.amount) || 0)}
            </span>
          </div>
        </div>
          </div>
        );
      })()}

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
              {activeTimer.timerType === 'expert_report' && 'Tiempo para enviar reporte:'}
            </span>
            <span className="text-sm font-bold text-blue-900">
              {formatTimeRemaining(timeRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Distribución de dinero */}
      {shouldShowMoneyDistribution(moneyConfig) && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Distribución del Dinero
          </h4>
          <div className="space-y-3">
            {moneyDistribution.client > 0 && (
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-md border border-green-200">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm font-medium text-green-800">Cliente (reembolso)</span>
                </div>
                <span className="text-sm font-bold text-green-700">
                  {renderMoney(moneyDistribution.client, undefined, 'ml-1 text-xs text-green-600')}
                </span>
              </div>
            )}
            {moneyDistribution.expert > 0 && (
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-sm font-medium text-blue-800">Experto</span>
                </div>
                <span className="text-sm font-bold text-blue-700">
                  {renderMoney(moneyDistribution.expert, undefined, 'ml-1 text-xs text-blue-600')}
                </span>
              </div>
            )}
            {moneyDistribution.platform > 0 && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  <span className="text-sm font-medium text-gray-800">Plataforma</span>
                </div>
                <span className="text-sm font-bold text-gray-700">
                  {renderMoney(moneyDistribution.platform, undefined, 'ml-1 text-xs text-gray-500')}
                </span>
              </div>
            )}
          </div>
          
          {/* Información contextual */}
          <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
            <p className="text-xs text-gray-600">
              {(appointment.status === 'appointment_report_sent' || appointment.status === 'appointment_completed_without_client_approval') ? (
                <>✅ Servicio completado exitosamente</>
              ) : appointment.status === 'appointment_cancelled_by_expert_rejection' ? (
                <>⚠️ Cancelación por rechazos del experto - Cliente recibe reembolso completo</>
              ) : (
                <>ℹ️ Cancelación del servicio - Distribución según términos y condiciones</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      {actionButtons.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {actionButtons}
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

      {/* 🆕 Información de cancelaciones separadas */}
      <CancellationInfoCard appointment={appointment} />

      {/* 🆕 Información de eliminación de cuenta */}
      <AccountDeletionInfo appointment={appointment} />
    </div>
  );
};

export default AppointmentStatus;

