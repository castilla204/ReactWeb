import React from 'react';
import { Star } from 'lucide-react';
import { ReviewDto } from '../types/searchDetails';

interface ExistingReviewCardProps {
    review: ReviewDto;
    variant?: 'mobile' | 'desktop';
}

export default function ExistingReviewCard({ review, variant = 'desktop' }: ExistingReviewCardProps) {
    const isMobile = variant === 'mobile';
    
    const containerClasses = isMobile 
        ? "w-full mt-3 p-4 bg-green-50 border border-green-200 rounded-lg"
        : "w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg";
    
    const iconSize = isMobile ? "w-5 h-5" : "w-4 h-4";
    const starSize = isMobile ? "w-4 h-4" : "w-3 h-3";
    const titleSize = isMobile ? "text-sm" : "text-sm";
    const descriptionSize = isMobile ? "text-sm" : "text-xs";
    const metaSize = isMobile ? "text-xs" : "text-xs";

    return (
        <div className={containerClasses}>
            <div className={`flex items-center gap-2 ${isMobile ? 'mb-3' : 'mb-2'}`}>
                <Star className={`${iconSize} text-green-600 fill-current`} />
                <span className={`text-green-800 font-medium ${titleSize}`}>
                    {isMobile ? 'Reseña Enviada' : 'Reseña Enviada'}
                </span>
            </div>
            
            <div className={`flex items-center gap-1 ${isMobile ? 'mb-2' : 'mb-1'}`}>
                {Array.from({ length: 5 }, (_, index) => (
                    <Star
                        key={index}
                        className={`${starSize} ${
                            index < review.score 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                        }`}
                    />
                ))}
                <span className={`text-green-700 ${isMobile ? 'ml-2 font-medium' : 'ml-1'} ${descriptionSize}`}>
                    {review.score}/5
                </span>
            </div>
            
            <p className={`text-green-700 ${isMobile ? 'mb-2' : ''} ${descriptionSize} ${!isMobile ? 'line-clamp-2' : ''}`}>
                {review.description}
            </p>
            
            <p className={`text-green-600 ${isMobile ? '' : 'mt-1'} ${metaSize}`}>
                Por: {review.reviewer.name} • {new Date(review.createdAt).toLocaleDateString('es-ES')}
            </p>
        </div>
    );
}
