import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { StatusMapping, SystemStatus, CreateStatusMappingDto } from '../types/admin';

export const useStatusMappings = (page: number = 1, pageSize: number = 20) => {
  const [mappings, setMappings] = useState<StatusMapping[]>([]); // ✅ Inicializado como array vacío
  const [appointmentStatuses, setAppointmentStatuses] = useState<SystemStatus[]>([]); // ✅ Inicializado como array vacío
  const [searchHireStatuses, setSearchHireStatuses] = useState<SystemStatus[]>([]); // ✅ Inicializado como array vacío
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappingsPagination, setMappingsPagination] = useState<{
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null>(null);
  const { fetchApi } = useApi();

  const loadMappings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = `${API_CONFIG.endpoints.systemStatus.mappings}?page=${page}&pageSize=${pageSize}`;
      console.log('🔄 Cargando mapeos de estado desde:', endpoint);
      const response = await fetchApi<any>(endpoint);
      console.log('✅ Mapeos de estado cargados:', response);
      
      // ✅ NORMALIZAR mapeos según la guía
      let mappingsArray: any[] = [];
      
      if (response.mappings && response.pagination) {
        mappingsArray = response.mappings;
        setMappingsPagination(response.pagination);
      } else if (Array.isArray(response)) {
        mappingsArray = response;
        setMappingsPagination(null);
      } else {
        setMappings([]);
        setMappingsPagination(null);
        return;
      }
      
      // ✅ NORMALIZAR cada mapeo: el backend devuelve PascalCase (SourceStatus, TargetStatus, DisplayName, etc.)
      const normalizedMappings = mappingsArray.map((mapping: any) => {
        // ⭐ El backend devuelve SourceStatus y TargetStatus en PascalCase
        const sourceStatusRaw = mapping.SourceStatus || mapping.sourceStatus;
        const targetStatusRaw = mapping.TargetStatus || mapping.targetStatus;
        
        return {
          id: mapping.Id || mapping.id,
          isActive: mapping.IsActive ?? mapping.isActive ?? true,
          createdAt: mapping.CreatedAt || mapping.createdAt,
          updatedAt: mapping.UpdatedAt || mapping.updatedAt,
          sourceStatus: sourceStatusRaw ? {
            id: sourceStatusRaw.Id || sourceStatusRaw.id,
            statusType: sourceStatusRaw.StatusType || sourceStatusRaw.statusType,
            statusName: sourceStatusRaw.StatusName || sourceStatusRaw.statusName,
            statusValue: sourceStatusRaw.StatusValue || sourceStatusRaw.statusValue,
            displayName: sourceStatusRaw.DisplayName || sourceStatusRaw.displayName, // ⭐ CRÍTICO: Backend devuelve DisplayName
            description: sourceStatusRaw.Description || sourceStatusRaw.description,
            sortOrder: sourceStatusRaw.SortOrder || sourceStatusRaw.sortOrder,
            isActive: sourceStatusRaw.IsActive ?? sourceStatusRaw.isActive ?? true,
            createdAt: sourceStatusRaw.CreatedAt || sourceStatusRaw.createdAt,
            updatedAt: sourceStatusRaw.UpdatedAt || sourceStatusRaw.updatedAt,
          } : null,
          targetStatus: targetStatusRaw ? {
            id: targetStatusRaw.Id || targetStatusRaw.id,
            statusType: targetStatusRaw.StatusType || targetStatusRaw.statusType,
            statusName: targetStatusRaw.StatusName || targetStatusRaw.statusName,
            statusValue: targetStatusRaw.StatusValue || targetStatusRaw.statusValue,
            displayName: targetStatusRaw.DisplayName || targetStatusRaw.displayName, // ⭐ CRÍTICO: Backend devuelve DisplayName
            description: targetStatusRaw.Description || targetStatusRaw.description,
            sortOrder: targetStatusRaw.SortOrder || targetStatusRaw.sortOrder,
            isActive: targetStatusRaw.IsActive ?? targetStatusRaw.isActive ?? true,
            createdAt: targetStatusRaw.CreatedAt || targetStatusRaw.createdAt,
            updatedAt: targetStatusRaw.UpdatedAt || targetStatusRaw.updatedAt,
          } : null,
        };
      });
      
      console.log('✅ Mapeos normalizados:', normalizedMappings);
      setMappings(normalizedMappings);
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
      const response = await fetchApi<any>(API_CONFIG.endpoints.systemStatus.statusesByType('AppointmentStatus'));
      console.log('✅ Estados de cita cargados (raw):', response);
      
      // ✅ NORMALIZAR estados según la guía: el backend devuelve PascalCase
      const normalizedStatuses = (Array.isArray(response) ? response : []).map((status: any) => ({
        id: status.Id || status.id,
        statusType: status.StatusType || status.statusType,
        statusName: status.StatusName || status.statusName,
        statusValue: status.StatusValue || status.statusValue,
        displayName: status.DisplayName || status.displayName, // ⭐ CRÍTICO: Backend devuelve DisplayName
        description: status.Description || status.description,
        sortOrder: status.SortOrder || status.sortOrder,
        isActive: status.IsActive ?? status.isActive ?? true,
        createdAt: status.CreatedAt || status.createdAt,
        updatedAt: status.UpdatedAt || status.updatedAt,
      }));
      
      console.log('✅ Estados de cita normalizados:', normalizedStatuses);
      console.log('🔍 DEBUG - Estados de cita IDs disponibles:', normalizedStatuses.map(s => s.id));
      setAppointmentStatuses(normalizedStatuses);
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
      const response = await fetchApi<any>(API_CONFIG.endpoints.systemStatus.statusesByType('SearchHireStatus'));
      console.log('✅ Estados generales cargados (raw):', response);
      
      // ✅ NORMALIZAR estados según la guía: el backend devuelve PascalCase
      const normalizedStatuses = (Array.isArray(response) ? response : []).map((status: any) => ({
        id: status.Id || status.id,
        statusType: status.StatusType || status.statusType,
        statusName: status.StatusName || status.statusName,
        statusValue: status.StatusValue || status.statusValue,
        displayName: status.DisplayName || status.displayName, // ⭐ CRÍTICO: Backend devuelve DisplayName
        description: status.Description || status.description,
        sortOrder: status.SortOrder || status.sortOrder,
        isActive: status.IsActive ?? status.isActive ?? true,
        createdAt: status.CreatedAt || status.createdAt,
        updatedAt: status.UpdatedAt || status.updatedAt,
      }));
      
      console.log('✅ Estados generales normalizados:', normalizedStatuses);
      console.log('🔍 DEBUG - Estados generales IDs disponibles:', normalizedStatuses.map(s => s.id));
      setSearchHireStatuses(normalizedStatuses);
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

  // Cargar datos al montar el componente o cuando cambian los parámetros de paginación.
  // Sin auto-refresh por polling: estos catálogos (mapeos/estados del sistema) son casi
  // estáticos y ya se recargan tras cada mutación (create/update/delete -> loadAllData)
  // y mediante el botón "Refrescar" (refreshAllData). El setInterval de 60s disparaba
  // 3 GET/min indefinidos sin aportar frescura.
  useEffect(() => {
    loadAllData();
  }, [page, pageSize]);

  return {
    mappings,
    appointmentStatuses,
    searchHireStatuses,
    mappingsPagination,
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