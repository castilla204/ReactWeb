import React, { useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, ArrowRight, Link2, AlertTriangle } from 'lucide-react';
import { useStatusMappings } from '../../hooks/useStatusMappings';
import { Pagination } from '../../components/Pagination';
import { showToast } from '../../lib/toast';
import {
  AdminButton,
  AdminCard,
  AdminCardHeader,
  AdminCardBody,
  AdminBadge,
  AdminStatusPill,
  AdminTable,
  AdminTHead,
  AdminTH,
  AdminTBody,
  AdminTR,
  AdminTD,
  AdminEmptyState,
  AdminTableSkeleton,
  AdminModal,
} from '../../components/admin/ui';
import { StatusMapping } from '../../types/admin';
import { isLegacyStatus, statusValueOf } from '../../constants/legacyStatuses';

const AdminMappingsPage: React.FC = () => {
  const [mappingsPage, setMappingsPage] = useState(1);
  const [mappingsPageSize, setMappingsPageSize] = useState(20);
  // Ocultar por defecto los estados legacy (flujo antiguo retirado) del catálogo. Toggle para mostrarlos.
  const [showLegacyStatuses, setShowLegacyStatuses] = useState(false);
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [mappingFormData, setMappingFormData] = useState({
    sourceStatusId: 0,
    targetStatusId: 0,
    isActive: true
  });

  // Edición del estado destino de un mapeo (sustituye al modal imperativo)
  const [editing, setEditing] = useState<StatusMapping | null>(null);
  const [editTargetStatusId, setEditTargetStatusId] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Confirmación de borrado (sustituye al window.confirm)
  const [confirmDelete, setConfirmDelete] = useState<StatusMapping | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        showToast('error', 'Por favor selecciona tanto el estado origen como el estado destino');
        return;
      }

      if (mappingFormData.sourceStatusId === mappingFormData.targetStatusId) {
        showToast('error', 'El estado origen y destino no pueden ser el mismo');
        return;
      }

      await statusMappings.createMapping(mappingFormData);
      showToast('success', 'Mapeo creado exitosamente', undefined, { surface: 'homepage' });
      setShowMappingForm(false);
      resetMappingForm();
    } catch (error: any) {
      console.error('Error creating mapping:', error);

      if (error.message?.includes('han cambiado') || error.message?.includes('no existe')) {
        showToast('error', `${error.message} Los datos se han refrescado automáticamente.`);
        await statusMappings.refreshAllData();
      } else {
        showToast('error', `Error al crear mapeo: ${error.message || 'Error desconocido'}`);
      }
    }
  };

  const handleUpdateMapping = async (mappingId: number, updates: any) => {
    try {
      const currentMapping = (statusMappings.mappings || []).find(m => (m.id || (m as any).Id) === mappingId);
      if (!currentMapping) {
        throw new Error("Mapeo no encontrado");
      }

      const targetStatusExists = (statusMappings.searchHireStatuses || []).some(s => (s.id || (s as any).Id) === updates.targetStatusId);
      if (!targetStatusExists) {
        throw new Error(`El estado con ID ${updates.targetStatusId} no existe`);
      }

      const sourceStatus: any = currentMapping.sourceStatus || (currentMapping as any).SourceStatus;
      const fullUpdateData = {
        sourceStatusId: sourceStatus?.id || (currentMapping as any).SourceStatus?.id || sourceStatus?.Id || (currentMapping as any).SourceStatus?.Id,
        targetStatusId: updates.targetStatusId
      };

      await statusMappings.updateMapping(mappingId, fullUpdateData);
      showToast('success', 'Mapeo actualizado', undefined, { surface: 'homepage' });
    } catch (error: any) {
      console.error('Error updating mapping:', error);
      showToast('error', `Error al actualizar mapeo: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleSaveMapping = async () => {
    if (!editing) return;

    const targetStatus: any = editing.targetStatus || (editing as any).TargetStatus;
    const currentTargetId = targetStatus?.id || targetStatus?.Id;
    const mappingId = editing.id || (editing as any).Id;
    const newTargetStatusId = editTargetStatusId;

    const selectedStatusExists = (statusMappings.searchHireStatuses || []).some(s => (s.id || (s as any).Id) === newTargetStatusId);

    if (!selectedStatusExists) {
      showToast('error', `El estado con ID ${newTargetStatusId} no existe en la lista actual. Refrescando datos...`);
      statusMappings.refreshAllData();
      setEditing(null);
      return;
    }

    setSaving(true);
    try {
      if (newTargetStatusId !== currentTargetId) {
        await handleUpdateMapping(mappingId, { targetStatusId: newTargetStatusId });
      }
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMapping = async () => {
    if (!confirmDelete) return;
    const mappingId = confirmDelete.id || (confirmDelete as any).Id;

    setDeleting(true);
    try {
      await statusMappings.deleteMapping(mappingId);
      showToast('success', 'Mapeo eliminado exitosamente', undefined, { surface: 'homepage' });
      setConfirmDelete(null);
    } catch (error: any) {
      console.error('Error deleting mapping:', error);
      showToast('error', `Error al eliminar mapeo: ${error.message || 'Error desconocido'}`);
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (mapping: StatusMapping) => {
    if (!statusMappings.searchHireStatuses || statusMappings.searchHireStatuses.length === 0) {
      showToast('error', 'Los estados no están cargados. Refrescando datos...');
      statusMappings.refreshAllData();
      return;
    }
    const targetStatus: any = mapping.targetStatus || (mapping as any).TargetStatus;
    setEditTargetStatusId(targetStatus?.id || targetStatus?.Id || 0);
    setEditing(mapping);
  };

  const editingSource: any = editing
    ? editing.sourceStatus || (editing as any).SourceStatus
    : null;
  const editingSourceDisplayName =
    editingSource?.displayName || editingSource?.DisplayName || 'Estado desconocido';

  return (
    <div>
      <div className="mb-6 flex justify-end items-center">
        <div className="flex gap-3">
          <AdminButton
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            title="Refrescar datos de mapeos y estados"
            onClick={async () => {
              try {
                await statusMappings.refreshAllData();
                showToast('success', 'Datos refrescados exitosamente', undefined, { surface: 'homepage' });
              } catch {
                showToast('error', 'Error al refrescar datos');
              }
            }}
          >
            Refrescar
          </AdminButton>
          <AdminButton
            variant="brand"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetMappingForm();
              setShowMappingForm(true);
            }}
          >
            Agregar Mapeo
          </AdminButton>
        </div>
      </div>

      {statusMappings.isLoading ? (
        <AdminCard>
          <AdminTableSkeleton rows={5} cols={3} />
        </AdminCard>
      ) : statusMappings.error ? (
        <AdminCard>
          <AdminCardBody>
            <div className="flex items-start gap-3 text-[hsl(var(--ap-warning))]">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-[hsl(var(--ap-ink))]">Error al cargar mapeos</h3>
                <p className="mt-1 text-[13px] text-[hsl(var(--ap-muted))]">{statusMappings.error}</p>
              </div>
            </div>
          </AdminCardBody>
        </AdminCard>
      ) : (
        <AdminCard>
          {!statusMappings.mappings || statusMappings.mappings.length === 0 ? (
            <AdminEmptyState
              icon={<Link2 className="h-5 w-5" />}
              title="No hay mapeos configurados"
              description="Crea un mapeo para relacionar un estado de cita con un estado general."
            />
          ) : (
            <AdminTable>
              <AdminTHead>
                <AdminTH>Estado origen (Cita)</AdminTH>
                <AdminTH>Estado destino (General)</AdminTH>
                <AdminTH>Estado</AdminTH>
                <AdminTH className="text-right">Acciones</AdminTH>
              </AdminTHead>
              <AdminTBody>
                {(statusMappings.mappings || []).map((mapping) => {
                  const sourceStatus: any = mapping.sourceStatus || (mapping as any).SourceStatus;
                  const targetStatus: any = mapping.targetStatus || (mapping as any).TargetStatus;
                  const sourceDisplayName = sourceStatus?.displayName || sourceStatus?.DisplayName || 'Estado desconocido';
                  const sourceStatusValue = sourceStatus?.statusValue || sourceStatus?.StatusValue || 'N/A';
                  const targetDisplayName = targetStatus?.displayName || targetStatus?.DisplayName || 'Estado desconocido';
                  const targetStatusValue = targetStatus?.statusValue || targetStatus?.StatusValue || 'N/A';
                  const sourceStatusType = sourceStatus?.statusType || sourceStatus?.StatusType || 'Unknown';
                  const isActive = mapping.isActive ?? (mapping as any).IsActive ?? false;
                  const rowKey = mapping.id || (mapping as any).Id;

                  return (
                    <AdminTR key={rowKey}>
                      <AdminTD>
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(var(--ap-brand)/0.12)] text-[12px] font-bold text-[hsl(var(--ap-brand))]">
                            {sourceStatusType === 'AppointmentStatus' ? 'A' : 'S'}
                          </span>
                          <div>
                            <div className="text-[13px] font-medium text-[hsl(var(--ap-ink))]">{sourceDisplayName}</div>
                            <div className="text-[12px] text-[hsl(var(--ap-muted))]">{sourceStatusValue}</div>
                          </div>
                        </div>
                      </AdminTD>
                      <AdminTD>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 flex-shrink-0 text-[hsl(var(--ap-muted))]" />
                          <div>
                            <div className="text-[13px] font-medium text-[hsl(var(--ap-ink))]">{targetDisplayName}</div>
                            <div className="text-[12px] text-[hsl(var(--ap-muted))]">{targetStatusValue}</div>
                          </div>
                        </div>
                      </AdminTD>
                      <AdminTD>
                        <AdminStatusPill tone={isActive ? 'success' : 'error'}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </AdminStatusPill>
                      </AdminTD>
                      <AdminTD className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            icon={<Pencil className="h-4 w-4" />}
                            title="Editar estado destino"
                            onClick={() => openEdit(mapping)}
                          />
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="h-4 w-4 text-[hsl(var(--ap-error))]" />}
                            title="Eliminar mapeo"
                            onClick={() => setConfirmDelete(mapping)}
                          />
                        </div>
                      </AdminTD>
                    </AdminTR>
                  );
                })}
              </AdminTBody>
            </AdminTable>
          )}
          {statusMappings.mappingsPagination && (
            <div className="border-t border-[hsl(var(--ap-border))]">
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
        </AdminCard>
      )}

      {/* Información de estados disponibles */}
      <div className="mt-8 mb-3 flex items-center justify-end">
        <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showLegacyStatuses}
            onChange={(e) => setShowLegacyStatuses(e.target.checked)}
            className="rounded border-gray-300"
          />
          Mostrar estados legacy (flujo antiguo retirado)
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminCard>
          <AdminCardHeader title="Estados de Cita Disponibles" />
          <AdminCardBody>
            <div className="flex flex-wrap gap-2">
              {(statusMappings.appointmentStatuses || [])
                .filter((status) => showLegacyStatuses || !isLegacyStatus(status))
                .map((status) => (
                <AdminBadge key={status.id || (status as any).Id} tone="neutral">
                  {status.displayName || (status as any).DisplayName || 'Estado desconocido'}
                  <span className="opacity-60">({statusValueOf(status) || 'N/A'})</span>
                </AdminBadge>
              ))}
            </div>
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader title="Estados Generales Disponibles" />
          <AdminCardBody>
            <div className="flex flex-wrap gap-2">
              {(statusMappings.searchHireStatuses || [])
                .filter((status) => showLegacyStatuses || !isLegacyStatus(status))
                .map((status) => (
                <AdminBadge key={status.id || (status as any).Id} tone="info">
                  {status.displayName || (status as any).DisplayName || 'Estado desconocido'}
                  <span className="opacity-60">({statusValueOf(status) || 'N/A'})</span>
                </AdminBadge>
              ))}
            </div>
          </AdminCardBody>
        </AdminCard>
      </div>

      {/* Modal: editar estado destino de un mapeo */}
      <AdminModal
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        title="Editar mapeo de estado"
        description="Selecciona el estado general destino para este estado de cita."
        footer={
          <>
            <AdminButton variant="outline" onClick={() => setEditing(null)}>Cancelar</AdminButton>
            <AdminButton variant="brand" loading={saving} onClick={handleSaveMapping}>Guardar</AdminButton>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="text-[13px] text-[hsl(var(--ap-muted))]">
              Estado origen: <strong className="text-[hsl(var(--ap-ink))]">{editingSourceDisplayName}</strong>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[hsl(var(--ap-ink))]">
                Nuevo estado destino
              </label>
              <select
                value={editTargetStatusId}
                onChange={(e) => setEditTargetStatusId(Number(e.target.value))}
                className="w-full rounded-md border border-[hsl(var(--ap-border-strong))] bg-[hsl(var(--ap-surface))] px-3 py-2 text-[13px] text-[hsl(var(--ap-ink))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ap-brand))]"
              >
                {(statusMappings.searchHireStatuses || []).map((status) => {
                  const statusDisplayName = status.displayName || (status as any).DisplayName || 'Estado desconocido';
                  const statusValue = status.statusValue || (status as any).StatusValue || 'N/A';
                  const statusId = status.id || (status as any).Id;
                  return (
                    <option key={statusId} value={statusId}>
                      {statusDisplayName} ({statusValue})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Modal: confirmar eliminación de un mapeo */}
      <AdminModal
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Eliminar mapeo"
        description="¿Estás seguro de que quieres eliminar este mapeo? Esta acción no se puede deshacer."
        footer={
          <>
            <AdminButton variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</AdminButton>
            <AdminButton variant="danger" loading={deleting} onClick={handleDeleteMapping}>Eliminar</AdminButton>
          </>
        }
      />

      {/* Formulario para crear mapeos */}
      <AdminModal
        open={showMappingForm}
        onOpenChange={(o) => {
          if (!o) {
            setShowMappingForm(false);
            resetMappingForm();
          }
        }}
        title="Crear Nuevo Mapeo"
        description="Relaciona un estado de cita con un estado general."
        footer={
          <>
            <AdminButton
              variant="outline"
              onClick={() => {
                setShowMappingForm(false);
                resetMappingForm();
              }}
            >
              Cancelar
            </AdminButton>
            <AdminButton variant="brand" icon={<Plus className="w-4 h-4" />} onClick={handleCreateMapping}>
              Crear Mapeo
            </AdminButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[hsl(var(--ap-ink))]">
              Estado Origen (Cita)
            </label>
            <select
              value={mappingFormData.sourceStatusId}
              onChange={(e) => setMappingFormData({ ...mappingFormData, sourceStatusId: Number(e.target.value) })}
              className="w-full rounded-md border border-[hsl(var(--ap-border-strong))] bg-[hsl(var(--ap-surface))] px-3 py-2 text-[13px] text-[hsl(var(--ap-ink))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ap-brand))]"
            >
              <option value={0}>Seleccionar estado de cita</option>
              {(statusMappings.appointmentStatuses || []).map((status) => {
                const statusId = status.id || (status as any).Id;
                const displayName = status.displayName || (status as any).DisplayName || 'Estado desconocido';
                const statusValue = status.statusValue || (status as any).StatusValue || 'N/A';
                return (
                  <option key={statusId} value={statusId}>
                    {displayName} ({statusValue})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[hsl(var(--ap-ink))]">
              Estado Destino (General)
            </label>
            <select
              value={mappingFormData.targetStatusId}
              onChange={(e) => setMappingFormData({ ...mappingFormData, targetStatusId: Number(e.target.value) })}
              className="w-full rounded-md border border-[hsl(var(--ap-border-strong))] bg-[hsl(var(--ap-surface))] px-3 py-2 text-[13px] text-[hsl(var(--ap-ink))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ap-brand))]"
            >
              <option value={0}>Seleccionar estado general</option>
              {(statusMappings.searchHireStatuses || []).map((status) => {
                const statusId = status.id || (status as any).Id;
                const displayName = status.displayName || (status as any).DisplayName || 'Estado desconocido';
                const statusValue = status.statusValue || (status as any).StatusValue || 'N/A';
                return (
                  <option key={statusId} value={statusId}>
                    {displayName} ({statusValue})
                  </option>
                );
              })}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-[hsl(var(--ap-ink))]">
            <input
              type="checkbox"
              checked={mappingFormData.isActive}
              onChange={(e) => setMappingFormData({ ...mappingFormData, isActive: e.target.checked })}
              className="rounded border-[hsl(var(--ap-border-strong))] text-[hsl(var(--ap-brand))] focus:ring-[hsl(var(--ap-brand))]"
            />
            Mapeo activo
          </label>
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminMappingsPage;
