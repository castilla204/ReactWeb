import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import {
  Appointment,
  ProposeAppointmentDto,
  ConfirmAppointmentDto,
  RejectAppointmentDto,
  CancelAppointmentDto,
  SubmitExpertReportDto,
  AppointmentActions,
  MoneyDistribution
} from '../types/appointment';

/**
 * Hook para manejar el sistema de citas
 * Incluye todas las operaciones CRUD y lógica de negocio
 */
export const useAppointments = () => {
  const { fetchApi } = useApi();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Queries
  // ❌ ELIMINADO: myAppointmentsQuery - No se usa, los datos vienen del endpoint optimizado
  // const myAppointmentsQuery = useQuery({
  //   queryKey: ['appointments', 'my'],
  //   queryFn: () => fetchApi<Appointment[]>(API_CONFIG.endpoints.appointment.myAppointments),
  // });

  const getAppointment = (id: number) =>
    useQuery({
      queryKey: ['appointment', id],
      queryFn: () => fetchApi<Appointment>(API_CONFIG.endpoints.appointment.get(id)),
    });

  const getAppointmentBySearchHire = (searchHireId: number) =>
    useQuery({
      queryKey: ['appointment', 'search-hire', searchHireId],
      queryFn: () => fetchApi<Appointment>(API_CONFIG.endpoints.appointment.getBySearchHire(searchHireId)),
    });

  // Función para limpiar los datos antes de enviar
  const cleanAppointmentData = (data: ProposeAppointmentDto) => {
    // ✅ INTERNACIONALIZACIÓN: El backend usa automáticamente el timezone del experto
    // guardado en SearchHire.ExpertTimezone. NO es necesario enviar timezone.
    // Solo se envía si se proporciona explícitamente (para sobrescribir).
    
    const cleaned: any = {
      proposedDate: data.proposedDate,
      proposedTime: data.proposedTime,
      location: data.location
    };
    
    // ✅ OPCIONAL: Solo enviar timezone si se proporciona explícitamente
    if (data.timezone) {
      cleaned.timezone = data.timezone;
      console.log('[useAppointments] Timezone manual enviado:', data.timezone);
    } else {
      console.log('[useAppointments] Timezone no enviado - backend usará el del experto automáticamente');
    }
    
    // Solo incluir campos opcionales si tienen valores válidos
    if (data.latitude !== undefined && data.latitude !== null) {
      cleaned.latitude = data.latitude;
    }
    if (data.longitude !== undefined && data.longitude !== null) {
      cleaned.longitude = data.longitude;
    }
    if (data.doorNumber !== undefined && data.doorNumber !== null && data.doorNumber.trim() !== '') {
      cleaned.doorNumber = data.doorNumber.trim();
    }
    if (data.ownerPhone !== undefined && data.ownerPhone !== null && data.ownerPhone.trim() !== '') {
      cleaned.ownerPhone = data.ownerPhone.trim();
    }
    if (data.siteDetails !== undefined && data.siteDetails !== null && data.siteDetails.trim() !== '') {
      cleaned.siteDetails = data.siteDetails.trim();
    }
    
    return cleaned;
  };

  // Mutations
  const proposeAppointmentMutation = useMutation({
    mutationFn: ({ searchHireId, data }: { searchHireId: number; data: ProposeAppointmentDto }) => {
      const cleanedData = cleanAppointmentData(data);
      console.log('[useAppointments] Sending cleaned appointment data:', cleanedData);
      
      return fetchApi<Appointment>(API_CONFIG.endpoints.appointment.propose(searchHireId), {
        method: 'POST',
        body: JSON.stringify(cleanedData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
    },
    onError: (error: any) => {
      console.error('Error en useAppointments proposeAppointmentMutation:', error);
      
      // Manejar errores específicos del backend
      let errorMessage = 'Error al proponer cita';
      
      if (error && typeof error === 'object' && error.message) {
        // Verificar si es un error de rango de ubicación
        if (error.message.includes('fuera del rango') || 
            error.message.includes('Distancia:') || 
            error.message.includes('Rango máximo:')) {
          errorMessage = error.message;
        } else if (error.message.includes('24 horas') || error.message.includes('12 horas')) {
          errorMessage = 'La cita debe ser al menos 24 horas en el futuro';
        } else if (error.message.includes('fecha')) {
          errorMessage = 'La fecha seleccionada no es válida';
        } else if (error.message.includes('ubicación')) {
          errorMessage = 'Debes seleccionar una ubicación válida';
        } else if (error.message.includes('tiempo')) {
          errorMessage = 'El tiempo seleccionado no es válido';
        } else {
          // Usar el mensaje del servidor si está disponible
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    },
  });

  const confirmAppointmentMutation = useMutation({
    mutationFn: (data: ConfirmAppointmentDto) =>
      fetchApi<Appointment>(API_CONFIG.endpoints.appointment.confirm, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      console.log('[useAppointments] confirmAppointmentMutation onSuccess - Invalidating queries');
      // ✅ Invalidar queries de appointments
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
      // ✅ IMPORTANTE: Invalidar también searchDetailsComplete para que SearchDetails se actualice
      queryClient.invalidateQueries({ queryKey: ['searchDetailsComplete'] });
      queryClient.invalidateQueries({ queryKey: ['searchDetailsCompleteByHire'] });
      console.log('[useAppointments] Queries invalidated successfully');
    },
    onError: (error: any) => {
      console.error('[useAppointments] confirmAppointmentMutation error:', error);
      // Extraer el mensaje del backend si está disponible
      const errorMessage = error?.message || (error instanceof Error ? error.message : 'Error al confirmar cita');
      setError(errorMessage);
    },
  });

  const rejectAppointmentMutation = useMutation({
    mutationFn: (data: RejectAppointmentDto) =>
      fetchApi<Appointment>(API_CONFIG.endpoints.appointment.reject, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      console.log('[useAppointments] rejectAppointmentMutation onSuccess - Invalidating queries');
      // ✅ Invalidar queries de appointments
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
      // ✅ IMPORTANTE: Invalidar también searchDetailsComplete para que SearchDetails se actualice
      queryClient.invalidateQueries({ queryKey: ['searchDetailsComplete'] });
      queryClient.invalidateQueries({ queryKey: ['searchDetailsCompleteByHire'] });
      console.log('[useAppointments] Queries invalidated successfully');
    },
    onError: (error: any) => {
      console.error('[useAppointments] rejectAppointmentMutation error:', error);
      // Extraer el mensaje del backend si está disponible
      const errorMessage = error?.message || (error instanceof Error ? error.message : 'Error al rechazar cita');
      setError(errorMessage);
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: (data: CancelAppointmentDto) =>
      fetchApi<Appointment>(API_CONFIG.endpoints.appointment.cancel, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
    },
    onError: (error: any) => {
      // Extraer el mensaje del backend si está disponible
      const errorMessage = error?.message || (error instanceof Error ? error.message : 'Error al cancelar cita');
      setError(errorMessage);
    },
  });

  const submitExpertReportMutation = useMutation({
    mutationFn: ({ appointmentId, data }: { appointmentId: number; data: SubmitExpertReportDto }) =>
      fetchApi<Appointment>(API_CONFIG.endpoints.appointment.submitReport(appointmentId), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Error al enviar reporte');
    },
  });


  // Funciones de conveniencia
  const proposeAppointment = async (searchHireId: number, data: ProposeAppointmentDto) => {
    try {
      setError(null);
      return await proposeAppointmentMutation.mutateAsync({ searchHireId, data });
    } catch (err) {
      throw err;
    }
  };

  const confirmAppointment = async (data: ConfirmAppointmentDto) => {
    console.log('[useAppointments] confirmAppointment called with data:', data);
    try {
      setError(null);
      const result = await confirmAppointmentMutation.mutateAsync(data);
      console.log('[useAppointments] confirmAppointment success:', result);
      return result;
    } catch (err) {
      console.error('[useAppointments] confirmAppointment error:', err);
      throw err;
    }
  };

  const rejectAppointment = async (data: RejectAppointmentDto) => {
    try {
      setError(null);
      return await rejectAppointmentMutation.mutateAsync(data);
    } catch (err) {
      throw err;
    }
  };

  const cancelAppointment = async (data: CancelAppointmentDto) => {
    try {
      setError(null);
      return await cancelAppointmentMutation.mutateAsync(data);
    } catch (err) {
      throw err;
    }
  };

  const submitExpertReport = async (appointmentId: number, data: SubmitExpertReportDto) => {
    try {
      setError(null);
      return await submitExpertReportMutation.mutateAsync({ appointmentId, data });
    } catch (err) {
      throw err;
    }
  };


  return {
    // Queries
    // ❌ ELIMINADO: myAppointments - No se usa, los datos vienen del endpoint optimizado
    // myAppointments: myAppointmentsQuery,
    getAppointment,
    getAppointmentBySearchHire,
    
    // Mutations
    proposeAppointment,
    confirmAppointment,
    rejectAppointment,
    cancelAppointment,
    submitExpertReport,
    
    // Estados
    error,
    setError,
    
    // Estados de loading
    isProposing: proposeAppointmentMutation.isPending,
    isConfirming: confirmAppointmentMutation.isPending,
    isRejecting: rejectAppointmentMutation.isPending,
    isCancelling: cancelAppointmentMutation.isPending,
    isSubmittingReport: submitExpertReportMutation.isPending,
  };
};

/**
 * Hook para manejar timers de citas
 */
export const useAppointmentTimers = (appointment: Appointment | null) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!appointment?.timers) return;

    const activeTimer = appointment.timers.find(t => !t.isExpired && new Date(t.endTime) > new Date());
    
    if (activeTimer) {
      const updateTimeRemaining = () => {
        const remaining = Math.max(0, new Date(activeTimer.endTime).getTime() - Date.now());
        setTimeRemaining(remaining);
        setIsExpired(remaining === 0);
      };
      
      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 1000);
      
      return () => clearInterval(interval);
    } else {
      setTimeRemaining(0);
      setIsExpired(true);
    }
  }, [appointment?.timers]);

  const getActiveTimer = () => {
    if (!appointment?.timers) return null;
    return appointment.timers.find(t => !t.isExpired && new Date(t.endTime) > new Date());
  };

  const formatTimeRemaining = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return {
    activeTimer: getActiveTimer(),
    timeRemaining,
    isExpired,
    formatTimeRemaining,
  };
};

/**
 * Hook para verificar si una cita está bloqueada
 * ✅ INTERNACIONALIZACIÓN: Usa campos UTC para cálculos
 */
export const useAppointmentLock = (appointment: Appointment | null) => {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!appointment) {
      setIsLocked(false);
      return;
    }

    const checkLockStatus = () => {
      // Solo bloquear si la cita está confirmada y es menos de 12 horas antes
      if (appointment.status === 'appointment_confirmed') {
        // ✅ Usar campos UTC para cálculos de tiempo
        const dateStr = appointment.proposedDateUtc || appointment.proposedDate;
        const timeStr = appointment.proposedTimeUtc || appointment.proposedTime;
        const appointmentDateTime = new Date(`${dateStr}T${timeStr}Z`); // Z indica UTC
        const twelveHoursBefore = new Date(appointmentDateTime.getTime() - 12 * 60 * 60 * 1000);
        
        const newLockedStatus = new Date() >= twelveHoursBefore;
        setIsLocked(prev => prev !== newLockedStatus ? newLockedStatus : prev);
      } else {
        // Para citas propuestas, no bloquear nunca
        setIsLocked(false);
      }
    };
    
    checkLockStatus();
    const interval = setInterval(checkLockStatus, 60000); // Verificar cada minuto
    
    return () => clearInterval(interval);
  }, [appointment?.proposedDateUtc, appointment?.proposedTimeUtc, appointment?.proposedDate, appointment?.proposedTime, appointment?.status]);

  return isLocked;
};

