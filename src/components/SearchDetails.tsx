import { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronDown, Star, AlertTriangle, MessageCircle, Upload, Share2, ChevronUp } from 'lucide-react';
import { useSearch } from '../hooks/useSearch.hooks';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useReview } from '../hooks/useReview.hooks';
import { useChat } from '../hooks/useChat';
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

interface SearchDetailsProps {
    isAdmin: boolean;
    onBack?: () => void;
}

const categoryBanners: { [key: number]: string } = {
    1: '/src/media/Car.png',
    2: '/src/media/motorcycle.png',
    3: '/src/media/house.png',
};

const statusRoadmap = [
    { label: 'Pendiente', status: 'pending', color: 'bg-yellow-600' },
    { label: 'En progreso', status: 'in_progress', color: 'bg-blue-600' },
    { label: 'En revisión', status: 'awaiting_client_decision', color: 'bg-purple-600' },
    { label: 'Completado', status: 'completed', color: 'bg-green-600' },
];

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
    const [showTrackOrder, setShowTrackOrder] = useState(false);
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

    const category = categories?.find((c: Category) => c.id === searchQuery.data?.category);
    const categoryName = category?.name || 'Unknown Category';

    useEffect(() => {
        console.log('[13:42 CEST] SearchDetails initialized with searchId:', searchId);
        console.log('[13:42 CEST] Deliverables state:', deliverables);
        console.log('[13:42 CEST] Deliverables query status:', {
            isLoading: deliverablesQuery?.isLoading,
            isError: deliverablesQuery?.isError,
            error: deliverablesQuery?.error?.message,
        });
        console.log('[13:42 CEST] Deliverables URLs:', deliverables?.deliverableUrls);
        if (deliverables?.deliverableUrls?.length) {
            console.log('[13:42 CEST] Rendering deliverable URLs:', deliverables.deliverableUrls);
        } else {
            console.log('[13:42 CEST] No deliverable URLs to render, deliverables:', JSON.stringify(deliverables));
        }
    }, [searchId, deliverables, deliverablesQuery]);

    useEffect(() => {
        if (searchQuery.data?.searchHire?.id && searchQuery.data.searchHire.id !== lastSearchHireId.current) {
            console.log('[13:42 CEST] searchHireId changed, refetching deliverables for searchHireId:', searchQuery.data.searchHire.id);
            lastSearchHireId.current = searchQuery.data.searchHire.id;
            refetchDeliverables();
        }
    }, [searchQuery.data?.searchHire?.id, refetchDeliverables]);

    const handleDeliverableFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        const maxDeliverableFileSize = 50 * 1024 * 1024; // 50MB
        const validFiles = files.filter((file) => {
            const extension = file.name.split('.').pop()?.toLowerCase();
            const isValidType = ['pdf', 'mp4'].includes(extension || '');
            const isValidSize = file.size <= maxDeliverableFileSize;
            return isValidType && isValidSize;
        });
        console.log('[13:42 CEST] Selected deliverable files:', validFiles.map((f) => ({ name: f.name, size: f.size })));
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

    const handleUploadDeliverable = async () => {
        if (selectedDeliverableFiles.length > 0) {
            console.log('[13:42 CEST] Uploading deliverables:', selectedDeliverableFiles.map((f) => ({ name: f.name, size: f.size })));
            await uploadDeliverable(selectedDeliverableFiles);
            setSelectedDeliverableFiles([]);
            console.log('[13:42 CEST] Triggered refetchDeliverables after upload');
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
        await handleDisputeSubmit({
            searchHireId: searchQuery.data?.searchHire?.id,
            disputeReason,
            callback: () => {
                resultsQuery.refetch();
                searchQuery.refetch();
                setModalState((prev) => ({ ...prev, showDisputeModal: false }));
                setDisputeReason('');
            },
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

    const currentStatus = searchQuery.data?.searchHire?.status || 'pending';
    const currentStepIndex = statusRoadmap.findIndex((step) => step.status === currentStatus);

    if (resultsQuery.isLoading || searchQuery.isLoading || reviewsQuery.isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white text-black">
                <p className="text-lg">Cargando...</p>
            </div>
        );
    }

    if (resultsQuery.error || searchQuery.error || reviewsQuery.error) {
        return (
            <div className="flex items-center justify-center h-screen bg-white text-black">
                <p className="text-lg text-red-400">Error al cargar los datos</p>
            </div>
        );
    }

    return (
        <div className="bg-white text-black min-h-screen max-w-6xl mx-auto">
            {/* Header Section - Similar to Fiverr style */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack || (() => navigate('/busquedas'))}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <span className="text-gray-500 text-sm">
                                {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                            <h1 className="text-lg font-medium">{searchQuery.data?.title || 'Cargando...'}</h1>
                            <span className="text-gray-500 text-xs">
                                {new Date().toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Compartir
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Comentarios del Equipo
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 p-6">
                {/* Main Chat Area - Left Side */}
                {canViewChat && (
                    <div className="w-full lg:w-2/3 bg-white border border-gray-200 rounded-lg shadow-md">
                        <div className="p-4 text-center border-b border-gray-100">
                            <button className="text-blue-600 hover:text-blue-700 text-sm">Cargar más</button>
                        </div>
                        <div className="h-[calc(100vh-20rem)] overflow-y-auto px-6 py-4">
                            <Chat searchId={searchId} setNotifications={setNotifications} isExpert={isExpert} />
                        </div>
                    </div>
                )}

                {/* Right Sidebar - Fiverr Style */}
                <div className="w-full lg:w-1/3 border-l border-gray-200 bg-gray-50 rounded-lg shadow-md p-6">
                    {/* Order Details */}
                    <div className="border-b border-gray-200 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Detalles del Pedido</h2>
                            <button className="text-gray-400 hover:text-gray-600">•••</button>
                        </div>

                        <div className="bg-white rounded-lg p-4 mb-4">
                            <img
                                src={searchQuery.data?.category && categoryBanners[searchQuery.data.category] ? categoryBanners[searchQuery.data.category] : '/default-service.png'}
                                alt="Service"
                                className="w-full h-20 object-cover rounded-lg mb-3"
                            />
                            <p className="text-sm text-gray-800 mb-2">{searchQuery.data?.title}</p>
                            <span
                                className={`inline-block px-2 py-1 text-xs font-medium rounded-full text-white ${currentStatus === 'completed' ? 'bg-green-500' :
                                    currentStatus === 'in_progress' ? 'bg-blue-500' :
                                        currentStatus === 'awaiting_client_decision' ? 'bg-purple-500' : 'bg-yellow-500'
                                    }`}
                            >
                                {currentStatus === 'completed' ? 'COMPLETADO' :
                                    currentStatus === 'in_progress' ? 'EN PROGRESO' :
                                        currentStatus === 'awaiting_client_decision' ? 'EN REVISIÓN' : 'PENDIENTE'}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Solicitado por</span>
                                <span className="font-medium">• {user?.name || 'Usuario'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Proyecto</span>
                                <span className="font-medium">📁 Mi proyecto</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Categoría</span>
                                <span className="font-medium">{categoryName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Encargado a</span>
                                <span className="font-medium">{searchQuery.data?.searchHire?.expert?.name || 'Experto'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Fecha de entrega</span>
                                <span className="font-medium">
                                    {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Precio total</span>
                                <span className="font-medium">€99.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Número de pedido</span>
                                <span className="font-medium">#{searchId.toString().padStart(8, '0')}</span>
                            </div>
                        </div>

                        {(isAdmin || isExpert) && (
                            <button
                                onClick={() => setModalState((prev) => ({ ...prev, showAddAdForm: true }))}
                                className="w-full mt-4 bg-black text-white py-3 rounded-lg hover:bg-gray-800"
                            >
                                Añadir Anuncio
                            </button>
                        )}
                    </div>

                    {/* Track Order */}
                    <div className="border-b border-gray-200 py-6">
                        <button
                            onClick={() => setShowTrackOrder(!showTrackOrder)}
                            className="flex items-center justify-between w-full text-left"
                        >
                            <h3 className="font-semibold">Seguimiento del Pedido</h3>
                            {showTrackOrder ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showTrackOrder && (
                            <div className="mt-4 space-y-3">
                                {statusRoadmap.map((step, index) => (
                                    <div key={step.status} className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${index <= currentStepIndex ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className={`text-sm ${index <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {canDispute && (
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showDisputeModal: true }))}
                                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                                >
                                    Disputar
                                </button>
                                <button
                                    onClick={handleApproveService}
                                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                                >
                                    Aprobar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Support Section */}
                    <div className="py-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm">
                                👤
                            </div>
                            <div>
                                <p className="text-sm font-medium">¿Necesitas ayuda con tu pedido?</p>
                                <p className="text-xs text-gray-500">Estoy aquí para ti.</p>
                            </div>
                        </div>

                        <button className="w-full mb-4 bg-white border-2 border-purple-500 text-purple-500 py-3 rounded-lg hover:bg-purple-50 flex items-center justify-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Hablemos
                        </button>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Soporte</h4>

                            {isDisputed && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                    <p className="text-sm text-amber-700 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Disputa abierta. Un administrador la resolverá pronto.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <button className="flex items-center justify-between w-full text-left py-2 hover:bg-gray-100 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 text-center">❓</span>
                                        <div>
                                            <p className="text-sm">FAQs de la Plataforma</p>
                                            <p className="text-xs text-gray-500">Encuentra respuestas necesarias.</p>
                                        </div>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>

                                <button className="flex items-center justify-between w-full text-left py-2 hover:bg-gray-100 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 text-center">🎯</span>
                                        <div>
                                            <p className="text-sm">Centro de resolución</p>
                                            <p className="text-xs text-gray-500">Resuelve problemas del pedido.</p>
                                        </div>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {canCancel && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showCancelConfirm: true }))}
                                    className="w-full mt-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm"
                                >
                                    Cancelar Servicio
                                </button>
                            )}

                            {isAdmin && searchQuery.data?.searchHire && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showFinalizeModal: true }))}
                                    className="w-full mt-2 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 text-sm"
                                >
                                    Finalizar Búsqueda
                                </button>
                            )}

                            {canReview && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                    className="w-full mt-2 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 text-sm flex items-center justify-center gap-2"
                                >
                                    <Star className="w-4 h-4" />
                                    Enviar Reseña
                                </button>
                            )}
                        </div>

                        {/* Deliverables Section */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-blue-600" />
                                Entregables
                            </h4>

                            {deliverablesQuery.isLoading ? (
                                <p className="text-sm text-gray-500">Cargando entregables...</p>
                            ) : deliverablesQuery.isError ? (
                                <p className="text-sm text-red-400">Error al cargar entregables</p>
                            ) : deliverables && deliverables.deliverableUrls.length > 0 ? (
                                <div className="space-y-2">
                                    {deliverables.deliverableUrls.map((url, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            {url.endsWith('.mp4') ? (
                                                <video src={url} controls className="max-w-full rounded-lg" style={{ maxHeight: '120px' }} />
                                            ) : (
                                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:text-blue-800 bg-white p-2 rounded border">
                                                    📄 Ver PDF {index + 1}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No hay entregables disponibles.</p>
                            )}

                            {isExpert && (
                                <div className="mt-3 space-y-2">
                                    <label className="block">
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.mp4"
                                            onChange={handleDeliverableFileChange}
                                            className="hidden"
                                        />
                                        <div className="w-full p-2 border border-gray-300 bg-white text-sm text-gray-600 cursor-pointer rounded-lg hover:bg-gray-50 text-center">
                                            Subir entregable (PDF, MP4)
                                        </div>
                                    </label>
                                    <button
                                        onClick={handleUploadDeliverable}
                                        className={`w-full py-2 text-sm rounded-lg ${selectedDeliverableFiles.length === 0
                                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                        disabled={selectedDeliverableFiles.length === 0}
                                    >
                                        Subir Archivo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
                onClose={() => setModalState((prev) => ({
                    ...prev,
                    showFinalizeModal: false
                }))}
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