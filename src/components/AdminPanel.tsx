import React, { useState } from 'react';
import { Settings, Plus, Edit, Trash2, Search, Save, X } from 'lucide-react';
import { useAppointmentStatusConfigs, useServiceTypeCategoryConfigs, useCategoryServiceTypeConfigs, useMoneyDistributionQuery, useConfigValidation, useAppointmentStatuses, useAppointmentStatusManagement } from '../hooks/useAdminConfig';
import { useStatusMappings } from '../hooks/useStatusMappings';
import { ConfigFormData } from '../types/admin';
import PriorityInfo from './PriorityInfo';
import PriorityBadge from './PriorityBadge';
import { API_CONFIG } from '../config/api';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'category' | 'granular' | 'query' | 'mappings'>('status');
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [formData, setFormData] = useState<ConfigFormData>({
    statusId: 0,
    categoryId: undefined,
    serviceTypeCategoryId: undefined,
    clientPercentage: 0,
    expertPercentage: 0,
    platformPercentage: 0,
    isActive: true
  });
  
  // Estados para categorías y tipos de servicio
  const [categories, setCategories] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<number | null>(null);
  const [loadingBasicData, setLoadingBasicData] = useState(true);


  // Estados para mapeos de estado
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [mappingFormData, setMappingFormData] = useState({
    sourceStatusId: 0,
    targetStatusId: 0,
    isActive: true
  });

  // Hooks
  const appointmentStatusConfigs = useAppointmentStatusConfigs();
  const serviceTypeCategoryConfigs = useServiceTypeCategoryConfigs();
  const granularConfigs = useCategoryServiceTypeConfigs();
  const moneyDistributionQuery = useMoneyDistributionQuery();
  const { validateForm } = useConfigValidation();
  const appointmentStatuses = useAppointmentStatuses();
  const statusMappings = useStatusMappings();
  const statusManagement = useAppointmentStatusManagement();

  // Cargar datos básicos al montar el componente
  React.useEffect(() => {
    const loadBasicData = async () => {
      try {
        setLoadingBasicData(true);
        console.log('🔄 Cargando datos básicos...');
        
        // Hacer los 4 GETs en paralelo (incluyendo estados de finalización)
        const [statusesRes, categoriesRes, serviceTypesRes] = await Promise.all([
          fetch(`${API_CONFIG.baseUrl}/api/AppointmentConfig/appointment-status`),
          fetch(`${API_CONFIG.baseUrl}/api/AppointmentConfig/categories`),
          fetch(`${API_CONFIG.baseUrl}/api/AppointmentConfig/service-types`)
        ]);

        // Cargar estados de finalización
        await statusManagement.fetchAllStatuses();

        // Verificar que las respuestas sean exitosas
        if (!statusesRes.ok) throw new Error(`Error cargando estados: ${statusesRes.status}`);
        if (!categoriesRes.ok) throw new Error(`Error cargando categorías: ${categoriesRes.status}`);
        if (!serviceTypesRes.ok) throw new Error(`Error cargando tipos de servicio: ${serviceTypesRes.status}`);

        // Convertir a JSON
        const [statusesData, categoriesData, serviceTypesData] = await Promise.all([
          statusesRes.json(),
          categoriesRes.json(),
          serviceTypesRes.json()
        ]);

        console.log('✅ Estados cargados:', statusesData);
        console.log('✅ Categorías cargadas:', categoriesData);
        console.log('✅ Tipos de servicio cargados:', serviceTypesData);

        // Actualizar el estado
        setCategories(categoriesData);
        setServiceTypes(serviceTypesData);
        
        // También actualizar los estados del hook si es necesario
        if (appointmentStatuses.statuses.length === 0) {
          // Forzar recarga de estados si no están cargados
          appointmentStatuses.fetchStatuses?.();
        }

      } catch (error: any) {
        console.error('❌ Error cargando datos básicos:', error);
        alert('Error cargando datos: ' + error.message);
      } finally {
        setLoadingBasicData(false);
      }
    };
    
    loadBasicData();
  }, []);

  // Función para obtener configuraciones según el tab activo
  const getConfigsForTab = () => {
    switch (activeTab) {
      case 'status':
        return appointmentStatusConfigs.configs;
      case 'category':
        return serviceTypeCategoryConfigs.configs;
      case 'granular':
        return granularConfigs.configs;
      default:
        return [];
    }
  };

  // Función para obtener estado de carga según el tab activo
  const getLoadingForTab = () => {
    switch (activeTab) {
      case 'status':
        return appointmentStatusConfigs.isLoading;
      case 'category':
        return serviceTypeCategoryConfigs.isLoading;
      case 'granular':
        return granularConfigs.isLoading;
      default:
        return false;
    }
  };

  // Función para obtener error según el tab activo
  const getErrorForTab = () => {
    switch (activeTab) {
      case 'status':
        return appointmentStatusConfigs.error;
      case 'category':
        return serviceTypeCategoryConfigs.error;
      case 'granular':
        return granularConfigs.error;
      default:
        return null;
    }
  };

  // Estados para la consulta
  const [queryStatus, setQueryStatus] = useState('');
  const [queryCategoryId, setQueryCategoryId] = useState<number | undefined>(undefined);
  const [queryServiceTypeCategoryId, setQueryServiceTypeCategoryId] = useState<number | undefined>(undefined);

  const handleCreateConfig = async () => {
    // Validar que los porcentajes sumen 100%
    const total = formData.clientPercentage + formData.expertPercentage + formData.platformPercentage;
    if (total !== 100) {
      alert(`Los porcentajes deben sumar 100%. Actual: ${total}%`);
      return;
    }

    // Validar que se haya seleccionado una categoría para configuraciones por categoría y granulares
    if ((activeTab === 'category' || activeTab === 'granular') && !selectedCategoryId) {
      alert('Debes seleccionar una categoría para crear esta configuración');
      return;
    }

    // Validar que se haya seleccionado un tipo de servicio para configuraciones granulares
    if (activeTab === 'granular' && !selectedServiceTypeId) {
      alert('Debes seleccionar un tipo de servicio para crear una configuración granular');
      return;
    }

    const errors = validateForm(formData, activeTab);
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    try {
      if (activeTab === 'status') {
        // Preparar datos según el tipo de configuración
        let submitData: any = {
          statusId: formData.statusId,
          clientPercentage: formData.clientPercentage,
          expertPercentage: formData.expertPercentage,
          platformPercentage: formData.platformPercentage,
          isActive: formData.isActive
        };

        // Agregar categoría y tipo de servicio según el tipo de configuración
        if (activeTab === 'category' || activeTab === 'granular') {
          submitData.categoryId = selectedCategoryId;
        }

        if (activeTab === 'granular') {
          submitData.serviceTypeCategoryId = selectedServiceTypeId;
        }

        console.log('=== DEBUG FRONTEND ===');
        console.log('ActiveTab:', activeTab);
        console.log('FormData:', formData);
        console.log('SelectedCategoryId:', selectedCategoryId);
        console.log('SelectedServiceTypeId:', selectedServiceTypeId);
        console.log('SubmitData ANTES de createConfig:', submitData);
        console.log('Total percentage:', total);
        console.log('=== FIN DEBUG FRONTEND ===');

        await appointmentStatusConfigs.createConfig(submitData);
        
        // Limpiar formulario después de crear
        setFormData({
          statusId: 0,
          clientPercentage: 0,
          expertPercentage: 0,
          platformPercentage: 0,
          isActive: true
        });
        setSelectedCategoryId(null);
        setSelectedServiceTypeId(null);
        setShowForm(false);
      } else if (activeTab === 'category') {
        await serviceTypeCategoryConfigs.createConfig({
          categoryId: selectedCategoryId!,
          serviceTypeCategoryId: null, // Para configuraciones por categoría, serviceTypeCategoryId debe ser null
          status: formData.statusId.toString(),
          clientPercentage: formData.clientPercentage,
          expertPercentage: formData.expertPercentage,
          platformPercentage: formData.platformPercentage,
          isActive: formData.isActive
        });
      } else if (activeTab === 'granular') {
        await granularConfigs.createConfig({
          categoryId: selectedCategoryId!,
          serviceTypeCategoryId: selectedServiceTypeId!,
          status: formData.statusId.toString(),
          clientPercentage: formData.clientPercentage,
          expertPercentage: formData.expertPercentage,
          platformPercentage: formData.platformPercentage,
          isActive: formData.isActive
        });
        setSelectedCategoryId(null);
        setSelectedServiceTypeId(null);
      }
      
      // Mostrar mensaje de éxito
      alert('✅ Configuración creada correctamente');
      
      setShowForm(false);
      resetForm();
      
      // ✅ CORREGIDO: Solo refrescar el hook correspondiente al tipo de configuración
      setTimeout(() => {
        console.log('🔄 Refrescando datos después de crear...');
        if (activeTab === 'status') {
          appointmentStatusConfigs.fetchConfigs();
        } else if (activeTab === 'category') {
          serviceTypeCategoryConfigs.fetchConfigs();
        } else if (activeTab === 'granular') {
          granularConfigs.fetchConfigs();
        }
        console.log('✅ Datos refrescados exitosamente');
      }, 500);
    } catch (error: any) {
      console.error('Error creating config:', error);
      alert(`❌ Error: ${error.message || 'Error al crear la configuración'}`);
    }
  };

  const handleUpdateConfig = async () => {
    try {
      console.log('🔄 DEBUG - handleUpdateConfig - Iniciando actualización');
      console.log('🔄 DEBUG - handleUpdateConfig - editingConfig:', editingConfig);
      console.log('🔄 DEBUG - handleUpdateConfig - formData:', formData);
      console.log('🔄 DEBUG - handleUpdateConfig - activeTab:', activeTab);
      console.log('🔄 DEBUG - handleUpdateConfig - selectedCategoryId:', selectedCategoryId);
      console.log('🔄 DEBUG - handleUpdateConfig - selectedServiceTypeId:', selectedServiceTypeId);

      // Validar datos
      if (!formData.statusId || formData.statusId <= 0) {
        alert('Debe seleccionar un estado válido');
        return;
      }

      // Validar que los porcentajes sumen 100%
      const total = formData.clientPercentage + formData.expertPercentage + formData.platformPercentage;
      if (total !== 100) {
        alert(`Los porcentajes deben sumar 100%. Actual: ${total}%`);
        return;
      }

      // Validaciones específicas para configuraciones granulares
      if (activeTab === 'granular') {
        if (!formData.categoryId) {
          alert('Debe seleccionar una categoría para configuraciones granulares');
          return;
        }
        if (!formData.serviceTypeCategoryId) {
          alert('Debe seleccionar un tipo de servicio para configuraciones granulares');
          return;
        }
      }

      const errors = validateForm(formData, activeTab);
      if (errors.length > 0) {
        console.log('🔄 DEBUG - handleUpdateConfig - Errores de validación:', errors);
        alert(errors.join('\n'));
        return;
      }

      // Llamar a la función de actualización según el tipo de configuración
      if (activeTab === 'status') {
        // Preparar datos para configuraciones por estado
        let updateData: any = {
          statusId: formData.statusId,
          clientPercentage: formData.clientPercentage,
          expertPercentage: formData.expertPercentage,
          platformPercentage: formData.platformPercentage,
          isActive: formData.isActive
        };

        console.log('🔄 DEBUG - handleUpdateConfig - updateData final (status):', updateData);
        await appointmentStatusConfigs.updateConfig(editingConfig.id, updateData);
            } else if (activeTab === 'category') {
        await serviceTypeCategoryConfigs.updateConfig(editingConfig.id, {
          categoryId: formData.categoryId!, // ✅ AGREGADO: Incluir categoryId
          serviceTypeCategoryId: formData.serviceTypeCategoryId!,
          status: formData.statusId.toString(),
          clientPercentage: formData.clientPercentage,
          expertPercentage: formData.expertPercentage,
          platformPercentage: formData.platformPercentage,
          isActive: formData.isActive
        });
      } else if (activeTab === 'granular') {
        await granularConfigs.updateConfig(editingConfig.id, {
          categoryId: formData.categoryId!,
          serviceTypeCategoryId: formData.serviceTypeCategoryId!,
          status: formData.statusId.toString(),
          clientPercentage: formData.clientPercentage,
          expertPercentage: formData.expertPercentage,
          platformPercentage: formData.platformPercentage,
          isActive: formData.isActive
        });
      }
      
      // Cerrar modal y recargar datos
      setShowForm(false);
      setEditingConfig(null);
      resetForm();
      
      // ✅ CORREGIDO: Solo refrescar el hook correspondiente al tipo de configuración
      setTimeout(() => {
        console.log('🔄 Refrescando datos después de actualizar...');
        if (activeTab === 'status') {
          appointmentStatusConfigs.fetchConfigs();
        } else if (activeTab === 'category') {
          serviceTypeCategoryConfigs.fetchConfigs();
        } else if (activeTab === 'granular') {
          granularConfigs.fetchConfigs();
        }
        console.log('✅ Datos refrescados exitosamente');
      }, 500);
      
      // Mostrar mensaje de éxito
      alert('✅ Configuración actualizada correctamente');
      
    } catch (error: any) {
      console.error('❌ Error updating config:', error);
      alert(`❌ Error: ${error.message || 'Error al actualizar la configuración'}`);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      return;
    }

    try {
      console.log('🗑️ Eliminando configuración ID:', id);
      
      if (activeTab === 'status') {
        await appointmentStatusConfigs.deleteConfig(id);
      } else if (activeTab === 'category') {
        await serviceTypeCategoryConfigs.deleteConfig(id);
      } else if (activeTab === 'granular') {
        await granularConfigs.deleteConfig(id);
      }
      
      // ✅ CORREGIDO: Solo refrescar el hook correspondiente al tipo de configuración
      setTimeout(() => {
        console.log('🔄 Refrescando datos después de eliminar...');
        if (activeTab === 'status') {
          appointmentStatusConfigs.fetchConfigs();
        } else if (activeTab === 'category') {
          serviceTypeCategoryConfigs.fetchConfigs();
        } else if (activeTab === 'granular') {
          granularConfigs.fetchConfigs();
        }
        console.log('✅ Datos refrescados exitosamente');
      }, 500);
      
      alert('✅ Configuración eliminada correctamente');
    } catch (error: any) {
      console.error('❌ Error deleting config:', error);
      alert(`❌ Error: ${error.message || 'Error al eliminar la configuración'}`);
    }
  };

  // ✅ MAPEO DE NOMBRES DE ESTADOS (usando la nueva estructura del backend)
  const getStatusDisplayName = (status: any) => {
    // ✅ PRIORIDAD 1: Usar displayName del backend (más confiable)
    if (status.displayName && status.displayName.trim() !== '') {
      console.log(`🔍 DEBUG - getStatusDisplayName - DisplayName del backend: "${status.displayName}"`);
      return status.displayName.trim();
    }
    
    // ✅ PRIORIDAD 2: Usar statusName como fallback
    if (status.statusName && status.statusName.trim() !== '') {
      console.log(`🔍 DEBUG - getStatusDisplayName - StatusName del backend: "${status.statusName}"`);
      return status.statusName.trim();
    }
    
    // ✅ PRIORIDAD 3: Usar name (compatibilidad con estructura anterior)
    if (status.name && status.name.trim() !== '') {
      console.log(`🔍 DEBUG - getStatusDisplayName - Name del backend: "${status.name}"`);
      return status.name.trim();
    }
    
    // ✅ FALLBACK: Estado genérico
    console.log(`🔍 DEBUG - getStatusDisplayName - Sin nombre, usando fallback: "Estado ${status.id}"`);
    return `Estado ${status.id}`;
  };

  // ✅ FUNCIÓN PARA VERIFICAR SI UN ESTADO TIENE CONFIGURACIÓN
  const hasConfiguration = (statusId: number) => {
    // Verificar en configuraciones por estado
    const hasStatusConfig = appointmentStatusConfigs.configs.some(config => 
      config.statusId === statusId
    );
    
    // Verificar en configuraciones por categoría (usar 'status' en lugar de 'statusId')
    const hasCategoryConfig = serviceTypeCategoryConfigs.configs.some(config => 
      config.status && config.status.includes(statusId.toString())
    );
    
    // Verificar en configuraciones granulares
    const hasGranularConfig = granularConfigs.configs.some(config => 
      config.status && config.status.includes(statusId.toString())
    );
    
    return hasStatusConfig || hasCategoryConfig || hasGranularConfig;
  };

  // ✅ FUNCIÓN PARA TOGGLE DE ESTADO DE FINALIZACIÓN
  const handleToggleFinalizationStatus = async (statusId: number, currentStatus: boolean) => {
    try {
      console.log(`🔄 Cambiando estado de finalización para statusId: ${statusId}, de ${currentStatus} a ${!currentStatus}`);
      
      await statusManagement.updateFinalizationStatus(statusId, !currentStatus);
      
      alert(`✅ Estado de finalización ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('Error actualizando estado de finalización:', error);
      alert('❌ Error al actualizar el estado de finalización');
    }
  };

  const handleEditConfig = (config: any) => {
    console.log('🔍 DEBUG - handleEditConfig - Config recibida:', config);
    console.log('🔍 DEBUG - handleEditConfig - Campos disponibles:', Object.keys(config));
    console.log('🔍 DEBUG - handleEditConfig - categoryId:', config.categoryId);
    console.log('🔍 DEBUG - handleEditConfig - serviceTypeCategoryId:', config.serviceTypeCategoryId);
    console.log('🔍 DEBUG - handleEditConfig - activeTab actual:', activeTab);
    console.log('🔍 DEBUG - handleEditConfig - Config completa para granular:', {
      id: config.id,
      statusId: config.statusId,
      categoryId: config.categoryId,
      serviceTypeCategoryId: config.serviceTypeCategoryId,
      cliente: config.cliente,
      experto: config.experto,
      plataforma: config.plataforma,
      activo: config.activo,
      clientPercentage: config.clientPercentage,
      expertPercentage: config.expertPercentage,
      platformPercentage: config.platformPercentage,
      isActive: config.isActive
    });
    
    setEditingConfig(config);
    setFormData({
      statusId: config.statusId || 0,
      categoryId: config.categoryId || null, // ✅ AGREGADO: Incluir categoryId
      serviceTypeCategoryId: config.serviceTypeCategoryId,
      clientPercentage: Number(config.cliente || config.clientPercentage || 0), // ✅ Asegurar que sea número
      expertPercentage: Number(config.experto || config.expertPercentage || 0), // ✅ Asegurar que sea número
      platformPercentage: Number(config.plataforma || config.platformPercentage || 0), // ✅ Asegurar que sea número
      isActive: config.activo === 'Activo' || config.isActive || true
    });
    
    console.log('🔍 DEBUG - handleEditConfig - FormData establecida:', {
      statusId: config.statusId || 0,
      categoryId: config.categoryId || null,
      serviceTypeCategoryId: config.serviceTypeCategoryId,
      clientPercentage: Number(config.cliente || config.clientPercentage || 0),
      expertPercentage: Number(config.experto || config.expertPercentage || 0),
      platformPercentage: Number(config.plataforma || config.platformPercentage || 0),
      isActive: config.activo === 'Activo' || config.isActive || true
    });
    
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      statusId: 0,
      categoryId: undefined, // ✅ AGREGADO: Resetear categoryId
      serviceTypeCategoryId: undefined, // ✅ AGREGADO: Resetear serviceTypeCategoryId
      clientPercentage: 0,
      expertPercentage: 0,
      platformPercentage: 0,
      isActive: true
    });
  };

  // Funciones para manejar mapeos de estado
  const handleCreateMapping = async () => {
    try {
      if (mappingFormData.sourceStatusId === 0 || mappingFormData.targetStatusId === 0) {
        alert('Por favor selecciona tanto el estado origen como el estado destino');
        return;
      }

      if (mappingFormData.sourceStatusId === mappingFormData.targetStatusId) {
        alert('El estado origen y destino no pueden ser el mismo');
        return;
      }

      await statusMappings.createMapping(mappingFormData);
      alert('✅ Mapeo creado exitosamente');
      setShowMappingForm(false);
      resetMappingForm();
    } catch (error: any) {
      console.error('Error creating mapping:', error);
      
      // Si el error es por estados no existentes, refrescar datos
      if (error.message?.includes('han cambiado') || error.message?.includes('no existe')) {
        alert(`⚠️ ${error.message}\n\nLos datos se han refrescado automáticamente.`);
        await statusMappings.refreshAllData();
      } else {
        alert(`❌ Error al crear mapeo: ${error.message || 'Error desconocido'}`);
      }
    }
  };

  const handleUpdateMapping = async (mappingId: number, updates: any) => {
    try {
      
      // 1. Obtener el mapeo actual para saber el sourceStatusId
      const currentMapping = statusMappings.mappings.find(m => m.id === mappingId);
      if (!currentMapping) {
        throw new Error("Mapeo no encontrado");
      }
      
      // 2. Validar que el targetStatusId existe
      const targetStatusExists = statusMappings.searchHireStatuses.some(s => s.id === updates.targetStatusId);
      if (!targetStatusExists) {
        throw new Error(`El estado con ID ${updates.targetStatusId} no existe`);
      }
      
      // 3. Enviar AMBOS IDs en el request
      const fullUpdateData = {
        sourceStatusId: currentMapping.sourceStatus.id,  // ← ESTO ES CLAVE
        targetStatusId: updates.targetStatusId
      };
      
      await statusMappings.updateMapping(mappingId, fullUpdateData);
      alert('✅ Mapeo actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating mapping:', error);
      
      // Si el error es por estados no existentes, refrescar datos
      if (error.message?.includes('han cambiado') || error.message?.includes('no existe')) {
        alert(`⚠️ ${error.message}\n\nLos datos se han refrescado automáticamente.`);
        await statusMappings.refreshAllData();
      } else {
        alert(`❌ Error al actualizar mapeo: ${error.message || 'Error desconocido'}`);
      }
    }
  };

  const handleDeleteMapping = async (mappingId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este mapeo?')) return;

    try {
      await statusMappings.deleteMapping(mappingId);
      alert('✅ Mapeo eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting mapping:', error);
      alert(`❌ Error al eliminar mapeo: ${error.message || 'Error desconocido'}`);
    }
  };

  const resetMappingForm = () => {
    setMappingFormData({
      sourceStatusId: 0,
      targetStatusId: 0,
      isActive: true
    });
  };

  const handleQueryConfig = () => {
    if (!queryStatus) {
      alert('Debe seleccionar un estado de cita');
      return;
    }
    moneyDistributionQuery.queryConfig(queryStatus, queryCategoryId, queryServiceTypeCategoryId);
  };

  const getStatusLabel = (config: any) => {
    // Usar el campo 'estado' que viene del backend
    return config.estado || config.status || 'Estado no disponible';
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="text-gray-600">Gestionar porcentajes de distribución de dinero</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sistema de Prioridades - Información */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">🎯</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Sistema de Prioridades</h2>
              <p className="text-gray-600 mb-4">El sistema busca configuraciones en este orden de prioridad:</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-3xl">🥇</span>
                <span className="font-bold text-green-800 text-lg">Nivel 1</span>
              </div>
              <p className="text-sm text-green-700 font-semibold mb-2">Máxima Granularidad</p>
              <p className="text-xs text-green-600 leading-relaxed">Category + ServiceTypeCategory + Status</p>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-3xl">🥈</span>
                <span className="font-bold text-blue-800 text-lg">Nivel 2</span>
              </div>
              <p className="text-sm text-blue-700 font-semibold mb-2">Granularidad Media</p>
              <p className="text-xs text-blue-600 leading-relaxed">ServiceTypeCategory + Status</p>
            </div>
            
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-3xl">🥉</span>
                <span className="font-bold text-orange-800 text-lg">Nivel 3</span>
              </div>
              <p className="text-sm text-orange-700 font-semibold mb-2">Granularidad Básica</p>
              <p className="text-xs text-orange-600 leading-relaxed">Solo Status</p>
            </div>
            
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-3xl">🏅</span>
                <span className="font-bold text-gray-800 text-lg">Nivel 4</span>
              </div>
              <p className="text-sm text-gray-700 font-semibold mb-2">Por Defecto</p>
              <p className="text-xs text-gray-600 leading-relaxed">Configuración del sistema</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">💡</span>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">¿Cómo funciona?</p>
                <p>El sistema busca configuraciones desde el Nivel 1 hasta el Nivel 4. Si encuentra una configuración en un nivel superior, no busca en los niveles inferiores. Esto permite máxima flexibilidad con configuraciones específicas y fallbacks automáticos.</p>
              </div>
            </div>
          </div>
        </div>


        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('status')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'status'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Configuraciones por Estado
              </button>
              <button
                onClick={() => setActiveTab('category')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'category'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏷️ Configuraciones por Categoría
              </button>
              <button
                onClick={() => setActiveTab('granular')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'granular'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎯 Configuraciones Granulares
              </button>
              <button
                onClick={() => setActiveTab('query')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'query'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔍 Consulta de Configuración
              </button>
              <button
                onClick={() => setActiveTab('mappings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'mappings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔗 Mapeos de Estado
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'status' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Configuraciones por Estado de Cita</h2>
                <button
                  onClick={() => {
                    setEditingConfig(null);
                    resetForm();
                    setShowForm(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Nueva
                </button>
              </div>
              

              {/* Mensaje informativo sobre funcionalidad completa */}
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Sistema Completamente Funcional
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>✅ Crear, editar y eliminar configuraciones funcionando correctamente. ✅ Soporte para configuraciones por estado, categoría y granular.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ NUEVA SECCIÓN: GESTIÓN DE ESTADOS DE FINALIZACIÓN */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">
                    🎯 Gestión de Estados de Finalización
                  </h3>
                  <button
                    onClick={() => statusManagement.fetchAllStatuses()}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    🔄 Actualizar
                  </button>
                </div>
                
                <p className="text-sm text-blue-700 mb-4">
                  Marca qué estados son considerados de "finalización" para las configuraciones de distribución de dinero.
                </p>


                {/* ✅ RESUMEN ESTADÍSTICO COMPACTO */}
                <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">📊 {statusManagement.statuses.length}</span>
                    {statusManagement.statuses.filter(s => s.isFinalizationStatus && !hasConfiguration(s.id)).length > 0 && (
                      <span className="text-red-600">⚠️ {statusManagement.statuses.filter(s => s.isFinalizationStatus && !hasConfiguration(s.id)).length}</span>
                    )}
                    <span className="text-green-600">✅ {statusManagement.statuses.filter(s => s.isFinalizationStatus).length}</span>
                    <span className="text-gray-600">⏳ {statusManagement.statuses.filter(s => !s.isFinalizationStatus).length}</span>
                  </div>
                </div>

                {statusManagement.isLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-blue-600">Cargando estados...</p>
                  </div>
                ) : statusManagement.error ? (
                  <div className="text-center py-4">
                    <p className="text-red-600 text-sm">❌ {statusManagement.error}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* ✅ GRUPO: ESTADOS SIN CONFIGURACIÓN (PRIMERO) */}
                    {statusManagement.statuses.filter(s => s.isFinalizationStatus && !hasConfiguration(s.id)).length > 0 && (
                      <div>
                        <h4 className="text-base font-semibold text-red-800 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          ⚠️ Sin Config ({statusManagement.statuses.filter(s => s.isFinalizationStatus && !hasConfiguration(s.id)).length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                          {statusManagement.statuses
                            .filter(status => status.isFinalizationStatus && !hasConfiguration(status.id))
                            .sort((a, b) => a.id - b.id)
                            .map((status) => (
                              <div
                                key={status.id}
                                className="p-2 rounded border bg-red-50 border-red-300 transition-all"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium text-gray-900 text-sm truncate">
                                    {getStatusDisplayName(status)}
                                  </h4>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-nowrap">
                                    {status.id}
                                  </span>
                                </div>
                                
                                {/* ✅ STATUS VALUE COMPACTO */}
                                {status.statusValue && (
                                  <p className="text-xs font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded mb-1 truncate">
                                    {status.statusValue}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    ⚠️
                                  </span>
                                  <button
                                    onClick={() => handleToggleFinalizationStatus(status.id, status.isFinalizationStatus)}
                                    className="px-2 py-0.5 text-xs rounded transition-colors bg-red-100 text-red-700 hover:bg-red-200"
                                  >
                                    ❌
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* ✅ GRUPO: ESTADOS DE FINALIZACIÓN (TODOS) */}
                    {statusManagement.statuses.filter(s => s.isFinalizationStatus).length > 0 && (
                      <div>
                        <h4 className="text-base font-semibold text-green-800 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          ✅ Final ({statusManagement.statuses.filter(s => s.isFinalizationStatus).length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                          {statusManagement.statuses
                            .filter(status => status.isFinalizationStatus)
                            .sort((a, b) => a.id - b.id)
                            .map((status) => (
                              <div
                                key={status.id}
                                className={`p-2 rounded border transition-all ${
                                  hasConfiguration(status.id) 
                                    ? 'bg-green-50 border-green-300' 
                                    : 'bg-red-50 border-red-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium text-gray-900 text-sm truncate">
                                    {getStatusDisplayName(status)}
                                  </h4>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-nowrap">
                                    {status.id}
                                  </span>
                                </div>
                                
                                {/* ✅ STATUS VALUE COMPACTO */}
                                {status.statusValue && (
                                  <p className="text-xs font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded mb-1 truncate">
                                    {status.statusValue}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      ✅
                                    </span>
                                    {!hasConfiguration(status.id) && (
                                      <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                        ⚠️
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleToggleFinalizationStatus(status.id, status.isFinalizationStatus)}
                                    className="px-2 py-0.5 text-xs rounded transition-colors bg-red-100 text-red-700 hover:bg-red-200"
                                  >
                                    ❌
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* ✅ GRUPO: ESTADOS INTERMEDIOS */}
                    <div>
                      <h4 className="text-base font-semibold text-gray-700 mb-2 flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                        ⏳ Inter ({statusManagement.statuses.filter(s => !s.isFinalizationStatus).length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                        {statusManagement.statuses
                          .filter(status => !status.isFinalizationStatus)
                          .sort((a, b) => a.id - b.id)
                          .map((status) => (
                            <div
                              key={status.id}
                              className="p-2 rounded border bg-gray-50 border-gray-200 transition-all"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {getStatusDisplayName(status)}
                                </h4>
                                <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-nowrap">
                                  {status.id}
                                </span>
                              </div>
                              
                              {/* ✅ STATUS VALUE COMPACTO */}
                              {status.statusValue && (
                                <p className="text-xs font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded mb-1 truncate">
                                  {status.statusValue}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  ⏳
                                </span>
                                <button
                                  onClick={() => handleToggleFinalizationStatus(status.id, status.isFinalizationStatus)}
                                  className="px-2 py-0.5 text-xs rounded transition-colors bg-green-100 text-green-700 hover:bg-green-200"
                                >
                                  ✅
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {getLoadingForTab() ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Cargando configuraciones...</p>
                </div>
              ) : getErrorForTab() ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-4">
                    <p className="text-lg font-semibold">Error al cargar configuraciones</p>
                    <p className="text-sm">{getErrorForTab()}</p>
                  </div>
                  <button
                    onClick={() => appointmentStatusConfigs.fetchConfigs()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plataforma</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getConfigsForTab().map((config) => (
                        <tr key={config.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getStatusLabel(config)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {config.cliente}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {config.experto}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {config.plataforma}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <PriorityBadge type="status" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              config.activo === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {config.activo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditConfig(config)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteConfig(config.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'category' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Configuraciones por Categoría de Servicio</h2>
                <button
                  onClick={() => {
                    setEditingConfig(null);
                    resetForm();
                    setShowForm(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Nueva
                </button>
              </div>

              {getLoadingForTab() ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Cargando configuraciones...</p>
                </div>
              ) : getErrorForTab() ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-4">
                    <p className="text-lg font-semibold">Error al cargar configuraciones</p>
                    <p className="text-sm">{getErrorForTab()}</p>
                  </div>
                  <button
                    onClick={() => serviceTypeCategoryConfigs.fetchConfigs()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {getConfigsForTab().length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-lg">No hay configuraciones por categoría</p>
                      <p className="text-gray-400 text-sm mt-2">Crea una nueva configuración para verla aquí</p>
                    </div>
                  ) : (
                    categories.map((category) => {
                      const categoryConfigs = getConfigsForTab().filter((config: any) => {
                        return config.categoryId === category.id && !config.serviceTypeCategoryId;
                      });
                    return (
                      <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{category.name}</h3>
                        {categoryConfigs.length === 0 ? (
                          <p className="text-gray-500 text-sm">No hay configuraciones para esta categoría</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experto</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plataforma</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {categoryConfigs.map((config) => (
                                  <tr key={config.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {getStatusLabel(config)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {config.cliente}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {config.experto}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {config.plataforma}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <PriorityBadge type="service-type" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        config.activo === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {config.activo}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <button
                                        onClick={() => handleEditConfig(config)}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteConfig(config.id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'granular' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Configuraciones Granulares (Category + ServiceType)</h2>
                <button
                  onClick={() => {
                    setEditingConfig(null);
                    setFormData({
                      statusId: 0,
                      clientPercentage: 0,
                      expertPercentage: 0,
                      platformPercentage: 0,
                      isActive: true
                    });
                    setShowForm(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Nueva Configuración
                </button>
              </div>

              {getLoadingForTab() ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando configuraciones granulares...</span>
                </div>
              ) : getErrorForTab() ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <X className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error al cargar configuraciones</h3>
                      <p className="mt-2 text-sm text-red-700">{getErrorForTab()}</p>
                      <button
                        onClick={() => granularConfigs.fetchConfigs()}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {getConfigsForTab().length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-lg">No hay configuraciones granulares</p>
                      <p className="text-gray-400 text-sm mt-2">Crea una nueva configuración para verla aquí</p>
                    </div>
                  ) : (
                    categories.map((category: any) => {
                      const granularConfigs = getConfigsForTab().filter((config: any) => {
                        return config.categoryId === category.id && config.serviceTypeCategoryId;
                      });
                      return (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-xl font-semibold text-gray-700 mb-4">{category.name}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Servicio</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente (%)</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experto (%)</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plataforma (%)</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                             {granularConfigs.map((config) => (
                              <tr key={config.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{config.serviceTypeCategoryName || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{config.estado}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{config.cliente}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{config.experto}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{config.plataforma}%</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <PriorityBadge type="granular" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    config.activo === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {config.activo}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => handleEditConfig(config)}
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteConfig(config.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    );
                  })
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'query' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Consulta de Configuración Aplicada</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Cita</label>
                  <select
                    value={queryStatus}
                    onChange={(e) => setQueryStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar estado...</option>
                    {appointmentStatuses.statuses.map((status: any) => (
                      <option key={status.id} value={status.statusValue}>
                        {status.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría Principal (Opcional)</label>
                  <select
                    value={queryCategoryId || ''}
                    onChange={(e) => setQueryCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingBasicData}
                  >
                    <option value="">
                      {loadingBasicData ? 'Cargando categorías...' : 'Todas las categorías'}
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Servicio (Opcional)</label>
                  <select
                    value={queryServiceTypeCategoryId || ''}
                    onChange={(e) => setQueryServiceTypeCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingBasicData}
                  >
                    <option value="">
                      {loadingBasicData ? 'Cargando tipos de servicio...' : 'Todos los tipos'}
                    </option>
                    {serviceTypes.map((serviceType) => (
                      <option key={serviceType.id} value={serviceType.id}>
                        {serviceType.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleQueryConfig}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Search className="w-4 h-4 mr-2" />
                Consultar Configuración
              </button>

              {moneyDistributionQuery.isLoading && (
                <div className="mt-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Consultando configuración...</p>
                </div>
              )}

              {moneyDistributionQuery.config && (
                <div className="mt-6 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración Aplicada</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded border">
                        <div className="text-sm text-gray-600">Cliente</div>
                        <div className="text-2xl font-bold text-green-600">{moneyDistributionQuery.config.clientPercentage}%</div>
                      </div>
                      <div className="bg-white p-4 rounded border">
                        <div className="text-sm text-gray-600">Experto</div>
                        <div className="text-2xl font-bold text-blue-600">{moneyDistributionQuery.config.expertPercentage}%</div>
                      </div>
                      <div className="bg-white p-4 rounded border">
                        <div className="text-sm text-gray-600">Plataforma</div>
                        <div className="text-2xl font-bold text-gray-600">{moneyDistributionQuery.config.platformPercentage}%</div>
                      </div>
                    </div>
                    <div className="mt-4 text-center p-3 bg-indigo-50 rounded-md border border-indigo-100 font-bold text-indigo-800">
                      Total: {moneyDistributionQuery.config.clientPercentage + moneyDistributionQuery.config.expertPercentage + moneyDistributionQuery.config.platformPercentage}%
                    </div>
                  </div>

                  <PriorityInfo
                    source={moneyDistributionQuery.config.source}
                    categoryName={moneyDistributionQuery.config.categoryName}
                    serviceTypeCategoryName={moneyDistributionQuery.config.serviceTypeCategoryName}
                    status={moneyDistributionQuery.config.status}
                  />
                </div>
              )}

              {moneyDistributionQuery.error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{moneyDistributionQuery.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingConfig ? 'Editar Configuración' : 'Crear Nueva Configuración'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingConfig(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); editingConfig ? handleUpdateConfig() : handleCreateConfig(); }}>


                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Cita</label>
                    <select
                      value={formData.statusId}
                      onChange={(e) => setFormData({ ...formData, statusId: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loadingBasicData}
                      onFocus={() => {
                        console.log('🔍 DEBUG - Select estado - onFocus - formData.statusId:', formData.statusId);
                        console.log('🔍 DEBUG - Select estado - onFocus - editingConfig:', editingConfig);
                      }}
                    >
                      <option value={0}>
                        {loadingBasicData ? 'Cargando estados...' : 'Seleccionar estado...'}
                      </option>
                      {appointmentStatuses.statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dropdown para categorías (solo para category y granular) */}
                  {(activeTab === 'category' || activeTab === 'granular') && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría
                      </label>
                      <select
                        value={editingConfig ? (formData.categoryId || '') : (selectedCategoryId || '')}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          if (editingConfig) {
                            // ✅ CORREGIDO: Al editar, actualizar formData en lugar de selectedCategoryId
                            setFormData({ ...formData, categoryId: value || undefined });
                            console.log('🔍 DEBUG - Select categoría - Actualizando formData.categoryId:', value);
                          } else {
                            setSelectedCategoryId(value);
                            console.log('🔍 DEBUG - Select categoría - Actualizando selectedCategoryId:', value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={loadingBasicData}
                        onFocus={() => {
                          console.log('🔍 DEBUG - Select categoría - onFocus - editingConfig:', editingConfig);
                          console.log('🔍 DEBUG - Select categoría - onFocus - formData.categoryId:', formData.categoryId);
                          console.log('🔍 DEBUG - Select categoría - onFocus - selectedCategoryId:', selectedCategoryId);
                          console.log('🔍 DEBUG - Select categoría - onFocus - value mostrado:', editingConfig ? (formData.categoryId || '') : (selectedCategoryId || ''));
                        }}
                      >
                        <option value="">
                          {loadingBasicData ? 'Cargando categorías...' : 'Seleccionar categoría...'}
                        </option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {categories.length === 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          No se pudieron cargar las categorías. Verifica la consola para más detalles.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Dropdown para tipos de servicio (solo para granular) */}
                  {activeTab === 'granular' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Servicio
                      </label>
                      <select
                        value={editingConfig ? (formData.serviceTypeCategoryId || '') : (selectedServiceTypeId || '')}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          if (editingConfig) {
                            // ✅ CORREGIDO: Al editar, actualizar formData en lugar de selectedServiceTypeId
                            setFormData({ ...formData, serviceTypeCategoryId: value || undefined });
                            console.log('🔍 DEBUG - Select tipo servicio - Actualizando formData.serviceTypeCategoryId:', value);
                          } else {
                            setSelectedServiceTypeId(value);
                            console.log('🔍 DEBUG - Select tipo servicio - Actualizando selectedServiceTypeId:', value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={loadingBasicData}
                        onFocus={() => {
                          console.log('🔍 DEBUG - Select tipo servicio - onFocus - editingConfig:', editingConfig);
                          console.log('🔍 DEBUG - Select tipo servicio - onFocus - formData.serviceTypeCategoryId:', formData.serviceTypeCategoryId);
                          console.log('🔍 DEBUG - Select tipo servicio - onFocus - selectedServiceTypeId:', selectedServiceTypeId);
                          console.log('🔍 DEBUG - Select tipo servicio - onFocus - value mostrado:', editingConfig ? (formData.serviceTypeCategoryId || '') : (selectedServiceTypeId || ''));
                        }}
                      >
                        <option value="">
                          {loadingBasicData ? 'Cargando tipos de servicio...' : 'Seleccionar tipo de servicio...'}
                        </option>
                        {serviceTypes.map((serviceType) => (
                          <option key={serviceType.id} value={serviceType.id}>
                            {serviceType.name}
                          </option>
                        ))}
                      </select>
                      {serviceTypes.length === 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          No se pudieron cargar los tipos de servicio. Verifica la consola para más detalles.
                        </p>
                      )}
                    </div>
                  )}

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.clientPercentage || 0}
                      onChange={(e) => setFormData({ ...formData, clientPercentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experto (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.expertPercentage || 0}
                      onChange={(e) => setFormData({ ...formData, expertPercentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plataforma (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.platformPercentage || 0}
                      onChange={(e) => setFormData({ ...formData, platformPercentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Indicador del total de porcentajes */}
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total:</span>
                    <span className={`text-lg font-bold ${
                      (formData.clientPercentage + formData.expertPercentage + formData.platformPercentage) === 100 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formData.clientPercentage + formData.expertPercentage + formData.platformPercentage}%
                    </span>
                  </div>
                  {(formData.clientPercentage + formData.expertPercentage + formData.platformPercentage) !== 100 && (
                    <p className="text-xs text-red-600 mt-1">
                      Los porcentajes deben sumar exactamente 100%
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Configuración activa</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingConfig(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingConfig ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

          {/* Pestaña de Mapeos de Estado */}
          {activeTab === 'mappings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Mapeos de Estado</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={async () => {
                      try {
                        await statusMappings.refreshAllData();
                        alert('✅ Datos refrescados exitosamente');
                      } catch (error) {
                        alert('❌ Error al refrescar datos');
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    title="Refrescar datos de mapeos y estados"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refrescar
                  </button>
                  <button
                    onClick={() => {
                      resetMappingForm();
                      setShowMappingForm(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Mapeo
                  </button>
                </div>
              </div>

              {statusMappings.isLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Cargando mapeos de estado...</div>
                </div>
              ) : statusMappings.error ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Endpoints de Mapeos de Estado No Implementados
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>{statusMappings.error}</p>
                        <p className="mt-2">
                          <strong>Para implementar esta funcionalidad, el backend necesita:</strong>
                        </p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                          <li><code>GET /api/SystemStatus/status-mappings</code></li>
                          <li><code>POST /api/SystemStatus/status-mappings</code></li>
                          <li><code>PUT /api/SystemStatus/status-mappings/&#123;id&#125;</code></li>
                          <li><code>DELETE /api/SystemStatus/status-mappings/&#123;id&#125;</code></li>
                          <li><code>GET /api/SystemStatus/statuses/&#123;statusType&#125;</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Mapeos de Estado Existentes
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Configuración de qué estados de cita se mapean a qué estados generales
                    </p>
                  </div>
                  
                  {statusMappings.mappings.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">No hay mapeos configurados</div>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {statusMappings.mappings.map((mapping) => (
                        <li key={mapping.id} className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {mapping.sourceStatus.statusType === 'AppointmentStatus' ? 'A' : 'S'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium text-gray-900">
                                    {mapping.sourceStatus.displayName}
                                  </p>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({mapping.sourceStatus.statusValue})
                                  </span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <span className="text-sm text-gray-500">→</span>
                                  <p className="ml-2 text-sm text-gray-900">
                                    {mapping.targetStatus.displayName}
                                  </p>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({mapping.targetStatus.statusValue})
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                mapping.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {mapping.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                              <button
                                onClick={() => {
                                  // Crear un modal simple para editar el estado destino
                                  const modal = document.createElement('div');
                                  modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
                                  
                                  const modalContent = document.createElement('div');
                                  modalContent.className = 'relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white';
                                  
                                  // Verificar que los estados están cargados
                                  if (statusMappings.searchHireStatuses.length === 0) {
                                    alert('⚠️ Los estados no están cargados. Refrescando datos...');
                                    statusMappings.refreshAllData();
                                    return;
                                  }
                                  
                                  
                                  modalContent.innerHTML = `
                                    <div class="mt-3">
                                      <div class="flex items-center justify-between mb-4">
                                        <h3 class="text-lg font-medium text-gray-900">Editar Estado Destino</h3>
                                        <button id="closeModal" class="text-gray-400 hover:text-gray-600">
                                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                          </svg>
                                        </button>
                                      </div>
                                      
                                      <div class="mb-4">
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                          Estado Origen: <strong>${mapping.sourceStatus.displayName}</strong>
                                        </label>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                          Nuevo Estado Destino:
                                        </label>
                                        <select id="newTargetStatus" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                          ${statusMappings.searchHireStatuses.map(status => 
                                            `<option value="${status.id}" ${status.id === mapping.targetStatus.id ? 'selected' : ''}>
                                              ${status.displayName} (${status.statusValue})
                                            </option>`
                                          ).join('')}
                                        </select>
                                        <p class="text-xs text-gray-500 mt-1">
                                          Estados disponibles: ${statusMappings.searchHireStatuses.map(s => s.id).join(', ')}
                                        </p>
                                      </div>
                                      
                                      <div class="flex justify-end space-x-3">
                                        <button id="cancelEdit" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                                          Cancelar
                                        </button>
                                        <button id="saveEdit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                          Guardar
                                        </button>
                                      </div>
                                    </div>
                                  `;
                                  
                                  modal.appendChild(modalContent);
                                  document.body.appendChild(modal);
                                  
                                  // Event listeners
                                  document.getElementById('closeModal')?.addEventListener('click', () => {
                                    document.body.removeChild(modal);
                                  });
                                  
                                  document.getElementById('cancelEdit')?.addEventListener('click', () => {
                                    document.body.removeChild(modal);
                                  });
                                  
                                  document.getElementById('saveEdit')?.addEventListener('click', () => {
                                    const select = document.getElementById('newTargetStatus') as HTMLSelectElement;
                                    const newTargetStatusId = Number(select.value);
                                    
                                    // Validar que el estado seleccionado existe en la lista actual
                                    const selectedStatusExists = statusMappings.searchHireStatuses.some(s => s.id === newTargetStatusId);
                                    
                                    if (!selectedStatusExists) {
                                      alert(`⚠️ El estado con ID ${newTargetStatusId} no existe en la lista actual. Refrescando datos...`);
                                      statusMappings.refreshAllData();
                                      document.body.removeChild(modal);
                                      return;
                                    }
                                    
                                    if (newTargetStatusId !== mapping.targetStatus.id) {
                                      handleUpdateMapping(mapping.id, { targetStatusId: newTargetStatusId });
                                    }
                                    
                                    document.body.removeChild(modal);
                                  });
                                  
                                  // Cerrar al hacer click fuera del modal
                                  modal.addEventListener('click', (e) => {
                                    if (e.target === modal) {
                                      document.body.removeChild(modal);
                                    }
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Editar estado destino"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMapping(mapping.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Eliminar mapeo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Información de estados disponibles */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Estados de Cita Disponibles
                  </h3>
                  <div className="space-y-2">
                    {statusMappings.appointmentStatuses.map((status) => (
                      <div key={status.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">{status.displayName}</span>
                        <span className="text-gray-500">({status.statusValue})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Estados Generales Disponibles
                  </h3>
                  <div className="space-y-2">
                    {statusMappings.searchHireStatuses.map((status) => (
                      <div key={status.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">{status.displayName}</span>
                        <span className="text-gray-500">({status.statusValue})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Formulario para crear mapeos */}
        {showMappingForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Mapeo</h3>
                  <button
                    onClick={() => {
                      setShowMappingForm(false);
                      resetMappingForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleCreateMapping(); }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado Origen (Cita)
                      </label>
                      <select
                        value={mappingFormData.sourceStatusId}
                        onChange={(e) => setMappingFormData({ ...mappingFormData, sourceStatusId: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value={0}>Seleccionar estado de cita</option>
                        {statusMappings.appointmentStatuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.displayName} ({status.statusValue})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado Destino (General)
                      </label>
                      <select
                        value={mappingFormData.targetStatusId}
                        onChange={(e) => setMappingFormData({ ...mappingFormData, targetStatusId: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value={0}>Seleccionar estado general</option>
                        {statusMappings.searchHireStatuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.displayName} ({status.statusValue})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={mappingFormData.isActive}
                        onChange={(e) => setMappingFormData({ ...mappingFormData, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mapeo activo</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMappingForm(false);
                        resetMappingForm();
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Crear Mapeo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
