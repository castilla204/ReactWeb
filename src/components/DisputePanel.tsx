import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { useDisputes } from '../hooks/useDisputes';
import { useAuth } from '../contexts/AuthContext';
import type { DisputeFilters, DisputeDto } from '../types/dispute';

interface DisputePanelProps {
  onBack?: () => void;
}

export const DisputePanel: React.FC<DisputePanelProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<DisputeFilters>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
  const [selectedDispute, setSelectedDispute] = useState<DisputeDto | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Verificar si el usuario es admin
  const isAdmin = user?.email?.trim().toLowerCase() === 'dcastillaa@gmail.com'.toLowerCase();
  
  const { useDisputesList, resolveDispute } = useDisputes();
  const disputesQuery = useDisputesList(filters);
  
  // Debug logging
  console.log('[DisputePanel] User info:', {
    user: user?.email,
    isAdmin,
    hasToken: !!localStorage.getItem('authToken')
  });

  const disputesData = disputesQuery.data;
  const loading = disputesQuery.isLoading;
  const error = disputesQuery.error;

  // Si no es admin, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">
              Solo los administradores pueden acceder al panel de disputas.
            </p>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Volver
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleFilterChange = (key: keyof DisputeFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleResolveDispute = async (disputeId: number, comments: string, action: 'refund_client' | 'pay_expert') => {
    try {
      await resolveDispute.mutateAsync({
        disputeId,
        data: { resolutionComments: comments, action }
      });
      setSelectedDispute(null);
      // Refresh the list
      disputesQuery.refetch();
    } catch (error) {
      console.error('Error resolving dispute:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (selectedDispute) {
    return (
      <DisputeDetails
        dispute={selectedDispute}
        onBack={() => setSelectedDispute(null)}
        onResolve={handleResolveDispute}
        isResolving={resolveDispute.isPending}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-bold text-gray-900">Panel de Disputas</h1>
            </div>
          </div>
          <p className="text-gray-600">Gestiona y resuelve disputas entre clientes y expertos</p>
        </div>

        {/* Stats Cards */}
        {disputesData?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard
              title="Pendientes"
              value={disputesData.stats.pendingDisputes}
              icon={Clock}
              color="orange"
            />
            <StatCard
              title="Resueltas"
              value={disputesData.stats.resolvedDisputes}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Clientes"
              value={disputesData.stats.clientDisputes}
              icon={User}
              color="blue"
            />
            <StatCard
              title="Expertos"
              value={disputesData.stats.expertDisputes}
              icon={User}
              color="purple"
            />
            <StatCard
              title="Esta Semana"
              value={disputesData.stats.thisWeekDisputes}
              icon={Calendar}
              color="indigo"
            />
            <StatCard
              title="Este Mes"
              value={disputesData.stats.thisMonthDisputes}
              icon={Calendar}
              color="pink"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Term */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.searchTerm || ''}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    placeholder="Buscar en razón, respuesta del experto..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="Pending">Pendiente</option>
                  <option value="Resolved">Resuelta</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Disputes List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Disputas</h2>
          </div>

          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando disputas...</p>
            </div>
          )}

          {error && (
            <div className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Error al cargar las disputas</p>
            </div>
          )}

          {disputesData && !loading && (
            <>
              <div className="divide-y divide-gray-200">
                {disputesData.disputes.map((dispute) => (
                  <DisputeCard
                    key={dispute.id}
                    dispute={dispute}
                    onClick={() => setSelectedDispute(dispute)}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>

              {/* Pagination */}
              {disputesData.pagination.totalPages > 1 && (
                <div className="p-6 border-t border-gray-200">
                  <Pagination
                    currentPage={disputesData.pagination.currentPage}
                    totalPages={disputesData.pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para las tarjetas de estadísticas
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Componente para las tarjetas de disputas
const DisputeCard: React.FC<{
  dispute: DisputeDto;
  onClick: () => void;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
}> = ({ dispute, onClick, formatDate, formatCurrency }) => {
  const statusColors = {
    Pending: 'bg-orange-100 text-orange-800',
    Resolved: 'bg-green-100 text-green-800',
  };

  return (
    <div
      onClick={onClick}
      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[dispute.status as keyof typeof statusColors]}`}>
              {dispute.statusTranslated}
            </span>
            <span className="text-sm text-gray-500">#{dispute.id}</span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {dispute.search.title}
          </h3>
          
          <p className="text-gray-600 mb-3 line-clamp-2">
            {dispute.reason}
          </p>
          
          {/* Información sobre respuesta del experto */}
          {dispute.expertResponse && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Respuesta del experto:</strong> {dispute.expertResponse.length > 100 
                  ? `${dispute.expertResponse.substring(0, 100)}...` 
                  : dispute.expertResponse}
              </p>
            </div>
          )}
          
          {/* Estado de respuesta del experto */}
          {dispute.status === 'Pending' && (
            <div className="mb-3 flex items-center gap-2">
              {dispute.canExpertRespond ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                  <Clock className="w-3 h-3" />
                  Experto puede responder
                </span>
              ) : dispute.expertResponse ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Experto respondió
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  <Clock className="w-3 h-3" />
                  Tiempo agotado
                </span>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{dispute.client.name}</span>
            </div>
            {dispute.expert && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{dispute.expert.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>{formatCurrency(dispute.searchHire.amount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(dispute.createdAt)}</span>
            </div>
            {/* Indicador de archivos adjuntos */}
            {dispute.files && dispute.files.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  📎 {dispute.files.length} archivo{dispute.files.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <Eye className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de paginación
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-lg border ${
              page === currentPage
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-sm text-gray-600">
        Página {currentPage} de {totalPages}
      </p>
    </div>
  );
};

// Componente para los detalles de una disputa
const DisputeDetails: React.FC<{
  dispute: DisputeDto;
  onBack: () => void;
  onResolve: (id: number, comments: string, action: 'refund_client' | 'pay_expert') => void;
  isResolving: boolean;
}> = ({ dispute, onBack, onResolve, isResolving }) => {
  const navigate = useNavigate();
  const [resolutionComments, setResolutionComments] = useState('');
  const [resolutionAction, setResolutionAction] = useState<'refund_client' | 'pay_expert'>('refund_client');
  const [showResolveForm, setShowResolveForm] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const handleResolve = () => {
    if (resolutionComments.trim()) {
      onResolve(dispute.id, resolutionComments, resolutionAction);
    }
  };

  const handleGoToSearchDetails = () => {
    navigate(`/detalles/${dispute.search.id}`);
  };

  // Debug: Ver qué datos están llegando
  console.log('[DisputeDetails] Dispute data:', {
    id: dispute.id,
    files: dispute.files,
    expertResponseFiles: dispute.expertResponseFiles,
    expertResponse: dispute.expertResponse
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-bold text-gray-900">Detalles de Disputa</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dispute Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Información de la Disputa</h2>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  dispute.status === 'Pending' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {dispute.statusTranslated}
                </span>
              </div>
              
              <div className="space-y-4">
                {/* Disputa del Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disputa del Cliente</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{dispute.reason}</p>
                  
                  {/* Archivos del cliente */}
                  {dispute.files && dispute.files.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Archivos adjuntos:</p>
                      <div className="flex flex-wrap gap-1">
                        {dispute.files.map((file) => (
                          <a
                            key={file.id}
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                          >
                            📎 {file.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Respuesta del Experto */}
                {dispute.expertResponse && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Respuesta del Experto</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{dispute.expertResponse}</p>
                    
                    {/* Archivos del experto */}
                    {(dispute.expertResponseFiles && dispute.expertResponseFiles.length > 0) || 
                     (dispute.files && dispute.files.length > 2) ? (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Archivos del experto:</p>
                        <div className="flex flex-wrap gap-1">
                          {/* Mostrar archivos específicos del experto si existen */}
                          {dispute.expertResponseFiles && dispute.expertResponseFiles.map((file) => (
                            <a
                              key={file.id}
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                            >
                              📎 {file.fileName}
                            </a>
                          ))}
                          {/* Si no hay archivos específicos del experto, mostrar los archivos adicionales */}
                          {(!dispute.expertResponseFiles || dispute.expertResponseFiles.length === 0) && 
                           dispute.files && dispute.files.length > 2 && 
                           dispute.files.slice(2).map((file, index) => (
                            <a
                              key={`expert-${index}`}
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                            >
                              📎 {file.fileName}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    
                    {dispute.expertResponseAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Respondido el {formatDate(dispute.expertResponseAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Estado de respuesta del experto */}
                {dispute.status === 'Pending' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <div>
                        {dispute.canExpertRespond ? (
                          <p className="text-sm font-medium text-orange-800">
                            El experto puede responder hasta: {dispute.expertResponseDeadline ? formatDate(dispute.expertResponseDeadline) : 'N/A'}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-orange-800">
                            {dispute.expertResponse ? 'El experto ya respondió' : 'El experto ya no puede responder'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                  <p className="text-gray-900">{formatDate(dispute.createdAt)}</p>
                </div>
                
                {dispute.resolutionComments && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios de Resolución</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{dispute.resolutionComments}</p>
                  </div>
                )}

                {/* Debug: Mostrar todos los archivos disponibles */}
                {(dispute.files && dispute.files.length > 0) || (dispute.expertResponseFiles && dispute.expertResponseFiles.length > 0) ? (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">🔍 Debug - Archivos Disponibles:</h4>
                    {dispute.files && dispute.files.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-yellow-700">Archivos principales ({dispute.files.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {dispute.files.map((file, index) => (
                            <span key={index} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              {index + 1}. {file.fileName || `Archivo ${index + 1}`}
                              {file.uploadedBy && ` (${file.uploadedBy})`}
                            </span>
                          ))}
                        </div>
                        {dispute.files.length > 2 && (
                          <p className="text-xs text-yellow-600 mt-1">
                            💡 Los archivos 3+ podrían ser del experto
                          </p>
                        )}
                      </div>
                    )}
                    {dispute.expertResponseFiles && dispute.expertResponseFiles.length > 0 && (
                      <div>
                        <p className="text-xs text-yellow-700">Archivos específicos del experto ({dispute.expertResponseFiles.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {dispute.expertResponseFiles.map((file, index) => (
                            <span key={index} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              {file.fileName || `Archivo experto ${index + 1}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                      <strong>Estructura de datos:</strong><br/>
                      • dispute.files: {dispute.files ? dispute.files.length : 0} archivos<br/>
                      • dispute.expertResponseFiles: {dispute.expertResponseFiles ? dispute.expertResponseFiles.length : 0} archivos<br/>
                      • dispute.expertResponse: {dispute.expertResponse ? 'Sí' : 'No'}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">No hay archivos adjuntos en esta disputa.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Search Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Información de la Búsqueda</h2>
                <button
                  onClick={handleGoToSearchDetails}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Detalles
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <p className="text-gray-900">{dispute.search.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <p className="text-gray-900">{dispute.search.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                  <p className="text-gray-900">{formatDate(dispute.search.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Users Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Usuarios Involucrados</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <div className="flex items-center gap-3">
                    {dispute.client.profilePictureUrl && (
                      <img
                        src={dispute.client.profilePictureUrl}
                        alt={dispute.client.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{dispute.client.name}</p>
                      <p className="text-sm text-gray-500">{dispute.client.email}</p>
                    </div>
                  </div>
                </div>
                
                {dispute.expert && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experto</label>
                    <div className="flex items-center gap-3">
                      {dispute.expert.profilePictureUrl && (
                        <img
                          src={dispute.expert.profilePictureUrl}
                          alt={dispute.expert.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{dispute.expert.name}</p>
                        <p className="text-sm text-gray-500">{dispute.expert.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Financiera</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dispute.searchHire.amount)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado del Pago</label>
                  <p className="text-gray-900">{dispute.searchHire.statusTranslated}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {dispute.status === 'Pending' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones</h2>
                
                {!showResolveForm ? (
                  <button
                    onClick={() => setShowResolveForm(true)}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Resolver Disputa
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comentarios de Resolución
                      </label>
                      <textarea
                        value={resolutionComments}
                        onChange={(e) => setResolutionComments(e.target.value)}
                        placeholder="Explica la resolución de la disputa..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Acción Financiera
                      </label>
                      <select
                        value={resolutionAction}
                        onChange={(e) => setResolutionAction(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="refund_client">Reembolsar al cliente</option>
                        <option value="pay_expert">Pagar al experto</option>
                      </select>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleResolve}
                        disabled={!resolutionComments.trim() || isResolving}
                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isResolving ? 'Resolviendo...' : 'Confirmar Resolución'}
                      </button>
                      <button
                        onClick={() => setShowResolveForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
