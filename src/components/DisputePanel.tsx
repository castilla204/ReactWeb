import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  User,
  DollarSign,
  CheckCircle2,
  Clock,
  Eye,
  ArrowLeft,
  ExternalLink,
  FileText,
  Image,
  File,
  FileVideo,
  FileAudio,
  Archive,
  Paperclip,
  ShieldCheck,
} from 'lucide-react';
import { useDisputes } from '../hooks/useDisputes';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { showToast } from '../lib/toast';
import type { DisputeFilters, DisputeDto } from '../types/dispute';
import { Pagination } from './Pagination';
import { getPriceDisplay } from '../utils/priceUtils';
import {
  AdminButton,
  AdminCard,
  AdminCardHeader,
  AdminCardBody,
  AdminBadge,
  AdminModal,
  AdminEmptyState,
  AdminTableSkeleton,
  type AdminTone,
} from './admin/ui';

// Estado de la disputa -> tono del sistema de diseño
const statusTone = (status: string): AdminTone =>
  status === 'Resolved' ? 'success' : 'warning';

const StatusBadge: React.FC<{ dispute: DisputeDto }> = ({ dispute }) => {
  const tone = statusTone(dispute.status);
  const icon =
    tone === 'success' ? (
      <CheckCircle2 className="w-3.5 h-3.5" />
    ) : (
      <Clock className="w-3.5 h-3.5" />
    );
  return (
    <AdminBadge tone={tone} icon={icon}>
      {dispute.statusTranslated}
    </AdminBadge>
  );
};

interface DisputePanelProps {
  onBack?: () => void;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[hsl(var(--ap-border))] bg-[hsl(var(--ap-surface))] ' +
  'text-[13px] text-[hsl(var(--ap-ink))] focus:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-[hsl(var(--ap-brand))] focus:border-[hsl(var(--ap-brand))]';
const labelClass = 'block text-[12px] font-medium text-[hsl(var(--ap-muted))] mb-1.5';

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

  // Verificar si el usuario es admin (compatibilidad con PascalCase y camelCase)
  const userEmail = user?.Email || user?.email;
  const userRole = user?.Role || user?.role;
  const isAdminByEmail = userEmail ? isAdmin(userEmail) : false;
  const isAdminByRole = userRole === 'Admin' || userRole === 'admin';
  const userIsAdmin = isAdminByEmail || isAdminByRole;

  const { useDisputesList, resolveDispute } = useDisputes();
  const disputesQuery = useDisputesList(filters);

  // Debug logging
  console.log('[DisputePanel] User info:', {
    user: user?.email,
    isAdmin: userIsAdmin,
    hasToken: !!localStorage.getItem('authToken')
  });

  // NORMALIZAR datos según la guía
  const disputesData = disputesQuery.data ? {
    ...disputesQuery.data,
    disputes: disputesQuery.data.disputes || [],
    pagination: disputesQuery.data.pagination ? {
      ...disputesQuery.data.pagination,
      currentPage: disputesQuery.data.pagination.currentPage || disputesQuery.data.pagination.page || 1,
      totalCount: disputesQuery.data.pagination.totalCount || disputesQuery.data.pagination.totalItems || 0,
      hasNext: disputesQuery.data.pagination.hasNext ?? disputesQuery.data.pagination.hasNextPage ?? false,
      hasPrevious: disputesQuery.data.pagination.hasPrevious ?? disputesQuery.data.pagination.hasPreviousPage ?? false,
    } : undefined,
    stats: disputesQuery.data.stats || {
      pendingDisputes: 0,
      resolvedDisputes: 0,
      clientDisputes: 0,
      expertDisputes: 0,
      thisWeekDisputes: 0,
      thisMonthDisputes: 0,
    }
  } : undefined;
  const loading = disputesQuery.isLoading;
  const error = disputesQuery.error;

