import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { SubmitExpertReportDto, Appointment } from '../types/appointment';

// Tipos para la validación de archivos
export interface FileValidationResult {
  canSubmit: boolean;
  missingFiles: string[];
  requiredTypes: string[];
  uploadedTypes: string[];
  message: string;
}

// Tipos para el timer inteligente
export interface TimerInfo {
  timeRemaining: string;
  isExpired: boolean;
  canSubmit: boolean;
  missingFiles: string[];
  message: string;
  subMessage: string;
}

/**
 * Hook para manejar el envío de reportes del experto
 * Incluye validación de archivos obligatorios y timer inteligente
 */
export const useExpertReport = () => {
  const { fetchApi } = useApi();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Mutation para enviar reporte
  const submitReportMutation = useMutation({
    mutationFn: async ({ 
      appointmentId, 
      data 
    }: { 
      appointmentId: number; 
      data: SubmitExpertReportDto 
    }): Promise<Appointment> => {
      console.log('📤 Enviando reporte del experto:', { appointmentId, data });
      
      const response = await fetchApi<Appointment>(
        API_CONFIG.endpoints.appointment.submitReport(appointmentId), 
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      
      console.log('✅ Reporte enviado exitosamente:', response);
      console.log('📊 Estado de la cita después del reporte:', {
        appointmentId: response.id,
        status: response.status,
        searchHireId: response.searchHireId
      });
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Reporte enviado exitosamente, invalidando cache:', data);
      
      // Invalidar queries relacionadas para asegurar que se actualice el estado correctamente
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
      queryClient.invalidateQueries({ queryKey: ['searches'] });
      queryClient.invalidateQueries({ queryKey: ['searchDetailsComplete'] });
      queryClient.invalidateQueries({ queryKey: ['searchDetailsCompleteByHire'] });
      queryClient.invalidateQueries({ queryKey: ['expertHires'] });
      
      // Actualizar el cache directamente con el nuevo estado
      if (data && data.id) {
        queryClient.setQueryData(['appointment', data.id], data);
      }
    },
    onError: (error: any) => {
      console.error('❌ Error al enviar reporte:', error);
      setError(error instanceof Error ? error.message : 'Error al enviar reporte');
    },
  });

  // Función para verificar archivos obligatorios
  const checkRequiredFiles = async (searchHireId: number, serviceData?: any): Promise<FileValidationResult> => {
    try {
      console.log('🔍 Verificando archivos obligatorios para searchHireId:', searchHireId);
      
      // 1. Obtener archivos subidos
      const deliverablesResponse = await fetchApi<any>(
        `${API_CONFIG.endpoints.chat.deliverable}/${searchHireId}`
      );
      
      // El endpoint devuelve un objeto con DeliverableUrls, no un array directo.
      // La API serializa PascalCase; se lee también camelCase por robustez.
      const deliverables = deliverablesResponse?.DeliverableUrls ?? deliverablesResponse?.deliverableUrls ?? [];
      console.log('📁 Deliverables recibidos:', deliverables);
      
      // 2. Si no tenemos datos del servicio, intentar obtenerlos
      let service = serviceData;
      if (!service) {
        try {
          // Usar el endpoint correcto para obtener el servicio por hireId
          const serviceResponse = await fetchApi<any>(
            API_CONFIG.endpoints.expert.services.getByHireId(searchHireId)
          );
          service = serviceResponse;
        } catch (serviceError) {
          console.warn('⚠️ No se pudo obtener información del servicio:', serviceError);
          // Si no podemos obtener el servicio, asumir que no hay archivos requeridos
          return {
            canSubmit: true,
            missingFiles: [],
            requiredTypes: [],
            uploadedTypes: deliverables.map((url: string) => {
              const extension = url.split('.').pop()?.toLowerCase();
              return extension === 'pdf' ? 'pdf' : extension === 'mp4' ? 'video' : extension;
            }).filter(Boolean),
            message: "No se pudo verificar archivos requeridos, pero se pueden enviar archivos"
          };
        }
      }
      
      // 3. Verificar tipos requeridos.
      // Solo PDF y Video son entregables con FICHERO — misma whitelist que
      // ValidateRequiredDeliverablesAsync en el backend. "Llamada" (y cualquier
      // entregable sin fichero) NUNCA debe bloquear el envío del informe.
      // La API serializa PascalCase; se leen ambos casings.
      const FILE_DELIVERABLES = ['pdf', 'video'];
      const selectedTypes: any[] = service?.SelectedDeliverableTypes ?? service?.selectedDeliverableTypes ?? [];
      const requiredTypes = selectedTypes
        .filter((dt: any) => dt.IsSelected ?? dt.isSelected)
        .map((dt: any) => {
          const type = dt.DeliverableType ?? dt.deliverableType;
          return String(type?.Name ?? type?.name ?? '').toLowerCase();
        })
        .filter((name: string) => FILE_DELIVERABLES.includes(name));
        
      // Extraer tipos de archivo de las URLs
      const uploadedTypes = deliverables.map((url: string) => {
        const extension = url.split('.').pop()?.toLowerCase();
        return extension === 'pdf' ? 'pdf' : extension === 'mp4' ? 'video' : extension;
      }).filter(Boolean);
      
      const missingTypes = requiredTypes.filter((type: string) => 
        !uploadedTypes.includes(type)
      );
      
      const result = {
        canSubmit: missingTypes.length === 0,
        missingFiles: missingTypes,
        requiredTypes,
        uploadedTypes,
        message: missingTypes.length > 0 
          ? `Faltan archivos: ${missingTypes.join(', ')}`
          : "Todos los archivos requeridos están subidos"
      };
      
      console.log('📋 Resultado de validación de archivos:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error verificando archivos:', error);
      return {
        canSubmit: false,
        missingFiles: [],
        requiredTypes: [],
        uploadedTypes: [],
        message: "Error verificando archivos"
      };
    }
  };

  // Función para obtener información del timer inteligente
  const getTimerInfo = async (appointment: Appointment): Promise<TimerInfo> => {
    try {
      if (appointment.status !== 'appointment_awaiting_report') {
        return {
          timeRemaining: '',
          isExpired: false,
          canSubmit: false,
          missingFiles: [],
          message: '',
          subMessage: ''
        };
      }

      // Buscar timer activo
      const activeTimer = appointment.timers?.find(t => 
        t.timerType === 'expert_report' && !t.isExpired
      );

      if (!activeTimer) {
        return {
          timeRemaining: '',
          isExpired: true,
          canSubmit: false,
          missingFiles: [],
          message: 'Timer expirado',
          subMessage: 'El tiempo para enviar el reporte ha expirado'
        };
      }

      // Verificar archivos
      const fileValidation = await checkRequiredFiles(appointment.searchHireId);
      
      // Calcular tiempo restante
      const now = new Date();
      const endTime = new Date(activeTimer.endTime);
      const timeDiff = endTime.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        return {
          timeRemaining: '00:00:00',
          isExpired: true,
          canSubmit: fileValidation.canSubmit,
          missingFiles: fileValidation.missingFiles,
          message: 'Timer expirado',
          // El backend NO auto-envía al expirar: cancela la cita (appointment_cancelled_by_no_report)
          subMessage: 'El plazo ha vencido sin enviar el informe: la cita se cancelará automáticamente'
        };
      }

      // Formatear tiempo restante
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      const timeRemaining = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      return {
        timeRemaining,
        isExpired: false,
        canSubmit: fileValidation.canSubmit,
        missingFiles: fileValidation.missingFiles,
        message: fileValidation.canSubmit 
          ? '⏰ 24h restantes - Todos los archivos están listos'
          : '⏰ 24h restantes - Faltan archivos requeridos',
        subMessage: fileValidation.canSubmit
          ? 'Recuerda enviar el informe antes del plazo: si no, la cita se cancelará automáticamente'
          : `Faltan: ${fileValidation.missingFiles.join(', ')}. Si no los subes y envías el informe, la cita se cancelará.`
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo información del timer:', error);
      return {
        timeRemaining: '',
        isExpired: false,
        canSubmit: false,
        missingFiles: [],
        message: 'Error obteniendo información del timer',
        subMessage: ''
      };
    }
  };

  // Función para enviar reporte con validación
  const submitExpertReport = async (appointmentId: number, notes: string): Promise<Appointment> => {
    try {
      setError(null);
      
      // 1. Obtener la cita para verificar el estado
      const appointmentResponse = await fetchApi<Appointment>(
        API_CONFIG.endpoints.appointment.get(appointmentId)
      );
      
      if (appointmentResponse.status !== 'appointment_awaiting_report') {
        throw new Error('La cita no está en estado correcto para enviar reporte');
      }
      
      // 2. Verificar archivos obligatorios
      const fileValidation = await checkRequiredFiles(appointmentResponse.searchHireId);
      
      if (!fileValidation.canSubmit) {
        throw new Error(`Es obligatorio subir los siguientes archivos antes de enviar el reporte: ${fileValidation.missingFiles.join(', ')}`);
      }
      
      // 3. Enviar reporte
      return await submitReportMutation.mutateAsync({
        appointmentId,
        data: { notes }
      });
      
    } catch (err: any) {
      console.error('❌ Error en submitExpertReport:', err);
      throw err;
    }
  };

  // Función para manejar errores específicos
  const handleSubmitError = (error: any): string => {
    const errorMessages: { [key: string]: string } = {
      "obligatorio subir PDF": "❌ Es obligatorio subir un archivo PDF antes de enviar el reporte",
      "obligatorio subir video": "❌ Es obligatorio subir un archivo de video antes de enviar el reporte", 
      "obligatorio subir": "❌ Es obligatorio subir archivos requeridos antes de enviar el reporte",
      "awaiting_report": "❌ La cita no está en estado correcto para enviar reporte",
      "Only the expert": "❌ Solo el experto puede enviar reportes",
      "Appointment not found": "❌ Cita no encontrada"
    };

    const message = error.message || error.toString();
    
    // Buscar mensaje específico
    for (const [key, value] of Object.entries(errorMessages)) {
      if (message.includes(key)) {
        return value;
      }
    }
    
    return `❌ Error: ${message}`;
  };

  return {
    // Mutations
    submitExpertReport,
    
    // Estados
    error,
    setError,
    isSubmitting: submitReportMutation.isPending,
    
    // Utilidades
    checkRequiredFiles,
    getTimerInfo,
    handleSubmitError,
  };
};

/**
 * Hook para manejar el timer inteligente de 24h
 */
export const useExpertReportTimer = (appointment: Appointment | null) => {
  const { getTimerInfo } = useExpertReport();
  const [timerInfo, setTimerInfo] = useState<TimerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateTimer = async () => {
    if (!appointment) {
      setTimerInfo(null);
      return;
    }

    setIsLoading(true);
    try {
      const info = await getTimerInfo(appointment);
      setTimerInfo(info);
    } catch (error) {
      console.error('❌ Error actualizando timer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar timer cada minuto
  useEffect(() => {
    if (!appointment) return;

    updateTimer();
    
    const interval = setInterval(updateTimer, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, [appointment]);

  return {
    timerInfo,
    isLoading,
    updateTimer,
  };
};
