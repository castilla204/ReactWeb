import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
    images: string[];
    alt?: string;
    className?: string;
    showControls?: boolean;
    showDots?: boolean;
}

export function ImageCarousel({ 
    images, 
    alt = 'Image', 
    className = '',
    showControls = true,
    showDots = true 
}: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) return null;

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

    const hasMultipleImages = images.length > 1;

    return (
        <div className={`relative overflow-hidden group ${className}`}>
            <img
                src={images[currentIndex]}
                alt={`${alt} - Image ${currentIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-300"
            />
            {hasMultipleImages && showControls && (
                <>
                    <button
                        type="button"
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full z-10 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                        aria-label="Imagen anterior"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full z-10 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                        aria-label="Siguiente imagen"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </>
            )}
            {hasMultipleImages && showDots && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={(e) => goToImage(e, index)}
                            className={`h-1.5 rounded-full transition-all ${
                                index === currentIndex 
                                    ? 'w-6 bg-white' 
                                    : 'w-1.5 bg-white/50 hover:bg-white/70'
                            }`}
                            aria-label={`Ver imagen ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

