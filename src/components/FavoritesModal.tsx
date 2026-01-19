import { type FC } from 'react';
import { X, Heart, ExternalLink, Star } from 'lucide-react';
import { useServiceFavorites } from '../hooks/useServiceFavorites';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../lib/toast';

interface FavoritesModalProps {
    onClose: () => void;
}

export const FavoritesModal: FC<FavoritesModalProps> = ({ onClose }) => {
    const { isAuthenticated } = useAuth();
    const { getUserFavorites, toggleFavoriteAsync } = useServiceFavorites();
    const { data: favoritesResponse, isLoading, error } = getUserFavorites(1, 20);
    const favorites = favoritesResponse?.data || [];

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-gray-900/90 p-8 rounded-2xl shadow-xl max-w-4xl w-full mx-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white">Favoritos</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex items-center justify-center h-48">
                        <div className="text-gray-400">Cargando favoritos...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-gray-900/90 p-8 rounded-2xl shadow-xl max-w-4xl w-full mx-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white">Favoritos</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex items-center justify-center h-48 text-red-400">
                        Error al cargar los favoritos
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-900/90 p-8 rounded-2xl shadow-xl max-w-4xl w-full mx-4 border border-gray-800">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Favoritos</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Heart className="w-12 h-12 mb-4 text-gray-500" />
                        <p>No tienes favoritos guardados</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
                        {favorites.map((favorite) => {
                            const service = favorite.service;
                            return (
                                <div key={favorite.id} className="bg-gray-800/50 rounded-lg overflow-hidden group">
                                    <div className="aspect-square relative">
                                        {service.imageUrls && service.imageUrls.length > 0 ? (
                                            <div className="relative group">
                                                <img
                                                    src={service.imageUrls[0]}
                                                    alt={service.serviceTypeName}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 aspect-square"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                <span className="text-gray-600">No image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-semibold text-white mb-1 line-clamp-2 min-h-[2.5rem]">{service.serviceTypeName}</h4>
                                        <p className="text-gray-400 text-sm mb-3">
                                            {service.expert?.city && <span>{service.expert.city} · </span>}
                                            {service.categoryName}
                                        </p>

                                        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                <span>{service.averageRating?.toFixed(1) || 'N/A'}</span>
                                            </div>
                                            <div className="text-white font-semibold">
                                                €{Math.round(service.price)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <a
                                                href={`/service/${service.id}`}
                                                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 px-3 py-1.5 rounded-lg transition-colors text-sm"
                                            >
                                                Ver servicio <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await toggleFavoriteAsync(service.id);
                                                        showToast('success', 'Favorito eliminado', 2000);
                                                    } catch (error: any) {
                                                        showToast('error', error.message || 'Error al eliminar favorito', 3000);
                                                    }
                                                }}
                                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
                                            >
                                                <Heart className="w-4 h-4 fill-current" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