  // fetchApi (useApi) lanza un OBJETO plano { message, status, ... }, NO un Error.
  // Sin esto, String(error) renderizaba el literal "[object Object]".
  const getDisputeErrorText = (err: unknown): string => {
    const anyErr = err as any;
    const status = anyErr?.status ?? anyErr?.response?.status;
    if (status && status >= 500) {
      return 'El servidor tuvo un problema al cargar las disputas. Vuelve a intentarlo en unos momentos.';
    }
    const msg =
      anyErr?.message ||
      anyErr?.response?.data?.message ||
      anyErr?.data?.message ||
      (typeof err === 'string' ? err : '');
    return msg || 'No se pudieron cargar las disputas. Vuelve a intentarlo.';
  };

  // Si no es admin, mostrar mensaje de acceso denegado
  if (!userIsAdmin) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <AdminCard>
            <AdminCardBody>
              <AdminEmptyState
                icon={<AlertTriangle className="w-6 h-6" />}
                title="Acceso denegado"
                description="Solo los administradores pueden acceder al panel de disputas."
                action={
                  onBack ? (
                    <AdminButton variant="brand" onClick={onBack}>
                      Volver
                    </AdminButton>
                  ) : undefined
                }
              />
            </AdminCardBody>
          </AdminCard>
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
      showToast('success', 'Disputa resuelta correctamente', undefined, { surface: 'homepage' });
    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      // Extraer mensaje de error del servidor si está disponible
      // El error puede venir en diferentes formatos: error.message, error.response.data.message, etc.
      const errorMessage = error?.message ||
                          error?.response?.data?.message ||
                          error?.response?.data?.error ||
                          error?.data?.message ||
                          error?.data?.error ||
                          (typeof error === 'string' ? error : 'Error al resolver la disputa');
      showToast('error', errorMessage);
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
    <div className="p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {onBack && (
            <AdminButton variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
              Volver
            </AdminButton>
          )}
          <p className="text-[13px] text-[hsl(var(--ap-muted))]">
            Gestiona y resuelve disputas entre clientes y expertos
          </p>
        </div>

        {/* Stats Cards */}
        {disputesData?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatCard title="Pendientes" value={disputesData.stats.pendingDisputes} icon={Clock} tone="warning" />
            <StatCard title="Resueltas" value={disputesData.stats.resolvedDisputes} icon={CheckCircle2} tone="success" />
            <StatCard title="Clientes" value={disputesData.stats.clientDisputes} icon={User} tone="info" />
            <StatCard title="Expertos" value={disputesData.stats.expertDisputes} icon={User} tone="brand" />
            <StatCard title="Esta Semana" value={disputesData.stats.thisWeekDisputes} icon={Calendar} tone="neutral" />
            <StatCard title="Este Mes" value={disputesData.stats.thisMonthDisputes} icon={Calendar} tone="neutral" />
          </div>
        )}

        {/* Filters */}
        <AdminCard className="mb-6">
          <AdminCardHeader
            title="Filtros"
            actions={
              <AdminButton
                variant="outline"
                size="sm"
                icon={<Filter className="w-4 h-4" />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Ocultar' : 'Mostrar'} filtros
              </AdminButton>
            }
          />
          {showFilters && (
            <AdminCardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Term */}
                <div>
                  <label className={labelClass}>Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--ap-muted))]" />
                    <input
                      type="text"
                      value={filters.searchTerm || ''}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      placeholder="Buscar en razón, respuesta del experto..."
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className={labelClass}>Estado</label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                    className={inputClass}
                  >
                    <option value="">Todos</option>
                    <option value="Pending">Pendiente</option>
                    <option value="Resolved">Resuelta</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className={labelClass}>Fecha Inicio</label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                    className={inputClass}
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className={labelClass}>Fecha Fin</label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                    className={inputClass}
                  />
                </div>
              </div>
            </AdminCardBody>
          )}
        </AdminCard>

        {/* Disputes List */}
        <AdminCard>
          <AdminCardHeader title="Lista de Disputas" />

          {loading && <AdminTableSkeleton rows={5} cols={3} />}

          {error && !loading && (
            <AdminCardBody>
              <div className="admin-alert admin-alert--error">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Error al cargar las disputas</p>
                  <p className="mt-1 opacity-80">{getDisputeErrorText(error)}</p>
                  <div className="mt-3">
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => disputesQuery.refetch()}
                      loading={disputesQuery.isFetching}
                    >
                      Reintentar
                    </AdminButton>
                  </div>
                </div>
              </div>
            </AdminCardBody>
          )}

          {disputesData && !loading && (
            <>
              {disputesData.disputes && disputesData.disputes.length > 0 ? (
                <div className="admin-card-body space-y-3">
                  {disputesData.disputes.map((dispute) => (
                    <DisputeCard
                      key={dispute.id}
                      dispute={dispute}
                      onClick={() => setSelectedDispute(dispute)}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              ) : (
                <AdminEmptyState
                  icon={<ShieldCheck className="w-6 h-6" />}
                  title="Sin disputas"
                  description="No se encontraron disputas con los filtros actuales."
                />
              )}

              {/* Pagination */}
              {disputesData.pagination && (
                <div className="px-4 py-4 border-t border-[hsl(var(--ap-border))]">
                  <Pagination
                    page={disputesData.pagination.currentPage || 1}
                    pageSize={disputesData.pagination.pageSize || filters.pageSize}
                    totalCount={disputesData.pagination.totalCount || disputesData.pagination.totalItems || 0}
                    totalPages={disputesData.pagination.totalPages}
                    hasNextPage={disputesData.pagination.hasNext ?? disputesData.pagination.hasNextPage ?? false}
                    hasPreviousPage={disputesData.pagination.hasPrevious ?? disputesData.pagination.hasPreviousPage ?? false}
                    onPageChange={handlePageChange}
                    onPageSizeChange={(newPageSize) => {
                      setFilters(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
                    }}
                  />
                </div>
              )}
            </>
          )}
        </AdminCard>
      </div>
    </div>
  );
};

// Componente para las tarjetas de estadísticas
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: AdminTone;
}> = ({ title, value, icon: Icon, tone }) => {
  const toneClasses: Record<AdminTone, string> = {
    neutral: 'bg-[hsl(220_14%_95%)] text-[hsl(var(--ap-muted))]',
    success: 'bg-[hsl(var(--ap-success-bg))] text-[hsl(var(--ap-success))]',
    warning: 'bg-[hsl(var(--ap-warning-bg))] text-[hsl(var(--ap-warning))]',
    error: 'bg-[hsl(var(--ap-error-bg))] text-[hsl(var(--ap-error))]',
    info: 'bg-[hsl(var(--ap-info-bg))] text-[hsl(var(--ap-info))]',
    brand: 'bg-[hsl(var(--ap-brand-soft))] text-[hsl(var(--ap-brand-strong))]',
  };

  return (
    <AdminCard>
      <AdminCardBody className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-medium text-[hsl(var(--ap-muted))]">{title}</p>
          <p className="text-2xl font-bold text-[hsl(var(--ap-ink))]">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${toneClasses[tone]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </AdminCardBody>
    </AdminCard>
  );
};

// Componente para las tarjetas de disputas
const DisputeCard: React.FC<{
  dispute: DisputeDto;
  onClick: () => void;
  formatDate: (date: string) => string;
}> = ({ dispute, onClick, formatDate }) => {
  return (
    <div
      onClick={onClick}
      className="admin-card cursor-pointer transition-colors hover:bg-[hsl(220_16%_98%)] p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge dispute={dispute} />
            <AdminBadge tone="neutral">Disputa</AdminBadge>
            <span className="text-[12px] text-[hsl(var(--ap-muted))]">#{dispute.id}</span>
          </div>

          <h3 className="text-base font-semibold text-[hsl(var(--ap-ink))] mb-1">
            {dispute.search.title}
          </h3>

          <p className="text-[13px] text-[hsl(var(--ap-muted))] mb-3 line-clamp-2">
            {dispute.reason}
          </p>

          {/* Información sobre respuesta del experto */}
          {dispute.expertResponse && (
            <div className="mb-3 admin-alert admin-alert--success">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <strong>Respuesta del experto:</strong>{' '}
                {dispute.expertResponse.length > 100
                  ? `${dispute.expertResponse.substring(0, 100)}...`
                  : dispute.expertResponse}
              </p>
            </div>
          )}

          {/* Estado de respuesta del experto */}
          {dispute.status === 'Pending' && (
            <div className="mb-3">
              {dispute.canExpertRespond ? (
                <AdminBadge tone="warning" icon={<Clock className="w-3.5 h-3.5" />}>
                  Experto puede responder
                </AdminBadge>
              ) : dispute.expertResponse ? (
                <AdminBadge tone="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                  Experto respondió
                </AdminBadge>
              ) : (
                <AdminBadge tone="neutral" icon={<Clock className="w-3.5 h-3.5" />}>
                  Sin respuesta · resuélvela tú
                </AdminBadge>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[hsl(var(--ap-muted))]">
            {dispute.client ? (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{dispute.client.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 opacity-60">
                <User className="w-4 h-4" />
                <span>Cliente no disponible</span>
              </div>
            )}
            {dispute.expert ? (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{dispute.expert.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 opacity-60">
                <User className="w-4 h-4" />
                <span>Experto no disponible</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <div className="flex flex-col">
                <span>{getPriceDisplay(dispute.searchHire).formattedTotal}</span>
                {getPriceDisplay(dispute.searchHire).hasTaxInfo && (
                  <span className="text-[11px] opacity-70">IVA incluido</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(dispute.createdAt)}</span>
            </div>
            {/* Indicador de archivos adjuntos */}
            {dispute.files && dispute.files.length > 0 && (
              <AdminBadge tone="info" icon={<Paperclip className="w-3.5 h-3.5" />}>
                {dispute.files.length} archivo{dispute.files.length !== 1 ? 's' : ''}
              </AdminBadge>
            )}
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <Eye className="w-5 h-5 text-[hsl(var(--ap-muted))]" />
        </div>
      </div>
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

  // Función helper para obtener el icono según el tipo de archivo
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-[hsl(var(--ap-error))]" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="w-4 h-4 text-[hsl(var(--ap-info))]" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <FileVideo className="w-4 h-4 text-[hsl(var(--ap-brand))]" />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <FileAudio className="w-4 h-4 text-[hsl(var(--ap-success))]" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="w-4 h-4 text-[hsl(var(--ap-warning))]" />;
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="w-4 h-4 text-[hsl(var(--ap-info))]" />;
      default:
        return <File className="w-4 h-4 text-[hsl(var(--ap-muted))]" />;
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
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <AdminButton variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
            Volver
          </AdminButton>
          <span className="text-[13px] text-[hsl(var(--ap-muted))]">Detalles de la disputa #{dispute.id}</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-4">
            {/* Dispute Info */}
            <AdminCard>
              <AdminCardHeader
                title="Información de la Disputa"
                actions={<StatusBadge dispute={dispute} />}
              />
              <AdminCardBody className="space-y-4">
                {/* Disputa del Cliente */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ap-info))]" />
                    <h3 className="text-sm font-semibold text-[hsl(var(--ap-ink))]">Disputa del Cliente</h3>
                  </div>
                  <div className="admin-alert admin-alert--info">
                    <p className="leading-relaxed">{dispute.reason}</p>
                  </div>

                  {/* Archivos del cliente */}
                  {dispute.files && dispute.files.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ap-info))]" />
                        <p className="text-[12px] font-medium text-[hsl(var(--ap-muted))]">Archivos del Cliente</p>
                        <AdminBadge tone="info">
                          {dispute.files.filter(file => file.fileCategory === 'client' || !file.fileCategory).length}
                        </AdminBadge>
                      </div>
                      <div className="space-y-1.5">
                        {dispute.files
                          .filter(file => file.fileCategory === 'client' || !file.fileCategory)
                          .map((file) => (
                          <div key={file.id} className="flex items-center gap-2 p-2 rounded-lg border border-[hsl(var(--ap-border))] hover:bg-[hsl(220_16%_98%)] transition-colors">
                            {getFileIcon(file.fileName)}
                            <div className="flex-1 min-w-0">
                              <a
                                href={file.fileUrl || file.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                download=""
                                className="text-[12px] text-[hsl(var(--ap-brand-strong))] hover:underline font-medium truncate block"
                                title={file.fileName}
                              >
                                {file.fileName}
                              </a>
                              {file.uploadedByUserName && (
                                <p className="text-[11px] text-[hsl(var(--ap-muted))]">
                                  por {file.uploadedByUserName}
                                </p>
                              )}
                            </div>
                            <AdminBadge tone="info">
                              {file.fileCategoryLabel || 'Archivo del Cliente'}
                            </AdminBadge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Respuesta del Experto */}
                {dispute.expertResponse && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ap-success))]" />
                      <h3 className="text-sm font-semibold text-[hsl(var(--ap-ink))]">Respuesta del Experto</h3>
                    </div>
                    <div className="admin-alert admin-alert--success">
                      <p className="leading-relaxed">{dispute.expertResponse}</p>
                    </div>

                    {/* Archivos del experto */}
                    {(dispute.expertResponseFiles && dispute.expertResponseFiles.length > 0) ||
                     (dispute.files && dispute.files.some(f => f.fileCategory === 'expert')) ? (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ap-success))]" />
                          <p className="text-[12px] font-medium text-[hsl(var(--ap-muted))]">Archivos del Experto</p>
                          <AdminBadge tone="success">
                            {(dispute.expertResponseFiles?.length || 0) + (dispute.files?.filter(f => f.fileCategory === 'expert').length || 0)}
                          </AdminBadge>
                        </div>
                        <div className="space-y-1.5">
                          {/* Mostrar archivos específicos del experto si existen */}
                          {dispute.expertResponseFiles && dispute.expertResponseFiles.map((file) => (
                            <div key={file.id} className="flex items-center gap-2 p-2 rounded-lg border border-[hsl(var(--ap-border))] hover:bg-[hsl(220_16%_98%)] transition-colors">
                              {getFileIcon(file.fileName)}
                              <div className="flex-1 min-w-0">
                                <a
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download=""
                                  className="text-[12px] text-[hsl(var(--ap-success))] hover:underline font-medium truncate block"
                                  title={file.fileName}
                                >
                                  {file.fileName}
                                </a>
                                {file.uploadedByUserName && (
                                  <p className="text-[11px] text-[hsl(var(--ap-muted))]">
                                    por {file.uploadedByUserName}
                                  </p>
                                )}
                              </div>
                              <AdminBadge tone="success">
                                {file.fileCategoryLabel || 'Archivo del Experto'}
                              </AdminBadge>
                            </div>
                          ))}
                          {/* Mostrar archivos del experto desde el array principal */}
                          {dispute.files
                            ?.filter(file => file.fileCategory === 'expert')
                            .map((file) => (
                            <div key={file.id} className="flex items-center gap-2 p-2 rounded-lg border border-[hsl(var(--ap-border))] hover:bg-[hsl(220_16%_98%)] transition-colors">
                              {getFileIcon(file.fileName)}
                              <div className="flex-1 min-w-0">
                                <a
                                  href={file.fileUrl || file.filePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download=""
                                  className="text-[12px] text-[hsl(var(--ap-success))] hover:underline font-medium truncate block"
                                  title={file.fileName}
                                >
                                  {file.fileName}
                                </a>
                                {file.uploadedByUserName && (
                                  <p className="text-[11px] text-[hsl(var(--ap-muted))]">
                                    por {file.uploadedByUserName}
                                  </p>
                                )}
                              </div>
                              <AdminBadge tone="success">
                                {file.fileCategoryLabel || 'Archivo del Experto'}
                              </AdminBadge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {dispute.expertResponseAt && (
                      <p className="text-[11px] text-[hsl(var(--ap-muted))] mt-2">
                        Respondido el {formatDate(dispute.expertResponseAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Estado de respuesta del experto */}
                {dispute.status === 'Pending' && (
                  <div className="admin-alert admin-alert--warning">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      {dispute.canExpertRespond ? (
                        <p className="font-medium">
                          El experto puede responder hasta: {dispute.expertResponseDeadline ? formatDate(dispute.expertResponseDeadline) : 'N/A'}
                        </p>
                      ) : (
                        <p className="font-medium">
                          {dispute.expertResponse ? 'El experto ya respondió' : 'El experto no respondió (era opcional) · pendiente de tu resolución manual'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[hsl(var(--ap-border))] p-3">
                    <label className="block text-[11px] font-medium text-[hsl(var(--ap-muted))] mb-1">Fecha de Creación</label>
                    <p className="text-[13px] text-[hsl(var(--ap-ink))]">{formatDate(dispute.createdAt)}</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--ap-border))] p-3">
                    <label className="block text-[11px] font-medium text-[hsl(var(--ap-muted))] mb-1.5">Estado</label>
                    <StatusBadge dispute={dispute} />
                  </div>
                </div>

                {dispute.resolutionComments && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--ap-brand))]" />
                      <h3 className="text-sm font-semibold text-[hsl(var(--ap-ink))]">Comentarios de Resolución</h3>
                    </div>
                    <div className="admin-alert admin-alert--info">
                      <p className="leading-relaxed">{dispute.resolutionComments}</p>
                    </div>
                  </div>
                )}

                {/* Archivos adjuntos: resumen */}
                {(dispute.files && dispute.files.length > 0) || (dispute.expertResponseFiles && dispute.expertResponseFiles.length > 0) ? (
                  <div className="rounded-lg border border-[hsl(var(--ap-border))] p-3">
                    <h4 className="text-[12px] font-semibold text-[hsl(var(--ap-ink))] mb-2">Archivos disponibles</h4>
                    {dispute.files && dispute.files.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[11px] text-[hsl(var(--ap-muted))] mb-1">Archivos principales ({dispute.files.length}):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {dispute.files.map((file, index) => (
                            <AdminBadge key={index} tone="neutral">
                              {file.fileName || `Archivo ${index + 1}`}
                              {file.fileCategory && ` · ${file.fileCategory}`}
                            </AdminBadge>
                          ))}
                        </div>
                      </div>
                    )}
                    {dispute.expertResponseFiles && dispute.expertResponseFiles.length > 0 && (
                      <div>
                        <p className="text-[11px] text-[hsl(var(--ap-muted))] mb-1">Archivos específicos del experto ({dispute.expertResponseFiles.length}):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {dispute.expertResponseFiles.map((file, index) => (
                            <AdminBadge key={index} tone="neutral">
                              {file.fileName || `Archivo experto ${index + 1}`}
                              {file.fileCategory && ` · ${file.fileCategory}`}
                            </AdminBadge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-[hsl(var(--ap-border))] p-3">
                    <p className="text-[13px] text-[hsl(var(--ap-muted))]">No hay archivos adjuntos en esta disputa.</p>
                  </div>
                )}
              </AdminCardBody>
            </AdminCard>

            {/* Search Info */}
            <AdminCard>
              <AdminCardHeader
                title="Información de la Búsqueda"
                actions={
                  <AdminButton
                    variant="outline"
                    size="sm"
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={handleGoToSearchDetails}
                  >
                    Ver Detalles
                  </AdminButton>
                }
              />
              <AdminCardBody className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-[hsl(var(--ap-muted))] mb-1">Título</label>
                  <p className="text-[13px] text-[hsl(var(--ap-ink))]">{dispute.search.title}</p>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[hsl(var(--ap-muted))] mb-1">Descripción</label>
                  <p className="text-[13px] text-[hsl(var(--ap-ink))]">{dispute.search.description || 'Sin descripción'}</p>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[hsl(var(--ap-muted))] mb-1">Fecha de Creación</label>
                  <p className="text-[13px] text-[hsl(var(--ap-ink))]">{formatDate(dispute.search.createdAt)}</p>
                </div>
              </AdminCardBody>
            </AdminCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Users Info */}
            <AdminCard>
              <AdminCardHeader title="Usuarios Involucrados" />
              <AdminCardBody className="space-y-3">
                {dispute.client ? (
                  <div>
                    <label className="block text-[11px] font-medium text-[hsl(var(--ap-muted))] mb-1">Cliente</label>
                    <div className="flex items-center gap-2">
                      {dispute.client.profilePictureUrl && (
                        <img
                          src={dispute.client.profilePictureUrl}
                          alt={dispute.client.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="text-[13px] font-medium text-[hsl(var(--ap-ink))]">{dispute.client.name}</p>
                        <p className="text-[11px] text-[hsl(var(--ap-muted))]">{dispute.client.email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-medium text-[hsl(var(--ap-muted))] mb-1">Cliente</label>
                    <div>
                      <p className="text-[13px] font-medium text-[hsl(var(--ap-muted))]">Cliente no disponible</p>
                      <p className="text-[11px] text-[hsl(var(--ap-muted))] opacity-70">Usuario eliminado o no asignado</p>
                    </div>
                  </div>
                )}

                {dispute.expert && (
                  <div>
                    <label className="block text-[11px] font-medium text-[hsl(var(--ap-muted))] mb-1">Experto</label>
                    <div className="flex items-center gap-2">
                      {dispute.expert.profilePictureUrl && (
                        <img
                          src={dispute.expert.profilePictureUrl}
                          alt={dispute.expert.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="text-[13px] font-medium text-[hsl(var(--ap-ink))]">{dispute.expert.name}</p>
                        <p className="text-[11px] text-[hsl(var(--ap-muted))]">{dispute.expert.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </AdminCardBody>
            </AdminCard>

            {/* Financial Info */}
            <AdminCard>
              <AdminCardHeader title="Información Financiera" />
              <AdminCardBody className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[hsl(var(--ap-muted))] mb-1">Monto</label>
                  <p className="text-xl font-bold text-[hsl(var(--ap-ink))]">{getPriceDisplay(dispute.searchHire).formattedTotal}</p>
                  {getPriceDisplay(dispute.searchHire).hasTaxInfo && (
                    <p className="text-[11px] text-[hsl(var(--ap-muted))] mt-1">IVA incluido</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[hsl(var(--ap-muted))] mb-1">Estado del Pago</label>
                  <p className="text-[13px] text-[hsl(var(--ap-ink))]">{dispute.searchHire.statusTranslated}</p>
                </div>
              </AdminCardBody>
            </AdminCard>

            {/* Actions */}
            {dispute.status === 'Pending' && (
              <AdminCard>
                <AdminCardHeader title="Acciones" />
                <AdminCardBody>
                  <AdminButton variant="brand" className="w-full" onClick={() => setShowResolveForm(true)}>
                    Resolver Disputa
                  </AdminButton>
                </AdminCardBody>
              </AdminCard>
            )}
          </div>
        </div>
      </div>

      {/* Resolución de disputa */}
      <AdminModal
        open={showResolveForm}
        onOpenChange={(open) => {
          if (!isResolving) setShowResolveForm(open);
        }}
        title="Resolver Disputa"
        description="Indica los comentarios y la acción financiera. Esta decisión es definitiva."
        footer={
          <>
            <AdminButton
              variant="ghost"
              onClick={() => setShowResolveForm(false)}
              disabled={isResolving}
            >
              Cancelar
            </AdminButton>
            <AdminButton
              variant="danger"
              loading={isResolving && resolutionAction === 'refund_client'}
              disabled={!resolutionComments.trim() || isResolving}
              onClick={() => {
                setResolutionAction('refund_client');
                if (resolutionComments.trim()) {
                  onResolve(dispute.id, resolutionComments, 'refund_client');
                }
              }}
            >
              Reembolsar al cliente
            </AdminButton>
            <AdminButton
              variant="brand"
              loading={isResolving && resolutionAction === 'pay_expert'}
              disabled={!resolutionComments.trim() || isResolving}
              onClick={() => {
                setResolutionAction('pay_expert');
                if (resolutionComments.trim()) {
                  onResolve(dispute.id, resolutionComments, 'pay_expert');
                }
              }}
            >
              Pagar al experto
            </AdminButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Comentarios de Resolución</label>
            <textarea
              value={resolutionComments}
              onChange={(e) => setResolutionComments(e.target.value)}
              placeholder="Explica la resolución de la disputa..."
              className={inputClass}
              rows={3}
            />
            {!resolutionComments.trim() && (
              <p className="text-[11px] text-[hsl(var(--ap-muted))] mt-1">
                Escribe un comentario antes de elegir una acción.
              </p>
            )}
          </div>
        </div>
      </AdminModal>
    </div>
  );
};
