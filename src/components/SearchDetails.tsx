// src/components/SearchDetails.tsx
import { useLayoutEffect, useState, useEffect } from 'react';
import { ArrowLeft, Filter, ChevronDown, Star, AlertTriangle, Check, XCircle, Plus } from 'lucide-react';
import { useSearch } from '../hooks/useSearch.hooks';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useReview } from '../hooks/useReview.hooks';
import { ResultCard } from './ResultCard';
import { ReviewModal, DisputeModal, ResolveDisputeModal, AddAdModal, CancelServiceModal, FinalizeModal } from './Modals';
import { useSearchActions } from '../hooks/useSearchActions';
import { Notification, NotificationType } from './Notification';
import Chat from './Chat';

// Define interfaces
interface SearchHire {
    id: number;
    clientId?: number;
    expertId: number | null;
    status: string;
}

interface Category {
    id: number;
    name: string;
}

interface Review {
    searchHireId: number;
    reviewerId: number;
}

interface NotificationState {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
}

interface SearchDetailsProps {
    searchId: number;
    onBack: () => void;
    isAdmin: boolean;
}

interface NewAd {
    title: string;
    description: string;
    price: number;
    url: string;
    images: string[];
    category: string;
    province: string;
    city: string;
    sellerType: string;
    platformId: number;
}

const categoryBanners = {
    1: '/src/media/Car.png',
    2: '/src/media/motorcycle.png',
    3: '/src/media/house.png',
};

