import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useStatusMappings } from '../../hooks/useStatusMappings';
import { Pagination } from '../../components/Pagination';

const AdminMappingsPage: React.FC = () => {
  const [mappingsPage, setMappingsPage] = useState(1);
  const [mappingsPageSize, setMappingsPageSize] = useState(20);
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [mappingFormData, setMappingFormData] = useState({
    sourceStatusId: 0,
    targetStatusId: 0,
    isActive: true
  });

  const statusMappings = useStatusMappings(mappingsPage, mappingsPageSize);

  const resetMappingForm = () => {
    setMappingFormData({
      sourceStatusId: 0,
      targetStatusId: 0,
      isActive: true
    });
  };

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
      const currentMapping = (statusMappings.mappings || []).find(m => (m.id || m.Id) === mappingId);
      if (!currentMapping) {
        throw new Error("Mapeo no encontrado");
      }
      
      const targetStatusExists = (statusMappings.searchHireStatuses || []).some(s => (s.id || s.Id) === updates.targetStatusId);
      if (!targetStatusExists) {
        throw new Error(`El estado con ID ${updates.targetStatusId} no existe`);
      }
      
      const fullUpdateData = {
        sourceStatusId: currentMapping.sourceStatus?.id || currentMapping.SourceStatus?.id || currentMapping.sourceStatus?.Id || currentMapping.SourceStatus?.Id,
        targetStatusId: updates.targetStatusId
      };
      
      await statusMappings.updateMapping(mappingId, fullUpdateData);
      alert('✅ Mapeo actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating mapping:', error);
      alert(`❌ Error al actualizar mapeo: ${error.message || 'Error desconocido'}`);
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

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mapeos de Estado</h2>
          <p className="text-gray-600 mt-1">Configuración de qué estados de cita se mapean a qué estados generales</p>
        </div>
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
                Error al cargar mapeos
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{statusMappings.error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {!statusMappings.mappings || statusMappings.mappings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No hay mapeos configurados</div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {(statusMappings.mappings || []).map((mapping) => {
                const sourceStatus = mapping.sourceStatus || mapping.SourceStatus;
                const targetStatus = mapping.targetStatus || mapping.TargetStatus;
                const sourceDisplayName = sourceStatus?.displayName || sourceStatus?.DisplayName || 'Estado desconocido';
                const sourceStatusValue = sourceStatus?.statusValue || sourceStatus?.StatusValue || 'N/A';
                const targetDisplayName = targetStatus?.displayName || targetStatus?.DisplayName || 'Estado desconocido';
                const targetStatusValue = targetStatus?.statusValue || targetStatus?.StatusValue || 'N/A';
                const sourceStatusType = sourceStatus?.statusType || sourceStatus?.StatusType || 'Unknown';
                const isActive = mapping.isActive ?? mapping.IsActive ?? false;
                
                return (
                  <li key={mapping.id || mapping.Id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {sourceStatusType === 'AppointmentStatus' ? 'A' : 'S'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {sourceDisplayName}
                            </p>
                            <span className="ml-2 text-xs text-gray-500">
                              ({sourceStatusValue})
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="text-sm text-gray-500">→</span>
                            <p className="ml-2 text-sm text-gray-900">
                              {targetDisplayName}
                            </p>
                            <span className="ml-2 text-xs text-gray-500">
                              ({targetStatusValue})
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          onClick={() => {
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
                            
                            const modalContent = document.createElement('div');
                            modalContent.className = 'relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white';
                            
                            if (!statusMappings.searchHireStatuses || statusMappings.searchHireStatuses.length === 0) {
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
                                    Estado Origen: <strong>${sourceDisplayName}</strong>
                                  </label>
                                  <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Nuevo Estado Destino:
                                  </label>
                                  <select id="newTargetStatus" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    ${(statusMappings.searchHireStatuses || []).map(status => {
                                      const statusDisplayName = status.displayName || status.DisplayName || 'Estado desconocido';
                                      const statusValue = status.statusValue || status.StatusValue || 'N/A';
                                      const statusId = status.id || status.Id;
                                      const targetStatusId = targetStatus?.id || targetStatus?.Id;
                                      return `<option value="${statusId}" ${statusId === targetStatusId ? 'selected' : ''}>
                                        ${statusDisplayName} (${statusValue})
                                      </option>`;
                                    }).join('')}
                                  </select>
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
                            
                            document.getElementById('closeModal')?.addEventListener('click', () => {
                              document.body.removeChild(modal);
                            });
                            
                            document.getElementById('cancelEdit')?.addEventListener('click', () => {
                              document.body.removeChild(modal);
                            });
                            
                            document.getElementById('saveEdit')?.addEventListener('click', () => {
                              const select = document.getElementById('newTargetStatus') as HTMLSelectElement;
                              const newTargetStatusId = Number(select.value);
                              
                              const selectedStatusExists = (statusMappings.searchHireStatuses || []).some(s => (s.id || s.Id) === newTargetStatusId);
                              
                              if (!selectedStatusExists) {
                                alert(`⚠️ El estado con ID ${newTargetStatusId} no existe en la lista actual. Refrescando datos...`);
                                statusMappings.refreshAllData();
                                document.body.removeChild(modal);
                                return;
                              }
                              
                              const currentTargetId = targetStatus?.id || targetStatus?.Id;
                              const mappingId = mapping.id || mapping.Id;
                              if (newTargetStatusId !== currentTargetId) {
                                handleUpdateMapping(mappingId, { targetStatusId: newTargetStatusId });
                              }
                              
                              document.body.removeChild(modal);
                            });
                            
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
                          onClick={() => handleDeleteMapping(mapping.id || mapping.Id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar mapeo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {statusMappings.mappingsPagination && (
            <div className="border-t border-gray-200">
              <Pagination
                page={statusMappings.mappingsPagination.page}
                pageSize={statusMappings.mappingsPagination.pageSize}
                totalCount={statusMappings.mappingsPagination.totalCount}
                totalPages={statusMappings.mappingsPagination.totalPages}
                hasNextPage={statusMappings.mappingsPagination.hasNextPage}
                hasPreviousPage={statusMappings.mappingsPagination.hasPreviousPage}
                onPageChange={(newPage) => {
                  setMappingsPage(newPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPageSizeChange={(newPageSize) => {
                  setMappingsPageSize(newPageSize);
                  setMappingsPage(1);
                }}
              />
            </div>
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
            {(statusMappings.appointmentStatuses || []).map((status) => (
              <div key={status.id || status.Id} className="flex items-center justify-between text-sm">
                <span className="text-gray-900">{status.displayName || status.DisplayName || 'Estado desconocido'}</span>
                <span className="text-gray-500">({status.statusValue || status.StatusValue || 'N/A'})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estados Generales Disponibles
          </h3>
          <div className="space-y-2">
            {(statusMappings.searchHireStatuses || []).map((status) => (
              <div key={status.id || status.Id} className="flex items-center justify-between text-sm">
                <span className="text-gray-900">{status.displayName || status.DisplayName || 'Estado desconocido'}</span>
                <span className="text-gray-500">({status.statusValue || status.StatusValue || 'N/A'})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                      {(statusMappings.appointmentStatuses || []).map((status) => {
                        const statusId = status.id || status.Id;
                        const displayName = status.displayName || status.DisplayName || 'Estado desconocido';
                        const statusValue = status.statusValue || status.StatusValue || 'N/A';
                        return (
                          <option key={statusId} value={statusId}>
                            {displayName} ({statusValue})
                          </option>
                        );
                      })}
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
                      {(statusMappings.searchHireStatuses || []).map((status) => {
                        const statusId = status.id || status.Id;
                        const displayName = status.displayName || status.DisplayName || 'Estado desconocido';
                        const statusValue = status.statusValue || status.StatusValue || 'N/A';
                        return (
                          <option key={statusId} value={statusId}>
                            {displayName} ({statusValue})
                          </option>
                        );
                      })}
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
  );
};

export default AdminMappingsPage;






