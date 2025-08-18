import React, { useState, useMemo } from 'react';
import {
    Search,
    Clock,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Calendar,
    Trash2,
    Pencil,
    ArrowLeft,
    Tag,
    X,
    Car,
    Home,
    Bike,
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
        deleteSearch: deleteSearchMutation,
        reviseSearch: reviseSearchMutation,
        updateSearch: updateSearchMutation,
    } = useSearch();
    const navigate = useNavigate();

    const [editingSearch, setEditingSearch] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        frequency: 0,
    });
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

    const handleDelete = async (searchId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this search? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteSearchMutation.mutateAsync(searchId);
            window.dispatchEvent(
                new CustomEvent('showNotification', {
                    detail: {
                        type: 'success',
                        message: '🗑️ Búsqueda eliminada correctamente',
                    },
                })
            );
        } catch (error) {
            console.error('Error deleting search:', error);
            window.dispatchEvent(
                new CustomEvent('showNotification', {
                    detail: {
                        type: 'error',
                        message: '❌ Error al eliminar la búsqueda',
                    },
                })
            );
        }
    };

    const handleEdit = (search: SearchItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSearch(search.id);
        setEditForm({
            title: search.title,
            description: search.description,
            frequency: search.frequency,
        });
    };

    const handleSaveEdit = async (searchId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateSearchMutation.mutateAsync({
                searchId,
                data: {
                    ...editForm,
                    startDate: new Date().toISOString(),
                },
            });

            setEditingSearch(null);
            window.dispatchEvent(
                new CustomEvent('showNotification', {
                    detail: {
                        type: 'success',
                        message: '✏️ Búsqueda actualizada correctamente',
                    },
                })
            );
        } catch (error) {
            console.error('Error updating search:', error);
            window.dispatchEvent(
                new CustomEvent('showNotification', {
                    detail: {
                        type: 'error',
                        message: '❌ Error al actualizar la búsqueda',
                    },
                })
            );
        }
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSearch(null);
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
        <div className="bg-gray-50 min-h-screen">
            {/* Header Section - Fiverr Style */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-semibold text-gray-900">
                                        {isAdmin ? 'Todas las Búsquedas' : 'Mis Búsquedas'}
                                    </h1>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                        {filteredSearches.length}
                                    </span>
                                </div>
                                <p className="text-gray-600">Gestiona y monitoriza tus búsquedas activas</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LayoutList className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">

            {/* Filters Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                {/* Search input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Buscar búsquedas</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            placeholder="Buscar por título o descripción..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all placeholder:text-gray-500"
                        />
                    </div>
                </div>

                {/* Filter Pills */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Filtros</label>
                    <div className="flex flex-wrap gap-3">
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
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filters.category === category.id
                                        ? 'bg-gray-900 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${filters.category === category.id ? 'bg-white/20' : 'bg-white'}`}>
                                        {category.id === 1 && <Car className={`w-3 h-3 ${filters.category === category.id ? 'text-white' : 'text-gray-600'}`} />}
                                        {category.id === 2 && <Bike className={`w-3 h-3 ${filters.category === category.id ? 'text-white' : 'text-gray-600'}`} />}
                                        {category.id === 3 && <Home className={`w-3 h-3 ${filters.category === category.id ? 'text-white' : 'text-gray-600'}`} />}
                                    </div>
                                    {category.name}
                                </button>
                            ))}

                        {/* Status filters */}
                        <button
                            onClick={() => setFilters((prev) => ({ ...prev, status: 'active' }))}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filters.status === 'active'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${filters.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            Activas
                        </button>
                        <button
                            onClick={() => setFilters((prev) => ({ ...prev, status: 'inactive' }))}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filters.status === 'inactive'
                                ? 'bg-gray-100 text-gray-800 border border-gray-300'
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
                                className={`group bg-white rounded-xl p-6 transition-all duration-200 ${editingSearch === search.id ? 'cursor-default' : 'cursor-pointer'
                                    } hover:shadow-lg border border-gray-200 hover:border-gray-300 ${isAdmin && !search.isRevised
                                        ? 'ring-2 ring-red-100 border-red-200'
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
                                            {editingSearch === search.id ? (
                                                <input
                                                    type="text"
                                                    value={editForm.title}
                                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                    className="text-lg font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 w-full focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2 leading-tight">
                                                    {search.title}
                                                </h3>
                                            )}
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
                                    {editingSearch === search.id ? (
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm mb-4 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                                            rows={2}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">{search.description}</p>
                                    )}
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frecuencia</span>
                                            </div>
                                            {editingSearch === search.id ? (
                                                <input
                                                    type="number"
                                                    value={editForm.frequency}
                                                    onChange={(e) => setEditForm({ ...editForm, frequency: parseInt(e.target.value) })}
                                                    className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                                                    min="1"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-gray-900">Cada {search.frequency}h</p>
                                            )}
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Última vez</span>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {new Date(search.lastExecution).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Footer with category and status */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            {categories?.find((c) => c.id === search.category) && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                                    <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
                                                        <Tag className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-700">
                                                        {categories.find((c) => c.id === search.category)?.name}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getActivityStatus(search) === 'Activa'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full inline-block mr-2 ${getActivityStatus(search) === 'Activa' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                {getActivityStatus(search)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {search.searchHire && (
                                                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${search.searchHire.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : search.searchHire.status === 'awaiting_client_decision'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : search.searchHire.status === 'disputed'
                                                            ? 'bg-red-100 text-red-700'
                                                            : search.searchHire.status === 'cancelled' || search.searchHire.status === 'completed' || search.searchHire.status === 'dispute-resolved'
                                                                ? 'bg-gray-100 text-gray-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {search.searchHire.status.replace(/_/g, ' ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Action buttons */}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                        {editingSearch === search.id ? (
                                            <div className="flex items-center gap-2 w-full justify-end">
                                                <button
                                                    onClick={(e) => handleSaveEdit(search.id, e)}
                                                    className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 w-full justify-end">
                                                <button
                                                    onClick={(e) => handleEdit(search, e)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Edit search"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(search.id, e)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete search"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                        {search.searchHire?.expert && (
                                            <div className="mt-4 text-xs md:text-sm text-blue-600 border-t border-gray-100 pt-4 flex items-center gap-2">
                                                <img
                                                    src={search.searchHire.expert.profilePictureUrl || '/default-avatar.png'}
                                                    alt={`${search.searchHire.expert.name}'s profile`}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                />
                                                A cargo de: {search.searchHire.expert.name}
                                            </div>
                                        )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frecuencia</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Ejecución</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredSearches.map((search) => {
                                const hasUnreadMessages = false; // TODO: Implementar cuando esté disponible en el tipo

                                return (
                                    <tr key={search.id} onClick={() => handleSearchClick(search.id)} className="hover:bg-gray-50 cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {hasUnreadMessages && <MessageSquare className="w-4 h-4 text-red-500 animate-pulse" />}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{search.title}</div>
                                                    <div className="text-sm text-gray-500 line-clamp-1">{search.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {categories?.find((c) => c.id === search.category)?.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityStatus(search) === 'Activa'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {getActivityStatus(search)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">Cada {search.frequency} horas</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(search.lastExecution).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => handleEdit(search, e)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(search.id, e)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        {search.searchHire && (
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${search.searchHire.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : search.searchHire.status === 'awaiting_client_decision'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : search.searchHire.status === 'disputed'
                                                                ? 'bg-red-100 text-red-800'
                                                                : search.searchHire.status === 'cancelled' || search.searchHire.status === 'completed' || search.searchHire.status === 'dispute-resolved'
                                                                    ? 'bg-gray-100 text-gray-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {search.searchHire.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                        )}
                                        {search.searchHire?.expert && (
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <img
                                                        src={search.searchHire.expert.profilePictureUrl || '/default-avatar.png'}
                                                        alt={`${search.searchHire.expert.name}'s profile`}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                    <span>A cargo de: {search.searchHire.expert.name}</span>
                                                </div>
                                            </td>
                                        )}
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