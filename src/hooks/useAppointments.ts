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
    const cleaned: any = {
      proposedDate: data.proposedDate,
      proposedTime: data.proposedTime,
      location: data.location
    };
    
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
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Error al proponer cita');
    },
  });

  const confirmAppointmentMutation = useMutation({
    mutationFn: (data: ConfirmAppointmentDto) =>
      fetchApi<Appointment>(API_CONFIG.endpoints.appointment.confirm, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Error al confirmar cita');
    },
  });

  const rejectAppointmentMutation = useMutation({
    mutationFn: (data: RejectAppointmentDto) =>
      fetchApi<Appointment>(API_CONFIG.endpoints.appointment.reject, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Error al rechazar cita');
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
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Error al cancelar cita');
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
    try {
      setError(null);
      return await confirmAppointmentMutation.mutateAsync(data);
    } catch (err) {
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
 */
export const useAppointmentLock = (appointment: Appointment | null) => {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!appointment) {
      setIsLocked(false);
      return;
    }

    const checkLockStatus = () => {
      const appointmentDateTime = new Date(`${appointment.proposedDate}T${appointment.proposedTime}`);
      const twelveHoursBefore = new Date(appointmentDateTime.getTime() - 12 * 60 * 60 * 1000);
      
      setIsLocked(new Date() >= twelveHoursBefore);
    };
    
    checkLockStatus();
    const interval = setInterval(checkLockStatus, 60000); // Verificar cada minuto
    
    return () => clearInterval(interval);
  }, [appointment?.proposedDate, appointment?.proposedTime]);

  return isLocked;
};

/**
 * Utilidad para obtener las acciones disponibles según el estado de la cita
 */
export const getAvailableActions = (
  appointment: Appointment | null, 
  userRole: 'client' | 'expert', 
  isLocked: boolean
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

/**
 * Utilidad para calcular la distribución de dinero
 */
export const calculateMoneyDistribution = (appointment: Appointment | null): MoneyDistribution => {
  if (!appointment) {
    return { client: 0, expert: 0, platform: 0 };
  }

  const amount = appointment.amount;

  switch (appointment.status) {
    case "appointment_completed":
      return { 
        client: 0, 
        expert: amount * 0.95, 
        platform: amount * 0.05 
      };
    
    case "appointment_cancelled_by_client":
      return { 
        client: amount, 
        expert: 0, 
        platform: 0 
      };
    
    case "appointment_cancelled_by_client_second":
    case "appointment_cancelled_by_expert":
    case "appointment_cancelled_by_no_response":
      return { 
        client: amount * 0.90, 
        expert: amount * 0.08, 
        platform: amount * 0.02 
      };
    
    case "appointment_cancelled_by_expert_rejection":
      return { 
        client: amount * 0.98, 
        expert: 0, 
        platform: amount * 0.02 
      };
    
    default:
      return { client: 0, expert: 0, platform: 0 };
  }
};

/**
 * Utilidad para obtener el texto del estado de la cita
 */
export const getAppointmentStatusText = (status: string): string => {
  const statusTexts: { [key: string]: string } = {
    'awaiting_appointment': 'Esperando propuesta del cliente',
    'appointment_proposed': 'Cita propuesta - Esperando confirmación del experto',
    'appointment_confirmed': 'Cita confirmada',
    'appointment_rejected': 'Cita rechazada por el experto',
    'appointment_cancelled_by_client': 'Cancelada por cliente - Puede reprogramar',
    'appointment_cancelled_by_client_second': 'Cancelada por cliente (2ª vez)',
    'appointment_cancelled_by_expert': 'Cancelada por experto',
    'appointment_cancelled_by_expert_rejection': 'Cancelada - Experto rechazó 2 veces',
    'appointment_cancelled_by_no_response': 'Cancelada por falta de respuesta',
    'appointment_awaiting_report': 'Esperando reporte del experto',
    'appointment_completed': 'Cita completada',
    'appointment_cancelled_by_no_report': 'Cancelada - Experto no envió reporte'
  };
  
  return statusTexts[status] || status;
};

/**
 * Utilidad para obtener el color del estado de la cita
 */
export const getAppointmentStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    'awaiting_appointment': 'yellow',
    'appointment_proposed': 'blue',
    'appointment_confirmed': 'green',
    'appointment_rejected': 'orange',
    'appointment_cancelled_by_client': 'orange',
    'appointment_cancelled_by_client_second': 'red',
    'appointment_cancelled_by_expert': 'red',
    'appointment_cancelled_by_expert_rejection': 'red',
    'appointment_cancelled_by_no_response': 'gray',
    'appointment_awaiting_report': 'purple',
    'appointment_completed': 'green',
    'appointment_cancelled_by_no_report': 'red'
  };
  
  return statusColors[status] || 'gray';
};