/**
 * Utilidad para calcular si una cita está bloqueada (12 horas antes de la cita)
 * ✅ INTERNACIONALIZACIÓN: Usa campos UTC para cálculos
 */
const calculateIsLocked = (appointment: Appointment): boolean => {
  if (appointment.status !== 'appointment_confirmed') {
    return false;
  }
  
  try {
    // ✅ Usar campos UTC para cálculos de tiempo
    const dateStr = appointment.proposedDateUtc || appointment.proposedDate;
    const timeStr = appointment.proposedTimeUtc || appointment.proposedTime;
    const appointmentDateTime = new Date(`${dateStr}T${timeStr}Z`); // Z indica UTC
    const twelveHoursBefore = new Date(appointmentDateTime.getTime() - 12 * 60 * 60 * 1000);
    return new Date() >= twelveHoursBefore;
  } catch {
    return false;
  }
};

/**
 * Utilidad para obtener las acciones disponibles según el estado de la cita
 */
export const getAvailableActions = (
  appointment: Appointment | null, 
  userRole: 'client' | 'expert'
): AppointmentActions => {
  if (!appointment) {
    return {
      canPropose: false,
      canConfirm: false,
      canReject: false,
      canCancel: false,
      canMarkCompleted: false,
    };
  }

  const isLocked = calculateIsLocked(appointment);

  if (isLocked) {
    return {
      canPropose: false,
      canConfirm: appointment.status === "appointment_proposed",
      canReject: false,
      canCancel: false,
      canMarkCompleted: appointment.status === "appointment_confirmed",
    };
  }

  const baseActions = {
    canPropose: ["awaiting_appointment", "appointment_rejected", "appointment_cancelled_by_client"].includes(appointment.status),
    canConfirm: appointment.status === "appointment_proposed",
    canReject: appointment.status === "appointment_proposed",
    canCancel: appointment.status === "appointment_confirmed",
    canMarkCompleted: appointment.status === "appointment_confirmed",
  };

  // Ajustar según el rol del usuario
  if (userRole === 'client') {
    return {
      ...baseActions,
      canConfirm: false,
      canReject: false,
    };
  } else if (userRole === 'expert') {
    return {
      ...baseActions,
      canPropose: false,
    };
  }

  return baseActions;
};

// ✅ FUNCIONES HARDCODEADAS ELIMINADAS
// Ahora se usan los hooks dinámicos:
// - useAppointmentStatuses() para obtener estados
// - useMoneyDistributionConfig() para calcular distribución de dinero
// - getAppointmentStatusText(), getAppointmentStatusColor() en useAppointmentStatuses.ts

