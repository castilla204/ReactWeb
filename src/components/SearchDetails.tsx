import { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { ArrowLeft, Filter, ChevronDown, Star, AlertTriangle, Check, XCircle, Plus, MessageCircle, Upload } from 'lucide-react';
import { useSearch } from '../hooks/useSearch.hooks';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useReview } from '../hooks/useReview.hooks';
import { useChat } from '../hooks/useChat';
import { ResultCard } from './ResultCard';
import Chat from './Chat';
import { ReviewModal, DisputeModal, ResolveDisputeModal, AddAdModal, CancelServiceModal, FinalizeModal } from './Modals';
import { useSearchActions } from '../hooks/useSearchActions';
import { Notification, NotificationType } from './Notification';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

interface Category {
    id: number;
    name: string;
}

interface Review {
    searchHireId: number;
    reviewerId: number;
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

interface SearchHire {
    id: number;
    clientId: number;
    expertId: number;
    status: string;
    expert?: { name: string; profilePictureUrl: string };
    messages: Array<{
        id: number;
        isRead: boolean;
        senderId: number;
    }>;
}

interface Search {
    title: string;
    description: string;
    category: number;
    userId: number;
    searchHire?: SearchHire;
}

interface SearchDetailsProps {
    isAdmin: boolean;
    onBack?: () => void;
}

const categoryBanners = {
    1: '/src/media/Car.png',
    2: '/src/media/motorcycle.png',
    3: '/src/media/house.png',
};

export default function SearchDetails({ isAdmin, onBack }: SearchDetailsProps) {
    const { id } = useParams<{ id: string }>();
    const searchId = parseInt(id || '0', 10);
    const navigate = useNavigate();
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
    const [notifications, setNotifications] = useState<{ id: string; type: NotificationType; message: string; duration?: number }[]>([]);
    const [selectedDeliverableFiles, setSelectedDeliverableFiles] = useState<File[]>([]);
    const lastSearchHireId = useRef<number | null>(null);

    const { getResults, getSearch } = useSearch();
    const { categories } = useCategories();
    const { user } = useAuth();
    const { getExpertReviews } = useReview();
    const { deliverables, uploadDeliverable, deliverablesQuery, refetchDeliverables } = useChat(searchId, setNotifications);
    const { handleCancelService, handleForceFinalize, handleCompleteService, handleDisputeSubmit, handleResolveDispute, handleAddAd } =
        useSearchActions(setNotifications);

    const resultsQuery = getResults(searchId);
    const searchQuery = getSearch(searchId);
    const reviewsQuery = getExpertReviews(searchQuery.data?.searchHire?.expertId || 0);

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
    const unreadMessages = searchQuery.data?.searchHire?.messages?.filter((msg) => !msg.isRead && msg.senderId !== userId).length || 0;

    const category = categories?.find((c: Category) => c.id === searchQuery.data?.category);

    // Debug searchId, deliverables, and query state
    useEffect(() => {
        console.log('[10:45 CEST] SearchDetails initialized with searchId:', searchId);
        console.log('[10:45 CEST] Deliverables state:', deliverables);
        console.log('[10:45 CEST] Deliverables query status:', {
            isLoading: deliverablesQuery?.isLoading,
            isError: deliverablesQuery?.isError,
            error: deliverablesQuery?.error?.message,
        });
        console.log('[10:45 CEST] Deliverables URLs:', deliverables?.deliverableUrls);
        if (deliverables?.deliverableUrls?.length) {
            console.log('[10:45 CEST] Rendering deliverable URLs:', deliverables.deliverableUrls);
        } else {
            console.log('[10:45 CEST] No deliverable URLs to render, deliverables:', JSON.stringify(deliverables));
        }
    }, [searchId, deliverables, deliverablesQuery]);

    // Throttled refetch for deliverables
    useEffect(() => {
        if (searchQuery.data?.searchHire?.id && searchQuery.data.searchHire.id !== lastSearchHireId.current) {
            console.log('[10:45 CEST] searchHireId changed, refetching deliverables for searchHireId:', searchQuery.data.searchHire.id);
            lastSearchHireId.current = searchQuery.data.searchHire.id;
            refetchDeliverables();
        }
    }, [searchQuery.data?.searchHire?.id, refetchDeliverables]);

    // Handle deliverable file selection
    const handleDeliverableFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        const maxDeliverableFileSize = 50 * 1024 * 1024; // 50MB
        const validFiles = files.filter((file) => {
            const extension = file.name.split('.').pop()?.toLowerCase();
            const isValidType = ['pdf', 'mp4'].includes(extension || '');
            const isValidSize = file.size <= maxDeliverableFileSize;
            return isValidType && isValidSize;
        });
        console.log('[10:45 CEST] Selected deliverable files:', validFiles.map((f) => ({ name: f.name, size: f.size })));
        if (validFiles.length > 0) {
            setNotifications((prev) => [
                ...prev,
                {
                    id: `deliverable-selected-${uuidv4()}`,
                    type: 'success' as NotificationType,
                    message: `Entregables seleccionados: ${validFiles.map((f) => f.name).join(', ')}`,
                    duration: 3000,
                },
            ]);
        }
        if (validFiles.length < files.length) {
            setNotifications((prev) => [
                ...prev,
                {
                    id: `deliverable-file-error-${uuidv4()}`,
                    type: 'error' as NotificationType,
                    message: `Solo se permiten archivos PDF, MP4 con un tamaño máximo de ${maxDeliverableFileSize / 1024 / 1024}MB.`,
                    duration: 5000,
                },
            ]);
        }
        setSelectedDeliverableFiles(validFiles);
    };

