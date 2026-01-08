import { useState, useEffect, useCallback } from 'react';
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
  ConfigFormData,
  AppointmentStatusDto,
} from '../types/admin';

// Hook para obtener estados de citas disponibles
export const useAppointmentStatuses = () => {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchApi } = useApi();

  const fetchStatuses = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchApi<any[]>(API_CONFIG.endpoints.appointmentConfig.appointmentStatus);
      setStatuses(response);
    } catch (err) {
      console.error('Error fetching appointment statuses:', err);
      setError('Error al obtener estados de citas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  return {
    statuses,
    isLoading,
    error,
    fetchStatuses
  };
};

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
      console.log('🔍 DEBUG - useAppointmentStatusConfigs - Endpoint:', API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs);
      const response = await fetchApi<AppointmentStatusConfigDto[]>(API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs);
      console.log('🔍 DEBUG - useAppointmentStatusConfigs - Response:', response);
      console.log('🔍 DEBUG - useAppointmentStatusConfigs - Response length:', response?.length);
      setConfigs(response);
    } catch (err) {
      console.error('Error fetching appointment status configs:', err);
      setError('Error al obtener configuraciones por estado');
    } finally {
      setIsLoading(false);
    }
  };

  const createConfig = async (config: CreateAppointmentStatusConfigDto): Promise<AppointmentStatusConfigDto> => {
    try {
      console.log('➕ Creando nueva configuración:', config);

      // Validar que los porcentajes sumen 100%
      const total = config.clientPercentage + config.expertPercentage + config.platformPercentage;
      if (total !== 100) {
        throw new Error(`Los porcentajes deben sumar 100%. Actual: ${total}%`);
      }

      // Preparar datos para enviar con action: "create"
      const submitData = {
        action: "create",
        statusId: config.statusId,
        categoryId: config.categoryId !== undefined ? config.categoryId : null,
        serviceTypeCategoryId: config.serviceTypeCategoryId !== undefined ? config.serviceTypeCategoryId : null,
        clientPercentage: config.clientPercentage,
        expertPercentage: config.expertPercentage,
        platformPercentage: config.platformPercentage,
        isActive: config.isActive
      };

      console.log('📤 Enviando datos de creación:', submitData);
      console.log('📤 Config original:', config);
      console.log('📤 categoryId check:', { 
        original: config.categoryId, 
        isUndefined: config.categoryId === undefined,
        result: config.categoryId !== undefined ? config.categoryId : null 
      });
      console.log('📤 serviceTypeCategoryId check:', { 
        original: config.serviceTypeCategoryId, 
        isUndefined: config.serviceTypeCategoryId === undefined,
        result: config.serviceTypeCategoryId !== undefined ? config.serviceTypeCategoryId : null 
      });

      const response = await fetchApi<AppointmentStatusConfigDto>(API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs, {
        method: 'POST',
        body: JSON.stringify(submitData)
      });
      
      console.log('✅ Configuración creada:', response);
      await fetchConfigs(); // Refrescar la lista
      return response;
    } catch (error) {
      console.error('❌ Error creating config:', error);
      throw error;
    }
  };

  const updateConfig = async (configId: number, config: CreateAppointmentStatusConfigDto): Promise<AppointmentStatusConfigDto> => {
    try {
      console.log('🔄 Actualizando configuración ID:', configId);
      console.log('📊 Datos a actualizar:', config);

      // Validar que los porcentajes sumen 100%
      const total = config.clientPercentage + config.expertPercentage + config.platformPercentage;
      if (total !== 100) {
        throw new Error(`Los porcentajes deben sumar 100%. Actual: ${total}%`);
      }

      // Preparar datos para enviar con action: "update"
      const submitData = {
        action: "update",
        configId: configId,
        statusId: config.statusId,
        categoryId: config.categoryId !== undefined ? config.categoryId : null,
        serviceTypeCategoryId: config.serviceTypeCategoryId !== undefined ? config.serviceTypeCategoryId : null,
        clientPercentage: config.clientPercentage,
        expertPercentage: config.expertPercentage,
        platformPercentage: config.platformPercentage,
        isActive: config.isActive
      };

      console.log('📤 Enviando datos de actualización:', submitData);

      // Usar POST con action: "update"
      const response = await fetchApi<AppointmentStatusConfigDto>(API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs, {
        method: 'POST',
        body: JSON.stringify(submitData)
      });
      
      console.log('✅ Configuración actualizada:', response);
      await fetchConfigs(); // Refrescar la lista
      return response;

    } catch (error) {
      console.error('❌ Error updating config:', error);
      throw error;
    }
  };

  const deleteConfig = async (id: number): Promise<void> => {
    try {
      console.log('🗑️ Eliminando configuración ID:', id);
      
      // Preparar datos para eliminar con action: "delete"
      const submitData = {
        action: "delete",
        configId: id,
        statusId: 1, // Valor temporal requerido
        categoryId: null,
        serviceTypeCategoryId: null,
        clientPercentage: 0, // Valores temporales requeridos
        expertPercentage: 0,
        platformPercentage: 0,
        isActive: true
      };

      console.log('📤 Enviando datos de eliminación:', submitData);

      // Usar POST con action: "delete"
      const response = await fetchApi(API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs, {
        method: 'POST',
        body: JSON.stringify(submitData)
      });
      
      console.log('✅ Configuración eliminada:', response);
      await fetchConfigs(); // Refrescar la lista
      
    } catch (error) {
      console.error('❌ Error deleting config:', error);
      throw error;
    }
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

// Función para cargar configuraciones por tipo
export const loadConfigsByType = async (type: string, categoryId?: number, serviceTypeId?: number) => {
  try {
    let endpoint = '';
    
    switch (type) {
      case 'status':
        // Nivel 4 - Configuraciones generales (sin categoría ni tipo de servicio)
        endpoint = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs}`;
        break;
      case 'category':
        // Nivel 3 - Configuraciones por categoría
        if (categoryId) {
          endpoint = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs}/configurations-by-category/${categoryId}`;
        } else {
          endpoint = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs}/configurations-by-category`;
        }
        break;
      case 'granular':
        // Nivel 1 - Configuraciones granulares
        if (categoryId && serviceTypeId) {
          endpoint = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs}/granular-configurations/${categoryId}/${serviceTypeId}`;
        } else {
          endpoint = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs}/granular-configurations`;
        }
        break;
      default:
        endpoint = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs}`;
    }
    
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`✅ Configuraciones ${type} cargadas:`, data);
    return data;
    
  } catch (error) {
    console.error(`❌ Error loading ${type} configs:`, error);
    throw error;
  }
};

