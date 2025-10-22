import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

export interface AppointmentStatus {
  id: number;
  statusValue: string;
  displayName: string;
  description: string;
  isFinalizationStatus: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const useAppointmentStatuses = () => {
  const { fetchApi } = useApi();
  
  return useQuery({
    queryKey: ['appointment-statuses'],
    queryFn: () => fetchApi<AppointmentStatus[]>(API_CONFIG.endpoints.appointment.statuses),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Utilidad para obtener el texto de un estado
export const getAppointmentStatusText = (status: string, statuses: AppointmentStatus[]): string => {
  const statusConfig = statuses.find(s => s.statusValue === status);
  return statusConfig?.displayName || status;
};

// Utilidad para obtener el color de un estado
export const getAppointmentStatusColor = (status: string, statuses: AppointmentStatus[]): string => {
  const statusConfig = statuses.find(s => s.statusValue === status);
  
  if (!statusConfig) return 'gray';
  
  // Lógica de colores basada en el tipo de estado
  if (statusConfig.isFinalizationStatus) {
    if (statusConfig.statusValue.includes('completed')) return 'green';
    if (statusConfig.statusValue.includes('cancelled')) return 'red';
    return 'gray';
  }
  
  // Estados intermedios
  if (statusConfig.statusValue.includes('awaiting')) return 'purple';
  if (statusConfig.statusValue.includes('proposed')) return 'blue';
  if (statusConfig.statusValue.includes('confirmed')) return 'green';
  if (statusConfig.statusValue.includes('rejected')) return 'orange';
  
  return 'gray';
};

// Utilidad para obtener el icono de un estado
export const getAppointmentStatusIcon = (status: string, statuses: AppointmentStatus[]): string => {
  const statusConfig = statuses.find(s => s.statusValue === status);
  
  if (!statusConfig) return 'circle';
  
  if (statusConfig.statusValue.includes('completed')) return 'check-circle';
  if (statusConfig.statusValue.includes('cancelled')) return 'x-circle';
  if (statusConfig.statusValue.includes('rejected')) return 'x-circle';
  if (statusConfig.statusValue.includes('awaiting')) return 'clock';
  if (statusConfig.statusValue.includes('proposed')) return 'calendar';
  if (statusConfig.statusValue.includes('confirmed')) return 'check';
  
  return 'circle';
};