    // Handle deliverable upload
    const handleUploadDeliverable = async () => {
        if (selectedDeliverableFiles.length > 0) {
            console.log('[10:45 CEST] Uploading deliverables:', selectedDeliverableFiles.map((f) => ({ name: f.name, size: f.size })));
            await uploadDeliverable(selectedDeliverableFiles);
            setSelectedDeliverableFiles([]);
            console.log('[10:45 CEST] Triggered refetchDeliverables after upload');
            refetchDeliverables();
        } else {
            setNotifications((prev) => [
                ...prev,
                {
                    id: `deliverable-empty-error-${uuidv4()}`,
                    type: 'error' as NotificationType,
                    message: 'Por favor, selecciona al menos un archivo para subir como entregable.',
                    duration: 5000,
                },
            ]);
        }
    };

    useEffect(() => {
        if (!canViewChat && searchQuery.data?.searchHire && searchQuery.isSuccess) {
            setNotifications((prev) => [
                ...prev.filter((n) => !n.id.startsWith('chat-access-denied-')),
                {
                    id: `chat-access-denied-${Date.now()}`,
                    type: 'error',
                    message: `Chat no visible: El ID de usuario (${userId}) no coincide con el ID del cliente (${clientId}) ni con el del experto (${expertId})`,
                    duration: 5000,
                },
            ]);
        }
    }, [canViewChat, searchQuery.data, searchQuery.isSuccess, userId, clientId, expertId]);

    useEffect(() => {
        if (resultsQuery.error || searchQuery.error || reviewsQuery.error) {
            setNotifications((prev) => [
                ...prev.filter((n) => !n.id.startsWith('api-error-')),
                {
                    id: `api-error-${Date.now()}`,
                    type: 'error',
                    message: 'Error al cargar datos. Por favor, verifica tu conexión o inicia sesión nuevamente.',
                    duration: 5000,
                },
            ]);
        }
    }, [resultsQuery.error, searchQuery.error, reviewsQuery.error]);