// Función para cargar categorías
export const loadCategories = async () => {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs}/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('✅ Categorías cargadas:', data);
    return data;
  } catch (error) {
    console.error('❌ Error loading categories:', error);
    throw error;
  }
};

// Función para cargar tipos de servicio
export const loadServiceTypes = async () => {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs}/service-types`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('✅ Tipos de servicio cargados:', data);
    return data;
  } catch (error) {
    console.error('❌ Error loading service types:', error);
    throw error;
  }
};

// Función para obtener distribución de dinero
export const getMoneyDistribution = async (statusValue: string, categoryId?: number, serviceTypeId?: number) => {
  try {
    let endpoint = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.appointmentConfig.moneyDistribution}?statusValue=${statusValue}`;
    
    if (categoryId) {
      endpoint += `&categoryId=${categoryId}`;
    }
    
    if (serviceTypeId) {
      endpoint += `&serviceTypeCategoryId=${serviceTypeId}`;
    }
    
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('✅ Distribución de dinero obtenida:', data);
    return data;
  } catch (error) {
    console.error('❌ Error getting money distribution:', error);
    throw error;
  }
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
      // Usar el endpoint específico para configuraciones por categoría
      console.log('🔍 DEBUG - useServiceTypeCategoryConfigs - Endpoint:', API_CONFIG.endpoints.appointmentConfig.configurationsByCategory);
      const response = await fetchApi<ServiceTypeCategoryConfigDto[]>(API_CONFIG.endpoints.appointmentConfig.configurationsByCategory);
      console.log('🔍 DEBUG - useServiceTypeCategoryConfigs - Response:', response);
      console.log('🔍 DEBUG - useServiceTypeCategoryConfigs - Response length:', response?.length);
      setConfigs(response);
    } catch (err) {
      console.error('Error fetching service type category configs:', err);
      setError('Error al obtener configuraciones por categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const createConfig = async (config: CreateServiceTypeCategoryConfigDto): Promise<ServiceTypeCategoryConfigDto> => {
    try {
      console.log('➕ Creando configuración por categoría:', config);

      // Validar que los porcentajes sumen 100%
      const total = config.clientPercentage + config.expertPercentage + config.platformPercentage;
      if (total !== 100) {
        throw new Error(`Los porcentajes deben sumar 100%. Actual: ${total}%`);
      }

      // Preparar datos en el formato correcto para el backend
      const submitData = {
        action: "create",
        statusId: parseInt(config.status), // Convertir string a número
        categoryId: config.categoryId !== undefined ? config.categoryId : null,
        serviceTypeCategoryId: config.serviceTypeCategoryId !== undefined ? config.serviceTypeCategoryId : null,
        clientPercentage: config.clientPercentage,
        expertPercentage: config.expertPercentage,
        platformPercentage: config.platformPercentage,
        isActive: config.isActive
      };

      console.log('📤 Enviando datos de creación por categoría:', submitData);

      // Usar el endpoint correcto
      const response = await fetchApi<ServiceTypeCategoryConfigDto>(API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs, {
        method: 'POST',
        body: JSON.stringify(submitData)
      });
      
      console.log('✅ Configuración por categoría creada:', response);
      await fetchConfigs(); // Refrescar la lista
      return response;
    } catch (error) {
      console.error('❌ Error creating category config:', error);
      throw error;
    }
  };

  const updateConfig = async (id: number, config: CreateServiceTypeCategoryConfigDto): Promise<ServiceTypeCategoryConfigDto> => {
    try {
      console.log('🔄 Actualizando configuración por categoría ID:', id);

      // Validar que los porcentajes sumen 100%
      const total = config.clientPercentage + config.expertPercentage + config.platformPercentage;
      if (total !== 100) {
        throw new Error(`Los porcentajes deben sumar 100%. Actual: ${total}%`);
      }

      // Preparar datos en el formato correcto para el backend
      const submitData = {
        action: "update",
        configId: id,
        statusId: parseInt(config.status), // Convertir string a número
        categoryId: config.categoryId, // ✅ CORREGIDO: Usar config.categoryId en lugar de null
        serviceTypeCategoryId: config.serviceTypeCategoryId,
        clientPercentage: config.clientPercentage,
        expertPercentage: config.expertPercentage,
        platformPercentage: config.platformPercentage,
        isActive: config.isActive
      };

      console.log('📤 Enviando datos de actualización por categoría:', submitData);

      // Usar el endpoint correcto
      const response = await fetchApi<ServiceTypeCategoryConfigDto>(API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs, {
        method: 'POST',
        body: JSON.stringify(submitData)
      });
      
      console.log('✅ Configuración por categoría actualizada:', response);
      await fetchConfigs(); // Refrescar la lista
      return response;
    } catch (error) {
      console.error('❌ Error updating category config:', error);
      throw error;
    }
  };

  const deleteConfig = async (id: number): Promise<void> => {
    try {
      console.log('🗑️ Eliminando configuración por categoría ID:', id);
      
      // Preparar datos en el formato correcto para el backend
      const submitData = {
        action: "delete",
        configId: id,
        statusId: 1, // Valor temporal requerido
        categoryId: null,
        serviceTypeCategoryId: null,
        clientPercentage: 0, // Valores temporales requeridos
        expertPercentage: 0,
        platformPercentage: 0,
        isActive: true
      };

      console.log('📤 Enviando datos de eliminación por categoría:', submitData);

      // Usar el endpoint correcto
      await fetchApi(API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs, {
        method: 'POST',
        body: JSON.stringify(submitData)
      });
      
      console.log('✅ Configuración por categoría eliminada');
      await fetchConfigs(); // Refrescar la lista
    } catch (error) {
      console.error('❌ Error deleting category config:', error);
      throw error;
    }
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
      const params = new URLSearchParams({ statusValue: status });
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
  const validateForm = (data: ConfigFormData, configType: 'status' | 'category' | 'granular' | 'query' = 'status'): string[] => {
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
    
    if (!data.statusId || data.statusId <= 0) {
      errors.push('Debe seleccionar un estado de cita');
    }
    
    // Validaciones condicionales según el tipo de configuración
    if (configType === 'granular') {
      if (data.categoryId !== undefined && data.categoryId <= 0) {
        errors.push('Debe seleccionar una categoría válida');
      }
    }
    
    if (configType === 'category' || configType === 'granular') {
      // ✅ CORREGIDO: Permitir serviceTypeCategoryId: null para "todos los tipos de servicio"
      if (data.serviceTypeCategoryId !== undefined && data.serviceTypeCategoryId !== null && data.serviceTypeCategoryId <= 0) {
        errors.push('Debe seleccionar una categoría de servicio válida');
      }
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
export const useCategoryServiceTypeConfigs = (page: number = 1, pageSize: number = 20) => {
  const [configs, setConfigs] = useState<CategoryServiceTypeConfigDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null>(null);
  const { fetchApi } = useApi();

  const fetchConfigs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Usar el endpoint específico para configuraciones granulares con paginación
      const endpoint = `${API_CONFIG.endpoints.appointmentConfig.granularConfigurations}?page=${page}&pageSize=${pageSize}`;
      console.log('🔍 DEBUG - useCategoryServiceTypeConfigs - Endpoint:', endpoint);
      const response = await fetchApi<any>(endpoint);
      console.log('🔍 DEBUG - useCategoryServiceTypeConfigs - Response:', response);
      
      // Manejar respuesta paginada o no paginada
      if (response.configs && response.pagination) {
        setConfigs(response.configs);
        setPagination(response.pagination);
      } else if (Array.isArray(response)) {
        setConfigs(response);
        setPagination(null);
      } else {
        setConfigs([]);
        setPagination(null);
      }
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

  // Cargar configuraciones automáticamente al montar el componente o cuando cambian los parámetros de paginación
  useEffect(() => {
    fetchConfigs();
  }, [page, pageSize]);

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
      console.log('➕ Creando configuración granular:', config);

      // Validar que los porcentajes sumen 100%
      const total = config.clientPercentage + config.expertPercentage + config.platformPercentage;
      if (total !== 100) {
        throw new Error(`Los porcentajes deben sumar 100%. Actual: ${total}%`);
      }

      // Preparar datos en el formato correcto para el backend
      const submitData = {
        action: "create",
        statusId: parseInt(config.status), // Convertir string a número
        categoryId: config.categoryId,
        serviceTypeCategoryId: config.serviceTypeCategoryId,
        clientPercentage: config.clientPercentage,
        expertPercentage: config.expertPercentage,
        platformPercentage: config.platformPercentage,
        isActive: config.isActive
      };

      console.log('📤 Enviando datos de creación granular:', submitData);

      // Usar el endpoint correcto
      const response = await fetchApi<CategoryServiceTypeConfigDto>(API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs, {
        method: 'POST',
        body: JSON.stringify(submitData),
      });
      
      console.log('✅ Configuración granular creada:', response);
      
      // Refrescar la lista de configuraciones granulares
      await fetchConfigs();
      
      return response;
    } catch (err) {
      console.error('❌ Error creating granular config:', err);
      throw err;
    }
  };

  const updateConfig = async (id: number, config: CreateCategoryServiceTypeConfigDto) => {
    try {
      console.log('🔄 Actualizando configuración granular ID:', id);

      // Validar que los porcentajes sumen 100%
      const total = config.clientPercentage + config.expertPercentage + config.platformPercentage;
      if (total !== 100) {
        throw new Error(`Los porcentajes deben sumar 100%. Actual: ${total}%`);
      }

      // Preparar datos en el formato correcto para el backend
      const submitData = {
        action: "update",
        configId: id,
        statusId: parseInt(config.status), // Convertir string a número
        categoryId: config.categoryId,
        serviceTypeCategoryId: config.serviceTypeCategoryId,
        clientPercentage: config.clientPercentage,
        expertPercentage: config.expertPercentage,
        platformPercentage: config.platformPercentage,
        isActive: config.isActive
      };

      console.log('📤 Enviando datos de actualización granular:', submitData);

      // Usar el endpoint correcto
      const response = await fetchApi<CategoryServiceTypeConfigDto>(API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs, {
        method: 'POST',
        body: JSON.stringify(submitData),
      });
      
      console.log('✅ Configuración granular actualizada:', response);
      setConfigs(prev => prev.map(c => c.id === id ? response : c));
      return response;
    } catch (err) {
      console.error('❌ Error updating granular config:', err);
      throw err;
    }
  };

  const deleteConfig = async (id: number) => {
    try {
      console.log('🗑️ Eliminando configuración granular ID:', id);
      
      // Preparar datos en el formato correcto para el backend
      const submitData = {
        action: "delete",
        configId: id,
        statusId: 1, // Valor temporal requerido
        categoryId: null,
        serviceTypeCategoryId: null,
        clientPercentage: 0, // Valores temporales requeridos
        expertPercentage: 0,
        platformPercentage: 0,
        isActive: true
      };

      console.log('📤 Enviando datos de eliminación granular:', submitData);

      // Usar el endpoint correcto
      await fetchApi(API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs, {
        method: 'POST',
        body: JSON.stringify(submitData),
      });
      
      console.log('✅ Configuración granular eliminada');
      setConfigs(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('❌ Error deleting granular config:', err);
      throw err;
    }
  };

  return {
    configs,
    isLoading,
    error,
    pagination,
    fetchConfigs,
    getConfigsByCategory,
    getConfigsByServiceType,
    createConfig,
    updateConfig,
    deleteConfig
  };
};

// Función para cargar configuraciones según el tab activo
export const loadConfigurationsByTab = async (activeTab: 'status' | 'category' | 'granular' | 'query' | 'mappings') => {
  try {
    console.log('🔄 Cargando configuraciones para tab:', activeTab);
    
    let endpoint = '';
    
    switch (activeTab) {
      case 'status':
        // Nivel 4 - Por Defecto (configuraciones base)
        endpoint = API_CONFIG.endpoints.appointmentConfig.appointmentStatusConfigs;
        break;
      case 'category':
        // Nivel 3 - Granularidad Básica (configuraciones por categoría)
        endpoint = '/api/AppointmentConfig/configurations-by-category';
        break;
      case 'granular':
        // Nivel 1 - Máxima Granularidad (configuraciones granulares)
        endpoint = '/api/AppointmentConfig/granular-configurations';
        break;
      case 'mappings':
        // Para mapeos, no necesitamos cargar configuraciones aquí
        return [];
      default:
        throw new Error(`Tab no válido: ${activeTab}`);
    }
    
    console.log('📡 Llamando endpoint:', endpoint);
    
    // Usar fetch directamente para evitar problemas con fetchApi
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error cargando configuraciones: ${response.status}`);
    }
    
    const configs = await response.json();
    console.log(`✅ Configuraciones cargadas para ${activeTab}:`, configs);
    
    return configs;
    
  } catch (error) {
    console.error('❌ Error cargando configuraciones:', error);
    throw error;
  }
};

// ✅ HOOK PARA GESTIÓN DE ESTADOS DE FINALIZACIÓN CON PAGINACIÓN
export const useAppointmentStatusManagement = (page: number = 1, pageSize: number = 20) => {
  const { fetchApi } = useApi();
  const [statuses, setStatuses] = useState<AppointmentStatusDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null>(null);

  const fetchAllStatuses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = `${API_CONFIG.endpoints.appointmentConfig.allStatuses}?page=${page}&pageSize=${pageSize}`;
      console.log('🔍 DEBUG - useAppointmentStatusManagement - Fetching all statuses...');
      console.log('🔍 DEBUG - useAppointmentStatusManagement - Endpoint:', endpoint);
      const response = await fetchApi<any>(endpoint);
      console.log('🔍 DEBUG - useAppointmentStatusManagement - Response:', response);
      
      // Manejar respuesta paginada o no paginada
      let statusesArray: any[] = [];
      
      if (response.statuses && response.pagination) {
        statusesArray = response.statuses;
        setPagination(response.pagination);
      } else if (Array.isArray(response)) {
        statusesArray = response;
        setPagination(null);
      } else {
        setStatuses([]);
        setPagination(null);
        return;
      }
      
      // ✅ NORMALIZAR: Asegurar que todos los estados tengan displayName, statusName, etc. en camelCase
      const normalizedStatuses = statusesArray.map((status: any) => ({
        id: status.id || status.Id,
        statusType: status.statusType || status.StatusType,
        statusName: status.statusName || status.StatusName,
        statusValue: status.statusValue || status.StatusValue,
        displayName: status.displayName || status.DisplayName, // ⭐ CRÍTICO: Normalizar displayName
        description: status.description || status.Description,
        sortOrder: status.sortOrder || status.SortOrder,
        isActive: status.isActive ?? status.IsActive ?? true,
        isFinalizationStatus: status.isFinalizationStatus ?? status.IsFinalizationStatus ?? false,
        // Mantener propiedades originales para compatibilidad
        ...status
      }));
      
      setStatuses(normalizedStatuses);
      
      // Log detallado de cada estado
      if (normalizedStatuses.length > 0) {
        normalizedStatuses.forEach((status: any, index: number) => {
          console.log(`🔍 DEBUG - Estado ${index + 1}:`, {
            id: status.id,
            statusType: status.statusType,
            statusName: status.statusName,
            statusValue: status.statusValue,
            displayName: status.displayName,
            description: status.description,
            sortOrder: status.sortOrder,
            isActive: status.isActive,
            isFinalizationStatus: status.isFinalizationStatus
          });
        });
      }
    } catch (err) {
      console.error('Error fetching all statuses:', err);
      setError('Error al obtener todos los estados');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, fetchApi]);

  // Ejecutar automáticamente cuando cambien page o pageSize
  // Mover la lógica directamente al useEffect para evitar loops causados por fetchApi
  useEffect(() => {
    let isMounted = true;
    
    const loadStatuses = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const endpoint = `${API_CONFIG.endpoints.appointmentConfig.allStatuses}?page=${page}&pageSize=${pageSize}`;
        console.log('🔍 DEBUG - useAppointmentStatusManagement - Fetching all statuses...');
        console.log('🔍 DEBUG - useAppointmentStatusManagement - Endpoint:', endpoint);
        const response = await fetchApi<any>(endpoint);
        
        if (!isMounted) return;
        
        console.log('🔍 DEBUG - useAppointmentStatusManagement - Response:', response);
        
        // Manejar respuesta paginada o no paginada
        let statusesArray: any[] = [];
        
        if (response.statuses && response.pagination) {
          statusesArray = response.statuses;
          setPagination(response.pagination);
        } else if (Array.isArray(response)) {
          statusesArray = response;
          setPagination(null);
        } else {
          setStatuses([]);
          setPagination(null);
          return;
        }
        
        // ✅ NORMALIZAR: Asegurar que todos los estados tengan displayName, statusName, etc. en camelCase
        const normalizedStatuses = statusesArray.map((status: any) => ({
          id: status.id || status.Id,
          statusType: status.statusType || status.StatusType,
          statusName: status.statusName || status.StatusName,
          statusValue: status.statusValue || status.StatusValue,
          displayName: status.displayName || status.DisplayName, // ⭐ CRÍTICO: Normalizar displayName
          description: status.description || status.Description,
          sortOrder: status.sortOrder || status.SortOrder,
          isActive: status.isActive ?? status.IsActive ?? true,
          isFinalizationStatus: status.isFinalizationStatus ?? status.IsFinalizationStatus ?? false,
          // Mantener propiedades originales para compatibilidad
          ...status
        }));
        
        setStatuses(normalizedStatuses);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching all statuses:', err);
        setError('Error al obtener todos los estados');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadStatuses();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const updateFinalizationStatus = async (statusId: number, isFinalizationStatus: boolean) => {
    try {
      console.log(`🔄 Actualizando estado de finalización para statusId: ${statusId}, isFinalizationStatus: ${isFinalizationStatus}`);
      
      const response = await fetchApi<AppointmentStatusDto>(
        API_CONFIG.endpoints.appointmentConfig.updateFinalizationStatus(statusId),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isFinalizationStatus }),
        }
      );

      console.log('✅ Estado de finalización actualizado:', response);
      
      // Actualizar el estado local
      setStatuses(prevStatuses => 
        prevStatuses.map(status => 
          status.id === statusId 
            ? { ...status, isFinalizationStatus }
            : status
        )
      );

      return response;
    } catch (err) {
      console.error('Error updating finalization status:', err);
      setError('Error al actualizar estado de finalización');
      throw err;
    }
  };

  return {
    statuses,
    isLoading,
    error,
    pagination,
    fetchAllStatuses,
    updateFinalizationStatus,
  };
};
