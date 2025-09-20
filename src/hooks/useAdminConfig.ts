import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import {
  AppointmentStatusConfigDto,
  ServiceTypeCategoryConfigDto,
  CategoryServiceTypeConfigDto,
  MoneyDistributionConfigDto,
  CreateAppointmentStatusConfigDto,
  CreateServiceTypeCategoryConfigDto,
  CreateCategoryServiceTypeConfigDto,
  ConfigFormData
} from '../types/admin';

// Hook para configuraciones por estado de cita
export const useAppointmentStatusConfigs = () => {
  const [configs, setConfigs] = useState<AppointmentStatusConfigDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchApi } = useApi();

  const fetchConfigs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchApi<AppointmentStatusConfigDto[]>(API_CONFIG.endpoints.appointmentConfig.appointmentStatus);
      setConfigs(response);
    } catch (err) {
      console.error('Error fetching appointment status configs:', err);
      setError('Error al obtener configuraciones por estado');
    } finally {
      setIsLoading(false);
    }
  };

  const createConfig = async (config: CreateAppointmentStatusConfigDto): Promise<AppointmentStatusConfigDto> => {
    const response = await fetchApi<AppointmentStatusConfigDto>(API_CONFIG.endpoints.appointmentConfig.appointmentStatus, {
      method: 'POST',
      body: JSON.stringify(config)
    });
    await fetchConfigs(); // Refrescar la lista
    return response;
  };

  const updateConfig = async (id: number, config: CreateAppointmentStatusConfigDto): Promise<AppointmentStatusConfigDto> => {
    const response = await fetchApi<AppointmentStatusConfigDto>(API_CONFIG.endpoints.appointmentConfig.appointmentStatusById(id), {
      method: 'PUT',
      body: JSON.stringify(config)
    });
    await fetchConfigs(); // Refrescar la lista
    return response;
  };

  const deleteConfig = async (id: number): Promise<void> => {
    await fetchApi(API_CONFIG.endpoints.appointmentConfig.appointmentStatusById(id), {
      method: 'DELETE'
    });
    await fetchConfigs(); // Refrescar la lista
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return {
    configs,
    isLoading,
    error,
    fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig
  };
};

// Hook para configuraciones por categoría de servicio
export const useServiceTypeCategoryConfigs = () => {
  const [configs, setConfigs] = useState<ServiceTypeCategoryConfigDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchApi } = useApi();

  const fetchConfigs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchApi<ServiceTypeCategoryConfigDto[]>(API_CONFIG.endpoints.appointmentConfig.serviceTypeCategory);
      setConfigs(response);
    } catch (err) {
      console.error('Error fetching service type category configs:', err);
      setError('Error al obtener configuraciones por categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const createConfig = async (config: CreateServiceTypeCategoryConfigDto): Promise<ServiceTypeCategoryConfigDto> => {
    const response = await fetchApi<ServiceTypeCategoryConfigDto>(API_CONFIG.endpoints.appointmentConfig.serviceTypeCategory, {
      method: 'POST',
      body: JSON.stringify(config)
    });
    await fetchConfigs(); // Refrescar la lista
    return response;
  };

  const updateConfig = async (id: number, config: CreateServiceTypeCategoryConfigDto): Promise<ServiceTypeCategoryConfigDto> => {
    const response = await fetchApi<ServiceTypeCategoryConfigDto>(API_CONFIG.endpoints.appointmentConfig.serviceTypeCategoryById(id), {
      method: 'PUT',
      body: JSON.stringify(config)
    });
    await fetchConfigs(); // Refrescar la lista
    return response;
  };

  const deleteConfig = async (id: number): Promise<void> => {
    await fetchApi(API_CONFIG.endpoints.appointmentConfig.serviceTypeCategoryById(id), {
      method: 'DELETE'
    });
    await fetchConfigs(); // Refrescar la lista
  };

  const getConfigsByCategory = (categoryId: number) => {
    return configs.filter(config => config.serviceTypeCategoryId === categoryId);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return {
    configs,
    isLoading,
    error,
    fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    getConfigsByCategory
  };
};

// Hook para consultar configuración aplicada
export const useMoneyDistributionQuery = () => {
  const [config, setConfig] = useState<MoneyDistributionConfigDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchApi } = useApi();

  const queryConfig = async (status: string, categoryId?: number, serviceTypeCategoryId?: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ status });
      if (categoryId) {
        params.append('categoryId', categoryId.toString());
      }
      if (serviceTypeCategoryId) {
        params.append('serviceTypeCategoryId', serviceTypeCategoryId.toString());
      }
      
      const response = await fetchApi<MoneyDistributionConfigDto>(`${API_CONFIG.endpoints.appointmentConfig.moneyDistribution}?${params.toString()}`);
      setConfig(response);
    } catch (err) {
      console.error('Error querying money distribution config:', err);
      setError('Error al consultar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    config,
    isLoading,
    error,
    queryConfig
  };
};

