import React, { useLayoutEffect, useState } from 'react';
import { MapPin, ArrowLeft, Heart, Car, Users, Gauge, Filter, ChevronDown, ArrowRight, Plus, Check, Trash2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch.hooks';
import { useLikes } from '../hooks/useLikes.hooks';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { useSubscription } from '../hooks/useSubscription.hooks';

interface SearchDetailsProps {
    searchId: number;
    onBack: () => void;
    isAdmin: boolean;
}

const categoryBanners = {
    1: "/src/media/Car.png", // Cars
    2: "/src/media/motorcycle.png", // Motorcycles
    3: "/src/media/house.png" // Houses
};

export function SearchDetails({ searchId, onBack, isAdmin }: SearchDetailsProps) {
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showAddAdForm, setShowAddAdForm] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [showResolveDisputeModal, setShowResolveDisputeModal] = useState(false);
    const [resolveInFavorOfClient, setResolveInFavorOfClient] = useState<boolean | null>(null);
    const [resolutionReason, setResolutionReason] = useState('');
    const { forceFinalize, completeService, disputeService, resolveDispute, getDisputeDetails } = useSubscription();
    const { getResults, getSearch } = useSearch();
    const { categories } = useCategories();
    const { user } = useAuth();
    const { fetchApi } = useApi();
    const navigate = useNavigate();
    const resultsQuery = getResults(searchId);
    const searchQuery = getSearch(searchId);
    const disputeQuery = getDisputeDetails(searchQuery.data?.searchHire?.id || 0);
    const [newAd, setNewAd] = useState({
        title: '',
        description: '',
        price: 0 as number,
        url: '',
        images: [] as string[],
        category: categories?.[0]?.id.toString() ?? '1',
        province: '',
        city: '',
        sellerType: 'particular',
        platformId: 1
    });

    // Enhanced debug logs to diagnose isClient and disputeQuery
    console.log('SearchDetails Debug:');
    console.log('User:', user);
    console.log('User ID:', user?.id);
    console.log('User Role:', user?.role);
    console.log('IsAdmin:', isAdmin);
    console.log('SearchQuery Data:', searchQuery.data);
    console.log('Search UserID:', searchQuery.data?.userId);
    console.log('SearchHire:', searchQuery.data?.searchHire);
    console.log('SearchHire Status:', searchQuery.data?.searchHire?.status);
    console.log('SearchHire ID:', searchQuery.data?.searchHire?.id);
    console.log('IsClient Breakdown:', {
        userIdMatches: user?.id === searchQuery.data?.userId,
        notExpert: user?.role !== 'Expert',
        notAdmin: !isAdmin
    });
    console.log('IsClient:', user?.id === searchQuery.data?.userId && user?.role !== 'Expert' && !isAdmin);
    console.log('Status Match:', searchQuery.data?.searchHire?.status === 'awaiting_client_decision');
    console.log('DisputeQuery:', {
        isLoading: disputeQuery.isLoading,
        isSuccess: disputeQuery.isSuccess,
        isError: disputeQuery.isError,
        data: disputeQuery.data,
        error: disputeQuery.error
    });

    const isClient = user?.id === searchQuery.data?.userId && user?.role !== 'Expert' && !isAdmin;

    const handleCancelService = async () => {
        try {
            const searchHireId = searchQuery.data?.searchHire?.id;
            if (!searchHireId) {
                throw new Error('SearchHire ID not found');
            }
            await fetchApi('/api/Subscription/cancel-service', {
                method: 'POST',
                body: JSON.stringify({ SearchHireId: searchHireId })
            });

            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✅ Servicio cancelado correctamente'
                }
            }));

            navigate('/expert-panel');
        } catch (error) {
            console.error('Error canceling service:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al cancelar el servicio'
                }
            }));
        }
    };

    const handleForceFinalize = async (favorExpert: boolean) => {
        try {
            const searchHireId = searchQuery.data?.searchHire?.id;
            if (!searchHireId) {
                throw new Error('SearchHire ID not found');
            }
            await forceFinalize({
                SearchHireId: searchHireId,
                ResolveInFavorOfClient: !favorExpert
            });
            setShowFinalizeModal(false);
            resultsQuery.refetch();
            searchQuery.refetch();
            disputeQuery.refetch();
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✅ Búsqueda finalizada exitosamente'
                }
            }));
        } catch (error) {
            console.error('Error finalizing search:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al finalizar la búsqueda'
                }
            }));
        }
    };

    const handleCompleteService = async () => {
        try {
            const searchHireId = searchQuery.data?.searchHire?.id;
            if (!searchHireId) {
                throw new Error('SearchHire ID not found');
            }
            await completeService({
                SearchHireId: searchHireId,
                ClientApproved: true
            });
            resultsQuery.refetch();
            searchQuery.refetch();
            disputeQuery.refetch();
        } catch (error) {
            console.error('Error completing service:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al completar el servicio'
                }
            }));
        }
    };

    const handleDisputeService = async () => {
        setShowDisputeModal(true);
    };

    const handleDisputeSubmit = async () => {
        try {
            const searchHireId = searchQuery.data?.searchHire?.id;
            if (!searchHireId) {
                throw new Error('SearchHire ID not found');
            }
            if (!disputeReason.trim()) {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: {
                        type: 'error',
                        message: '❌ Por favor, ingrese una razón para la disputa'
                    }
                }));
                return;
            }
            await disputeService({
                SearchHireId: searchHireId,
                Reason: disputeReason
            });
            setShowDisputeModal(false);
            setDisputeReason('');
            resultsQuery.refetch();
            searchQuery.refetch();
            disputeQuery.refetch();
        } catch (error) {
            console.error('Error disputing service:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al iniciar la disputa'
                }
            }));
        }
    };

    const handleResolveDispute = async () => {
        try {
            const searchHireId = searchQuery.data?.searchHire?.id;
            if (!searchHireId) {
                throw new Error('SearchHire ID not found');
            }
            if (!resolutionReason.trim()) {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: {
                        type: 'error',
                        message: '❌ Por favor, ingrese una razón para la resolución'
                    }
                }));
                return;
            }
            if (resolveInFavorOfClient === null) {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: {
                        type: 'error',
                        message: '❌ Por favor, seleccione a quién dar la razón'
                    }
                }));
                return;
            }
            await resolveDispute({
                SearchHireId: searchHireId,
                ResolveInFavorOfClient: resolveInFavorOfClient,
                Resolution: resolutionReason
            });
            setShowResolveDisputeModal(false);
            setResolveInFavorOfClient(null);
            setResolutionReason('');
            resultsQuery.refetch();
            searchQuery.refetch();
            disputeQuery.refetch();
        } catch (error) {
            console.error('Error resolving dispute:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al resolver la disputa'
                }
            }));
        }
    };

    const addImageField = () => {
        setNewAd(prev => ({
            ...prev,
            images: [...prev.images, '']
        }));
    };

    const removeImageField = (index: number) => {
        setNewAd(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const updateImageUrl = (index: number, value: string) => {
        setNewAd(prev => ({
            ...prev,
            images: prev.images.map((url, i) => i === index ? value : url)
        }));
    };

    const handleAddAd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetchApi(`/api/SearchResult/${searchId}/manual-ad`, {
                method: 'POST',
                body: JSON.stringify(newAd)
            });

            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✅ Ad added successfully'
                }
            }));

            setShowAddAdForm(false);
            setNewAd({
                title: '',
                description: '',
                price: 0 as number,
                url: '',
                images: [] as string[],
                category: categories?.[0]?.id.toString() ?? '1',
                province: '',
                city: '',
                sellerType: 'particular',
                platformId: 1
            });
            resultsQuery.refetch();
        } catch (error) {
            console.error('Error adding ad:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Failed to add ad'
                }
            }));
        }
    };

    useLayoutEffect(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []);

    if (resultsQuery.isLoading || searchQuery.isLoading) {
        return (
            <div className="relative w-full max-w-[1280px] mx-auto px-4 md:px-8 pb-8 pt-24 min-h-screen">
                <div className="relative h-48 mb-8 rounded-3xl overflow-hidden shadow-2xl w-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/90 via-blue-500/95 to-blue-600/90" />
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-[url('/src/media/Background.png')] bg-cover bg-center opacity-[0.07]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.08)_75%,transparent_75%,transparent)] bg-[length:100px_100px]" />
                    </div>
                    <div className="relative h-full flex items-center px-8">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                                <span className="font-medium">Back</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center h-[400px] bg-white/90 backdrop-blur-xl rounded-xl border border-gray-100 shadow-lg">
                    <div className="text-gray-600">Loading results...</div>
                </div>
            </div>
        );
    }

    if (resultsQuery.error || searchQuery.error) {
        return (
            <div className="relative w-full max-w-[1280px] mx-auto px-4 md:px-8 pb-8 pt-24 min-h-screen">
                <div className="relative h-48 mb-8 rounded-3xl overflow-hidden shadow-2xl w-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/90 via-blue-500/95 to-blue-600/90" />
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-[url('/src/media/Background.png')] bg-cover bg-center opacity-[0.07]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.08)_75%,transparent_75%,transparent)] bg-[length:100px_100px]" />
                    </div>
                    <div className="relative h-full flex items-center px-8">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                                <span className="font-medium">Back</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="text-center py-12 bg-white/90 backdrop-blur-xl rounded-xl border border-red-100 shadow-lg">
                    <p className="text-red-600">Error loading results</p>
                </div>
            </div>
        );
    }

    const results = resultsQuery.data || [];
    const search = searchQuery.data;
    const category = categories?.find(c => c.id === search?.category);

    return (
        <div className="relative w-full max-w-[1280px] mx-auto px-4 md:px-8 pb-8 pt-24">
            {/* Category Banner */}
            <div className="relative h-48 mb-8 rounded-3xl overflow-hidden shadow-2xl w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/90 via-blue-500/95 to-blue-600/90" />
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[url('/src/media/Background.png')] bg-cover bg-center opacity-[0.07]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.08)_75%,transparent_75%,transparent)] bg-[length:100px_100px]" />
                </div>
                <img
                    src={categoryBanners[search?.category as keyof typeof categoryBanners]}
                    alt={category?.name}
                    className="absolute right-8 bottom-0 h-40 object-contain opacity-90"
                />
                <div className="relative h-full flex items-center px-8">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <button onClick={onBack} className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                                <span className="font-medium">Back</span>
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setShowAddAdForm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Ad</span>
                                </button>
                            )}
                            {user?.role === 'Expert' && searchQuery.data?.searchHire?.expertId === user.id && (
                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>Cancelar Servicio</span>
                                </button>
                            )}
                            {isAdmin && searchQuery.data?.searchHire && (
                                <button
                                    onClick={() => setShowFinalizeModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-white rounded-lg transition-colors"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Finalizar Búsqueda</span>
                                </button>
                            )}
                            {isAdmin && searchQuery.data?.searchHire?.status === 'disputed' && (
                                <button
                                    onClick={() => setShowResolveDisputeModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-white rounded-lg transition-colors"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Resolver Disputa</span>
                                </button>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {search?.title}
                        </h1>
                        <p className="text-white/80">
                            {results.length} {results.length === 1 ? 'result' : 'results'} found
                        </p>
                    </div>
                </div>
            </div>

            {/* Debug Status Display */}
            <div className="mb-8 p-4 bg-yellow-100 rounded-xl">
                <p><strong>Debug Info:</strong></p>
                <p>SearchHire Status: {searchQuery.data?.searchHire?.status || 'No Status'}</p>
                <p>SearchHire ID: {searchQuery.data?.searchHire?.id || 'No ID'}</p>
                <p>IsClient: {isClient.toString()}</p>
                <p>DisputeQuery Status: {disputeQuery.isLoading ? 'Loading' : disputeQuery.isSuccess ? 'Success' : disputeQuery.isError ? 'Error' : 'Idle'}</p>
                <p>DisputeQuery Data: {JSON.stringify(disputeQuery.data)}</p>
            </div>

            {/* Dispute Details Section */}
            {searchQuery.data?.searchHire?.status === 'dispute-resolved' && (
                <div className="mb-8 p-6 bg-white/90 backdrop-blur-xl rounded-xl border border-gray-100 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Dispute Details
                        </h3>
                    </div>
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={() => disputeQuery.refetch()}
                            className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Refetch Dispute</span>
                        </button>
                    </div>
                    {disputeQuery.isLoading ? (
                        <p className="text-gray-600">Loading dispute details...</p>
                    ) : disputeQuery.isError ? (
                        <p className="text-red-600">Error loading dispute details: {disputeQuery.error?.message || 'Unknown error'}</p>
                    ) : disputeQuery.data ? (
                        <div className="space-y-2 text-gray-600">
                            <p><strong>Reason:</strong> {disputeQuery.data.Reason || 'N/A'}</p>
                            <p><strong>Resolution:</strong> {disputeQuery.data.Resolution || 'N/A'}</p>
                            <p>
                                <strong>Outcome:</strong>{' '}
                                {disputeQuery.data.ResolvedInFavorOfClient === null
                                    ? 'Not specified'
                                    : disputeQuery.data.ResolvedInFavorOfClient
                                        ? 'In favor of client'
                                        : 'In favor of expert'}
                            </p>
                            <p>
                                <strong>Dispute Created:</strong>{' '}
                                {disputeQuery.data.CreatedAt
                                    ? new Date(disputeQuery.data.CreatedAt).toLocaleDateString()
                                    : 'N/A'}
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-600">No dispute details available for this search hire.</p>
                    )}
                </div>
            )}

            {/* Awaiting Client Decision Module */}
            {isClient && searchQuery.data?.searchHire?.status === 'awaiting_client_decision' && (
                <div className="mb-8 p-6 bg-white/90 backdrop-blur-xl rounded-xl border border-blue-100 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            ¡La búsqueda ha finalizado!
                        </h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                        El experto ha completado la búsqueda. Por favor, revisa los resultados y decide si estás satisfecho con el servicio.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleDisputeService}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-700 rounded-lg transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                            <span>Disputar Servicio</span>
                        </button>
                        <button
                            onClick={handleCompleteService}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-700 rounded-lg transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            <span>Aprobar Servicio</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className="mb-8">
                <div className="flex items-center gap-3 p-4 bg-white/90 backdrop-blur-xl rounded-xl border border-blue-100 shadow-lg w-full">
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">All Filters</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="h-6 w-px bg-blue-100" />
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            Price: Low to High
                        </button>
                        <button className="px-3 py-1.5 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            Latest
                        </button>
                        <button className="px-3 py-1.5 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            Popular
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="min-h-[400px]">
                {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] bg-white/90 backdrop-blur-xl rounded-xl border border-gray-100 shadow-lg">
                        <p className="text-gray-500">No results found</p>
                        {isAdmin && <p className="text-sm text-gray-400 mt-2">Try adjusting your search criteria</p>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr relative">
                        {results.map((result) => (
                            <ResultCard key={result.id} result={result} searchId={searchId} />
                        ))}
                    </div>
                )}
            </div>

            {/* Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Iniciar Disputa
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Por favor, indique la razón de la disputa.
                        </p>
                        <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                            placeholder="Explique por qué desea disputar el servicio..."
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowDisputeModal(false);
                                    setDisputeReason('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDisputeSubmit}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Enviar Disputa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolve Dispute Modal */}
            {showResolveDisputeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Resolver Disputa
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Seleccione a quién dar la razón y proporcione una razón para la resolución.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dar razón a:
                            </label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setResolveInFavorOfClient(false)}
                                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${resolveInFavorOfClient === false ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Experto
                                </button>
                                <button
                                    onClick={() => setResolveInFavorOfClient(true)}
                                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${resolveInFavorOfClient === true ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Cliente
                                </button>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Razón de la Resolución
                            </label>
                            <textarea
                                value={resolutionReason}
                                onChange={(e) => setResolutionReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={4}
                                placeholder="Explique la razón de la resolución..."
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowResolveDisputeModal(false);
                                    setResolveInFavorOfClient(null);
                                    setResolutionReason('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleResolveDispute}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Resolver Disputa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Ad Form Modal */}
            {showAddAdForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Add Manual Ad</h3>
                        <form onSubmit={handleAddAd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newAd.title}
                                    onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newAd.description}
                                    onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                    <input
                                        type="number"
                                        value={newAd.price}
                                        onChange={(e) => setNewAd({ ...newAd, price: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                    <input
                                        type="url"
                                        value={newAd.url}
                                        onChange={(e) => setNewAd({ ...newAd, url: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Image URLs</label>
                                    <button
                                        type="button"
                                        onClick={addImageField}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        + Add Image
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {newAd.images.map((url, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="url"
                                                value={url}
                                                onChange={(e) => updateImageUrl(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter image URL"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImageField(index)}
                                                className="p-2 text-red-500 hover:text-red-600"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    {newAd.images.length === 0 && (
                                        <button
                                            type="button"
                                            onClick={addImageField}
                                            className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                                        >
                                            Click to add an image URL
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={newAd.category}
                                        onChange={(e) => setNewAd({ ...newAd, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        {categories?.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                                    <input
                                        type="text"
                                        value={newAd.province}
                                        onChange={(e) => setNewAd({ ...newAd, province: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    value={newAd.city}
                                    onChange={(e) => setNewAd({ ...newAd, city: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Seller Type</label>
                                <select
                                    value={newAd.sellerType}
                                    onChange={(e) => setNewAd({ ...newAd, sellerType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="particular">Particular</option>
                                    <option value="professional">Professional</option>
                                    <option value="dealer">Dealer</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddAdForm(false)}
                                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Ad
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Cancelar Servicio
                            </h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de que quieres cancelar este servicio? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCancelService}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Confirmar Cancelación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Force Finalize Modal */}
            {showFinalizeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Finalizar Búsqueda
                        </h3>
                        <p className="text-gray-600 mb-6">
                            ¿A quién deseas dar la razón al finalizar esta búsqueda?
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleForceFinalize(true)}
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Dar razón al Experto
                            </button>
                            <button
                                onClick={() => handleForceFinalize(false)}
                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Dar razón al Cliente
                            </button>
                            <button
                                onClick={() => setShowFinalizeModal(false)}
                                className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ResultCardProps {
    result: {
        id: string;
        images: string[];
        title: string;
        category: string;
        price: number;
        url: string;
    };
    searchId: number;
}

function ResultCard({ result, searchId }: ResultCardProps) {
    const { isLiked, toggleLike } = useLikes(result.id);
    const { addToFiltered, removeFromFiltered, getFilteredResults } = useSearch();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.email === 'dcastillaa@gmail.com';
    const filteredResults = getFilteredResults(searchId);
    const filteredResult = filteredResults.data?.find(fr => fr.ad.id === result.id);
    const isFiltered = !!filteredResult;

    const handleToggleFiltered = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (!isFiltered) {
                await addToFiltered.mutateAsync({
                    searchId: searchId,
                    adId: result.id,
                    notes: 'Added by admin'
                });
            } else {
                if (filteredResult?.id) {
                    await removeFromFiltered.mutateAsync(filteredResult.id);
                }
            }

            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: isFiltered ? '🗑️ Ad removed from filtered list' : '✅ Ad added to filtered list'
                }
            }));
        } catch (error) {
            console.error('Error toggling filtered:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: `❌ Failed to ${isFiltered ? 'remove from' : 'add to'} filtered list`
                }
            }));
        }
    };

    const handleClick = () => {
        navigate(`/ad/${result.id}`);
    };

    const priceFormatter = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    });

    return (
        <div className="bg-white/95 backdrop-blur-xl rounded-xl overflow-hidden border border-blue-100 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group flex flex-col h-full">
            <div
                className="relative aspect-[4/3] overflow-hidden bg-gray-50 cursor-pointer"
            >
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
                            title={isFiltered ? "Remove from filtered list" : "Add to filtered list"}
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
                        <Heart className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} />
                    </button>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-1 cursor-pointer" onClick={handleClick}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{result.title}</h3>
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{result.category}</span>
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
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            {priceFormatter.format(result.price)}
                        </span>
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