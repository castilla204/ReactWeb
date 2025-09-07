import { useLayoutEffect, useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronDown, Star, AlertTriangle, MessageCircle, Upload, Share2, ChevronUp, FileText, MessageSquare } from 'lucide-react';
import { useSearch } from '../hooks/useSearch.hooks';
import { useServices } from '../hooks/useServices';
import { useCategories } from '../contexts/CategoryContext';
import { useAuth } from '../contexts/AuthContext';

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
    const [activeTab, setActiveTab] = useState<'chat' | 'details'>('chat');

    const { getSearch } = useSearch({ enableQueries: false });
    const { useServiceByHireId } = useServices({});
    const { categories } = useCategories();
    const { user } = useAuth();

    const { deliverables, uploadDeliverable, deliverablesQuery, refetchDeliverables, isUploadingDeliverable } = useChat(searchId, setNotifications);
    const { handleCancelService, handleForceFinalize, handleCompleteService, handleDisputeSubmit, handleResolveDispute, handleAddAd } =
        useSearchActions(setNotifications);

    const searchQuery = getSearch(searchId);
    // Only fetch service if we have a valid searchHire ID
    const hireId = searchQuery.data?.searchHire?.id;
    console.log('[SearchDetails] HireId extracted:', hireId);
    
    // Use the hook directly - it will handle enabled internally
    const serviceQuery = useServiceByHireId(hireId);

    const userId = Number(user?.id) || 0;
    const clientId = Number(searchQuery.data?.userId ?? 0);
    const expertId = Number(searchQuery.data?.searchHire?.expertId ?? 0);

    const isClient = userId === clientId;
    const isExpert = userId === expertId;
    const hasReviewed = false; // Simplified since we're not fetching reviews anymore
    const canReview =
        isClient && searchQuery.data?.searchHire && ['completed', 'dispute-resolved'].includes(searchQuery.data.searchHire.status) && !hasReviewed;
    const canDispute = isClient && searchQuery.data?.searchHire?.status === 'awaiting_client_decision';
    const canCancel = isExpert && searchQuery.data?.searchHire && !['completed', 'canceled', 'disputed'].includes(searchQuery.data.searchHire.status);
    const isDisputed = (isClient || isExpert) && searchQuery.data?.searchHire?.status === 'disputed';
    const canViewChat = (isClient || isExpert || isAdmin) && !!searchQuery.data?.searchHire;

    const category = categories?.find((c: Category) => c.id === searchQuery.data?.category);
    const categoryName = category?.name || 'Unknown Category';

    useEffect(() => {
        console.log('[SearchDetails] SearchDetails initialized with searchId:', searchId);
        console.log('[SearchDetails] SearchQuery state:', {
            isLoading: searchQuery.isLoading,
            isError: searchQuery.isError,
            error: searchQuery.error?.message,
            data: searchQuery.data ? 'Present' : 'Missing',
            searchHireId: searchQuery.data?.searchHire?.id
        });

        console.log('[SearchDetails] ServiceQuery state:', {
            isLoading: serviceQuery.isLoading,
            isError: serviceQuery.isError,
            error: serviceQuery.error?.message,
            data: serviceQuery.data ? 'Present' : 'Missing'
        });
        console.log('[SearchDetails] Deliverables state:', deliverables);
        console.log('[SearchDetails] Deliverables query status:', {
            isLoading: deliverablesQuery?.isLoading,
            isError: deliverablesQuery?.isError,
            error: deliverablesQuery?.error?.message,
        });
        console.log('[SearchDetails] Deliverables URLs:', deliverables?.deliverableUrls);
        if (deliverables?.deliverableUrls?.length) {
            console.log('[SearchDetails] Rendering deliverable URLs:', deliverables.deliverableUrls);
        } else {
            console.log('[SearchDetails] No deliverable URLs to render, deliverables:', JSON.stringify(deliverables));
        }
    }, [
        searchId, 
        searchQuery.isLoading, 
        searchQuery.isError, 
        searchQuery.data?.searchHire?.id,
        serviceQuery.isLoading, 
        serviceQuery.isError, 
        serviceQuery.data,
        deliverables?.deliverableUrls,
        deliverablesQuery?.isLoading,
        deliverablesQuery?.isError
    ]);

    useEffect(() => {
        if (searchQuery.data?.searchHire?.id && searchQuery.data.searchHire.id !== lastSearchHireId.current) {
            console.log('[13:42 CEST] searchHireId changed, refetching deliverables for searchHireId:', searchQuery.data.searchHire.id);
            lastSearchHireId.current = searchQuery.data.searchHire.id;
            // No necesitamos refetch manual, el useChat se encarga automáticamente
        }
    }, [searchQuery.data?.searchHire?.id]);

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
            // No necesitamos refetch manual, uploadDeliverable se encarga automáticamente
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
        if (searchQuery.error) {
            console.error('[13:42 CEST] SearchQuery error:', searchQuery.error);
            setNotifications((prev) => [
                ...prev.filter((n) => !n.id.startsWith('api-error-')),
                {
                    id: `api-error-${Date.now()}`,
                    type: 'error',
                    message: 'Error al cargar la búsqueda. Por favor, verifica tu conexión o inicia sesión nuevamente.',
                    duration: 5000,
                },
            ]);
        }
        
        if (serviceQuery.error) {
            console.error('[13:42 CEST] ServiceQuery error:', serviceQuery.error);
            // Don't show error notification for service query as it's not critical for page function
            // The UI will gracefully fall back to showing category banners instead of service images
        }
    }, [searchQuery.error, serviceQuery.error]);

    useLayoutEffect(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []);

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

    const handleAddAdAndClose = async () => {
        await handleAddAd(searchId, newAd, () => {
            // No need to refetch results in SearchDetails, just update the state
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
        await handleDisputeSubmit(
            searchQuery.data?.searchHire?.id,
            disputeReason,
            () => {
                searchQuery.refetch();
                setModalState((prev) => ({ ...prev, showDisputeModal: false }));
                setDisputeReason('');
            }
        );
    };

    const handleResolveDisputeAndClose = async () => {
        await handleResolveDispute(searchQuery.data?.searchHire?.id, resolveInFavorOfClient, resolutionReason, () => {
            searchQuery.refetch();
            setModalState((prev) => ({ ...prev, showResolveDisputeModal: false }));
            setResolveInFavorOfClient(null);
            setResolutionReason('');
        });
    };

    const handleCancelServiceAndClose = async () => {
        await handleCancelService(searchQuery.data?.searchHire?.id);
            searchQuery.refetch();
            setModalState((prev) => ({ ...prev, showCancelConfirm: false }));
    };

    const handleForceFinalizeAndClose = async (favorExpert: boolean) => {
        await handleForceFinalize(searchQuery.data?.searchHire?.id, favorExpert, () => {
            searchQuery.refetch();
            setModalState((prev) => ({ ...prev, showFinalizeModal: false }));
        });
    };

    const handleApproveService = async () => {
        await handleCompleteService(searchQuery.data?.searchHire?.id, () => {
            searchQuery.refetch();
        });
    };

    const currentStatus = searchQuery.data?.searchHire?.status || 'pending';
    const currentStepIndex = statusRoadmap.findIndex((step) => step.status === currentStatus);

    // Only show loading for critical queries (searchQuery)
    if (searchQuery.isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white text-black">
                <p className="text-lg">Cargando...</p>
            </div>
        );
    }

    // Only show error for critical failures (searchQuery)
    if (searchQuery.error) {
        return (
            <div className="flex items-center justify-center h-screen bg-white text-black">
                <p className="text-lg text-red-400">Error al cargar los datos</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 text-black h-screen lg:min-h-screen flex flex-col">
            {/* Mobile-First Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                            onClick={onBack || (() => navigate('/busquedas'))}
                                className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-gray-500 text-xs sm:text-sm">
                                {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                                    {/* Mobile Status Badge */}
                                    <span className={`sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                        ${currentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                        currentStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        currentStatus === 'awaiting_client_decision' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${currentStatus === 'completed' ? 'bg-green-500' :
                                            currentStatus === 'in_progress' ? 'bg-blue-500' :
                                            currentStatus === 'awaiting_client_decision' ? 'bg-purple-500' : 'bg-yellow-500'}`} />
                                        {currentStatus === 'completed' ? 'Completado' :
                                            currentStatus === 'in_progress' ? 'En progreso' :
                                            currentStatus === 'awaiting_client_decision' ? 'En revisión' : 'Pendiente'}
                            </span>
                        </div>
                                <h1 className="text-sm sm:text-lg font-medium text-gray-900 truncate">
                                    {searchQuery.data?.title || 'Cargando...'}
                                </h1>
                    </div>
                        </div>
                        
                        {/* Desktop Actions - Hidden on mobile */}
                        <div className="hidden sm:flex items-center gap-2">
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Compartir
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Comentarios del Equipo
                            </button>
                        </div>
                        
                        {/* Mobile Menu Button */}
                        <button className="sm:hidden p-2 hover:bg-gray-100 rounded-lg">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile-First Layout */}
            <div className="flex flex-col lg:flex-row lg:max-w-7xl lg:mx-auto lg:gap-6 xl:gap-8 flex-1 lg:flex-none lg:h-auto">
                {/* Mobile-First Chat Area */}
                {canViewChat && (
                    <div className="flex-1 lg:w-[65%] xl:w-[68%] flex flex-col">
                        {/* Mobile Tabs Navigation */}
                        <div className="lg:hidden bg-white border-b border-gray-200">
                            {/* Expert Info Header */}
                            <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                                <div className="flex items-center gap-3 flex-1">
                                    {(serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl) ? (
                                        <img 
                                            src={serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl} 
                                            alt={serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'Experto'}
                                            className="w-8 h-8 bg-blue-500 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                            {(serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'E').charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 truncate text-sm">
                                            {serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'Experto'}
                                        </h3>
                                        <p className="text-xs text-gray-500">Experto asignado • En línea</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Tabs */}
                            <div className="flex">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors relative ${
                                        activeTab === 'chat'
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Chat
                                    {activeTab === 'chat' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors relative ${
                                        activeTab === 'details'
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <FileText className="w-4 h-4" />
                                    Detalles
                                    {activeTab === 'details' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Promotional Banners - Hidden on mobile, compact on desktop */}
                        <div className="hidden lg:block lg:p-6 space-y-4">
                            {/* Promotional Banner - Compact */}
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-1">
                                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                                        D
                                    </div>
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                                        M
                                    </div>
                                </div>
                                <div className="flex-1">
                                        <h3 className="text-sm font-semibold mb-1">¿Te gustaría seguir trabajando juntos?</h3>
                                        <p className="text-purple-100 text-xs">
                                            Inicia proyectos a largo plazo con nuestros expertos.
                                    </p>
                                </div>
                            </div>
                                <div className="mt-3 flex gap-2">
                                    <button className="bg-white text-purple-600 px-3 py-1.5 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors">
                                        Solicitar oferta
                                </button>
                                    <button className="text-white border border-white/30 px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 transition-colors">
                                        Más info
                                </button>
                            </div>
                        </div>

                            {/* Expert Network Banner - Compact */}
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 mb-0.5 text-sm">El experto ahora forma parte de tu red freelance</h3>
                                        <p className="text-gray-600 text-xs">
                                            Accede fácilmente al trabajo realizado o contrátalos de nuevo.
                                        </p>
                                </div>
                                    <button className="text-gray-400 hover:text-gray-600 p-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Container - Mobile Tabs / Desktop Chat */}
                        <div className="bg-white lg:rounded-xl lg:shadow-sm lg:border lg:border-gray-200 lg:mx-6 flex flex-col flex-1 lg:flex-none lg:h-auto">
                            {/* Chat Header - Desktop Only */}
                            <div className="hidden lg:block p-4 border-b border-gray-100">
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                    Cargar mensajes anteriores
                                </button>
                            </div>
                            
                            {/* Mobile Tab Content */}
                            <div className="flex-1 lg:px-4 lg:py-2 overflow-hidden">
                                {/* Chat Tab Content - Mobile */}
                                {activeTab === 'chat' && (
                                    <div className="lg:hidden h-full">
                            <Chat 
                                searchId={searchId} 
                                setNotifications={setNotifications} 
                                isExpert={isExpert} 
                                expertData={{
                                    name: serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name,
                                    profilePictureUrl: serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl
                                }}
                            />
                            </div>
                                )}
                                
                                {/* Details Tab Content - Mobile */}
                                {activeTab === 'details' && (
                                    <div className="lg:hidden h-full overflow-y-auto">
                                        {/* Mobile Details Content */}
                                        <div className="p-4 space-y-6">
                                            {/* Service Card - Mobile Optimized */}
                                            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                                {/* Service Image */}
                                                <div className="relative">
                                                    {serviceQuery.data?.imageUrls && serviceQuery.data.imageUrls.length > 0 ? (
                                                        <div className="relative w-full h-32 overflow-hidden">
                                                            <img
                                                                src={serviceQuery.data.imageUrls[0]}
                                                                alt="Servicio contratado"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = searchQuery.data?.category && categoryBanners[searchQuery.data.category] 
                                                                        ? categoryBanners[searchQuery.data.category] 
                                                                        : '/default-service.png';
                                                                }}
                                                            />
                        </div>
                                                    ) : (
                                                        <div className="relative w-full h-32 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                                                            {searchQuery.data?.category && categoryBanners[searchQuery.data.category] ? (
                                                                <img
                                                                    src={categoryBanners[searchQuery.data.category]}
                                                                    alt={categoryName}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <div className="text-center">
                                                                        <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                                        </svg>
                                                                        <p className="text-xs text-gray-400 font-medium">{categoryName}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                    </div>
                )}

                                                    {/* Status Badge */}
                                                    <div className="absolute top-2 left-2">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm border
                                                            ${currentStatus === 'completed' ? 'bg-green-500/90 text-white border-green-400/50' :
                                                            currentStatus === 'in_progress' ? 'bg-blue-500/90 text-white border-blue-400/50' :
                                                            currentStatus === 'awaiting_client_decision' ? 'bg-purple-500/90 text-white border-purple-400/50' : 'bg-yellow-500/90 text-white border-yellow-400/50'}`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                            {currentStatus === 'completed' ? 'COMPLETADO' :
                                                                currentStatus === 'in_progress' ? 'EN PROGRESO' :
                                                                    currentStatus === 'awaiting_client_decision' ? 'EN REVISIÓN' : 'PENDIENTE'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Service Content */}
                                                <div className="p-4">
                                                    <h3 className="font-semibold text-gray-900 mb-2 leading-tight">
                                                        {searchQuery.data?.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                                                        {serviceQuery.data?.conditions || 'Servicio profesional personalizado'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Order Information - Mobile */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-gray-900">Información del pedido</h4>
                                                <div className="grid grid-cols-1 gap-4 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Solicitado por</span>
                                                        <span className="font-medium text-gray-900">{user?.name || 'Usuario'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Categoría</span>
                                                        <span className="font-medium text-gray-900">{categoryName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Estado</span>
                                                        <span className="font-medium text-gray-900">
                                                            {searchQuery.data?.searchHire?.status 
                                                                ? searchQuery.data.searchHire.status.charAt(0).toUpperCase() + searchQuery.data.searchHire.status.slice(1).replace('_', ' ')
                                                                : 'No disponible'
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Número de pedido</span>
                                                        <span className="font-mono text-sm text-gray-700">#{searchId.toString().padStart(6, '0')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons - Mobile */}
                                            <div className="space-y-3">
                                                {canDispute && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setModalState((prev) => ({ ...prev, showDisputeModal: true }))}
                                                            className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium"
                                                        >
                                                            Disputar
                                                        </button>
                                                        <button
                                                            onClick={handleApproveService}
                                                            className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
                                                        >
                                                            Aprobar
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {canCancel && (
                                                    <button
                                                        onClick={() => setModalState((prev) => ({ ...prev, showCancelConfirm: true }))}
                                                        className="w-full px-4 py-2.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 font-medium"
                                                    >
                                                        Cancelar Servicio
                                                    </button>
                                                )}

                                                {canReview && (
                                                    <button
                                                        onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                                        className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm rounded-lg hover:from-yellow-600 hover:to-orange-600 font-medium flex items-center justify-center gap-2"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                        Enviar Reseña
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Desktop Chat - Always Visible */}
                                <div className="hidden lg:block">
                                    <Chat 
                                        searchId={searchId} 
                                        setNotifications={setNotifications} 
                                        isExpert={isExpert} 
                                        expertData={{
                                            name: serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name,
                                            profilePictureUrl: serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Right Sidebar - Desktop Only */}
                <div className="hidden lg:block lg:w-[35%] xl:w-[32%] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Order Details Header */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-3 lg:mb-6">
                            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Detalles del pedido</h2>
                            <button className="text-gray-400 hover:text-gray-600 p-1">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>
                        </div>

                        {/* Service Card - Mobile Optimized */}
                        <div className="bg-gray-50 lg:bg-white rounded-lg lg:rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4 lg:mb-6">
                            {/* Service Image */}
                            <div className="relative">
                                {serviceQuery.data?.imageUrls && serviceQuery.data.imageUrls.length > 0 ? (
                                    <div className="relative w-full h-24 lg:h-40 overflow-hidden">
                                        <img
                                            src={serviceQuery.data.imageUrls[0]}
                                            alt="Servicio contratado"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to category banner if service image fails
                                                e.currentTarget.src = searchQuery.data?.category && categoryBanners[searchQuery.data.category] 
                                                    ? categoryBanners[searchQuery.data.category] 
                                                    : '/default-service.png';
                                            }}
                                        />
                                        {serviceQuery.data.imageUrls.length > 1 && (
                                            <div className="absolute bottom-3 right-3 bg-black/75 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                </svg>
                                                +{serviceQuery.data.imageUrls.length - 1}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative w-full h-40 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                                        {searchQuery.data?.category && categoryBanners[searchQuery.data.category] ? (
                                            <img
                                                src={categoryBanners[searchQuery.data.category]}
                                                alt={categoryName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="text-center">
                                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                    <p className="text-sm text-gray-400 font-medium">{categoryName}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Status Badge - Overlay on image */}
                                <div className="absolute top-3 left-3">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm border
                                        ${currentStatus === 'completed' ? 'bg-green-500/90 text-white border-green-400/50' :
                                        currentStatus === 'in_progress' ? 'bg-blue-500/90 text-white border-blue-400/50' :
                                        currentStatus === 'awaiting_client_decision' ? 'bg-purple-500/90 text-white border-purple-400/50' : 'bg-yellow-500/90 text-white border-yellow-400/50'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full bg-white`} />
                                {currentStatus === 'completed' ? 'COMPLETADO' :
                                    currentStatus === 'in_progress' ? 'EN PROGRESO' :
                                        currentStatus === 'awaiting_client_decision' ? 'EN REVISIÓN' : 'PENDIENTE'}
                            </span>
                        </div>
                            </div>
                            
                            {/* Service Content */}
                            <div className="p-3 lg:p-4">
                                <h3 className="font-semibold text-gray-900 mb-1 lg:mb-2 leading-tight text-sm lg:text-base line-clamp-1 lg:line-clamp-none">
                                    {searchQuery.data?.title}
                                </h3>
                                <p className="text-xs lg:text-sm text-gray-600 leading-relaxed line-clamp-1 lg:line-clamp-2">
                                    {serviceQuery.data?.conditions || 'Servicio profesional personalizado'}
                                </p>
                            </div>
                        </div>

                        {/* Order Information - Mobile Optimized */}
                        <div className="space-y-3 lg:space-y-4">
                            <div className="grid grid-cols-2 gap-3 lg:gap-4 text-xs lg:text-sm">
                                <div>
                                    <p className="text-gray-500 mb-1">Solicitado por</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                            {user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <span className="font-medium text-gray-900">{user?.name || 'Usuario'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Proyecto</p>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                        </svg>
                                        <span className="font-medium text-gray-900">Mi proyecto</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 mb-1">Categoría</p>
                                    <span className="font-medium text-gray-900">{categoryName}</span>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Encargado a</p>
                                    <div className="flex items-center gap-3">
                                        {(serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl) ? (
                                            <img 
                                                src={serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl} 
                                                alt={serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'Experto'}
                                                className="w-10 h-10 bg-green-500 rounded-full object-cover border-2 border-green-100"
                                                onError={(e) => {
                                                    // Fallback to initials if image fails to load
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-green-100 ${(serviceQuery.data?.expert?.profilePictureUrl || searchQuery.data?.searchHire?.expert?.profilePictureUrl) ? 'hidden' : ''}`}>
                                            {(serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'E').charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{serviceQuery.data?.expert?.user?.name || searchQuery.data?.searchHire?.expert?.name || 'Experto'}</span>
                                            {serviceQuery.data?.expert?.description && (
                                                <span className="text-xs text-gray-500 line-clamp-1">{serviceQuery.data.expert.description}</span>
                                            )}
                                        </div>
                                    </div>
                            </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 mb-1">Fecha de creación</p>
                                    <span className="font-medium text-gray-900">
                                        {searchQuery.data?.createdAt 
                                            ? new Date(searchQuery.data.createdAt).toLocaleDateString('es-ES', { 
                                                day: 'numeric', 
                                                month: 'short', 
                                                year: 'numeric',
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })
                                            : 'No disponible'
                                        }
                                </span>
                            </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Estado de la contratación</p>
                                    <span className="font-medium text-gray-900">
                                        {searchQuery.data?.searchHire?.status 
                                            ? searchQuery.data.searchHire.status.charAt(0).toUpperCase() + searchQuery.data.searchHire.status.slice(1).replace('_', ' ')
                                            : 'No disponible'
                                        }
                                    </span>
                                </div>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-gray-500 text-sm mb-1">Número de pedido</p>
                                <span className="font-mono text-sm text-gray-700">#{searchId.toString().padStart(12, 'FO41A05960584')}</span>
                            </div>
                        </div>

                        {(isAdmin || isExpert) && (
                            <button
                                onClick={() => setModalState((prev) => ({ ...prev, showAddAdForm: true }))}
                                className="w-full mt-4 lg:mt-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white py-2.5 lg:py-3 rounded-lg lg:rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-sm lg:text-base"
                            >
                                Order Again
                            </button>
                        )}
                    </div>

                    {/* Track Order - Mobile Optimized */}
                    <div className="px-4 py-4 lg:px-6 lg:py-6 border-b border-gray-100">
                        <button
                            onClick={() => setShowTrackOrder(!showTrackOrder)}
                            className="flex items-center justify-between w-full text-left group"
                        >
                            <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">Seguimiento del Pedido</h3>
                            <div className="p-1 rounded-full group-hover:bg-gray-100 transition-colors">
                                {showTrackOrder ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                            </div>
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

                    {/* Support Section - Mobile Optimized */}
                    <div className="px-4 py-4 lg:px-6 lg:py-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">¿Necesitas ayuda con tu pedido?</p>
                                <p className="text-sm text-gray-500">Estoy aquí para ti.</p>
                            </div>
                        </div>

                        <button className="w-full mb-6 bg-white border-2 border-purple-500 text-purple-600 py-3 rounded-xl hover:bg-purple-50 flex items-center justify-center gap-2 font-medium transition-all duration-200 hover:shadow-md">
                            <MessageCircle className="w-4 h-4" />
                            Let's Chat
                        </button>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900">Soporte</h4>

                            {isDisputed && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-amber-800 flex items-center gap-3 font-medium">
                                        <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-4 h-4 text-amber-700" />
                                        </div>
                                        Disputa abierta. Un administrador la resolverá pronto.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button className="flex items-center justify-between w-full text-left p-3 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Fiverr Pro FAQs</p>
                                            <p className="text-xs text-gray-500">Encuentra respuestas necesarias.</p>
                                        </div>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </button>

                                <button className="flex items-center justify-between w-full text-left p-3 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Resolution center</p>
                                            <p className="text-xs text-gray-500">Resuelve problemas del pedido.</p>
                                        </div>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </button>
                            </div>

                            {canCancel && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showCancelConfirm: true }))}
                                    className="w-full mt-4 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    Cancelar Servicio
                                </button>
                            )}

                            {isAdmin && searchQuery.data?.searchHire && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showFinalizeModal: true }))}
                                    className="w-full mt-3 bg-amber-500 text-white py-3 rounded-xl hover:bg-amber-600 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    Finalizar Búsqueda
                                </button>
                            )}

                            {canReview && (
                                <button
                                    onClick={() => setModalState((prev) => ({ ...prev, showReviewModal: true }))}
                                    className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl hover:from-yellow-600 hover:to-orange-600 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-gray-500">Cargando entregables...</p>
                                </div>
                            ) : deliverablesQuery.isError ? (
                                <div className="space-y-2">
                                <p className="text-sm text-red-400">Error al cargar entregables</p>
                                    <button 
                                        onClick={() => refetchDeliverables()}
                                        className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                    >
                                        Reintentar
                                    </button>
                                    {deliverablesQuery.error && (
                                        <p className="text-xs text-gray-400">{deliverablesQuery.error.message}</p>
                                    )}
                                </div>
                            ) : deliverables && deliverables.deliverableUrls && deliverables.deliverableUrls.length > 0 ? (
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
                                        className={`w-full py-2 text-sm rounded-lg flex items-center justify-center gap-2 ${selectedDeliverableFiles.length === 0 || isUploadingDeliverable
                                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                        disabled={selectedDeliverableFiles.length === 0 || isUploadingDeliverable}
                                    >
                                        {isUploadingDeliverable ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                                Subiendo...
                                            </>
                                        ) : (
                                            'Subir Archivo'
                                        )}
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