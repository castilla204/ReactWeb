import { useState, useEffect } from 'react';
import {
    Search,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    LayoutGrid,
    LayoutList,
    MessageSquare,
    Settings,
    MapPin,
    Calendar,
    CalendarX,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useSearch } from '../hooks/useSearch.hooks';
import { useAppointmentStatuses, getAppointmentStatusText } from '../hooks/useAppointmentStatuses';

// ✅ NUEVOS IMPORTS PARA SISTEMA DE ESTADOS
import StatusBadge from './StatusBadge';
import { getStatusInfoWithFallback } from '../utils/statusUtils';
import type { SearchItem, SearchFilters, PaginationMetadata } from '../hooks/useSearch.hooks';
import { useNavigate } from 'react-router-dom';


interface SearchDashboardProps {
    // onBack: () => void; // Opcional, lo eliminamos si no es necesario
}

// Componente simple para categorías
const CategoryIcon: React.FC<{ categoryId: number; size?: 'sm' | 'md' | 'lg' }> = ({ categoryId, size = 'md' }) => {
    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    const getCategoryInfo = (id: number) => {
        switch (id) {
            case 1: return { emoji: '🚗', name: 'Vehículos' };
            case 2: return { emoji: '🏍️', name: 'Motos' };
            case 3: return { emoji: '🏠', name: 'Inmuebles' };
            default: return { emoji: '📋', name: 'General' };
        }
    };

    const { emoji } = getCategoryInfo(categoryId);

            return (
        <span className={`${sizeClasses[size]} select-none`}>
            {emoji}
        </span>
    );
};

interface Filters {
    search: string;
    category: number | null;
    isActive: boolean | null;      // ✅ NUEVO: Estado activo/inactivo
    isRevised: boolean | null;     // ✅ NUEVO: Estado revisado/no revisado
    searchHireStatus: string;      // ✅ NUEVO: Estado de contratación
    sortBy: string;
    sortDirection: 'asc' | 'desc';
}