// Hook para validar formularios
export const useConfigValidation = () => {
  const validateForm = (data: ConfigFormData): string[] => {
    const errors: string[] = [];
    
    if (data.clientPercentage + data.expertPercentage + data.platformPercentage !== 100) {
      errors.push('Los porcentajes deben sumar 100%');
    }
    
    if (data.clientPercentage < 0 || data.clientPercentage > 100) {
      errors.push('El porcentaje del cliente debe estar entre 0 y 100');
    }
    
    if (data.expertPercentage < 0 || data.expertPercentage > 100) {
      errors.push('El porcentaje del experto debe estar entre 0 y 100');
    }
    
    if (data.platformPercentage < 0 || data.platformPercentage > 100) {
      errors.push('El porcentaje de la plataforma debe estar entre 0 y 100');
    }
    
    if (!data.status) {
      errors.push('Debe seleccionar un estado de cita');
    }
    
    if (data.categoryId !== undefined && data.categoryId <= 0) {
      errors.push('Debe seleccionar una categoría válida');
    }
    
    if (data.serviceTypeCategoryId !== undefined && data.serviceTypeCategoryId <= 0) {
      errors.push('Debe seleccionar una categoría de servicio válida');
    }
    
    return errors;
  };

  const validatePercentages = (client: number, expert: number, platform: number): boolean => {
    return client + expert + platform === 100;
  };

  return {
    validateForm,
    validatePercentages
  };
};

// Hook para configuraciones granulares (Category + ServiceTypeCategory)
export const useCategoryServiceTypeConfigs = () => {
  const [configs, setConfigs] = useState<CategoryServiceTypeConfigDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchApi } = useApi();

  const fetchConfigs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchApi<CategoryServiceTypeConfigDto[]>(API_CONFIG.endpoints.appointmentConfig.categoryServiceType);
      setConfigs(response);
    } catch (err) {
      console.error('Error fetching category service type configs:', err);
      setError('Error al cargar configuraciones granulares');
    } finally {
      setIsLoading(false);
    }
  };

  const getConfigsByCategory = async (categoryId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchApi<CategoryServiceTypeConfigDto[]>(API_CONFIG.endpoints.appointmentConfig.categoryServiceTypeByCategory(categoryId));
      setConfigs(response);
    } catch (err) {
      console.error('Error fetching configs by category:', err);
      setError('Error al cargar configuraciones por categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const getConfigsByServiceType = async (serviceTypeCategoryId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchApi<CategoryServiceTypeConfigDto[]>(API_CONFIG.endpoints.appointmentConfig.categoryServiceTypeByServiceType(serviceTypeCategoryId));
      setConfigs(response);
    } catch (err) {
      console.error('Error fetching configs by service type:', err);
      setError('Error al cargar configuraciones por tipo de servicio');
    } finally {
      setIsLoading(false);
    }
  };

  const createConfig = async (config: CreateCategoryServiceTypeConfigDto) => {
    try {
      const response = await fetchApi<CategoryServiceTypeConfigDto>(API_CONFIG.endpoints.appointmentConfig.categoryServiceType, {
        method: 'POST',
        body: JSON.stringify(config),
      });
      setConfigs(prev => [...prev, response]);
      return response;
    } catch (err) {
      console.error('Error creating category service type config:', err);
      throw err;
    }
  };

  const updateConfig = async (id: number, config: CreateCategoryServiceTypeConfigDto) => {
    try {
      const response = await fetchApi<CategoryServiceTypeConfigDto>(API_CONFIG.endpoints.appointmentConfig.categoryServiceTypeById(id), {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      setConfigs(prev => prev.map(c => c.id === id ? response : c));
      return response;
    } catch (err) {
      console.error('Error updating category service type config:', err);
      throw err;
    }
  };

  const deleteConfig = async (id: number) => {
    try {
      await fetchApi(API_CONFIG.endpoints.appointmentConfig.categoryServiceTypeById(id), {
        method: 'DELETE',
      });
      setConfigs(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting category service type config:', err);
      throw err;
    }
  };

  return {
    configs,
    isLoading,
    error,
    fetchConfigs,
    getConfigsByCategory,
    getConfigsByServiceType,
    createConfig,
    updateConfig,
    deleteConfig
  };
};
