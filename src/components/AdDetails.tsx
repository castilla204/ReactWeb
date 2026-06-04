import { useState } from 'react';
import { Heart, ArrowLeft, Star } from 'lucide-react';
import { useLikes } from '../hooks/useLikes.hooks';
import { useParams } from 'react-router-dom';
import { useSearch, type SearchResult } from '../hooks/useSearch.hooks';

export interface AdDetailsProps {
    onBack: () => void;
}

interface ImageGalleryProps {
    images: string[];
    title: string;
    currentIndex: number;
    onImageSelect: (index: number) => void;
}

function ImageGallery({ images, title, currentIndex, onImageSelect }: ImageGalleryProps) {
    const displayedImages = images.slice(0, 2);
    const remainingCount = images.length - 2;

    return (
        <div className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                <img
                    key={currentIndex}
                    src={images[currentIndex]}
                    alt={title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = new URL('../media/Car.png', import.meta.url).href; // Fallback image
                    }}
                />
            </div>
            <div className="grid grid-cols-3 gap-4">
                {displayedImages.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => onImageSelect(index)}
                        className={`aspect-[4/3] rounded-xl overflow-hidden ${currentIndex === index
                            ? 'ring-2 ring-blue-600'
                            : 'ring-1 ring-gray-200'
                            }`}
                    >
                        <img
                            src={image}
                            alt={`${title} - View ${index + 1}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.src = new URL('../media/Car.png', import.meta.url).href; // Fallback image
                            }}
                        />
                    </button>
                ))}
                {images.length > 2 && (
                    <button
                        onClick={() => onImageSelect(2)}
                        className="aspect-[4/3] rounded-xl overflow-hidden relative bg-gray-900 group"
                    >
                        <img
                            src={images[2]}
                            alt={`${title} - More images`}
                            className="w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white font-medium">
                            <span>+{remainingCount + 1}</span>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}

export function AdDetails({ onBack }: AdDetailsProps) {
    const { id } = useParams();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { isLiked, toggleLike } = useLikes(id || '');
    const [randomRating] = useState(() => (Math.random() * 1.5 + 3.5)); // Random between 3.5 and 5
    const { searches, getResults } = useSearch();

    // Find the result across all searches
    let result: SearchResult | undefined;
    if (searches.data) {
        for (const search of searches.data) {
            const resultsQuery = getResults(search.id);
            result = resultsQuery.data?.find(r => r.id === id);
            if (result) break;
        }
    }

    if (!result) {
        return (
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-16">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <div className="text-center text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-16">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Images */}
                <ImageGallery
                    images={result.images}
                    title={result.title}
                    currentIndex={currentImageIndex}
                    onImageSelect={setCurrentImageIndex}
                />

                {/* Right Column - Details */}
                <div>
                    <div className="flex items-start justify-between mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">{result.title}</h1>
                        <button
                            onClick={() => toggleLike()}
                            className={`p-2 rounded-full ${isLiked
                                ? 'text-red-500 bg-red-50'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                } transition-colors`}
                        >
                            <Heart className="w-6 h-6" fill={isLiked ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        {[...Array(5)].map((_, i) => {
                            const starValue = i + 1;
                            const isFilled = randomRating >= starValue;
                            const isHalfFilled = !isFilled && randomRating > starValue - 0.5;

                            return (
                                <Star
                                    key={i}
                                    className={`w-5 h-5 ${isFilled || isHalfFilled ? 'text-yellow-400' : 'text-gray-200'
                                        }`}
                                    fill={isFilled ? "currentColor" : isHalfFilled ? "url(#half)" : "none"}
                                />
                            );
                        })}
                        <span className="text-gray-600 text-sm">Score: {randomRating.toFixed(1)}</span>
                    </div>

                    <p className="text-gray-600 mb-8">{result.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="space-y-4">
                            <div>
                                <span className="text-gray-500 text-sm">Category</span>
                                <p className="text-gray-900 font-medium">{result.category}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-sm">Provincia</span>
                                <p className="text-gray-900 font-medium">{result.province}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <span className="text-gray-500 text-sm">Ciudad</span>
                                <p className="text-gray-900 font-medium">{result.city}</p>
                            </div>
                            <div>
                                <span className="text-gray-500 text-sm">Tipo de Vendedor</span>
                                <p className="text-gray-900 font-medium">{result.sellerType}</p>
                            </div>
                        </div>
                    </div>

                    <div className="py-4 border-t border-b border-gray-100 mb-8">
                        <h3 className="font-medium text-gray-900 mb-2">Aspectos Positivos</h3>
                        <ul className="space-y-1">
                            {result.goodThings?.map((thing: string, index: number) => (
                                <li key={index} className="text-green-600 text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                                    {thing}
                                </li>
                            ))}
                        </ul>

                        {result.badThings?.length > 0 && (
                            <>
                                <h3 className="font-medium text-gray-900 mt-4 mb-2">Aspectos Negativos</h3>
                                <ul className="space-y-1">
                                    {result.badThings?.map((thing: string, index: number) => (
                                        <li key={index} className="text-red-600 text-sm flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                                            {thing}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-gray-500 text-sm">Precio</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-gray-900">
                                    {/* 🛡️ Round 28: anuncio scrapeado puede venir en GBP/PLN/etc., usar divisa real */}
                                    {new Intl.NumberFormat('es-ES', {
                                        style: 'currency',
                                        currency: ((result as any).priceCurrency || (result as any).currency || 'EUR').toUpperCase()
                                    }).format(result.price)}
                                </span>
                            </div>
                        </div>
                        <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            Ver Anuncio
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}