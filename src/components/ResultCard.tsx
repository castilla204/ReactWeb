import { Heart, Users, Gauge, Car, Check, Plus, ArrowRight } from 'lucide-react';
import { useLikes } from '../hooks/useLikes.hooks';
import { useSearch } from '../hooks/useSearch.hooks';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NotificationType } from '../lib/toast';
import { useCurrency } from '../contexts/CurrencyContext';

interface ResultCardProps {
    result: {
        id: string;
        images: string[];
        title: string;
        category: string;
        price: number;
        /** Round 24: currency original del scrape (ISO 4217). Default 'EUR'. */
        priceCurrency?: string;
        url: string;
    };
    searchId: number;
    setNotifications: React.Dispatch<React.SetStateAction<{ id: string; type: NotificationType; message: string; duration?: number }[]>>;
}

export function ResultCard({ result, searchId, setNotifications }: ResultCardProps) {
    const { isLiked, toggleLike } = useLikes(result.id);
    const { addToFiltered, removeFromFiltered, getFilteredResults } = useSearch();
    const { user } = useAuth();
    const navigate = useNavigate();
    // Round 24: convert to user's preferred currency.
    const { formatPriceWithSource, preferredCurrency } = useCurrency();
    const isAdmin = user?.email === 'dcastillaa@gmail.com';
    const filteredResults = getFilteredResults(searchId);
    const filteredResult = filteredResults.data?.find((fr) => fr.ad.id === result.id);
    const isFiltered = !!filteredResult;

    const addNotification = (type: NotificationType, message: string, duration?: number) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, type, message, duration }]);
    };

    const handleToggleFiltered = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (!isFiltered) {
                await addToFiltered.mutateAsync({
                    searchId: searchId,
                    adId: result.id,
                    notes: 'Added by admin',
                });
                addNotification('success', '✅ Ad added to filtered list');
            } else {
                if (filteredResult?.id) {
                    await removeFromFiltered.mutateAsync(filteredResult.id);
                    addNotification('success', '🗑️ Ad removed from filtered list');
                }
            }
        } catch (error) {
            console.error('Error toggling filtered:', error);
            addNotification('error', `❌ Failed to ${isFiltered ? 'remove from' : 'add to'} filtered list`);
        }
    };

    const handleClick = () => {
        navigate(`/ad/${result.id}`);
    };

    // Round 24: usar formatPriceWithSource del context para convertir según moneda preferida.
    const sourceCurrency = result.priceCurrency || 'EUR';
    const priceInfo = formatPriceWithSource(result.price, sourceCurrency, preferredCurrency);

    return (
        <div className="bg-white/95 backdrop-blur-xl rounded-xl overflow-hidden border border-blue-100 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group flex flex-col h-full">
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 cursor-pointer">
                <img
                    src={result.images[0]}
                    alt={result.title}
                    onClick={handleClick}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                    {isAdmin && (
                        <button
                            onClick={handleToggleFiltered}
                            className={`p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg transition-colors group ${isFiltered
                                ? 'text-green-500 hover:text-green-600 hover:bg-green-50'
                                : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                            title={isFiltered ? 'Remove from filtered list' : 'Add to filtered list'}
                        >
                            {isFiltered ? (
                                <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            ) : (
                                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            )}
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleLike();
                        }}
                        className={`p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                            } transition-colors`}
                    >
                        <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>
            <div
                className="p-4 flex flex-col flex-1 cursor-pointer"
                onClick={handleClick}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{result.title}</h3>
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {result.category}
                    </span>
                </div>
                <div className="flex items-center py-3 border-t border-b border-blue-50 mb-3">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Users className="w-4 h-4" />
                        <span>4 People</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Gauge className="w-4 h-4" />
                        <span>Manual</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Car className="w-4 h-4" />
                        <span>70L</span>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-baseline gap-1 flex-wrap">
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            {priceInfo.wasConverted ? `≈ ${priceInfo.converted}` : priceInfo.display}
                        </span>
                        {priceInfo.wasConverted && (
                            <span className="text-xs text-gray-500">({priceInfo.sourceFormatted})</span>
                        )}
                        <span className="text-xs text-gray-500">/day</span>
                    </div>
                    <a
                        href={result.url}
                        target="_blank"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(result.url, '_blank');
                        }}
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20"
                    >
                        <span>Rent Now</span>
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}