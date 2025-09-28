import React, { useState } from 'react';
import { Play, RefreshCw, Info } from 'lucide-react';
import { useMoneyDistribution } from '../hooks/useMoneyDistribution';
import { CATEGORIES, SERVICE_TYPE_CATEGORIES, APPOINTMENT_STATUSES } from '../types/admin';
import PriorityInfo from './PriorityInfo';

const ConfigurationSimulator: React.FC = () => {
  const [categoryId, setCategoryId] = useState<number | undefined>(1);
  const [serviceTypeCategoryId, setServiceTypeCategoryId] = useState<number | undefined>(1);
  const [status, setStatus] = useState("appointment_completed");
  const [isSimulating, setIsSimulating] = useState(false);

  const { config: result, isLoading, error } = useMoneyDistribution(
    status, 
    categoryId, 
    serviceTypeCategoryId
  );

  const handleSimulate = () => {
    setIsSimulating(true);
    // El hook se ejecutará automáticamente cuando cambien los valores
    setTimeout(() => setIsSimulating(false), 1000);
  };

  const getStatusLabel = (statusValue: string) => {
    const statusObj = APPOINTMENT_STATUSES.find(s => s.value === statusValue);
    return statusObj ? statusObj.label : statusValue;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Play className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Simulador de Configuración</h3>
      </div>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">¿Cómo funciona el sistema de prioridades?</p>
            <p>El sistema busca configuraciones en este orden:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li><strong>🥇 Específica:</strong> Category + ServiceTypeCategory + Status</li>
              <li><strong>🥈 Por ServiceType:</strong> ServiceTypeCategory + Status</li>
              <li><strong>🥉 Por Status:</strong> Solo Status</li>
              <li><strong>🏅 Por Defecto:</strong> Configuración del sistema</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría Principal
          </label>
          <select
            value={categoryId || ''}
            onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Servicio
          </label>
          <select
            value={serviceTypeCategoryId || ''}
            onChange={(e) => setServiceTypeCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            {SERVICE_TYPE_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado de Cita
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {APPOINTMENT_STATUSES.map((statusOption) => (
              <option key={statusOption.value} value={statusOption.value}>
                {statusOption.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSimulate}
        disabled={isLoading || isSimulating}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading || isSimulating ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Simulando...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Simular Configuración
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {result && !isLoading && !error && (
        <div className="mt-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Resultado de la Simulación</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded border">
                <div className="text-sm text-gray-600">Cliente</div>
                <div className="text-2xl font-bold text-green-600">{result.clientPercentage}%</div>
              </div>
              <div className="bg-white p-4 rounded border">
                <div className="text-sm text-gray-600">Experto</div>
                <div className="text-2xl font-bold text-blue-600">{result.expertPercentage}%</div>
              </div>
              <div className="bg-white p-4 rounded border">
                <div className="text-sm text-gray-600">Plataforma</div>
                <div className="text-2xl font-bold text-gray-600">{result.platformPercentage}%</div>
              </div>
            </div>

            <div className="text-center p-3 bg-indigo-50 rounded-md border border-indigo-100 font-bold text-indigo-800">
              Total: {result.clientPercentage + result.expertPercentage + result.platformPercentage}%
            </div>
          </div>

          <PriorityInfo
            source={result.source}
            categoryName={result.categoryName}
            serviceTypeCategoryName={result.serviceTypeCategoryName}
            status={result.status}
          />
        </div>
      )}
    </div>
  );
};

export default ConfigurationSimulator;






