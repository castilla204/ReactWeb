import React from 'react';
import { Star, Calendar, User } from 'lucide-react';

interface CurrentReview {
    id: number;
    score: number;
    description: string;
    createdAt: string;
}

interface CurrentReviewCardProps {
    review: CurrentReview;
    showDate?: boolean;
}

export default function CurrentReviewCard({ 
    review, 
    showDate = true 
}: CurrentReviewCardProps) {
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

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Header con puntuación */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        {renderStars(review.score)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                        {review.score}/5
                    </span>
                </div>
                {showDate && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(review.createdAt)}</span>
                    </div>
                )}
            </div>

            {/* Descripción de la reseña */}
            <div className="mb-3">
                <p className="text-gray-700 text-sm leading-relaxed">
                    {review.description}
                </p>
            </div>

            {/* Footer con información adicional */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>Reseña #{review.id}</span>
                </div>
                <div className="text-xs text-gray-400">
                    {review.score === 5 ? '⭐ Excelente' : 
                     review.score === 4 ? '👍 Muy bueno' :
                     review.score === 3 ? '👌 Bueno' :
                     review.score === 2 ? '⚠️ Regular' : '❌ Malo'}
                </div>
            </div>
        </div>
    );
}

// Componente para mostrar múltiples reseñas actuales
interface CurrentReviewsListProps {
    reviews: CurrentReview[];
    showDate?: boolean;
    maxReviews?: number;
}

export function CurrentReviewsList({ 
    reviews, 
    showDate = true,
    maxReviews = 10
}: CurrentReviewsListProps) {
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

    // Calcular promedio de puntuación
    const averageRating = reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Reseñas ({reviews.length})
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, index) => (
                                <Star
                                    key={index}
                                    className={`w-4 h-4 ${
                                        index < Math.round(averageRating)
                                            ? 'text-yellow-400 fill-current' 
                                            : 'text-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            {averageRating.toFixed(1)}/5
                        </span>
                    </div>
                </div>
                {remainingReviews > 0 && (
                    <span className="text-sm text-gray-500">
                        Mostrando {displayReviews.length} de {reviews.length}
                    </span>
                )}
            </div>
            
            <div className="space-y-4">
                {displayReviews.map((review) => (
                    <CurrentReviewCard
                        key={review.id}
                        review={review}
                        showDate={showDate}
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










