import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { StatusMapping, SystemStatus, CreateStatusMappingDto } from '../types/admin';

export const useStatusMappings = () => {
  const [mappings, setMappings] = useState<StatusMapping[]>([]);
  const [appointmentStatuses, setAppointmentStatuses] = useState<SystemStatus[]>([]);
  const [searchHireStatuses, setSearchHireStatuses] = useState<SystemStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchApi } = useApi();

  const loadMappings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando mapeos de estado desde:', API_CONFIG.endpoints.systemStatus.mappings);
      const response = await fetchApi<StatusMapping[]>(API_CONFIG.endpoints.systemStatus.mappings);
      console.log('✅ Mapeos de estado cargados:', response);
      setMappings(response);
    } catch (err: any) {
      console.error('❌ Error loading status mappings:', err);
      if (err.message?.includes('404')) {
        setError('Los endpoints de mapeos de estado no están implementados en el backend');
      } else {
        setError(`Error al cargar mapeos de estado: ${err.message || 'Error desconocido'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadAppointmentStatuses = async () => {
    try {
      console.log('🔄 Cargando estados de cita desde:', API_CONFIG.endpoints.systemStatus.statusesByType('AppointmentStatus'));
      const response = await fetchApi<SystemStatus[]>(API_CONFIG.endpoints.systemStatus.statusesByType('AppointmentStatus'));
      console.log('✅ Estados de cita cargados:', response);
      console.log('🔍 DEBUG - Estados de cita IDs disponibles:', response.map(s => s.id));
      setAppointmentStatuses(response);
    } catch (err: any) {
      console.error('❌ Error loading appointment statuses:', err);
      if (err.message?.includes('404')) {
        console.warn('⚠️ Endpoints de estados de cita no implementados en el backend');
      }
    }
  };

  const loadSearchHireStatuses = async () => {
    try {
      console.log('🔄 Cargando estados generales desde:', API_CONFIG.endpoints.systemStatus.statusesByType('SearchHireStatus'));
      const response = await fetchApi<SystemStatus[]>(API_CONFIG.endpoints.systemStatus.statusesByType('SearchHireStatus'));
      console.log('✅ Estados generales cargados:', response);
      console.log('🔍 DEBUG - Estados generales IDs disponibles:', response.map(s => s.id));
      setSearchHireStatuses(response);
    } catch (err: any) {
      console.error('❌ Error loading search hire statuses:', err);
      if (err.message?.includes('404')) {
        console.warn('⚠️ Endpoints de estados generales no implementados en el backend');
      }
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando todos los datos de mapeos de estado...');
      
      // Cargar mapeos primero (el más importante)
      await loadMappings();
      
      // Cargar estados en paralelo (no críticos si fallan)
      await Promise.allSettled([
        loadAppointmentStatuses(),
        loadSearchHireStatuses()
      ]);
      
      console.log('✅ Todos los datos de mapeos cargados');
    } catch (err) {
      console.error('❌ Error loading all data:', err);
      setError('Error al cargar datos de mapeos de estado');
    } finally {
      setIsLoading(false);
    }
  };

  const createMapping = async (data: CreateStatusMappingDto): Promise<StatusMapping> => {
    try {
      console.log('➕ Creando nuevo mapeo:', data);
      
      // Validar que ambos IDs existen
      if (!data.sourceStatusId || data.sourceStatusId === 0) {
        throw new Error("SourceStatusId no puede ser 0 o vacío");
      }
      
      if (!data.targetStatusId || data.targetStatusId === 0) {
        throw new Error("TargetStatusId no puede ser 0 o vacío");
      }
      
      // Enviar directamente al backend - que el backend valide
      const response = await fetchApi<StatusMapping>(API_CONFIG.endpoints.systemStatus.mappings, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      console.log('✅ Mapeo creado exitosamente:', response);
      await loadMappings(); // Recargar mapeos
      return response;
    } catch (err: any) {
      console.error('❌ Error al crear mapeo:', err);
      
      // Si el error es por estados no existentes, refrescar todos los datos
      if (err.message?.includes('no existen') || err.message?.includes('not found')) {
        console.log('🔄 Refrescando todos los datos debido a error de estados...');
        await loadAllData();
        throw new Error('Los estados han cambiado. Por favor, intenta nuevamente.');
      }
      
      throw err;
    }
  };

  const updateMapping = async (mappingId: number, data: { sourceStatusId: number; targetStatusId: number }): Promise<StatusMapping> => {
    try {
      console.log('🔄 Actualizando mapeo ID:', mappingId, data);
      console.log('🔍 DEBUG - URL del request:', API_CONFIG.endpoints.systemStatus.mappingsById(mappingId));
      console.log('🔍 DEBUG - Body del request:', JSON.stringify(data));
      
      // Validar que ambos IDs existen
      if (!data.sourceStatusId || data.sourceStatusId === 0) {
        throw new Error("SourceStatusId no puede ser 0 o vacío");
      }
      
      if (!data.targetStatusId || data.targetStatusId === 0) {
        throw new Error("TargetStatusId no puede ser 0 o vacío");
      }
      
      // Enviar directamente al backend - que el backend valide
      const response = await fetchApi<StatusMapping>(API_CONFIG.endpoints.systemStatus.mappingsById(mappingId), {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      console.log('✅ Mapeo actualizado exitosamente:', response);
      await loadMappings(); // Recargar mapeos
      return response;
    } catch (err: any) {
      console.error('❌ Error al actualizar mapeo:', err);
      
      // Log detallado del error del backend
      if (err.missingStatuses) {
        console.log('🔍 DEBUG - Estados faltantes:', err.missingStatuses);
      }
      if (err.availableStatuses) {
        console.log('🔍 DEBUG - Estados disponibles en backend:', err.availableStatuses);
      }
      
      // Si el error es por estados no existentes, refrescar todos los datos
      if (err.message?.includes('no existen') || err.message?.includes('not found') || err.message?.includes('no existe')) {
        console.log('🔄 Refrescando todos los datos debido a error de estados...');
        await loadAllData();
        throw new Error('Los estados han cambiado. Por favor, intenta nuevamente.');
      }
      
      throw err;
    }
  };

  const deleteMapping = async (mappingId: number): Promise<void> => {
    try {
      console.log('🗑️ Eliminando mapeo ID:', mappingId);
      
      await fetchApi(API_CONFIG.endpoints.systemStatus.mappingsById(mappingId), {
        method: 'DELETE'
      });
      
      console.log('✅ Mapeo eliminado exitosamente');
      await loadMappings(); // Recargar mapeos
    } catch (err) {
      console.error('❌ Error al eliminar mapeo:', err);
      throw err;
    }
  };

  // Métodos para gestionar estados del sistema
  const createStatus = async (data: any): Promise<SystemStatus> => {
    try {
      console.log('➕ Creando nuevo estado:', data);
      
      const response = await fetchApi<SystemStatus>(API_CONFIG.endpoints.systemStatus.statuses, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      console.log('✅ Estado creado exitosamente:', response);
      await loadAllData(); // Recargar todos los datos
      return response;
    } catch (err) {
      console.error('❌ Error al crear estado:', err);
      throw err;
    }
  };

  const updateStatus = async (statusId: number, data: any): Promise<SystemStatus> => {
    try {
      console.log('🔄 Actualizando estado ID:', statusId, data);
      
      const response = await fetchApi<SystemStatus>(API_CONFIG.endpoints.systemStatus.statusesById(statusId), {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      console.log('✅ Estado actualizado exitosamente:', response);
      await loadAllData(); // Recargar todos los datos
      return response;
    } catch (err) {
      console.error('❌ Error al actualizar estado:', err);
      throw err;
    }
  };

  const deleteStatus = async (statusId: number): Promise<void> => {
    try {
      console.log('🗑️ Eliminando estado ID:', statusId);
      
      await fetchApi(API_CONFIG.endpoints.systemStatus.statusesById(statusId), {
        method: 'DELETE'
      });
      
      console.log('✅ Estado eliminado exitosamente');
      await loadAllData(); // Recargar todos los datos
    } catch (err) {
      console.error('❌ Error al eliminar estado:', err);
      throw err;
    }
  };

  // Método para refrescar todos los datos
  const refreshAllData = async () => {
    console.log('🔄 Refrescando todos los datos de mapeos...');
    await loadAllData();
  };

  // Auto-refresh cada 30 segundos para mantener datos actualizados
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('🔄 Auto-refresh de datos de mapeos...');
      await loadAllData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAllData();
  }, []);

  return {
    mappings,
    appointmentStatuses,
    searchHireStatuses,
    isLoading,
    error,
    loadMappings,
    loadAllData,
    refreshAllData,
    createMapping,
    updateMapping,
    deleteMapping,
    createStatus,
    updateStatus,
    deleteStatus
  };
};
