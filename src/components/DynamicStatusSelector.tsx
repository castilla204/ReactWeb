import React from 'react';
import { useAppointmentStatuses } from '../hooks/useAppointmentStatuses';

interface DynamicStatusSelectorProps {
  value: string;
  onChange: (status: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const DynamicStatusSelector: React.FC<DynamicStatusSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccionar estado..."
}) => {
  const { data: statuses, isLoading, error } = useAppointmentStatuses();

  if (isLoading) {
    return (
      <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
        <option>Cargando estados...</option>
      </select>
    );
  }

  if (error || !statuses) {
    return (
      <select disabled className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50">
        <option>Error al cargar estados</option>
      </select>
    );
  }

  // Agrupar estados por tipo
  const finalizationStatuses = statuses.filter(s => s.isFinalizationStatus);
  const intermediateStatuses = statuses.filter(s => !s.isFinalizationStatus);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
    >
      <option value="">{placeholder}</option>
      
      {/* Estados intermedios */}
      {intermediateStatuses.length > 0 && (
        <optgroup label="Estados Intermedios">
          {intermediateStatuses
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((status) => (
              <option key={status.id} value={status.statusValue}>
                {status.displayName}
              </option>
            ))}
        </optgroup>
      )}
      
      {/* Estados de finalización */}
      {finalizationStatuses.length > 0 && (
        <optgroup label="Estados de Finalización">
          {finalizationStatuses
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((status) => (
              <option key={status.id} value={status.statusValue}>
                {status.displayName}
              </option>
            ))}
        </optgroup>
      )}
    </select>
  );
};

export default DynamicStatusSelector;
