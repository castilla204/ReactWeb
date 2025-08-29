import { useState, useMemo } from 'react';
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

// Componente para iconos animados y coloridos
const CategoryIcon: React.FC<{ categoryId: number; size?: 'sm' | 'md' | 'lg' }> = ({ categoryId, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-6 h-6',
        lg: 'w-7 h-7'
    };

    const iconClass = `${sizeClasses[size]} rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-3 shadow-md`;

    switch (categoryId) {
        case 1: // Coches - Diseño de sedan clásico
            return (
                <div className={`${iconClass} bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 shadow-blue-500/40`}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white">
                        {/* Coche sedan con ventanas y ruedas bien definidas */}
                        <rect x="4" y="12" width="16" height="4" rx="1" fill="currentColor"/>
                        <rect x="6" y="8" width="12" height="4" rx="2" fill="rgba(255,255,255,0.9)"/>
                        <rect x="5" y="9" width="14" height="3" rx="1.5" fill="currentColor"/>
                        <circle cx="7" cy="17" r="1.8" fill="currentColor"/>
                        <circle cx="17" cy="17" r="1.8" fill="currentColor"/>
                        <circle cx="7" cy="17" r="0.8" fill="rgba(255,255,255,0.8)"/>
                        <circle cx="17" cy="17" r="0.8" fill="rgba(255,255,255,0.8)"/>
                    </svg>
                </div>
            );
        case 2: // Motos - MOTOCICLETA REAL
            return (
                <div className={`${iconClass} bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 shadow-orange-500/40`}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                        {/* MOTOCICLETA con motor y tanque */}
                        
                        {/* Rueda trasera */}
                        <circle cx="5" cy="17" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <circle cx="5" cy="17" r="1" fill="currentColor"/>
                        
                        {/* Rueda delantera */}
                        <circle cx="19" cy="17" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <circle cx="19" cy="17" r="1" fill="currentColor"/>
                        
                        {/* MOTOR/BLOQUE - lo que la hace MOTO */}
                        <rect x="8" y="14" width="5" height="4" rx="1" fill="currentColor"/>
                        
                        {/* TANQUE DE GASOLINA - característico de moto */}
                        <ellipse cx="12" cy="11" rx="3" ry="1.5" fill="currentColor"/>
                        
                        {/* Chasis que conecta motor con ruedas */}
                        <path d="M8 17h8" stroke="currentColor" strokeWidth="2"/>
                        
                        {/* Manillar y horquilla delantera */}
                        <path d="M15.5 17L17 10L19 8" stroke="currentColor" strokeWidth="2"/>
                        <path d="M17 8h3" stroke="currentColor" strokeWidth="1.5"/>
                        
                        {/* Asiento */}
                        <ellipse cx="14" cy="10" rx="2" ry="0.8" fill="rgba(255,255,255,0.9)"/>
                    </svg>
                </div>
            );
        case 3: // Casas
            return (
                <div className={`${iconClass} bg-gradient-to-br from-emerald-400 via-green-500 to-green-600 shadow-green-500/40`}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-white">
                        <path
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                        />
                    </svg>
                </div>
            );
        default:
            return (
                <div className={`${iconClass} bg-gradient-to-br from-gray-400 to-gray-600 shadow-gray-500/40`}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-white">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="17" r="1" fill="currentColor"/>
                    </svg>
                </div>
            );
    }
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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Loading searches...</div>
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
        <div className="min-h-screen bg-white">
            {/* Clean Header Section */}
            <div className="border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">
                                        {isAdmin ? 'Todas las Búsquedas' : 'Mis Búsquedas'}
                                    </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {filteredSearches.length} búsquedas • {searchesList.filter(s => getActivityStatus(s) === 'Activa').length} activas
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LayoutList className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">

            {/* Professional Filters Section */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
                {/* Search input */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex-1">
                    <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            placeholder="Buscar por título o descripción..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                        />
                    </div>
                </div>

                {/* Filter Pills */}
                    <div className="flex flex-wrap gap-2">
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
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.category === category.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                >
                                    <CategoryIcon categoryId={category.id} size="sm" />
                                    {category.name}
                                </button>
                            ))}

                        {/* Status filters */}
                        <button
                            onClick={() => setFilters((prev) => ({ ...prev, status: 'active' }))}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.status === 'active'
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${filters.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            Activas
                        </button>
                        <button
                            onClick={() => setFilters((prev) => ({ ...prev, status: 'inactive' }))}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.status === 'inactive'
                                ? 'bg-gray-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${filters.status === 'inactive' ? 'bg-gray-500' : 'bg-gray-400'}`}></span>
                            Inactivas
                        </button>

                        {/* Clear filters */}
                        {(filters.search || filters.category !== null || filters.status !== 'active') && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all"
                            >
                                <X className="w-4 h-4" />
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <Search className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                            {filteredSearches.length} {filteredSearches.length === 1 ? 'resultado' : 'resultados'}
                        </span>
                    </div>
                </div>
            </div>

            {filteredSearches.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron búsquedas</h3>
                    <p className="text-gray-500 text-sm">Prueba con otros filtros o crea una nueva búsqueda</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSearches.map((search) => {
                        const hasUnreadMessages = false; // TODO: Implementar cuando esté disponible en el tipo

                        return (
                            <div
                                key={search.id}
                                onClick={() => handleSearchClick(search.id)}
                                className={`group bg-white rounded-xl p-6 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-gray-200/50 border border-gray-200 hover:border-gray-300 ${isAdmin && !search.isRevised
                                        ? 'border-red-300 bg-red-50/30'
                                        : ''
                                    } relative`}
                            >
                                {/* Status indicator */}
                                {isAdmin && !search.isRevised && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                                )}
                                
                                <div className="relative">
                                    {/* Header with title and status */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2 leading-tight">
                                                    {search.title}
                                                </h3>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                            {isAdmin && search.isRevised && (
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                </div>
                                            )}
                                            {hasUnreadMessages && (
                                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                                    <MessageSquare className="w-4 h-4 text-red-600" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Description */}
                                        <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">{search.description}</p>
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-lg p-3">
                                            <div className="text-xs font-medium text-blue-700 mb-1">Fecha de creación</div>
                                            <div className="font-semibold text-gray-900">
                                                {new Date(search.createdAt).toLocaleDateString('es-ES', { 
                                                    day: 'numeric', 
                                                    month: 'short', 
                                                    year: 'numeric' 
                                                })}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 rounded-lg p-3">
                                            <div className="text-xs font-medium text-purple-700 mb-1">Categoría</div>
                                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                <CategoryIcon categoryId={search.category} size="sm" />
                                                {Array.isArray(categories) && categories.find(cat => cat.id === search.category)?.name || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Footer with key info */}
                                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-3 text-xs text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <span className={`w-2 h-2 rounded-full ${getActivityStatus(search) === 'Activa' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                {getActivityStatus(search)}
                                            </div>
                                            {search.searchHire && (
                                                <span className={`px-2 py-1 rounded text-xs ${search.searchHire.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : search.searchHire.status === 'awaiting_client_decision'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : search.searchHire.status === 'disputed'
                                                            ? 'bg-red-100 text-red-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {search.searchHire.status.replace(/_/g, ' ')}
                                                </span>
                                            )}

                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                        {search.searchHire?.expert && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-600">
                                                <img
                                                    src={search.searchHire.expert.profilePictureUrl || '/default-avatar.png'}
                                                    alt={`${search.searchHire.expert.name}'s profile`}
                                                className="w-5 h-5 rounded-full object-cover"
                                                />
                                            <span>Experto: {search.searchHire.expert.name}</span>
                                            </div>
                                        )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 overflow-hidden relative">
                    {/* Subtle gradient overlay for table */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 pointer-events-none"></div>
                    <div className="relative z-10">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Búsqueda</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha Creación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredSearches.map((search) => {
                                const hasUnreadMessages = false; // TODO: Implementar cuando esté disponible en el tipo

                                return (
                                    <tr key={search.id} onClick={() => handleSearchClick(search.id)} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {hasUnreadMessages && <MessageSquare className="w-4 h-4 text-red-500 animate-pulse" />}
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-gray-900 mb-1">{search.title}</div>
                                                    <div className="text-xs text-gray-600 line-clamp-1">{search.description}</div>
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
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${getActivityStatus(search) === 'Activa' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                <span className="text-sm font-medium text-gray-700">{getActivityStatus(search)}</span>
                                            </div>
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
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export { SearchDashboard };