    useLayoutEffect(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []);

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

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
        await handleCompleteService(searchQuery.data?.searchHire?.id, () => {
            resultsQuery.refetch();
            searchQuery.refetch();
        });
    };

    if (resultsQuery.isLoading || searchQuery.isLoading || reviewsQuery.isLoading) {
        return (
            <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 pb-8 pt-24 min-h-screen bg-gray-50">
                <div className="relative h-56 mb-8 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-blue-600 to-blue-800 backdrop-blur-md">
                    <div className="absolute inset-0 bg-[url('/src/media/Background.png')] bg-cover bg-center opacity-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="relative h-full flex items-center px-8">
                        <button
                            onClick={onBack || (() => navigate('/busquedas'))}
                            className="flex items-center gap-2 text-white hover:text-white/90 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-semibold">Volver</span>
                        </button>
                        {canViewChat && unreadMessages > 0 && (
                            <div className="ml-4 inline-flex items-center px-2.5 py-1 text-sm font-semibold text-white bg-red-500 rounded-full animate-pulse">
                                {unreadMessages} {unreadMessages === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-center h-[400px] bg-white rounded-2xl border border-gray-100 shadow-lg">
                    <div className="text-gray-600 text-lg">Cargando resultados...</div>
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
            <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 pb-8 pt-24 min-h-screen bg-gray-50">
                <div className="relative h-56 mb-8 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-blue-600 to-blue-800 backdrop-blur-md">
                    <div className="absolute inset-0 bg-[url('/src/media/Background.png')] bg-cover bg-center opacity-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="relative h-full flex items-center px-8">
                        <button
                            onClick={onBack || (() => navigate('/busquedas'))}
                            className="flex items-center gap-2 text-white hover:text-white/90 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-semibold">Volver</span>
                        </button>
                        {canViewChat && unreadMessages > 0 && (
                            <div className="ml-4 inline-flex items-center px-2.5 py-1 text-sm font-semibold text-white bg-red-500 rounded-full animate-pulse">
                                {unreadMessages} {unreadMessages === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-center py-12 bg-white rounded-2xl border border-red-100 shadow-lg">
                    <p className="text-red-600 text-lg">Error al cargar los resultados</p>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 text-sm text-gray-600">
                            <p><strong>Error Details:</strong></p>
                            <p>Results Query: {resultsQuery.error?.message || 'N/A'}</p>
                            <p>Search Query: {searchQuery.error?.message || 'N/A'}</p>
                            <p>Reviews Query: {reviewsQuery.error?.message || 'N/A'}</p>
                        </div>
                    )}
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
        <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 pb-8 pt-24 min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="relative h-64 mb-8 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-blue-600 to-blue-800 backdrop-blur-md">
                <div className="absolute inset-0 bg-[url('/src/media/Background.png')] bg-cover bg-center opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <img
                    src={categoryBanners[searchQuery.data?.category as keyof typeof categoryBanners] || categoryBanners[1]}
                    alt={category?.name || 'Category'}
                    className="absolute right-8 bottom-0 h-48 object-contain opacity-90"
                />
                <div className="relative h-full flex items-center px-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <button
                                onClick={onBack || (() => navigate('/busquedas'))}
                                className="flex items-center gap-2 text-white hover:text-white/90 transition-colors bg-blue-700/20 px-4 py-2 rounded-lg"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="font-semibold">Volver</span>
                            </button>
                            {(isAdmin || isExpert) && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showAddAdForm: true }))}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Añadir Anuncio</span>
                                </button>
                            )}
                            {canCancel && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showCancelConfirm: true }))}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-white rounded-lg transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span>Cancelar Servicio</span>
                                </button>
                            )}
                            {isAdmin && searchQuery.data?.searchHire && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showFinalizeModal: true }))}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-white rounded-lg transition-colors"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Finalizar Búsqueda</span>
                                </button>
                            )}
                            {isAdmin && isDisputed && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showResolveDisputeModal: true }))}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-white rounded-lg transition-colors"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Resolver Disputa</span>
                                </button>
                            )}
                            {canReview && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-white rounded-lg transition-colors"
                                >
                                    <Star className="w-4 h-4" />
                                    <span>Enviar Reseña</span>
                                </button>
                            )}
                            {canViewChat && unreadMessages > 0 && (
                                <div className="inline-flex items-center px-2.5 py-1 text-sm font-semibold text-white bg-red-500 rounded-full animate-pulse">
                                    {unreadMessages} {unreadMessages === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">{searchQuery.data?.title || 'Cargando...'}</h1>
                        {searchQuery.data?.description && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 max-w-2xl">
                                <p className="text-white/80 text-base leading-relaxed">{searchQuery.data.description}</p>
                            </div>
                        )}
                        {searchQuery.data?.searchHire && (
                            <div className="flex items-center gap-3">
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${searchQuery.data.searchHire.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : searchQuery.data.searchHire.status === 'awaiting_client_decision'
                                            ? 'bg-blue-100 text-blue-800'
                                            : searchQuery.data.searchHire.status === 'disputed'
                                                ? 'bg-red-100 text-red-800'
                                                : ['cancelled', 'transfer_failed'].includes(searchQuery.data.searchHire.status)
                                                    ? 'bg-gray-100 text-gray-800'
                                                    : ['dispute-resolved', 'completed'].includes(searchQuery.data.searchHire.status)
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    {searchQuery.data.searchHire.status.replace(/_/g, ' ')}
                                </span>
                                {searchQuery.data.searchHire.expert && (
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={searchQuery.data.searchHire.expert.profilePictureUrl || '/default-avatar.png'}
                                            alt={`${searchQuery.data.searchHire.expert.name}'s profile`}
                                            className="w-8 h-8 rounded-full object-cover border border-white/50"
                                        />
                                        <span className="text-sm text-white font-medium">Encargado: {searchQuery.data.searchHire.expert.name}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <p className="text-white/80 text-sm">{resultsQuery.data?.length || 0} {resultsQuery.data?.length === 1 ? 'resultado' : 'resultados'} encontrados</p>
                    </div>
                </div>
            </div>

            {/* Main Content: Chat, Ads, and Deliverables */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                {/* Chat Section */}
                {canViewChat && (
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MessageCircle className="w-6 h-6 text-blue-600" />
                            Chat
                        </h2>
                        <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl border border-gray-100 shadow-lg p-6 h-[500px] flex flex-col animate-fade-in">
                            <Chat searchId={searchId} setNotifications={setNotifications} isExpert={isExpert} />
                        </div>
                    </div>
                )}

                {/* Ads and Deliverables Sections */}
                <div className={canViewChat ? 'lg:col-span-3' : 'lg:col-span-5'}>
                    {/* Ads Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Anuncios Encontrados</h2>
                        {resultsQuery.data?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] bg-white rounded-2xl border border-gray-100 shadow-lg animate-fade-in">
                                <p className="text-gray-500 text-lg">No se encontraron resultados</p>
                                {(isAdmin || isExpert) && (
                                    <p className="text-sm text-gray-400 mt-2">Intenta añadir un nuevo anuncio o ajustar los criterios de búsqueda</p>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {resultsQuery.data?.map((result) => (
                                    <div key={result.id} className="transform transition-transform hover:scale-105">
                                        <ResultCard result={result} searchId={searchId} setNotifications={setNotifications} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Deliverables Section */}
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Upload className="w-6 h-6 text-blue-600" />
                            Entregables
                        </h2>
                        <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl border border-gray-100 shadow-lg p-6 animate-fade-in">
                            {deliverablesQuery.isLoading ? (
                                <p className="text-sm text-gray-500">Cargando entregables...</p>
                            ) : deliverablesQuery.isError ? (
                                <p className="text-sm text-red-500">Error al cargar entregables: {deliverablesQuery.error?.message}</p>
                            ) : deliverables && deliverables.deliverableUrls.length > 0 ? (
                                <div className="space-y-3">
                                    {deliverables.deliverableUrls.map((url, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            {url.endsWith('.mp4') ? (
                                                <video src={url} controls className="max-w-full rounded-lg" style={{ maxHeight: '200px' }} />
                                            ) : (
                                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm hover:text-blue-800">
                                                    Ver PDF {index + 1}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No hay entregables disponibles.</p>
                            )}
                            {isExpert && (
                                <div className="mt-4 flex items-center gap-2">
                                    <label className="flex-1 p-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm cursor-pointer">
                                        <span className="text-sm text-gray-600">Subir entregable (PDF, MP4)</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.mp4"
                                            onChange={handleDeliverableFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                    <button
                                        onClick={handleUploadDeliverable}
                                        className={`p-3 rounded-xl transition-colors ${selectedDeliverableFiles.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                        disabled={selectedDeliverableFiles.length === 0}
                                    >
                                        Subir Entregable
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="mb-8">
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-lg animate-fade-in">
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Todos los Filtros</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="h-6 w-px bg-gray-200" />
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            Precio: Bajo a Alto
                        </button>
                        <button className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            Más Reciente
                        </button>
                        <button className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            Popular
                        </button>
                    </div>
                </div>
            </div>

            {/* Dispute Notification */}
            {isDisputed && (
                <div className="mb-8 p-6 bg-white rounded-2xl border border-amber-100 shadow-lg animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Disputa Abierta</h3>
                    </div>
                    <p className="text-gray-600">Hay una disputa abierta para esta búsqueda. Un administrador la resolverá pronto.</p>
                </div>
            )}

            {/* Awaiting Client Decision */}
            {isExpert && searchQuery.data?.searchHire?.status === 'awaiting_client_decision' && (
                <div className="mb-8 p-6 bg-white rounded-2xl border border-blue-100 shadow-lg animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Esperando Aprobación del Cliente</h3>
                    </div>
                    <p className="text-gray-600">La búsqueda está lista para la decisión del cliente. Por favor, espera a que el cliente apruebe o dispute el servicio.</p>
                </div>
            )}

            {/* Client Decision Prompt */}
            {canDispute && (
                <div className="mb-8 p-6 bg-white rounded-2xl border border-blue-100 shadow-lg animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">¡La búsqueda ha finalizado!</h3>
                    </div>
                    <p className="text-gray-600 mb-6">El experto ha completado la búsqueda. Por favor, revisa los resultados y decide si estás satisfecho con el servicio.</p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setModalState((prev) => ({ ...prev, showDisputeModal: true }))}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                        >
                            <XCircle className="w-4 h-4" />
                            <span>Disputar Servicio</span>
                        </button>
                        <button
                            onClick={handleApproveService}
                            className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            <span>Aprobar Servicio</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Access Denied */}
            {!canViewChat && searchQuery.data?.searchHire && (
                <div className="mb-8 p-6 bg-white rounded-2xl border border-red-100 shadow-lg animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Acceso al Chat Denegado</h3>
                    </div>
                    <p className="text-gray-600">No tienes permiso para acceder al chat de esta búsqueda. Solo el cliente, el experto asignado o un administrador pueden ver el chat.</p>
                </div>
            )}

            {/* Debug Info (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mb-8 p-6 bg-yellow-50 rounded-2xl border border-yellow-100 shadow-sm animate-fade-in">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Información de Depuración</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                        <p><strong>Estado SearchHire:</strong> {searchQuery.data?.searchHire?.status || 'Sin Estado'}</p>
                        <p><strong>ID SearchHire:</strong> {searchQuery.data?.searchHire?.id || 'N/A'}</p>
                        <p><strong>Es Cliente:</strong> {isClient.toString()}</p>
                        <p><strong>Es Experto:</strong> {isExpert.toString()}</p>
                        <p><strong>Puede Reseñar:</strong> {(canReview ?? false).toString()}</p>
                        <p><strong>Puede Disputar:</strong> {(canDispute ?? false).toString()}</p>
                        <p><strong>Puede Cancelar:</strong> {(canCancel ?? false).toString()}</p>
                        <p><strong>En Disputa:</strong> {(isDisputed ?? false).toString()}</p>
                        <p><strong>Ha Reseñado:</strong> {hasReviewed.toString()}</p>
                        <p><strong>Rol del Usuario:</strong> {user?.role || 'N/A'}</p>
                        <p><strong>ID Usuario:</strong> {userId || 'N/A'}</p>
                        <p><strong>ID Cliente:</strong> {clientId || 'N/A'}</p>
                        <p><strong>ID Experto:</strong> {expertId || 'N/A'}</p>
                        <p><strong>Puede Ver Chat:</strong> {canViewChat.toString()}</p>
                        <p><strong>Mensajes No Leídos:</strong> {unreadMessages}</p>
                        <p><strong>Deliverables:</strong> {JSON.stringify(deliverables)}</p>
                    </div>
                </div>
            )}

            {/* Modals */}
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