import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

export interface MoneyDistributionConfig {
  clientPercentage: number;
  expertPercentage: number;
  platformPercentage: number;
  source: string;
  status: string;
  categoryId?: number;
  serviceTypeCategoryId?: number;
}

export const useMoneyDistributionConfig = (
  status: string, 
  categoryId?: number, 
  serviceTypeCategoryId?: number
) => {
  const { fetchApi } = useApi();
  
  // Construir parámetros de query
  const params = new URLSearchParams({ status });
  if (categoryId) params.append('categoryId', categoryId.toString());
  if (serviceTypeCategoryId) params.append('serviceTypeCategoryId', serviceTypeCategoryId.toString());
  
  return useQuery({
    queryKey: ['money-distribution-config', status, categoryId, serviceTypeCategoryId],
    queryFn: () => fetchApi<MoneyDistributionConfig>(
      `${API_CONFIG.endpoints.appointment.moneyDistributionConfig}?${params.toString()}`
    ),
    enabled: !!status,
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Utilidad para calcular la distribución de dinero
export const calculateMoneyDistribution = (
  amount: number, 
  config: MoneyDistributionConfig | null
): { client: number; expert: number; platform: number } => {
  if (!config) {
    return { client: 0, expert: 0, platform: 0 };
  }
  
  return {
    client: amount * (config.clientPercentage / 100),
    expert: amount * (config.expertPercentage / 100),
    platform: amount * (config.platformPercentage / 100),
  };
};

// Utilidad para validar que los porcentajes sumen 100%
export const validateMoneyDistribution = (config: MoneyDistributionConfig): boolean => {
  const total = config.clientPercentage + config.expertPercentage + config.platformPercentage;
  return Math.abs(total - 100) < 0.01; // Tolerancia de 0.01%
};

// Utilidad para obtener el texto de la fuente de configuración
export const getConfigSourceText = (source: string): string => {
  switch (source) {
    case 'status':
      return 'Configuración por Estado';
    case 'category':
      return 'Configuración por Categoría';
    case 'serviceType':
      return 'Configuración por Tipo de Servicio';
    case 'granular':
      return 'Configuración Granular';
    case 'default':
      return 'Configuración por Defecto';
    default:
      return 'Configuración Personalizada';
  }
};
