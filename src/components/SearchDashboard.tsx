import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
    Search,
    ChevronRight,
    AlertCircle,
    AlertTriangle,
    Activity,
    CheckCircle,
    ArrowLeft,
    LayoutGrid,
    LayoutList,
    MessageSquare,
    Settings,
    MapPin,
    Calendar,
    CalendarX,
    ChevronDown,
    Filter,
    FolderTree,
    Plus,
    WifiOff,
    RefreshCw,
    Shield,
    X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useSearch } from '../hooks/useSearch.hooks';
import { useAppointmentStatuses, getAppointmentStatusText } from '../hooks/useAppointmentStatuses';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from './ui/empty';
import { Button } from './ui/button';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

// ✅ NUEVOS IMPORTS PARA SISTEMA DE ESTADOS
import StatusBadge from './StatusBadge';
import { getStatusInfoWithFallback } from '../utils/statusUtils';
import { useErrorHandler, isNetworkError } from '../hooks/useErrorHandler';
import type { SearchItem, SearchFilters, PaginationMetadata } from '../hooks/useSearch.hooks';
import { useNavigate } from 'react-router-dom';
import { mfaService } from '../services/mfaService';


interface SearchDashboardProps {
    // onBack: () => void; // Opcional, lo eliminamos si no es necesario
}

