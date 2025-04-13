import React, { useState } from 'react';
import { Search, Clock, Power, ChevronRight, AlertCircle, CheckCircle, Calendar, Trash2, Pencil, ArrowLeft, Tag } from 'lucide-react';
import { SearchDetails } from './SearchDetails';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useSearch } from '../hooks/useSearch.hooks';
import type { SearchItem } from '../hooks/useSearch.hooks';

interface SearchDashboardProps {
    onBack: () => void;
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

    const searchesData = isAdmin ? adminSearchesQuery : searchesQuery;
    const loading = searchesData.isLoading;
    const error = searchesData.error;
    const searchesList: SearchItem[] = searchesData.data || [];

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-400">Loading searches...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-red-400">
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
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-8 min-h-screen">
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
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-100">
                    <Search className="w-4 h-4" />
                    {searchesList.length} {searchesList.length === 1 ? 'búsqueda' : 'búsquedas'} encontradas
                </div>
            </div>

            {searchesList.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-lg">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No se encontraron búsquedas activas</p>
                    <p className="text-gray-400 text-sm mt-1">Crea una nueva búsqueda para empezar</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchesList.map((search) => (
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
                                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                                                    title="Edit search"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(search.id, e)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
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
            )}
        </div>
    );
};

export { SearchDashboard };