import React from 'react';
import { Star, User, Calendar, Image as ImageIcon } from 'lucide-react';

interface EnhancedReview {
    id: number;
    score: number;
    description: string;
    createdAt: string;
    // ✅ Campos opcionales para compatibilidad con backend actual y futuro
    reviewer?: {
        id: number;
        name: string;
        email: string;
        profilePictureUrl?: string;
    };
    imageUrls?: string[];
}

interface EnhancedReviewCardProps {
    review: EnhancedReview;
    showReviewerInfo?: boolean;
    showImages?: boolean;
    maxImages?: number;
}

export default function EnhancedReviewCard({ 
    review, 
    showReviewerInfo = true, 
    showImages = true,
    maxImages = 3 
}: EnhancedReviewCardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderStars = (score: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star
                key={index}
                className={`w-4 h-4 ${
                    index < score 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                }`}
            />
        ));
    };

    const imageUrls = review.imageUrls || [];
    const displayImages = imageUrls.slice(0, maxImages);
    const remainingImages = imageUrls.length - maxImages;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Header con información del revisor */}
            {showReviewerInfo && (
                <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                        {review.reviewer?.profilePictureUrl ? (
                            <img
                                src={review.reviewer.profilePictureUrl}
                                alt={review.reviewer.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <div className={`w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium ${review.reviewer?.profilePictureUrl ? 'hidden' : ''}`}>
                            {review.reviewer?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm">
                                {review.reviewer?.name || 'Usuario Anónimo'}
                            </h4>
                            <div className="flex items-center gap-1">
                                {renderStars(review.score)}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(review.createdAt)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Descripción de la reseña */}
            <div className="mb-3">
                <p className="text-gray-700 text-sm leading-relaxed">
                    {review.description}
                </p>
            </div>

            {/* Imágenes de la reseña */}
            {showImages && imageUrls.length > 0 && (
                <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 font-medium">
                            Imágenes ({imageUrls.length})
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {displayImages.map((imageUrl, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={imageUrl}
                                    alt={`Imagen ${index + 1} de la reseña`}
                                    className="w-full h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => {
                                        // Aquí puedes implementar un modal para ver la imagen en grande
                                        window.open(imageUrl, '_blank');
                                    }}
                                />
                                {index === maxImages - 1 && remainingImages > 0 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">
                                            +{remainingImages}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer con información adicional */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>ID: {review.reviewer?.id || 'N/A'}</span>
                </div>
                <div className="text-xs text-gray-400">
                    Reseña #{review.id}
                </div>
            </div>
        </div>
    );
}

// Componente para mostrar múltiples reseñas
interface EnhancedReviewsListProps {
    reviews: EnhancedReview[];
    showReviewerInfo?: boolean;
    showImages?: boolean;
    maxImages?: number;
    maxReviews?: number;
}

export function EnhancedReviewsList({ 
    reviews, 
    showReviewerInfo = true, 
    showImages = true,
    maxImages = 3,
    maxReviews = 10
}: EnhancedReviewsListProps) {
    const displayReviews = reviews.slice(0, maxReviews);
    const remainingReviews = reviews.length - maxReviews;

    if (reviews.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Sin reseñas aún
                </h3>
                <p className="text-gray-500 text-sm">
                    Este servicio aún no tiene reseñas de clientes.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                    Reseñas ({reviews.length})
                </h3>
                {remainingReviews > 0 && (
                    <span className="text-sm text-gray-500">
                        Mostrando {displayReviews.length} de {reviews.length}
                    </span>
                )}
            </div>
            
            <div className="space-y-4">
                {displayReviews.map((review) => (
                    <EnhancedReviewCard
                        key={review.id}
                        review={review}
                        showReviewerInfo={showReviewerInfo}
                        showImages={showImages}
                        maxImages={maxImages}
                    />
                ))}
            </div>

            {remainingReviews > 0 && (
                <div className="text-center pt-4">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Ver {remainingReviews} reseñas más
                    </button>
                </div>
            )}
        </div>
    );
}
