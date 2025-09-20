import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchConfig = async () => {
      if (!status) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          status: status
        });
        
        if (categoryId) {
          params.append('categoryId', categoryId.toString());
        }
        
        if (serviceTypeCategoryId) {
          params.append('serviceTypeCategoryId', serviceTypeCategoryId.toString());
        }
        
        const response = await fetchApi<MoneyDistributionConfig>(`${API_CONFIG.endpoints.appointmentConfig.moneyDistributionPublic}?${params.toString()}`);
        setConfig(response);
      } catch (err) {
        console.error('Error fetching money distribution config:', err);
        setError('Error al obtener configuración de porcentajes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [status, categoryId, serviceTypeCategoryId, fetchApi]);

  return { config, isLoading, error };
};

// Hook para obtener múltiples configuraciones
export const useMultipleMoneyDistributions = (scenarios: Array<{ status: string; categoryId?: number; serviceTypeCategoryId?: number }>) => {
  const [configs, setConfigs] = useState<Array<{ status: string; config: MoneyDistributionConfig | null; error?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchApi } = useApi();

  useEffect(() => {
    const fetchConfigs = async () => {
      setIsLoading(true);
      
      try {
        const configPromises = scenarios.map(async (scenario) => {
          try {
            const params = new URLSearchParams({
              status: scenario.status
            });
            
            if (scenario.categoryId) {
              params.append('categoryId', scenario.categoryId.toString());
            }
            
            if (scenario.serviceTypeCategoryId) {
              params.append('serviceTypeCategoryId', scenario.serviceTypeCategoryId.toString());
            }
            
            const response = await fetchApi<MoneyDistributionConfig>(`${API_CONFIG.endpoints.appointmentConfig.moneyDistributionPublic}?${params.toString()}`);
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
    };

    if (scenarios.length > 0) {
      fetchConfigs();
    }
  }, [scenarios, fetchApi]);

  return { configs, isLoading };
};
