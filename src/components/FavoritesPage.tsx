import React from 'react';
import { ArrowLeft, Heart, ExternalLink, Trash2, ChevronLeft, ChevronRight, MapPin, Calendar } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites.hooks';

interface FavoritesPageProps {
    onBack: () => void;
}

interface ImageCarouselProps {
    images: string[];
    title: string;
}

function ImageCarousel({ images, title }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const goToImage = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex(index);
    };

    if (!images || images.length === 0) return null;

    return (
        <div className="relative aspect-video overflow-hidden group">
            <img
                src={images[currentIndex]}
                alt={`${title} - Image ${currentIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/75 rounded-full text-white/75 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/75 rounded-full text-white/75 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => goToImage(e, index)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentIndex
                                        ? 'bg-white scale-125'
                                        : 'bg-white/50 hover:bg-white/75'
                                    }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>
    );
}

export function FavoritesPage({ onBack }: FavoritesPageProps) {
    const { favorites, isLoading, removeFavorite } = useFavorites();

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-gray-400">Cargando favoritos...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 pt-48 pb-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden md:inline">Volver</span>
                    </button>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Heart className="w-6 h-6 text-red-400" />
                        Mis Favoritos
                    </h1>
                </div>
                <div className="text-sm text-gray-400">
                    {favorites.length} {favorites.length === 1 ? 'favorito' : 'favoritos'}
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/30 rounded-lg">
                    <Heart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No tienes favoritos guardados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {favorites.map((favorite) => (
                        <div
                            key={favorite.id}
                            className="bg-gray-800/30 rounded-lg overflow-hidden hover:bg-gray-800/50 transition-all border border-gray-700/50"
                        >
                            {favorite.images && favorite.images.length > 0 && (
                                <div className="relative">
                                    <ImageCarousel images={favorite.images} title={favorite.title} />
                                    <div className="absolute bottom-3 right-3 flex gap-2">
                                        <a
                                            href={favorite.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => removeFavorite(favorite.id)}
                                            className="p-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 rounded-full backdrop-blur-sm transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                                    {favorite.title}
                                </h3>
                                <p className="text-2xl font-bold text-blue-400 mb-4">
                                    {/* 🛡️ Round 28: divisa real del anuncio (puede no ser EUR) */}
                                    {new Intl.NumberFormat('es-ES', {
                                        style: 'currency',
                                        currency: ((favorite as any).priceCurrency || (favorite as any).currency || 'EUR').toUpperCase()
                                    }).format(favorite.price)}
                                </p>
                                <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                                    {favorite.description}
                                </p>
                                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {favorite.city && favorite.province
                                            ? `${favorite.city}, ${favorite.province}`
                                            : favorite.province || 'No especificada'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {favorite.publishDate
                                            ? new Date(favorite.publishDate).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            : 'Fecha no disponible'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {favorite.goodThings?.map((thing, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full"
                                        >
                                            {thing}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}