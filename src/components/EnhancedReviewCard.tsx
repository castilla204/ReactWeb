import React, { useState } from 'react';
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
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_LENGTH = 300;
    const shouldTruncate = review.description.length > MAX_LENGTH;
    const displayText = isExpanded || !shouldTruncate 
        ? review.description 
        : review.description.substring(0, MAX_LENGTH) + '...';

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long'
        });
    };

    const renderStars = (score: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star
                key={index}
                className={`w-3.5 h-3.5 ${
                    index < score 
                        ? 'fill-[#222222] text-[#222222]' 
                        : 'text-[#DDDDDD]'
                }`}
            />
        ));
    };

    const imageUrls = review.imageUrls || [];
    const displayImages = imageUrls.slice(0, maxImages);
    const remainingImages = imageUrls.length - maxImages;

    return (
        <div className="pb-6 border-b border-[#EBEBEB] last:border-b-0 w-full">
            <div className="flex items-start gap-4">
                {/* Contenido principal */}
                <div className="flex-1 min-w-0">
                    {/* Header con información del revisor */}
                    {showReviewerInfo && (
                        <div className="flex items-start gap-2.5 mb-3">
                            <div className="relative flex-shrink-0">
                                {review.reviewer?.profilePictureUrl ? (
                                    <img
                                        src={review.reviewer.profilePictureUrl}
                                        alt={review.reviewer.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`w-8 h-8 bg-[#717171] rounded-full flex items-center justify-center text-white text-xs font-medium ${review.reviewer?.profilePictureUrl ? 'hidden' : ''}`}>
                                    {review.reviewer?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="mb-1">
                                    <h4 className="font-semibold text-[#222222] text-sm mb-0.5">
                                        {review.reviewer?.name || 'Usuario Anónimo'}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-xs text-[#717171]">
                                        <span>{formatDate(review.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {renderStars(review.score)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Descripción de la reseña */}
                    <div className="mb-3">
                        <p className="text-[#222222] text-sm leading-[20px] whitespace-pre-line">
                            {displayText}
                        </p>
                        {shouldTruncate && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[#222222] text-sm font-semibold underline decoration-1 mt-1 hover:no-underline"
                            >
                                {isExpanded ? 'Mostrar menos' : 'Mostrar más'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Imágenes de la reseña - Más pequeñas y compactas */}
                {showImages && imageUrls.length > 0 && (
                    <div className="flex-shrink-0">
                        <div className="flex gap-1.5">
                            {displayImages.map((imageUrl, index) => (
                                <div 
                                    key={index} 
                                    className="relative group flex-shrink-0"
                                    style={{ width: '56px', height: '56px' }}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`Imagen ${index + 1} de la reseña`}
                                        className="w-full h-full object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                                        style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                                        onClick={() => {
                                            window.open(imageUrl, '_blank');
                                        }}
                                    />
                                    {index === maxImages - 1 && remainingImages > 0 && (
                                        <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors">
                                            <span className="text-white text-[10px] font-medium">
                                                +{remainingImages}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
        <div>
            <div className="space-y-0">
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
                <div className="pt-4">
                    <button className="text-[#222222] hover:underline text-sm font-semibold underline decoration-1">
                        Mostrar todas las {reviews.length} reseñas
                    </button>
                </div>
            )}
        </div>
    );
}
