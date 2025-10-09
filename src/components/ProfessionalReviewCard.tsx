import React from 'react';
import { Star, User, Calendar, MessageCircle } from 'lucide-react';
import { ReviewDto } from '../types/searchDetails';

interface ProfessionalReviewCardProps {
    review: ReviewDto;
}

export default function ProfessionalReviewCard({ review }: ProfessionalReviewCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 4) return 'text-green-600';
        if (score >= 3) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score: number) => {
        if (score >= 4) return 'bg-green-50 border-green-200';
        if (score >= 3) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Header con puntuación */}
            <div className={`p-6 ${getScoreBg(review.score)} border-b border-gray-100`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, index) => (
                                <Star
                                    key={index}
                                    className={`w-5 h-5 ${
                                        index < review.score 
                                            ? 'text-yellow-400 fill-current' 
                                            : 'text-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        <div>
                            <span className={`text-2xl font-bold ${getScoreColor(review.score)}`}>
                                {review.score}/5
                            </span>
                            <p className="text-sm text-gray-600">Excelente servicio</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(review.createdAt)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido de la reseña */}
            <div className="p-6">
                {/* Información del revisor */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">{review.reviewer.name}</h4>
                        <p className="text-sm text-gray-500">Cliente verificado</p>
                    </div>
                </div>

                {/* Descripción de la reseña */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <p className="text-gray-700 leading-relaxed italic">
                            "{review.description}"
                        </p>
                    </div>
                </div>

                {/* Imágenes de la reseña si las hay */}
                {review.imageUrls && review.imageUrls.length > 0 && (
                    <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Fotos del servicio</h5>
                        <div className="grid grid-cols-3 gap-2">
                            {review.imageUrls.slice(0, 3).map((imageUrl, index) => (
                                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                        src={imageUrl}
                                        alt={`Foto del servicio ${index + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                    />
                                </div>
                            ))}
                            {review.imageUrls.length > 3 && (
                                <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                                    <span className="text-xs text-gray-500">+{review.imageUrls.length - 3}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer con estado */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Reseña verificada</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        ID: #{review.id}
                    </div>
                </div>
            </div>
        </div>
    );
}