export default function SearchDetails({ searchId, onBack, isAdmin }: SearchDetailsProps) {
    const [modalState, setModalState] = useState({
        showFinalizeModal: false,
        showCancelConfirm: false,
        showAddAdForm: false,
        showDisputeModal: false,
        showResolveDisputeModal: false,
        showReviewModal: false,
    });
    const [disputeReason, setDisputeReason] = useState('');
    const [resolveInFavorOfClient, setResolveInFavorOfClient] = useState<boolean | null>(null);
    const [resolutionReason, setResolutionReason] = useState('');
    const [reviewForm, setReviewForm] = useState({
        score: 0,
        description: '',
        images: [] as File[],
    });
    const [newAd, setNewAd] = useState<NewAd>({
        title: '',
        description: '',
        price: 0,
        url: '',
        images: [],
        category: '',
        province: '',
        city: '',
        sellerType: 'particular',
        platformId: 1,
    });
    const [notifications, setNotifications] = useState<NotificationState[]>([]);

    const { getResults, getSearch } = useSearch();
    const { categories } = useCategories();
    const { user } = useAuth();
    const { getExpertReviews } = useReview();
    const { handleCancelService, handleForceFinalize, handleCompleteService, handleDisputeSubmit, handleResolveDispute, handleAddAd } =
        useSearchActions(setNotifications);

    const resultsQuery = getResults(searchId);
    const searchQuery = getSearch(searchId);
    const reviewsQuery = getExpertReviews(searchQuery.data?.searchHire?.expertId || 0);

    // Convert IDs to numbers, handle missing clientId
    const userId = Number(user?.id) || 0;
    const clientId = Number(searchQuery.data?.searchHire?.clientId ?? searchQuery.data?.userId ?? 0);
    const expertId = Number(searchQuery.data?.searchHire?.expertId ?? 0);

    const isClient = userId === clientId;
    const isExpert = userId === expertId;
    const hasReviewed =
        reviewsQuery.data?.some(
            (review: Review) => review.searchHireId === searchQuery.data?.searchHire?.id && review.reviewerId === userId
        ) || false;
    const canReview =
        isClient && searchQuery.data?.searchHire && ['completed', 'dispute-resolved'].includes(searchQuery.data.searchHire.status) && !hasReviewed;
    const canDispute = isClient && searchQuery.data?.searchHire?.status === 'awaiting_client_decision';
    const canCancel = isExpert && searchQuery.data?.searchHire && !['completed', 'canceled', 'disputed'].includes(searchQuery.data.searchHire.status);
    const isDisputed = (isClient || isExpert) && searchQuery.data?.searchHire?.status === 'disputed';
    const canViewChat = (isClient || isExpert || isAdmin) && !!searchQuery.data?.searchHire;

    const category = categories?.find((c: Category) => c.id === searchQuery.data?.category);

    // Handle chat access notification
    useEffect(() => {
        if (!canViewChat && searchQuery.data?.searchHire && searchQuery.isSuccess) {
            setNotifications((prev) => [
                ...prev.filter((n) => !n.id.startsWith('chat-access-denied-')),
                {
                    id: `chat-access-denied-${Date.now()}`,
                    type: 'error' as NotificationType,
                    message: `Chat not visible: User ID (${userId}) does not match Client ID (${clientId}) or Expert ID (${expertId})`,
                    duration: 5000,
                },
            ]);
        }
    }, [canViewChat, searchQuery.data, searchQuery.isSuccess, userId, clientId, expertId]);

    useLayoutEffect(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []);

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

    // Enhanced debug logging
    if (process.env.NODE_ENV === 'development') {
        console.log('Debug Info:', {
            SearchHireStatus: searchQuery.data?.searchHire?.status || 'No Status',
            SearchHireID: searchQuery.data?.searchHire?.id || 'No ID',
            IsClient: isClient,
            IsExpert: isExpert,
            CanReview: canReview ?? false,
            CanDispute: canDispute ?? false,
            CanCancel: canCancel ?? false,
            IsDisputed: isDisputed ?? false,
            HasReviewed: hasReviewed,
            UserRole: user?.role || 'N/A',
            UserID: userId,
            ClientID: clientId,
            ExpertID: expertId,
            RawUserId: user?.id,
            RawClientId: searchQuery.data?.searchHire?.clientId,
            RawExpertId: searchQuery.data?.searchHire?.expertId,
            SearchData: searchQuery.data,
            CanViewChat: canViewChat,
        });
    }

    const handleAddAdAndClose = async () => {
        await handleAddAd(searchId, newAd, () => {
            resultsQuery.refetch();
            setModalState((prev) => ({ ...prev, showAddAdForm: false }));
            setNewAd({
                title: '',
                description: '',
                price: 0,
                url: '',
                images: [],
                category: categories?.[0]?.id.toString() ?? '1',
                province: '',
                city: '',
                sellerType: 'particular',
                platformId: 1,
            });
        });
    };

    const handleDisputeSubmitAndClose = async () => {
        await handleDisputeSubmit(searchQuery.data?.searchHire?.id, disputeReason, () => {
            resultsQuery.refetch();
            searchQuery.refetch();
            setModalState((prev) => ({ ...prev, showDisputeModal: false }));
            setDisputeReason('');
        });
    };

    const handleResolveDisputeAndClose = async () => {
        await handleResolveDispute(searchQuery.data?.searchHire?.id, resolveInFavorOfClient, resolutionReason, () => {
            resultsQuery.refetch();
            searchQuery.refetch();
            setModalState((prev) => ({ ...prev, showResolveDisputeModal: false }));
            setResolveInFavorOfClient(null);
            setResolutionReason('');
        });
    };

    const handleCancelServiceAndClose = async () => {
        await handleCancelService(searchQuery.data?.searchHire?.id, () => {
            resultsQuery.refetch();
            searchQuery.refetch();
            setModalState((prev) => ({ ...prev, showCancelConfirm: false }));
        });
    };

    const handleForceFinalizeAndClose = async (favorExpert: boolean) => {
        await handleForceFinalize(searchQuery.data?.searchHire?.id, favorExpert, () => {
            resultsQuery.refetch();
            searchQuery.refetch();
            setModalState((prev) => ({ ...prev, showFinalizeModal: false }));
        });
    };

    const handleApproveService = async () => {
        await handleCompleteService(searchQuery.data?.searchHire?.id);
        resultsQuery.refetch();
        searchQuery.refetch();
    };

    if (resultsQuery.isLoading || searchQuery.isLoading || reviewsQuery.isLoading) {
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
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back</span>
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-center h-[400px] bg-white/90 backdrop-blur-xl rounded-xl border border-gray-100 shadow-lg">
                    <div className="text-gray-600">Loading results...</div>
                </div>
                {notifications.map((notification) => (
                    <Notification
                        key={notification.id}
                        type={notification.type}
                        message={notification.message}
                        onClose={() => removeNotification(notification.id)}
                        duration={notification.duration}
                    />
                ))}
            </div>
        );
    }

    if (resultsQuery.error || searchQuery.error || reviewsQuery.error) {
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
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back</span>
                        </button>
                    </div>
                </div>
                <div className="text-center py-12 bg-white/90 backdrop-blur-xl rounded-xl border border-red-100 shadow-lg">
                    <p className="text-red-600">Error loading results</p>
                </div>
                {notifications.map((notification) => (
                    <Notification
                        key={notification.id}
                        type={notification.type}
                        message={notification.message}
                        onClose={() => removeNotification(notification.id)}
                        duration={notification.duration}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-[1280px] mx-auto px-4 md:px-8 pb-8 pt-24">
            <div className="relative h-48 mb-8 rounded-3xl overflow-hidden shadow-2xl w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/90 via-blue-500/95 to-blue-600/90" />
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[url('/src/media/Background.png')] bg-cover bg-center opacity-[0.07]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.08)_75%,transparent_75%,transparent)] bg-[length:100px_100px]" />
                </div>
                <img
                    src={categoryBanners[searchQuery.data?.category as keyof typeof categoryBanners] || categoryBanners[1]}
                    alt={category?.name || 'Category'}
                    className="absolute right-8 bottom-0 h-40 object-contain opacity-90"
                />
                <div className="relative h-full flex items-center px-8">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="font-medium">Back</span>
                            </button>
                            {(isAdmin || isExpert) && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showAddAdForm: true }))}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Ad</span>
                                </button>
                            )}
                            {canCancel && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showCancelConfirm: true }))}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>Cancelar Servicio</span>
                                </button>
                            )}
                            {isAdmin && searchQuery.data?.searchHire && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showFinalizeModal: true }))}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-white rounded-lg transition-colors"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Finalizar Búsqueda</span>
                                </button>
                            )}
                            {isAdmin && isDisputed && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showResolveDisputeModal: true }))}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-white rounded-lg transition-colors"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Resolver Disputa</span>
                                </button>
                            )}
                            {canReview && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-white rounded-lg transition-colors"
                                >
                                    <Star className="w-4 h-4" />
                                    <span>Submit Review</span>
                                </button>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">{searchQuery.data?.title || 'Loading...'}</h1>
                        <p className="text-white/80">
                            {resultsQuery.data?.length || 0} {resultsQuery.data?.length === 1 ? 'result' : 'results'} found
                        </p>
                    </div>
                </div>
            </div>

            {process.env.NODE_ENV === 'development' && (
                <div className="mb-8 p-4 bg-yellow-100 rounded-xl">
                    <p>
                        <strong>Debug Info:</strong>
                    </p>
                    <p>SearchHire Status: {searchQuery.data?.searchHire?.status || 'No Status'}</p>
                    <p>SearchHire ID: {searchQuery.data?.searchHire?.id || 'No ID'}</p>
                    <p>IsClient: {isClient.toString()}</p>
                    <p>IsExpert: {isExpert.toString()}</p>
                    <p>CanReview: {(canReview ?? false).toString()}</p>
                    <p>CanDispute: {(canDispute ?? false).toString()}</p>
                    <p>CanCancel: {(canCancel ?? false).toString()}</p>
                    <p>IsDisputed: {(isDisputed ?? false).toString()}</p>
                    <p>HasReviewed: {hasReviewed.toString()}</p>
                    <p>User Role: {user?.role || 'N/A'}</p>
                    <p>User ID: {userId || 'N/A'}</p>
                    <p>Client ID: {clientId || 'N/A'}</p>
                    <p>Expert ID: {expertId || 'N/A'}</p>
                    <p>CanViewChat: {canViewChat.toString()}</p>
                    <p>Raw User ID: {user?.id || 'N/A'}</p>
                    <p>Raw Client ID: {searchQuery.data?.searchHire?.clientId || 'N/A'}</p>
                    <p>Raw Expert ID: {searchQuery.data?.searchHire?.expertId || 'N/A'}</p>
                    <p>Search Data: {JSON.stringify(searchQuery.data, null, 2)}</p>
                </div>
            )}

            {isDisputed && (
                <div className="mb-8 p-6 bg-white/90 backdrop-blur-xl rounded-xl border border-amber-100 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Disputa Abierta</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                        Hay una disputa abierta para esta búsqueda. Será resuelta pronto por un administrador.
                    </p>
                </div>
            )}

            {isExpert && searchQuery.data?.searchHire?.status === 'awaiting_client_decision' && (
                <div className="mb-8 p-6 bg-white/90 backdrop-blur-xl rounded-xl border border-blue-100 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Esperando Aprobación del Cliente</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                        La búsqueda está lista para la decisión del cliente. Por favor, espera a que el cliente apruebe o dispute el servicio.
                    </p>
                </div>
            )}

            {canDispute && (
                <div className="mb-8 p-6 bg-white/90 backdrop-blur-xl rounded-xl border border-blue-100 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">¡La búsqueda ha finalizado!</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                        El experto ha completado la búsqueda. Por favor, revisa los resultados y decide si estás satisfecho con el servicio.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setModalState((prev) => ({ ...prev, showDisputeModal: true }))}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-700 rounded-lg transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                            <span>Disputar Servicio</span>
                        </button>
                        <button
                            onClick={handleApproveService}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-700 rounded-lg transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            <span>Aprobar Servicio</span>
                        </button>
                    </div>
                </div>
            )}

            {canViewChat && (
                <div className="mb-8">
                    <Chat searchId={searchId} setNotifications={setNotifications} />
                </div>
            )}

            {!canViewChat && searchQuery.data?.searchHire && (
                <div className="mb-8 p-6 bg-white/90 backdrop-blur-xl rounded-xl border border-red-100 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Acceso al Chat Denegado</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                        No tienes permiso para acceder al chat de esta búsqueda. Solo el cliente, el experto asignado o un administrador pueden ver el chat.
                    </p>
                </div>
            )}

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

            <div className="min-h-[400px]">
                {resultsQuery.data?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] bg-white/90 backdrop-blur-xl rounded-xl border border-gray-100 shadow-lg">
                        <p className="text-gray-500">No results found</p>
                        {(isAdmin || isExpert) && (
                            <p className="text-sm text-gray-400 mt-2">Try adding a new ad or adjusting your search criteria</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr relative">
                        {resultsQuery.data?.map((result) => (
                            <ResultCard key={result.id} result={result} searchId={searchId} setNotifications={setNotifications} />
                        ))}
                    </div>
                )}
            </div>

            <ReviewModal
                isOpen={modalState.showReviewModal}
                onClose={() => {
                    setModalState((prev) => ({ ...prev, showReviewModal: false }));
                    setReviewForm({ score: 0, description: '', images: [] });
                }}
                searchHireId={searchQuery.data?.searchHire?.id}
                reviewForm={reviewForm}
                setReviewForm={setReviewForm}
                onSubmit={() => {
                    searchQuery.refetch();
                    reviewsQuery.refetch();
                    setModalState((prev) => ({ ...prev, showReviewModal: false }));
                    setReviewForm({ score: 0, description: '', images: [] });
                }}
                setNotifications={setNotifications}
            />
            <DisputeModal
                isOpen={modalState.showDisputeModal}
                onClose={() => {
                    setModalState((prev) => ({ ...prev, showDisputeModal: false }));
                    setDisputeReason('');
                }}
                disputeReason={disputeReason}
                setDisputeReason={setDisputeReason}
                onSubmit={handleDisputeSubmitAndClose}
            />
            <ResolveDisputeModal
                isOpen={modalState.showResolveDisputeModal}
                onClose={() => {
                    setModalState((prev) => ({ ...prev, showResolveDisputeModal: false }));
                    setResolveInFavorOfClient(null);
                    setResolutionReason('');
                }}
                resolveInFavorOfClient={resolveInFavorOfClient}
                setResolveInFavorOfClient={setResolveInFavorOfClient}
                resolutionReason={resolutionReason}
                setResolutionReason={setResolutionReason}
                onSubmit={handleResolveDisputeAndClose}
            />
            <AddAdModal
                isOpen={modalState.showAddAdForm}
                onClose={() => {
                    setModalState((prev) => ({ ...prev, showAddAdForm: false }));
                    setNewAd({
                        title: '',
                        description: '',
                        price: 0,
                        url: '',
                        images: [],
                        category: categories?.[0]?.id.toString() ?? '1',
                        province: '',
                        city: '',
                        sellerType: 'particular',
                        platformId: 1,
                    });
                }}
                newAd={newAd}
                setNewAd={setNewAd}
                categories={categories}
                onSubmit={handleAddAdAndClose}
            />
            <CancelServiceModal
                isOpen={modalState.showCancelConfirm}
                onClose={() => setModalState((prev) => ({ ...prev, showCancelConfirm: false }))}
                onConfirm={handleCancelServiceAndClose}
            />
            <FinalizeModal
                isOpen={modalState.showFinalizeModal}
                onClose={() => setModalState((prev) => ({ ...prev, showFinalizeModal: false }))}
                onFinalize={handleForceFinalizeAndClose}
            />
            {notifications.map((notification) => (
                <Notification
                    key={notification.id}
                    type={notification.type}
                    message={notification.message}
                    onClose={() => removeNotification(notification.id)}
                    duration={notification.duration}
                />
            ))}
        </div>
    );
}