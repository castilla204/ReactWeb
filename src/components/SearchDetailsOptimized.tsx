// ✅ COMPONENTE DE EJEMPLO USANDO LOS HOOKS OPTIMIZADOS

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSearchDetailsOptimized } from '../hooks/useSearchDetailsOptimized';
import { useSearchDetailsWithLazyLoading } from '../hooks/useSearchDetailsOptimized';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface SearchDetailsOptimizedProps {
  searchId: number;
  isAdmin?: boolean;
  onBack?: () => void;
}

/**
 * Componente optimizado de SearchDetails usando los nuevos hooks
 * Demuestra cómo usar los hooks optimizados para reducir requests
 */
export const SearchDetailsOptimized: React.FC<SearchDetailsOptimizedProps> = ({
  searchId,
  isAdmin = false,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'chat' | 'disputes' | 'appointment'>('details');

  // ✅ OPCIÓN 1: Hook unificado (carga todo de una vez)
  const {
    search,
    moneyDistribution,
    conversations,
    appointment,
    deliverables,
    disputes,
    isLoading,
    isError,
    error,
    invalidateAll
  } = useSearchDetailsOptimized(searchId);

  // ✅ Manejo elegante de errores con toast
  useErrorHandler(error, isError);

  // ✅ OPCIÓN 2: Hook con lazy loading (carga bajo demanda)
  // const {
  //   search,
  //   moneyDistribution,
  //   conversations,
  //   appointment,
  //   deliverables,
  //   disputes,
  //   isLoadingMain,
  //   isLoadingAdditional,
  //   isError,
  //   error
  // } = useSearchDetailsWithLazyLoading(searchId, activeTab);

  // Estados de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando detalles de la búsqueda...</span>
      </div>
    );
  }

  // ✅ Estados de error - manejo elegante
  // Los errores de red se manejan con toast, solo mostrar pantalla para errores críticos
  if (isError && error && !error?.message?.includes('Failed to fetch') && !error?.message?.includes('NetworkError')) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-100 dark:bg-orange-900/20 rounded-full animate-ping opacity-75"></div>
                <AlertTriangle className="w-16 h-16 text-orange-500 dark:text-orange-400 relative" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Error al cargar los datos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {error?.message || 'Ha ocurrido un error inesperado'}
              </p>
            </div>
            <button
              onClick={() => invalidateAll()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Datos no encontrados
  if (!search) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-yellow-800 font-medium">Búsqueda no encontrada</h3>
        <p className="text-yellow-600 text-sm mt-1">
          No se pudo encontrar la búsqueda con ID: {searchId}
        </p>
      </div>
    );
  }

  return (
    <div className="search-details-optimized">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{search.title}</h1>
          <p className="text-gray-600 mt-1">{search.description}</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Volver
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'details', label: 'Detalles', count: null },
            { id: 'chat', label: 'Chat', count: conversations.length > 0 ? conversations[0]?.unreadCount || 0 : 0 },
            { id: 'appointment', label: 'Cita', count: appointment ? 1 : 0 },
            { id: 'disputes', label: 'Disputas', count: disputes.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Información básica */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Búsqueda</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <p className="mt-1 text-sm text-gray-900">{search.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <p className="mt-1 text-sm text-gray-900">{search.searchHire?.status || 'Sin contratar'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente</label>
                  <p className="mt-1 text-sm text-gray-900">{search.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Experto</label>
                  <p className="mt-1 text-sm text-gray-900">{search.searchHire?.expert?.name || 'Sin asignar'}</p>
                </div>
              </div>
            </div>

            {/* Configuración de dinero */}
            {moneyDistribution && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Dinero</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experto</label>
                    <p className="mt-1 text-sm text-gray-900">{moneyDistribution.expertPercentage}%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plataforma</label>
                    <p className="mt-1 text-sm text-gray-900">{moneyDistribution.platformPercentage}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Archivos entregables */}
            {deliverables.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Archivos Entregables</h2>
                <div className="space-y-2">
                  {deliverables.map((deliverable) => (
                    <div key={deliverable.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{deliverable.fileName}</p>
                        <p className="text-xs text-gray-500">{deliverable.type}</p>
                      </div>
                      <a
                        href={deliverable.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Ver archivo
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversación</h2>
            {conversations.length > 0 ? (
              <div className="space-y-4">
                {conversations[0].messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {message.senderName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{message.senderName}</p>
                        <p className="text-xs text-gray-500">{message.timestamp}</p>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay mensajes en esta conversación</p>
            )}
          </div>
        )}

        {activeTab === 'appointment' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Cita</h2>
            {appointment ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <p className="mt-1 text-sm text-gray-900">{appointment.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Propuesta</label>
                  <p className="mt-1 text-sm text-gray-900">{appointment.proposedDate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hora</label>
                  <p className="mt-1 text-sm text-gray-900">{appointment.proposedTime}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                  <p className="mt-1 text-sm text-gray-900">{appointment.location}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay cita programada para esta búsqueda</p>
            )}
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Disputas</h2>
            {disputes.length > 0 ? (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">Disputa #{dispute.id}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        dispute.status === 'resolved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dispute.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{dispute.reason}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Creada: {new Date(dispute.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay disputas para esta búsqueda</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchDetailsOptimized;