const SearchDashboard = ({ /* onBack */ }: SearchDashboardProps) => {
    const { user } = useAuth();
    const { categories } = useCategories();
    const {
        searchesWithFilters, // ✅ NUEVO: Hook unificado con filtros
        reviseSearch: reviseSearchMutation,
    } = useSearch();
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filters, setFilters] = useState<Filters>({
        search: '',
        category: null,
        isActive: null,           // ✅ NUEVO: null = todos, true = activas, false = inactivas
        isRevised: null,          // ✅ NUEVO: null = todos, true = revisadas, false = no revisadas
        searchHireStatus: '',     // ✅ NUEVO: Estado de contratación
        sortBy: 'createdAt',
        sortDirection: 'desc',
    });
    const [pagination, setPagination] = useState<PaginationMetadata | null>(null); // ✅ NUEVO
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);


    const isAdmin = user?.role === 'Admin' || user?.email?.trim().toLowerCase() === 'dcastillaa@gmail.com'.toLowerCase();
    
    // ✅ COMPLETO: Preparar filtros para la API (5 filtros principales)
    const apiFilters: SearchFilters = {
        page: 1,
        pageSize: 20,
        searchTerm: filters.search || undefined,
        category: filters.category || undefined,
        isActive: filters.isActive !== null ? filters.isActive : undefined,
        isRevised: filters.isRevised !== null ? filters.isRevised : undefined,
        searchHireStatus: filters.searchHireStatus || undefined,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
    };

    // ✅ CORREGIDO: Todos los usuarios usan la nueva API con filtros
    const searchesWithFiltersQuery = searchesWithFilters(apiFilters, isAdmin, true); // Siempre habilitado
    const searchesData = searchesWithFiltersQuery; // Todos usan la misma query
    
    const loading = searchesData?.isLoading || false;
    const error = searchesData?.error;
    
    // ✅ NUEVO: Manejar la nueva estructura de respuesta (ambos endpoints tienen 'searches')
    const searchesList: SearchItem[] = searchesData?.data && 'searches' in searchesData.data 
        ? searchesData.data.searches 
        : [];
    
    // ✅ NUEVO: Actualizar paginación cuando cambien los datos
    useEffect(() => {
        if (searchesData?.data && 'pagination' in searchesData.data) {
            setPagination(searchesData.data.pagination);
        }
    }, [searchesData?.data]);

    // ✅ SIMPLIFICADO: El backend ya filtra, solo usamos los datos tal como vienen
    const filteredSearches = searchesList;

    const getActivityStatus = (search: SearchItem) => {
        // ✅ NUEVA LÓGICA: Usar isFinalizationStatus del statusInfo del backend
        if (!search.isActive) {
            return 'Inactiva';
        }
        
        if (!search.searchHire) {
            return 'Activa'; // Sin contratación = activa
        }
        
        // Si hay statusInfo, usar isFinalizationStatus
        if (search.searchHire.statusInfo) {
            return search.searchHire.statusInfo.isFinalizationStatus ? 'Inactiva' : 'Activa';
        }
        
        // Fallback: lógica hardcodeada anterior
        const terminalStatuses = ['dispute-resolved', 'completed', 'cancelled'];
        return !terminalStatuses.includes(search.searchHire.status) ? 'Activa' : 'Inactiva';
    };

    // ✅ HOOK DINÁMICO PARA ESTADOS
    const { data: appointmentStatuses } = useAppointmentStatuses();
    
    const getLocalAppointmentStatusText = (status?: string) => {
        if (!status) return 'Cita pendiente';
        return appointmentStatuses 
            ? getAppointmentStatusText(status, appointmentStatuses)
            : status;
    };

    const handleSearchClick = async (searchId: number) => {
        if (isAdmin) {
            try {
                await reviseSearchMutation.mutateAsync(searchId);
            } catch (error) {
                console.error('Failed to mark search as revised:', error);
            }
        }
        navigate(`/detalles/${searchId}`);
    };




    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header Skeleton */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-6xl mx-auto px-6 py-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                                <div>
                                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-24 mt-1 animate-pulse"></div>
                                </div>
                            </div>
                            <div className="hidden sm:flex w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Filters Skeleton */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                        <div className="hidden sm:block w-64 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                    </div>

                    {/* Results count skeleton */}
                    <div className="mb-4">
                        <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                    </div>

                    {/* Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 animate-pulse">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                    <div className="w-6 h-6 bg-gray-200 rounded-full ml-4"></div>
                                </div>
                                
                                {/* Meta Info */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                                </div>
                                
                                {/* Status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                                        <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                                    </div>
                                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                </div>
                                
                                {/* Expert info (sometimes) */}
                                {i % 3 === 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-red-500">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error instanceof Error ? error.message : 'An error occurred'}</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-8 py-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="p-3 hover:bg-slate-50 rounded-lg border border-slate-200 transition-all duration-200 hover:border-slate-300"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                                    {isAdmin ? 'Servicios' : 'Mis Búsquedas'}
                                </h1>
                                <p className="text-slate-600 mt-2 leading-relaxed">
                                    {filteredSearches.length} búsquedas • {searchesList.filter(s => getActivityStatus(s) === 'Activa').length} activas
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Admin Panel Button */}
                            {isAdmin && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    <span className="hidden sm:inline">Panel Admin</span>
                                </button>
                            )}
                            
                            {/* View Mode Toggle */}
                            <div className="hidden sm:flex items-center gap-2 bg-gray-100 p-1 rounded border">
                                <button
                                    onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    <LayoutList className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-10">


            {/* Compact Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-6">
                {/* Search - Hidden on mobile */}
                <div className="hidden sm:block flex-1 max-w-md">
                    <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            placeholder="Buscar búsquedas..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-200 hover:border-slate-300"
                        />
                    </div>
                </div>

                {/* Inline Filters */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {/* Category filters */}
                        {Array.isArray(categories) &&
                            categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            category: prev.category === category.id ? null : category.id,
                                        }))
                                    }
                                className={`px-4 py-2.5 text-sm font-semibold transition-all duration-200 border ${filters.category === category.id
                                    ? 'bg-slate-800 text-white border-slate-800 shadow-lg'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                >
                                    {category.name}
                                </button>
                            ))}

                        {/* ✅ NUEVO: Filtro de estado activo/inactivo */}
                        <button
                            onClick={() => setFilters((prev) => ({ 
                                ...prev, 
                                isActive: prev.isActive === null ? true : prev.isActive === true ? false : null
                            }))}
                            className={`px-4 py-2.5 text-sm font-semibold transition-all duration-200 border ${
                                filters.isActive === true
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg'
                                    : filters.isActive === false
                                        ? 'bg-slate-600 text-white border-slate-600 shadow-lg'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                        >
                            {filters.isActive === true ? 'Activas' : filters.isActive === false ? 'Inactivas' : 'Todas las búsquedas'}
                        </button>

                        {/* ✅ NUEVO: Filtro de estado revisado (solo admin) */}
                        {isAdmin && (
                            <button
                                onClick={() => setFilters((prev) => ({ 
                                    ...prev, 
                                    isRevised: prev.isRevised === null ? false : prev.isRevised === false ? true : null
                                }))}
                                className={`px-4 py-2.5 text-sm font-semibold transition-all duration-200 border ${
                                    filters.isRevised === true
                                        ? 'bg-green-600 text-white border-green-600 shadow-lg'
                                        : filters.isRevised === false
                                            ? 'bg-orange-600 text-white border-orange-600 shadow-lg'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                            >
                                {filters.isRevised === true ? 'Revisadas' : filters.isRevised === false ? 'Sin revisar' : 'Todas las revisiones'}
                            </button>
                        )}

                        {/* ✅ NUEVO: Filtro de estado de contratación */}
                        <select
                            value={filters.searchHireStatus}
                            onChange={(e) => setFilters((prev) => ({ 
                                ...prev, 
                                searchHireStatus: e.target.value 
                            }))}
                            className="px-4 py-2.5 text-sm font-semibold transition-all duration-200 border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        >
                            <option value="">Todos los estados</option>
                            <option value="pending">Pendiente</option>
                            <option value="awaiting_client_decision">Esperando decisión</option>
                            <option value="disputed">En disputa</option>
                            <option value="completed">Completado</option>
                            <option value="cancelled">Cancelado</option>
                            <option value="transfer_failed">Transferencia fallida</option>
                            <option value="dispute-resolved">Disputa resuelta</option>
                        </select>
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
                <div className="text-sm font-semibold text-slate-700">
                    {isAdmin && pagination ? (
                        <>
                            {pagination.totalCount} {pagination.totalCount === 1 ? 'búsqueda' : 'búsquedas'} total
                            <span className="text-slate-500 ml-2 font-normal">
                                • Página {pagination.currentPage} de {pagination.totalPages}
                            </span>
                        </>
                    ) : (
                        <>
                    {filteredSearches.length} {filteredSearches.length === 1 ? 'búsqueda' : 'búsquedas'}
                        </>
                    )}
                </div>
            </div>

            {filteredSearches.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200">
                    <div className="w-12 h-12 bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">No se encontraron búsquedas</h3>
                    <p className="text-slate-500 text-sm">Prueba con otros filtros o crea una nueva búsqueda</p>
                </div>
            ) : (viewMode === 'grid' || isMobile) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {filteredSearches.map((search) => {
                        const hasUnreadMessages = search.unreadMessagesCount > 0;

                        return (
                            <div
                                key={search.id}
                                onClick={() => handleSearchClick(search.id)}
                                className={`group bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:border-gray-300 cursor-pointer transition-all duration-200 ${isAdmin && !search.isRevised
                                        ? 'border-red-200 bg-red-50/30'
                                        : ''
                                    } relative overflow-hidden`}
                            >
                                {/* Status indicator */}
                                {isAdmin && !search.isRevised && (
                                    <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full"></div>
                                )}
                                
                                {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                                                    {search.title}
                                                </h3>
                                        <p className="text-gray-600 text-sm mt-2 line-clamp-2 leading-relaxed">
                                            {search.description}
                                        </p>
                                        </div>
                                    <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                                            {isAdmin && search.isRevised && (
                                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                                </div>
                                            )}
                                            <div className="relative">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                    hasUnreadMessages 
                                                        ? 'bg-red-100' 
                                                        : 'bg-gray-100'
                                                }`}>
                                                    <MessageSquare className={`w-3 h-3 ${
                                                        hasUnreadMessages 
                                                            ? 'text-red-600' 
                                                            : 'text-gray-400'
                                                    }`} />
                                                </div>
                                                {search.unreadMessagesCount > 0 && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                        {search.unreadMessagesCount > 9 ? '9+' : search.unreadMessagesCount}
                                                    </div>
                                                )}
                                            </div>
                                            {search.hasPendingAppointment ? (
                                            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center" title={getLocalAppointmentStatusText(search.pendingAppointmentStatus)}>
                                                <Calendar className="w-3 h-3 text-orange-600" />
                                                </div>
                                            ) : (
                                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center" title="Sin cita contratada">
                                                <CalendarX className="w-3 h-3 text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                </div>
                                
                                {/* Meta Info */}
                                <div className="flex items-center justify-between mb-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <CategoryIcon categoryId={search.category} size="sm" />
                                        <span>{Array.isArray(categories) && categories.find(cat => cat.id === search.category)?.name || 'N/A'}</span>
                                    </div>
                                    
                                    {/* Location and Date - Right Side */}
                                    <div className="flex flex-col items-end gap-2 text-sm text-gray-600">
                                        {search.locationName && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                <span className="truncate max-w-32">{search.locationName}</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span>{new Date(search.createdAt).toLocaleDateString('es-ES', { 
                                                day: 'numeric', 
                                                month: 'short' 
                                            })}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">Fecha de creación</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Status and Expert */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getActivityStatus(search) === 'Activa' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-gray-100 text-gray-600'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${getActivityStatus(search) === 'Activa' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                {getActivityStatus(search)}
                                        </span>
                                            {search.searchHire && (
                                                <StatusBadge 
                                                    statusInfo={getStatusInfoWithFallback(
                                                        search.searchHire.statusInfo,
                                                        search.searchHire.status
                                                    )}
                                                    size="sm"
                                                />
                                            )}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </div>
                                
                                {/* Expert info */}
                                        {search.searchHire?.expert && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                                                <img
                                                    src={search.searchHire.expert.profilePictureUrl || '/default-avatar.png'}
                                                    alt={`${search.searchHire.expert.name}'s profile`}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {search.searchHire.expert.name}
                                            </p>
                                            <p className="text-xs text-gray-500">Experto asignado</p>
                                        </div>
                                            </div>
                                        )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Búsqueda</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Experto</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSearches.map((search) => {
                                const hasUnreadMessages = search.unreadMessagesCount > 0;

                                return (
                                    <tr key={search.id} onClick={() => handleSearchClick(search.id)} className="hover:bg-blue-50/30 cursor-pointer transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <div className="relative">
                                                        <MessageSquare className={`w-4 h-4 ${
                                                            hasUnreadMessages 
                                                                ? 'text-red-500' 
                                                                : 'text-gray-400'
                                                        }`} />
                                                        {search.unreadMessagesCount > 0 && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                                {search.unreadMessagesCount > 9 ? '9+' : search.unreadMessagesCount}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {search.hasPendingAppointment ? (
                                                        <div title={getLocalAppointmentStatusText(search.pendingAppointmentStatus)}>
                                                            <Calendar className="w-4 h-4 text-orange-500" />
                                                        </div>
                                                    ) : (
                                                        <div title="Sin cita contratada">
                                                            <CalendarX className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                                        {search.title}
                                                    </div>
                                                    <div className="text-xs text-gray-600 line-clamp-1">
                                                        {search.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CategoryIcon categoryId={search.category} size="sm" />
                                                <span className="text-sm font-medium text-gray-700">
                                                {categories?.find((c) => c.id === search.category)?.name}
                                            </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getActivityStatus(search) === 'Activa' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-600'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getActivityStatus(search) === 'Activa' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                {getActivityStatus(search)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    <span>{new Date(search.createdAt).toLocaleDateString('es-ES', { 
                                                        day: 'numeric', 
                                                        month: 'short' 
                                                    })}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">Fecha de creación</span>
                                                {search.locationName && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 text-gray-500" />
                                                        <span className="truncate max-w-28">{search.locationName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {search.searchHire?.expert ? (
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={search.searchHire.expert.profilePictureUrl || '/default-avatar.png'}
                                                        alt={`${search.searchHire.expert.name}'s profile`}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {search.searchHire.expert.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                            </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ✅ NUEVO: Controles de paginación */}
            {isAdmin && pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                        onClick={() => {
                            // TODO: Implementar cambio de página
                            console.log('Cambiar a página anterior');
                        }}
                        disabled={!pagination.hasPrevious}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            pagination.hasPrevious
                                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                    >
                        Anterior
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                            Página {pagination.currentPage} de {pagination.totalPages}
                        </span>
                    </div>
                    
                    <button
                        onClick={() => {
                            // TODO: Implementar cambio de página
                            console.log('Cambiar a página siguiente');
                        }}
                        disabled={!pagination.hasNext}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            pagination.hasNext
                                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                    >
                        Siguiente
                    </button>
                </div>
            )}
            </div>
        </div>
    );
};

export { SearchDashboard };