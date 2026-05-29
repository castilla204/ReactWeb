import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

export interface MoneyDistributionConfig {
  clientPercentage: string;        // Ahora es string, no number
  expertPercentage: string;        // Ahora es string, no number
  platformPercentage: string;     // Ahora es string, no number
  source: string;                  // "dynamic" o "no_distribution_required"
  status: string;                  // Estado consultado
  categoryId: number | null;       // ID de categoría
  serviceTypeCategoryId: number | null; // ID de tipo de servicio
  message?: string;                // Solo cuando source = "no_distribution_required"
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
//
// 🛡️ Round 10 — P-D FIX: aritmética en céntimos enteros para alinear con backend.
// Antes: `amount * (percent / 100)` con IEEE 754 daba 16.30 * 0.30 = 4.890000000001
// (visible al sumar y comparar). Ahora trabajamos con centavos (long-equivalent en JS,
// seguro hasta 2^53 céntimos = €90 billones) y redondeamos al final con Math.round —
// equivalente al `Math.Round(x, 2, AwayFromZero)` del backend para valores no-negativos.
export const calculateMoneyDistribution = (
  amount: number,
  config: MoneyDistributionConfig | null
): { client: number; expert: number; platform: number } => {
  if (!config) {
    return { client: 0, expert: 0, platform: 0 };
  }

  // Si es un estado intermedio sin distribución, devolver 0
  if (config.source === 'no_distribution_required') {
    return { client: 0, expert: 0, platform: 0 };
  }

  // Coerción defensiva (parseFloat puede devolver NaN si llegan datos corruptos)
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const clientPercentage = parseFloat(config.clientPercentage);
  const expertPercentage = parseFloat(config.expertPercentage);
  const platformPercentage = parseFloat(config.platformPercentage);

  const clientPct = Number.isFinite(clientPercentage) ? clientPercentage : 0;
  const expertPct = Number.isFinite(expertPercentage) ? expertPercentage : 0;
  const platformPct = Number.isFinite(platformPercentage) ? platformPercentage : 0;

  // Trabajar en céntimos enteros: amountCents = round(amount * 100)
  const amountCents = Math.round(safeAmount * 100);

  // Para cada parte: round((amountCents * pct) / 100) — sigue siendo entero
  const clientCents = Math.round((amountCents * clientPct) / 100);
  const expertCents = Math.round((amountCents * expertPct) / 100);
  const platformCents = Math.round((amountCents * platformPct) / 100);

  return {
    client: clientCents / 100,
    expert: expertCents / 100,
    platform: platformCents / 100,
  };
};

// Utilidad para validar que los porcentajes sumen 100%
export const validateMoneyDistribution = (config: MoneyDistributionConfig): boolean => {
  // Si es un estado intermedio sin distribución, no validar
  if (config.source === 'no_distribution_required') {
    return true;
  }
  
  const clientPercentage = parseFloat(config.clientPercentage) || 0;
  const expertPercentage = parseFloat(config.expertPercentage) || 0;
  const platformPercentage = parseFloat(config.platformPercentage) || 0;
  const total = clientPercentage + expertPercentage + platformPercentage;
  
  return Math.abs(total - 100) < 0.01; // Tolerancia de 0.01%
};

// Utilidad para obtener el texto de la fuente de configuración
export const getConfigSourceText = (source: string): string => {
  switch (source) {
    case 'dynamic':
      return 'Configuración Dinámica';
    case 'no_distribution_required':
      return 'Sin Distribución Requerida';
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

// Utilidad para determinar si se debe mostrar la distribución de dinero
export const shouldShowMoneyDistribution = (
  config: MoneyDistributionConfig | null, 
  status?: string, 
  appointmentStatuses?: any[]
): boolean => {
  if (!config) return false;
  
  // No mostrar para estados intermedios donde se puede reprogramar
  if (config.source === 'no_distribution_required') {
    return false;
  }
  
  // Usar la información de appointmentStatuses para determinar si es un estado final
  if (status && appointmentStatuses && Array.isArray(appointmentStatuses)) {
    const statusInfo = appointmentStatuses.find((s: any) => s.statusValue === status);
    
    // Si encontramos el estado y NO es un estado de finalización, no mostrar distribución
    if (statusInfo && !statusInfo.isFinalizationStatus) {
      return false;
    }
  }
  
  // Solo mostrar si es un estado final con distribución real
  return config.source === 'dynamic' && 
         (parseFloat(config.clientPercentage) > 0 || 
          parseFloat(config.expertPercentage) > 0 || 
          parseFloat(config.platformPercentage) > 0);
};
