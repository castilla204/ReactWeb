import { useState, useMemo, useEffect } from 'react';
import {
    Search,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    X,
    LayoutGrid,
    LayoutList,
    MessageSquare,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useSearch } from '../hooks/useSearch.hooks';
import type { SearchItem } from '../hooks/useSearch.hooks';
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
    status: 'all' | 'active' | 'inactive';
}

const SearchDashboard = ({ /* onBack */ }: SearchDashboardProps) => {
    const { user } = useAuth();
    const { categories } = useCategories();
    const {
        searches: searchesQuery,
        adminSearches: adminSearchesQuery,
        reviseSearch: reviseSearchMutation,
    } = useSearch();
    const navigate = useNavigate();


    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filters, setFilters] = useState<Filters>({
        search: '',
        category: null,
        status: 'active', // Default to active searches
    });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const isAdmin = user?.email === 'dcastillaa@gmail.com';
    const searchesData = isAdmin ? adminSearchesQuery : searchesQuery;
    const loading = searchesData.isLoading;
    const error = searchesData.error;
    const searchesList: SearchItem[] = Array.isArray(searchesData.data) ? searchesData.data : [];

    // Filter searches
    const filteredSearches = useMemo(() => {
        return searchesList.filter((search) => {
            const searchMatch =
                filters.search.toLowerCase().trim() === '' ||
                search.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                search.description.toLowerCase().includes(filters.search.toLowerCase());

            const categoryMatch = filters.category === null || search.category === filters.category;

            const terminalStatuses = ['dispute-resolved', 'completed', 'cancelled'];
            const isSearchInactive = !search.isActive || (search.searchHire && terminalStatuses.includes(search.searchHire.status));
            const statusMatch =
                filters.status === 'all' ||
                (filters.status === 'active' && search.isActive && (!search.searchHire || !terminalStatuses.includes(search.searchHire.status))) ||
                (filters.status === 'inactive' && isSearchInactive);

            return searchMatch && categoryMatch && statusMatch;
        });
    }, [searchesList, filters]);

    const getActivityStatus = (search: SearchItem) => {
        const terminalStatuses = ['dispute-resolved', 'completed', 'cancelled'];
        return search.isActive && (!search.searchHire || !terminalStatuses.includes(search.searchHire.status)) ? 'Activa' : 'Inactiva';
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



    const clearFilters = () => {
        setFilters({
            search: '',
            category: null,
            status: 'active', // Reset to active
        });
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
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-gray-50 rounded border border-gray-200 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <div className="flex flex-col justify-center ml-1">
                                <h1 className="text-xl font-medium text-gray-900 leading-tight">
                                        {isAdmin ? 'Servicios' : 'Mis Búsquedas'}
                                    </h1>
                                <p className="text-sm text-gray-600 mt-0.5 leading-tight">
                                    {filteredSearches.length} búsquedas • {searchesList.filter(s => getActivityStatus(s) === 'Activa').length} activas
                                </p>
                            </div>
                        </div>
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

            <div className="max-w-7xl mx-auto px-6 py-6">

            {/* Compact Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                {/* Search - Hidden on mobile */}
                <div className="hidden sm:block flex-1 max-w-md">
                    <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            placeholder="Buscar búsquedas..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
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
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.category === category.id
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                >
                                    <CategoryIcon categoryId={category.id} size="sm" />
                                    {category.name}
                                </button>
                            ))}

                        {/* Status filter - single toggle button */}
                        <button
                            onClick={() => setFilters((prev) => ({ 
                                ...prev, 
                                status: prev.status === 'active' ? 'inactive' : 'active' 
                            }))}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                filters.status === 'active'
                                    ? 'bg-green-500 text-white shadow-sm'
                                    : 'bg-gray-500 text-white shadow-sm'
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                filters.status === 'active' ? 'bg-white' : 'bg-white'
                            }`}></span>
                            {filters.status === 'active' ? 'Activas' : 'Inactivas'}
                        </button>

                        {/* Clear filters */}
                        {(filters.search || filters.category !== null || filters.status !== 'active') && (
                            <button
                                onClick={clearFilters}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
                            >
                            <X className="w-3 h-3" />
                            Limpiar
                            </button>
                        )}
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900">
                    {filteredSearches.length} {filteredSearches.length === 1 ? 'búsqueda' : 'búsquedas'}
                    <span className="text-gray-500 ml-1">• {searchesList.filter(s => getActivityStatus(s) === 'Activa').length} activas</span>
                </div>
            </div>

            {filteredSearches.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-200 rounded">
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center mx-auto mb-4">
                        <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">No se encontraron búsquedas</h3>
                    <p className="text-gray-500 text-sm">Prueba con otros filtros o crea una nueva búsqueda</p>
                </div>
            ) : (viewMode === 'grid' || isMobile) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {filteredSearches.map((search) => {
                        const hasUnreadMessages = false; // TODO: Implementar cuando esté disponible en el tipo

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
                                            {hasUnreadMessages && (
                                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                                <MessageSquare className="w-3 h-3 text-red-600" />
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
                                    <div className="text-gray-500">
                                                {new Date(search.createdAt).toLocaleDateString('es-ES', { 
                                                    day: 'numeric', 
                                            month: 'short' 
                                                })}
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
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${search.searchHire.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : search.searchHire.status === 'awaiting_client_decision'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : search.searchHire.status === 'disputed'
                                                            ? 'bg-red-100 text-red-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {search.searchHire.status.replace(/_/g, ' ')}
                                                </span>
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
                                const hasUnreadMessages = false; // TODO: Implementar cuando esté disponible en el tipo

                                return (
                                    <tr key={search.id} onClick={() => handleSearchClick(search.id)} className="hover:bg-blue-50/30 cursor-pointer transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {hasUnreadMessages && <MessageSquare className="w-4 h-4 text-red-500" />}
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
                                            <span className="text-sm text-gray-600">
                                                {new Date(search.createdAt).toLocaleDateString('es-ES', { 
                                                    day: 'numeric', 
                                                    month: 'short', 
                                                    year: 'numeric' 
                                                })}
                                                </span>
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
            </div>
        </div>
    );
};

export { SearchDashboard };