// Componente para mostrar imagen o icono de categoría
const CategoryImage: React.FC<{ categoryId: number; categoryName: string; size?: 'sm' | 'md' | 'lg' }> = ({ categoryName, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10'
    };

    // Determinar qué imagen usar según el nombre de la categoría
    const isMotoAgua = categoryName.toLowerCase().includes('moto') && categoryName.toLowerCase().includes('agua');
    const isMoto = categoryName.toLowerCase().includes('moto') && !isMotoAgua;
    const isCoche = categoryName.toLowerCase().includes('coche') || categoryName.toLowerCase().includes('vehículo');
    const isCasa = categoryName.toLowerCase().includes('inmobiliaria') || categoryName.toLowerCase().includes('casa') || categoryName.toLowerCase().includes('inmueble');

    if (isMotoAgua) {
        return (
            <img 
                src={new URL('../media/motoagua.png', import.meta.url).href}
                alt="Moto de agua"
                className={`${sizeClasses[size]} object-contain`}
            />
        );
    }
    
    if (isMoto) {
        return (
            <img 
                src={new URL('../media/motopng.png', import.meta.url).href}
                alt="Moto"
                className={`${sizeClasses[size]} object-contain`}
            />
        );
    }
    
    if (isCoche) {
            return (
            <img 
                src={new URL('../media/cochepng.png', import.meta.url).href}
                alt="Coche"
                className={`${sizeClasses[size]} object-contain`}
            />
        );
    }
    
    if (isCasa) {
        return (
            <img 
                src={new URL('../media/casapng.png', import.meta.url).href}
                alt="Casa"
                className={`${sizeClasses[size]} object-contain`}
            />
        );
    }

    // Fallback: icono por defecto
            return (
        <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg flex items-center justify-center`}>
            <FolderTree className="w-4 h-4 text-gray-600" />
        </div>
    );
};

interface Filters {
    search: string;
    selectedCategories: number[];  // ✅ Cambiado: Array de categorías seleccionadas
    showInactives: boolean;        // ✅ Cambiado: true = mostrar inactivas también, false = solo activas
    isRevised: boolean | null;     // ✅ NUEVO: Estado revisado/no revisado
    searchHireStatus: string;      // ✅ NUEVO: Estado de contratación
    sortBy: string;
    sortDirection: 'asc' | 'desc';
}

const SearchDashboard = ({ /* onBack */ }: SearchDashboardProps) => {
    const { user, isAuthenticated } = useAuth();
    const { categories } = useCategories();
    const {
        searchesWithFilters, // ✅ NUEVO: Hook unificado con filtros
        reviseSearch: reviseSearchMutation,
    } = useSearch();
    const navigate = useNavigate();
    const [showMfaRecommendationBanner, setShowMfaRecommendationBanner] = useState(false);
    const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filters, setFilters] = useState<Filters>({
        search: '',
        selectedCategories: [], // Se inicializará cuando categories esté disponible
        showInactives: false,     // Por defecto solo activas (false = solo activas, true = activas + inactivas)
        isRevised: null,          // ✅ NUEVO: null = todos, true = revisadas, false = no revisadas
        searchHireStatus: '',     // ✅ NUEVO: Estado de contratación
        sortBy: 'createdAt',
        sortDirection: 'desc',
    });
    
    // Estado local para el input de búsqueda (para mantener el foco)
    const [searchInput, setSearchInput] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const cursorPositionRef = useRef<number | null>(null);
    const isFocusedRef = useRef<boolean>(false);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Función para manejar el cambio en el input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart;
        
        // Actualizar el valor inmediatamente
        setSearchInput(newValue);
        
        // Guardar la posición del cursor
        cursorPositionRef.current = cursorPos;
        
        // Limpiar el timeout anterior
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        
        // Crear nuevo timeout para el debounce
        debounceTimeoutRef.current = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: newValue }));
        }, 500);
    };
    
    // Manejar el foco
    const handleSearchFocus = () => {
        isFocusedRef.current = true;
    };
    
    const handleSearchBlur = () => {
        isFocusedRef.current = false;
    };
    
    // Restaurar el foco y la posición del cursor después de que se actualice filters.search
    useLayoutEffect(() => {
        if (isFocusedRef.current && searchInputRef.current && cursorPositionRef.current !== null) {
            const input = searchInputRef.current;
            const cursorPos = cursorPositionRef.current;
            
            // Función para restaurar el foco y cursor
            const restoreFocus = () => {
                if (input && isFocusedRef.current) {
                    // Verificar si el input sigue siendo el mismo elemento
                    if (document.body.contains(input)) {
                        // Restaurar foco si no lo tiene
                        if (document.activeElement !== input) {
                            input.focus();
                        }
                        // Restaurar posición del cursor
                        if (cursorPos !== null && cursorPos <= input.value.length) {
                            try {
                                input.setSelectionRange(cursorPos, cursorPos);
                            } catch (e) {
                                // Ignorar errores si el input no está listo
                            }
                        }
                    }
                }
            };
            
            // Intentar restaurar inmediatamente
            restoreFocus();
            
            // Intentar de nuevo después de un frame (por si acaso)
            requestAnimationFrame(() => {
                restoreFocus();
                // Un intento más después de un pequeño delay
                setTimeout(restoreFocus, 10);
            });
        }
    }, [filters.search]);
    
    // Limpiar timeout al desmontar
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);
    
    // Sincronizar searchInput con filters.search cuando cambie externamente (solo al montar)
    useEffect(() => {
        setSearchInput(filters.search);
    }, []);

    // Inicializar categorías seleccionadas cuando categories esté disponible
    useEffect(() => {
        if (Array.isArray(categories) && categories.length > 0 && filters.selectedCategories.length === 0) {
            setFilters(prev => ({
                ...prev,
                selectedCategories: categories.map(c => c.id)
            }));
        }
    }, [categories]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // ✅ Verificar estado de MFA para mostrar recomendación
    useEffect(() => {
        const checkMfaStatus = async () => {
            if (!isAuthenticated) {
                setMfaEnabled(null);
                setShowMfaRecommendationBanner(false);
                return;
            }

            try {
                const mfaStatus = await mfaService.getMFAStatus();
                setMfaEnabled(mfaStatus.isEnabled);
                
                // Mostrar banner solo si:
                // 1. MFA no está habilitado
                // 2. El banner no ha sido cerrado (localStorage)
                const bannerDismissed = localStorage.getItem('mfa-recommendation-banner-dismissed') === 'true';
                if (!mfaStatus.isEnabled && !bannerDismissed) {
                    setShowMfaRecommendationBanner(true);
                } else {
                    setShowMfaRecommendationBanner(false);
                }
            } catch (error) {
                console.error('[SearchDashboard] Error checking MFA status:', error);
                setMfaEnabled(null);
                setShowMfaRecommendationBanner(false);
            }
        };

        checkMfaStatus();
    }, [isAuthenticated]);

    const handleDismissMfaRecommendation = () => {
        setShowMfaRecommendationBanner(false);
        localStorage.setItem('mfa-recommendation-banner-dismissed', 'true');
    };

    const handleSetupMfa = () => {
        navigate('/mfa/setup');
    };


    const isAdmin = user?.role === 'Admin' || user?.email?.trim().toLowerCase() === 'dcastillaa@gmail.com'.toLowerCase();
    
    // ✅ COMPLETO: Preparar filtros para la API (5 filtros principales)
    // Si todas las categorías están seleccionadas, no filtrar por categoría
    const allCategoriesSelected = Array.isArray(categories) && 
        filters.selectedCategories.length === categories.length &&
        categories.every(cat => filters.selectedCategories.includes(cat.id));
    
    const apiFilters: SearchFilters = {
        page: 1,
        pageSize: 20,
        searchTerm: filters.search || undefined,
        category: allCategoriesSelected ? undefined : (filters.selectedCategories.length > 0 ? filters.selectedCategories[0] : undefined),
        isActive: filters.showInactives ? undefined : true,  // Si showInactives es false, solo activas
        isRevised: filters.isRevised !== null ? filters.isRevised : undefined,
        searchHireStatus: filters.searchHireStatus || undefined,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
    };

    // ✅ CORREGIDO: Todos los usuarios usan la nueva API con filtros
    const searchesWithFiltersQuery = searchesWithFilters(apiFilters, isAdmin, true); // Siempre habilitado
    
    const { isLoading, isFetching, data, error } = searchesWithFiltersQuery;
    
    const [currentSearches, setCurrentSearches] = useState<SearchItem[]>([]);
    const [currentPagination, setCurrentPagination] = useState<PaginationMetadata | null>(null);

    useEffect(() => {
        if (data) {
            setCurrentSearches(data.searches || []);
            setCurrentPagination('pagination' in data ? data.pagination : null);
        }
    }, [data]);

    const loading = isLoading && currentSearches.length === 0;

    // ✅ Manejo elegante de errores con toast (DEBE estar antes de cualquier return)
    useErrorHandler(error instanceof Error ? error : null, !!error);

    // ✅ SIMPLIFICADO: El backend ya filtra, solo usamos los datos tal como vienen
    const filteredSearches = currentSearches;

    const getActivityStatus = (search: SearchItem) => {
        // ✅ NUEVA LÓGICA: Usar isFinalizationStatus del statusInfo del backend
        if (!search.isActive) {
            return 'Inactiva';
        }
        
        if (!search.searchHire) {
            return 'Activa'; // Sin contratación = activa
        }
        
        // ✅ Usar statusInfo cuando esté disponible (viene del backend)
        if (search.searchHire.statusInfo) {
            return search.searchHire.statusInfo.isFinalizationStatus ? 'Inactiva' : 'Activa';
        }
        
        // Fallback: lógica hardcodeada anterior (usar statusInfo.statusValue si está disponible)
        const currentStatus = search.searchHire.statusInfo?.statusValue || search.searchHire.status;
        const terminalStatuses = ['dispute_resolved', 'completed', 'cancelled'];
        return !terminalStatuses.includes(currentStatus) ? 'Activa' : 'Inactiva';
    };

    // ✅ HOOK DINÁMICO PARA ESTADOS
    const { data: appointmentStatuses } = useAppointmentStatuses();
    
    const getLocalAppointmentStatusText = (status?: string) => {
        if (!status) return 'Cita pendiente';
        return appointmentStatuses 
            ? getAppointmentStatusText(status, appointmentStatuses)
            : status;
    };

    const handleSearchClick = async (searchId: number) => {
        if (isAdmin) {
            try {
                await reviseSearchMutation.mutateAsync(searchId);
            } catch (error) {
                console.error('Failed to mark search as revised:', error);
            }
        }
        navigate(`/detalles/${searchId}`);
    };




    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header Skeleton */}
                <div className="bg-white border-b border-gray-200/60">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-6">
                                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                                </div>
                            <div className="flex items-center gap-1">
                                <div className="hidden sm:flex items-center gap-0 bg-gray-50/80 p-0.5 rounded-lg border border-gray-200/60">
                                    <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse"></div>
                                    <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse"></div>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-10">
                    {/* Filters Bar Skeleton */}
                    <div className="mb-6 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                        {/* Search Bar Skeleton */}
                        <div className="w-full sm:flex-1 sm:min-w-[200px] sm:max-w-md">
                            <div className="relative">
                                <div className="w-full h-10 bg-white border border-gray-200 rounded-lg animate-pulse">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>

                        {/* Filter Buttons Skeleton */}
                        <div className="flex items-center gap-2 sm:gap-3 w-[75%] sm:w-auto flex-nowrap">
                            <div className="w-24 sm:w-28 h-9 bg-white border border-gray-200 rounded-lg animate-pulse flex-1 sm:flex-none"></div>
                            <div className="w-20 sm:w-24 h-9 bg-gray-200 rounded-lg animate-pulse flex-1 sm:flex-none"></div>
                            <div className="w-28 sm:w-32 h-9 bg-white border border-gray-200 rounded-lg animate-pulse flex-1 sm:flex-none"></div>
                        </div>
                    </div>

                    {/* Results count skeleton */}
                    <div className="mb-6">
                        <div className="h-5 bg-gray-200 rounded-md w-48 animate-pulse"></div>
                    </div>

                    {/* Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-6 bg-gray-200 rounded-md w-4/5 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded-md w-full animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded-md w-3/5 animate-pulse"></div>
                                    </div>
                                    <div className="w-7 h-7 bg-gray-200 rounded-full ml-3 animate-pulse"></div>
                                </div>
                                
                                {/* Meta Info */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded-md w-20 animate-pulse"></div>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded-md w-16 animate-pulse"></div>
                                </div>
                                
                                {/* Status */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                                        <div className="w-24 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                                    </div>
                                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                                
                                {/* Expert info (sometimes) */}
                                {i % 3 === 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-4 bg-gray-200 rounded-md w-24 animate-pulse"></div>
                                            <div className="h-3 bg-gray-200 rounded-md w-32 animate-pulse"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Verificar si es error de red
    const isNetworkErr = error && isNetworkError(error instanceof Error ? error : { message: String(error) });
    
    // Solo mostrar pantalla de error si es crítico y no es un error de red (los de red se manejan con toast)
    if (error && !isNetworkErr) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
                <div className="text-center space-y-6 max-w-md">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full blur-xl opacity-50"></div>
                            <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                                <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
                        </p>
                    </div>
                    <Button
                        onClick={() => searchesWithFiltersQuery.refetch()}
                        variant="outline"
                        size="sm"
                        className="mt-4"
                    >
                        <Activity className="w-4 h-4 mr-2" />
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12 sm:h-16">
                        <div className="flex items-center gap-3 sm:gap-6">
                            <button
                                onClick={() => navigate('/')}
                                className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 hover:bg-gray-50/80 rounded-lg transition-colors duration-150 text-gray-400 hover:text-gray-700"
                                aria-label="Volver"
                            >
                                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Admin Panel Button */}
                            {isAdmin && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 rounded-lg transition-all duration-150"
                                >
                                    <Settings className="w-3.5 h-3.5 sm:mr-1.5" strokeWidth={1.5} />
                                    <span className="hidden sm:inline">Admin</span>
                                </button>
                            )}
                            
                            {/* View Mode Toggle */}
                            <div className="hidden sm:flex items-center gap-0 bg-gray-50/80 p-0.5 rounded-lg border border-gray-200/60">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all duration-150 ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    aria-label="Vista de cuadrícula"
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all duration-150 ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    aria-label="Vista de lista"
                                >
                                    <LayoutList className="w-3.5 h-3.5" strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
                {/* ✅ Mensaje simple para errores de red */}
                {isNetworkErr && (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <WifiOff className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    No se pudo conectar con el servidor
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Intenta nuevamente en unos minutos
                                </p>
                            </div>
                            <Button
                                onClick={() => searchesWithFiltersQuery.refetch()}
                                variant="outline"
                                size="sm"
                                className="mt-2"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reintentar
                            </Button>
                        </div>
                    </div>
                )}

            {/* Filters Bar - Simplificado */}
            {!isNetworkErr && (
            <>
            <div className="mb-6 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                {/* Search Bar */}
                <div className="w-full sm:flex-1 sm:min-w-[200px] sm:max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchInput}
                            onChange={handleSearchChange}
                            onFocus={handleSearchFocus}
                            onBlur={handleSearchBlur}
                            placeholder="Buscar inspecciones..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:border-gray-300"
                        />
                        {isFetching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Buttons - Mobile: 75% width, Desktop: auto */}
                <div className="flex items-center gap-2 sm:gap-3 w-[75%] sm:w-auto flex-nowrap">
                    {/* Categorías - Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm whitespace-nowrap flex-1 sm:flex-none sm:w-auto">
                                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Categorías</span>
                                <span className="xs:hidden">Cat.</span>
                                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                                {filters.selectedCategories.length < (categories?.length || 0) && (
                                    <span className="ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] sm:text-xs font-semibold">
                                        {filters.selectedCategories.length}
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-gray-900 mb-3">Seleccionar categorías</h4>
                            {Array.isArray(categories) && categories.map((category) => {
                                const isSelected = filters.selectedCategories.includes(category.id);
                                return (
                                    <label
                                    key={category.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                                setFilters((prev) => {
                                                    if (e.target.checked) {
                                                        return {
                                            ...prev,
                                                            selectedCategories: [...prev.selectedCategories, category.id]
                                                        };
                                                    } else {
                                                        return {
                                                            ...prev,
                                                            selectedCategories: prev.selectedCategories.filter(id => id !== category.id)
                                                        };
                                                    }
                                                });
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                        />
                                        <CategoryImage categoryId={category.id} categoryName={category.name} size="sm" />
                                        <span className="text-sm text-gray-700 flex-1">{category.name}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>

                    {/* Botón Ver Inactivas */}
                        <button
                            onClick={() => setFilters((prev) => ({ 
                                ...prev, 
                            showInactives: !prev.showInactives
                        }))}
                        className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-sm whitespace-nowrap flex-1 sm:flex-none sm:w-auto ${
                            filters.showInactives
                                ? 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                    >
                        <span className="hidden xs:inline">{filters.showInactives ? 'Ver solo activas' : 'Ver inactivas'}</span>
                        <span className="xs:hidden">{filters.showInactives ? 'Solo activas' : 'Inactivas'}</span>
                        </button>

                    {/* Filtro de estado de contratación - Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm whitespace-nowrap flex-1 sm:flex-none sm:w-auto">
                                <span className="hidden sm:inline">
                                    {filters.searchHireStatus 
                                        ? [
                                            { value: 'pending', label: 'Pendiente' },
                                            { value: 'awaiting_client_decision', label: 'Esperando decisión' },
                                            { value: 'disputed', label: 'En disputa' },
                                            { value: 'completed', label: 'Completado' },
                                            { value: 'cancelled', label: 'Cancelado' },
                                            { value: 'transfer_failed', label: 'Transferencia fallida' },
                                            { value: 'dispute_resolved', label: 'Disputa resuelta' },
                                        ].find(s => s.value === filters.searchHireStatus)?.label || 'Estado'
                                        : 'Todos los estados'
                                    }
                                </span>
                                <span className="sm:hidden">
                                    {filters.searchHireStatus ? 'Estado' : 'Estados'}
                                </span>
                                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        </PopoverTrigger>
                    <PopoverContent className="w-56 p-3" align="start">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-gray-900 mb-3">Seleccionar estado</h4>
                            {[
                                { value: '', label: 'Todos los estados' },
                                { value: 'pending', label: 'Pendiente' },
                                { value: 'awaiting_client_decision', label: 'Esperando decisión' },
                                { value: 'disputed', label: 'En disputa' },
                                { value: 'completed', label: 'Completado' },
                                { value: 'cancelled', label: 'Cancelado' },
                                { value: 'transfer_failed', label: 'Transferencia fallida' },
                                { value: 'dispute_resolved', label: 'Disputa resuelta' },
                            ].map((status) => {
                                const isSelected = filters.searchHireStatus === status.value;
                                return (
                                    <label
                                        key={status.value}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                    >
                                        <input
                                            type="radio"
                                            name="searchHireStatus"
                                            value={status.value}
                                            checked={isSelected}
                                            onChange={(e) => {
                                                setFilters((prev) => ({
                                ...prev, 
                                searchHireStatus: e.target.value 
                                                }));
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                                        />
                                        <span className="text-sm text-gray-700 flex-1">{status.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
                <div className="text-sm font-semibold text-slate-700">
                    {isAdmin && currentPagination ? (
                        <>
                            {currentPagination.totalCount} {currentPagination.totalCount === 1 ? 'inspección' : 'inspecciones'} total
                            <span className="text-slate-500 ml-2 font-normal">
                                • Página {currentPagination.currentPage} de {currentPagination.totalPages}
                            </span>
                        </>
                    ) : (
                        <>
                    {filteredSearches.length} {filteredSearches.length === 1 ? 'inspección' : 'inspecciones'}
                        </>
                    )}
                </div>
            </div>

            {filteredSearches.length === 0 ? (
                <Empty className="bg-white border border-slate-200 rounded-lg">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Search className="w-7 h-7 text-slate-500" />
                        </EmptyMedia>
                        <EmptyTitle>No se encontraron inspecciones</EmptyTitle>
                        <EmptyDescription>Prueba con otros filtros o crea una nueva inspección para empezar</EmptyDescription>
                        <EmptyContent>
                            <Button 
                                onClick={() => {
                                    sessionStorage.setItem('scrollToFormSection', 'true');
                                    navigate('/');
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2.5 font-medium"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Crear nueva inspección
                            </Button>
                        </EmptyContent>
                    </EmptyHeader>
                </Empty>
            ) : (viewMode === 'grid' || isMobile) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
                    {filteredSearches.map((search) => {
                        const hasUnreadMessages = search.unreadMessagesCount > 0;

                        return (
                            <div
                                key={search.id}
                                onClick={() => handleSearchClick(search.id)}
                                className={`group bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden
                                    border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:border-blue-100/50 hover:-translate-y-1
                                    ${isAdmin && !search.isRevised ? 'ring-2 ring-red-100 bg-red-50/10' : ''}
                                `}
                            >
                                {/* Header: Title + Badge */}
                                <div className="flex justify-between items-start mb-3 gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[17px] font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                                            {search.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(search.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                            </span>
                                            {search.locationName && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        <span className="truncate">{search.locationName}</span>
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    {search.searchHire && (
                                        <div className="flex-shrink-0">
                                            <StatusBadge 
                                                statusInfo={(() => {
                                                    const info = getStatusInfoWithFallback(
                                                        search.searchHire.statusInfo,
                                                        search.searchHire.status
                                                    );
                                                    if (search.searchHire.status === 'pending' || info?.statusValue === 'pending') {
                                                        return {
                                                            ...info,
                                                            statusTranslated: 'Servicio activo'
                                                        };
                                                    }
                                                    return info;
                                                })()}
                                                size="sm"
                                                className="shadow-sm"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[40px] leading-relaxed">
                                    {search.description || 'Sin descripción adicional'}
                                </p>

                                {/* Category & Messages */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50/80 rounded-lg group-hover:bg-blue-50/50 transition-colors">
                                        <CategoryImage categoryId={search.category} categoryName={Array.isArray(categories) && categories.find(cat => cat.id === search.category)?.name || 'N/A'} size="sm" />
                                        <span className="text-xs font-semibold text-gray-700">
                                            {Array.isArray(categories) && categories.find(cat => cat.id === search.category)?.name || 'N/A'}
                                        </span>
                                    </div>

                                    {hasUnreadMessages && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium animate-pulse">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>{search.unreadMessagesCount} nuevos</span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer: Expert Info */}
                                <div className="flex items-center justify-between pt-1">
                                    {search.searchHire?.expert ? (
                                        <div className="flex items-center gap-2.5">
                                            <div className="relative">
                                                <img
                                                    src={search.searchHire.expert.profilePictureUrl || '/default-avatar.png'}
                                                    alt="Expert"
                                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                                                />
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Experto</span>
                                                <span className="text-xs font-bold text-gray-900 truncate max-w-[100px]">{search.searchHire.expert.name}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                            </div>
                                            <span className="text-xs font-medium">Pendiente de experto</span>
                                        </div>
                                    )}
                                    
                                    <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Inspección</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Experto</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSearches.map((search) => {
                                const hasUnreadMessages = search.unreadMessagesCount > 0;

                                return (
                                    <tr key={search.id} onClick={() => handleSearchClick(search.id)} className="hover:bg-blue-50/30 cursor-pointer transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <div className="relative">
                                                        <MessageSquare className={`w-4 h-4 ${
                                                            hasUnreadMessages 
                                                                ? 'text-red-500' 
                                                                : 'text-gray-400'
                                                        }`} />
                                                        {search.unreadMessagesCount > 0 && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                                {search.unreadMessagesCount > 9 ? '9+' : search.unreadMessagesCount}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {search.hasPendingAppointment ? (
                                                        <div title={getLocalAppointmentStatusText(search.pendingAppointmentStatus)}>
                                                            <Calendar className="w-4 h-4 text-orange-500" />
                                                        </div>
                                                    ) : (
                                                        <div title="Sin cita contratada">
                                                            <CalendarX className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                                        {search.title}
                                                    </div>
                                                    <div className="text-xs text-gray-600 line-clamp-1">
                                                        {search.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CategoryImage categoryId={search.category} categoryName={categories?.find((c) => c.id === search.category)?.name || 'N/A'} size="sm" />
                                                <span className="text-sm font-medium text-gray-700">
                                                {categories?.find((c) => c.id === search.category)?.name}
                                            </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getActivityStatus(search) === 'Activa' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-600'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getActivityStatus(search) === 'Activa' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                {getActivityStatus(search)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    <span>{new Date(search.createdAt).toLocaleDateString('es-ES', { 
                                                        day: 'numeric', 
                                                        month: 'short' 
                                                    })}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">Fecha de creación</span>
                                                {search.locationName && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 text-gray-500" />
                                                        <span className="truncate max-w-28">{search.locationName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {search.searchHire?.expert ? (
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={search.searchHire.expert.profilePictureUrl || '/default-avatar.png'}
                                                        alt={`${search.searchHire.expert.name}'s profile`}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {search.searchHire.expert.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                            </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ✅ NUEVO: Controles de paginación */}
            {isAdmin && currentPagination && currentPagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                        onClick={() => {
                            // TODO: Implementar cambio de página
                            console.log('Cambiar a página anterior');
                        }}
                        disabled={!currentPagination.hasPrevious}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            currentPagination.hasPrevious
                                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                    >
                        Anterior
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                            Página {currentPagination.currentPage} de {currentPagination.totalPages}
                        </span>
                    </div>
                    
                    <button
                        onClick={() => {
                            // TODO: Implementar cambio de página
                            console.log('Cambiar a página siguiente');
                        }}
                        disabled={!currentPagination.hasNext}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            currentPagination.hasNext
                                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                    >
                        Siguiente
                    </button>
                </div>
            )}
            </>
            )}
            </div>
        </div>
    );
};

export { SearchDashboard };