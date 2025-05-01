import React, { useState, useMemo } from 'react';
import { Search, Clock, Power, ChevronRight, AlertCircle, CheckCircle, Calendar, Trash2, Pencil, ArrowLeft, Tag, Filter, X, Car, Home, Bike, LayoutGrid, LayoutList } from 'lucide-react';
import { SearchDetails } from './SearchDetails';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useSearch } from '../hooks/useSearch.hooks';
import type { SearchItem } from '../hooks/useSearch.hooks';

interface SearchDashboardProps {
    onBack: () => void;
}

interface Filters {
    search: string;
    category: number | null;
    status: 'all' | 'active' | 'inactive';
}

const SearchDashboard = ({ onBack }: SearchDashboardProps) => {
    const { user } = useAuth();
    const { categories } = useCategories();
    const {
        searches: searchesQuery,
        adminSearches: adminSearchesQuery,
        deleteSearch: deleteSearchMutation,
        toggleActive: toggleActiveMutation,
        reviseSearch: reviseSearchMutation,
        updateSearch: updateSearchMutation
    } = useSearch();

    const [selectedSearch, setSelectedSearch] = useState<number | null>(null);
    const isAdmin = user?.email === 'dcastillaa@gmail.com';
    const [editingSearch, setEditingSearch] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        frequency: 0
    });

    // View mode state
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filters state
    const [filters, setFilters] = useState<Filters>({
        search: '',
        category: null,
        status: 'all'
    });

    const searchesData = isAdmin ? adminSearchesQuery : searchesQuery;
    const loading = searchesData.isLoading;
    const error = searchesData.error;
    const searchesList: SearchItem[] = searchesData.data || [];

    // Filter searches
    const filteredSearches = useMemo(() => {
        return searchesList.filter(search => {
            const searchMatch = filters.search.toLowerCase().trim() === '' ||
                search.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                search.description.toLowerCase().includes(filters.search.toLowerCase());

            const categoryMatch = filters.category === null || search.category === filters.category;

            const statusMatch = filters.status === 'all' ||
                (filters.status === 'active' && search.isActive) ||
                (filters.status === 'inactive' && !search.isActive);

            return searchMatch && categoryMatch && statusMatch;
        });
    }, [searchesList, filters]);

    const handleToggleActive = async (searchId: number, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await toggleActiveMutation.mutateAsync(searchId);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: `🔄 Búsqueda ${!currentStatus ? 'activada' : 'desactivada'} correctamente`
                }
            }));
        } catch (error) {
            console.error('Error toggling search status:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al actualizar el estado de la búsqueda'
                }
            }));
        }
    };

    const handleSearchClick = async (searchId: number) => {
        if (isAdmin) {
            try {
                await reviseSearchMutation.mutateAsync(searchId);
            } catch (error) {
                console.error('Failed to mark search as revised:', error);
            }
        }
        setSelectedSearch(searchId);
    };

    const handleDelete = async (searchId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this search? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteSearchMutation.mutateAsync(searchId);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '🗑️ Búsqueda eliminada correctamente'
                }
            }));
        } catch (error) {
            console.error('Error deleting search:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al eliminar la búsqueda'
                }
            }));
        }
    };

    const handleEdit = (search: SearchItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSearch(search.id);
        setEditForm({
            title: search.title,
            description: search.description,
            frequency: search.frequency
        });
    };

    const handleSaveEdit = async (searchId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateSearchMutation.mutateAsync({
                searchId,
                data: {
                    ...editForm,
                    startDate: new Date().toISOString()
                }
            });

            setEditingSearch(null);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✏️ Búsqueda actualizada correctamente'
                }
            }));
        } catch (error) {
            console.error('Error updating search:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al actualizar la búsqueda'
                }
            }));
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
            status: 'all'
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

    if (selectedSearch !== null) {
        return (
            <SearchDetails
                searchId={selectedSearch}
                onBack={() => setSelectedSearch(null)}
                isAdmin={isAdmin}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 md:gap-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden md:inline">Back</span>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                            {isAdmin ? 'Búsquedas' : 'Mis Búsquedas'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Gestiona y monitoriza tus búsquedas activas
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <LayoutList className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
                {/* Search input */}
                <div className="w-full">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            placeholder="Buscar por título o descripción..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                {/* Horizontal scrollable filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
                    {/* Category filters */}
                    {categories?.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setFilters(prev => ({
                                ...prev,
                                category: prev.category === category.id ? null : category.id
                            }))}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filters.category === category.id
                                ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {category.id === 1 && <Car className="w-3.5 h-3.5" />}
                            {category.id === 2 && <Bike className="w-3.5 h-3.5" />}
                            {category.id === 3 && <Home className="w-3.5 h-3.5" />}
                            {category.name}
                        </button>
                    ))}

                    {/* Status filters */}
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, status: 'active' }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filters.status === 'active'
                            ? 'bg-green-50 text-green-600 ring-1 ring-green-200'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Activas
                    </button>
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, status: 'inactive' }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filters.status === 'inactive'
                            ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Inactivas
                    </button>

                    {/* Clear filters */}
                    {(filters.search || filters.category !== null || filters.status !== 'all') && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 hover:bg-gray-50 rounded-lg transition-all whitespace-nowrap"
                        >
                            <X className="w-3.5 h-3.5" />
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
                <Search className="w-4 h-4" />
                <span>
                    {filteredSearches.length} {filteredSearches.length === 1 ? 'búsqueda encontrada' : 'búsquedas encontradas'}
                </span>
            </div>

            {filteredSearches.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-lg">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No se encontraron búsquedas</p>
                    <p className="text-gray-400 text-sm mt-1">Prueba con otros filtros</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSearches.map((search) => (
                        <div
                            key={search.id}
                            onClick={() => handleSearchClick(search.id)}
                            className={`group bg-white rounded-xl p-6 transition-all shadow-lg ${editingSearch === search.id ? 'cursor-default' : 'cursor-pointer'
                                } hover:shadow-xl ${isAdmin && !search.isRevised
                                    ? 'border-2 border-red-500 shadow-red-500/5'
                                    : 'border-[1.5px] border-blue-200/60 shadow-blue-100/50'
                                } hover:border-blue-300 hover:border-[1.5px] relative overflow-hidden`}
                        >
                            {/* Background gradient effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-white opacity-50" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.04),transparent_50%)]" />

                            <div className="relative">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {editingSearch === search.id ? (
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                className="text-base md:text-lg font-semibold bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 w-full focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 flex items-center gap-2">
                                                {search.title}
                                                {isAdmin && search.isRevised && (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                )}
                                            </h3>
                                        )}
                                    </div>
                                    {editingSearch === search.id ? (
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm mb-4 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all"
                                            rows={2}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">{search.description}</p>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm mb-3 md:mb-4">
                                        <div className="flex items-center text-gray-600 bg-gray-50/50 rounded-lg p-2 border border-gray-100">
                                            <Clock className="w-4 h-4 mr-1" />
                                            {editingSearch === search.id ? (
                                                <input
                                                    type="number"
                                                    value={editForm.frequency}
                                                    onChange={(e) => setEditForm({ ...editForm, frequency: parseInt(e.target.value) })}
                                                    className="w-16 bg-white border border-gray-200 rounded-lg px-2 text-gray-900 ml-1 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 transition-all"
                                                    min="1"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                `Every ${search.frequency} hours`
                                            )}
                                        </div>
                                        <div className="hidden md:flex items-center text-gray-600 bg-gray-50/50 rounded-lg p-2 border border-gray-100">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {new Date(search.lastExecution).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs">
                                            {categories?.find(c => c.id === search.category) && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                                                    <Tag className="w-3.5 h-3.5" />
                                                    {categories.find(c => c.id === search.category)?.name}
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => handleToggleActive(search.id, search.isActive, e)}
                                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${search.isActive
                                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                <Power className="w-3 h-3" />
                                                <span className="hidden md:inline">{search.isActive ? 'Activa' : 'Inactiva'}</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        {editingSearch === search.id ? (
                                            <div className="flex items-center gap-2 w-full justify-end">
                                                <button
                                                    onClick={(e) => handleSaveEdit(search.id, e)}
                                                    className="text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/10"
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 w-full justify-end">
                                                <button
                                                    onClick={(e) => handleEdit(search, e)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Edit search"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(search.id, e)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Delete search"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                                                    <ChevronRight className="w-5 h-5 text-blue-600" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {isAdmin && search.user && (
                                        <div className="mt-4 text-xs md:text-sm text-blue-600 border-t border-gray-100 pt-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-xs font-medium text-blue-600">
                                                    {search.user.name[0].toUpperCase()}
                                                </span>
                                            </div>
                                            Creado por: {search.user.name} ({search.user.email})
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
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
                            {filteredSearches.map((search) => (
                                <tr
                                    key={search.id}
                                    onClick={() => handleSearchClick(search.id)}
                                    className="hover:bg-gray-50 cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{search.title}</div>
                                                <div className="text-sm text-gray-500 line-clamp-1">{search.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {categories?.find(c => c.id === search.category)?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${search.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {search.isActive ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        Cada {search.frequency} horas
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(search.lastExecution).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={(e) => handleToggleActive(search.id, search.isActive, e)}
                                                className={`p-2 rounded-lg transition-colors ${search.isActive
                                                    ? 'text-green-600 hover:bg-green-50'
                                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Power className="w-4 h-4" />
                                            </button>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export { SearchDashboard };