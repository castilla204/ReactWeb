import { type FC } from 'react';
import { X, Heart, ExternalLink, MapPin, Clock } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites.hooks';

interface FavoritesModalProps {
    onClose: () => void;
}

export const FavoritesModal: FC<FavoritesModalProps> = ({ onClose }) => {
    const { favorites, isLoading, error, removeFavorite } = useFavorites();

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
                        {favorites.map((ad) => (
                            <div key={ad.id} className="bg-gray-800/50 rounded-lg overflow-hidden group">
                                <div className="aspect-video relative">
                                    {ad.images && ad.images.length > 0 ? (
                                        <div className="relative group">
                                            <img
                                                src={ad.images[0]}
                                                alt={ad.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 aspect-video"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                            <span className="text-gray-600">No image</span>
                                        </div>
                                    )}
                                    {ad.highlighted && (
                                        <div className="absolute top-2 right-2 bg-yellow-500/90 text-black text-xs px-3 py-1 rounded-full font-medium">
                                            Featured
                                        </div>
                                    )}
                                    {ad.isNew && (
                                        <div className="absolute top-2 left-2 bg-green-500/90 text-white text-xs px-3 py-1 rounded-full font-medium">
                                            New
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h4 className="font-semibold text-white mb-1 line-clamp-2 min-h-[2.5rem]">{ad.title}</h4>
                                    <p className="text-gray-400 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">{ad.description}</p>

                                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{ad.city}, {ad.province}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(ad.publishDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3 text-xs">
                                        <span className={`px-2 py-0.5 rounded-full ${ad.finalScore >= 70 ? 'bg-green-500/20 text-green-400' :
                                                ad.finalScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                            }`}>
                                            Score: {ad.finalScore}%
                                        </span>
                                        <span className="text-green-400">+{ad.goodThings.length}</span>
                                        <span className="text-gray-500">/</span>
                                        <span className="text-red-400">-{ad.badThings.length}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-2xl font-bold text-white">
                                                €{ad.price.toLocaleString('es-ES')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={ad.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 px-3 py-1.5 rounded-lg transition-colors text-sm"
                                            >
                                                View Ad <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => removeFavorite(ad.id)}
                                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
                                            >
                                                <Heart className="w-4 h-4 fill-current" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}