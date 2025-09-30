import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

export interface MoneyDistributionConfig {
  clientPercentage: number;
  expertPercentage: number;
  platformPercentage: number;
}

export const useMoneyDistribution = (status: string, categoryId?: number, serviceTypeCategoryId?: number) => {
  const [config, setConfig] = useState<MoneyDistributionConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchApi } = useApi();
  
  // Usar ref para mantener una referencia estable a fetchApi
  const fetchApiRef = useRef(fetchApi);
  fetchApiRef.current = fetchApi;

  // Memoizar los parámetros para evitar re-renders innecesarios
  const memoizedParams = useMemo(() => ({
    status,
    categoryId,
    serviceTypeCategoryId
  }), [status, categoryId, serviceTypeCategoryId]);

  const fetchConfig = useCallback(async () => {
    if (!memoizedParams.status) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        statusValue: memoizedParams.status
      });
      
      if (memoizedParams.categoryId) {
        params.append('categoryId', memoizedParams.categoryId.toString());
      }
      
      if (memoizedParams.serviceTypeCategoryId) {
        params.append('serviceTypeCategoryId', memoizedParams.serviceTypeCategoryId.toString());
      }
      
      const response = await fetchApiRef.current<MoneyDistributionConfig>(`${API_CONFIG.endpoints.appointmentConfig.moneyDistribution}?${params.toString()}`);
      setConfig(response);
    } catch (err) {
      console.error('Error fetching money distribution config:', err);
      setError('Error al obtener configuración de porcentajes');
    } finally {
      setIsLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, isLoading, error };
};

// Hook para obtener múltiples configuraciones
export const useMultipleMoneyDistributions = (scenarios: Array<{ status: string; categoryId?: number; serviceTypeCategoryId?: number }>) => {
  const [configs, setConfigs] = useState<Array<{ status: string; config: MoneyDistributionConfig | null; error?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchApi } = useApi();
  
  // Usar ref para mantener una referencia estable a fetchApi
  const fetchApiRef = useRef(fetchApi);
  fetchApiRef.current = fetchApi;

  // Memoizar los escenarios para evitar re-renders innecesarios
  const memoizedScenarios = useMemo(() => scenarios, [scenarios]);

  const fetchConfigs = useCallback(async () => {
    if (memoizedScenarios.length === 0) return;
    
    setIsLoading(true);
    
    try {
      const configPromises = memoizedScenarios.map(async (scenario) => {
        try {
          const params = new URLSearchParams({
            statusValue: scenario.status
          });
          
          if (scenario.categoryId) {
            params.append('categoryId', scenario.categoryId.toString());
          }
          
          if (scenario.serviceTypeCategoryId) {
            params.append('serviceTypeCategoryId', scenario.serviceTypeCategoryId.toString());
          }
          
          const response = await fetchApiRef.current<MoneyDistributionConfig>(`${API_CONFIG.endpoints.appointmentConfig.moneyDistribution}?${params.toString()}`);
          return { status: scenario.status, config: response, error: undefined };
        } catch (err) {
          console.error(`Error fetching config for ${scenario.status}:`, err);
          return { status: scenario.status, config: null, error: 'Error al obtener configuración' };
        }
      });

      const results = await Promise.all(configPromises);
      setConfigs(results);
    } catch (err) {
      console.error('Error fetching multiple configs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [memoizedScenarios]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return { configs, isLoading };
};
