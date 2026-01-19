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
    Clock,
    ArrowRight,
    Tag,
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

    // ✅ CRÍTICO: Validar que categoryName sea válido antes de usar toLowerCase
    const safeCategoryName = categoryName ? String(categoryName).toLowerCase() : '';
    
    // Determinar qué imagen usar según el nombre de la categoría
    const isMotoAgua = safeCategoryName.includes('moto') && safeCategoryName.includes('agua');
    const isMoto = safeCategoryName.includes('moto') && !isMotoAgua;
    const isCoche = safeCategoryName.includes('coche') || safeCategoryName.includes('vehículo');
    const isCasa = safeCategoryName.includes('inmobiliaria') || safeCategoryName.includes('casa') || safeCategoryName.includes('inmueble');

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

    // ✅ Helper para obtener el nombre de la categoría de forma robusta
    const getCategoryName = (categoryId: number | undefined | null): string => {
        if (!categoryId) {
            console.log('[SearchDashboard] getCategoryName: categoryId is null/undefined', categoryId);
            return 'Sin categoría';
        }
        
        if (!Array.isArray(categories) || categories.length === 0) {
            console.log('[SearchDashboard] getCategoryName: categories not available', { categories, categoryId });
            return 'Sin categoría';
        }
        
        // Buscar la categoría, manejando tanto números como strings
        const category = categories.find(cat => {
            const catId = typeof cat.id === 'number' ? cat.id : parseInt(String(cat.id), 10);
            const searchId = typeof categoryId === 'number' ? categoryId : parseInt(String(categoryId), 10);
            return catId === searchId;
        });
        
        if (!category) {
            console.log('[SearchDashboard] getCategoryName: category not found', { 
                categoryId, 
                categoriesIds: categories.map(c => c.id),
                categoriesNames: categories.map(c => c.name)
            });
        }
        
        return category?.name || 'Sin categoría';
    };

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
            <div className="flex items-center justify-center min-h-screen bg-white p-4">
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
        <div className="min-h-screen bg-white">
            {/* Header Section - Estilo Homepage */}
            <div className="bg-white sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-100">
                <div className="w-full max-w-[95%] md:max-w-[85%] lg:max-w-[80%] mx-auto px-6">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-700"
                                aria-label="Volver"
                                style={{
                                    border: '1px solid rgb(221, 221, 221)',
                                }}
                            >
                                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                            </button>
                            <h1
                                className="hidden md:block"
                                style={{
                                    fontSize: '22px',
                                    lineHeight: '26px',
                                    fontWeight: 600,
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    color: 'rgb(34, 34, 34)',
                                    margin: 0,
                                    padding: 0,
                                }}
                            >
                                Mis búsquedas
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Admin Panel Button */}
                            {isAdmin && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                                    style={{
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    }}
                                >
                                    <Shield className="w-4 h-4" strokeWidth={2} />
                                    <span className="hidden sm:inline">Admin</span>
                                </button>
                            )}
                            
                            {/* View Mode Toggle */}
                            <div className="hidden sm:flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    aria-label="Vista de cuadrícula"
                                >
                                    <LayoutGrid className="w-4 h-4" strokeWidth={2} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    aria-label="Vista de lista"
                                >
                                    <LayoutList className="w-4 h-4" strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-[95%] md:max-w-[85%] lg:max-w-[80%] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-8">
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

            {/* Filters Bar */}
            {!isNetworkErr && (
            <>
            {/* Search Bar - Estilo Airbnb discreto */}
            <div className="mb-4">
                <div className="relative max-w-xl">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                        <Search className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchInput}
                        onChange={handleSearchChange}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                        placeholder="Buscar inspecciones..."
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-full placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:shadow-md transition-all duration-200 shadow-sm hover:shadow-md"
                        style={{
                            fontSize: '14px',
                            lineHeight: '20px',
                            fontWeight: 400,
                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                            color: 'rgb(34, 34, 34)',
                        }}
                    />
                    {isFetching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#ff385c] rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Pills - Estilo Airbnb discreto */}
            <div className="mb-5">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Categorías - Pill */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow"
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 500,
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                <Filter className="w-3.5 h-3.5 text-gray-500" />
                                <span>Categorías</span>
                                {filters.selectedCategories.length < (categories?.length || 0) && (
                                    <span className="ml-0.5 px-1.5 py-0.5 bg-[#ff385c] text-white rounded-full text-[10px] font-semibold">
                                        {filters.selectedCategories.length}
                                    </span>
                                )}
                                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                        </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                        <div className="space-y-2">
                            <h4 
                                className="mb-3"
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 600,
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    color: 'rgb(34, 34, 34)',
                                }}
                            >
                                Seleccionar categorías
                            </h4>
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
                                            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 focus:ring-2"
                                        />
                                        <CategoryImage categoryId={category.id} categoryName={category.name} size="sm" />
                                        <span 
                                            className="flex-1"
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                color: 'rgb(34, 34, 34)',
                                            }}
                                        >
                                            {category.name}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>

                    {/* Botón Ver Inactivas - Estilo Airbnb discreto */}
                        <button
                            onClick={() => setFilters((prev) => ({ 
                                ...prev, 
                            showInactives: !prev.showInactives
                        }))}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow ${
                            filters.showInactives
                                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                : 'bg-[#ff385c] text-white hover:bg-[#e31c5f] border border-[#ff385c]'
                        }`}
                        style={{
                            fontSize: '14px',
                            lineHeight: '20px',
                            fontWeight: 500,
                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                        }}
                    >
                        <Activity className="w-3.5 h-3.5" />
                        <span>{filters.showInactives ? 'Solo activas' : 'Ver inactivas'}</span>
                        </button>

                    {/* Filtro de estado - Estilo Airbnb discreto */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow"
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 500,
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                <span>
                                    {filters.searchHireStatus 
                                        ? [
                                            { value: 'pending', label: 'Pendiente' },
                                            { value: 'awaiting_client_decision', label: 'Esperando' },
                                            { value: 'disputed', label: 'Disputa' },
                                            { value: 'completed', label: 'Completado' },
                                            { value: 'cancelled', label: 'Cancelado' },
                                            { value: 'transfer_failed', label: 'Fallida' },
                                            { value: 'dispute_resolved', label: 'Resuelta' },
                                        ].find(s => s.value === filters.searchHireStatus)?.label || 'Estado'
                                        : 'Estado'
                                    }
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                        </PopoverTrigger>
                    <PopoverContent className="w-56 p-3" align="start">
                        <div className="space-y-2">
                            <h4 
                                className="mb-3"
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 600,
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                    color: 'rgb(34, 34, 34)',
                                }}
                            >
                                Seleccionar estado
                            </h4>
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
                                            className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900 focus:ring-2"
                                        />
                                        <span 
                                            className="flex-1"
                                            style={{
                                                fontSize: '14px',
                                                lineHeight: '20px',
                                                fontWeight: 400,
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                color: 'rgb(34, 34, 34)',
                                            }}
                                        >
                                            {status.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>
                </div>
            </div>

            {/* Results count - Estilo Airbnb discreto */}
            <div className="flex items-center justify-between mb-4">
                <div 
                    className="inline-flex items-center gap-1.5"
                    style={{
                        fontSize: '14px',
                        lineHeight: '20px',
                        fontWeight: 400,
                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                        color: 'rgb(113, 113, 113)',
                    }}
                >
                    {isAdmin && currentPagination ? (
                        <>
                            {currentPagination.totalCount} {currentPagination.totalCount === 1 ? 'inspección' : 'inspecciones'}
                            <span className="text-gray-400">· Página {currentPagination.currentPage}/{currentPagination.totalPages}</span>
                        </>
                    ) : (
                        <>
                    {filteredSearches.length} {filteredSearches.length === 1 ? 'inspección' : 'inspecciones'}
                        </>
                    )}
                </div>
            </div>

            {filteredSearches.length === 0 ? (
                <Empty className="bg-white border border-gray-200 rounded-xl">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Search className="w-7 h-7 text-gray-400" />
                        </EmptyMedia>
                        <EmptyTitle
                            style={{
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                fontSize: '18px',
                                lineHeight: '24px',
                                fontWeight: 600,
                                color: 'rgb(34, 34, 34)',
                            }}
                        >
                            No se encontraron inspecciones
                        </EmptyTitle>
                        <EmptyDescription
                            style={{
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                fontSize: '14px',
                                lineHeight: '20px',
                                fontWeight: 400,
                                color: 'rgb(113, 113, 113)',
                            }}
                        >
                            Prueba con otros filtros o crea una nueva inspección para empezar
                        </EmptyDescription>
                        <EmptyContent>
                                <Button 
                                onClick={() => {
                                    sessionStorage.setItem('scrollToFormSection', 'true');
                                    navigate('/');
                                }}
                                className="bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200 px-6 py-2.5 rounded-lg"
                                style={{
                                    fontSize: '14px',
                                    lineHeight: '20px',
                                    fontWeight: 500,
                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
                                Crear inspección
                            </Button>
                        </EmptyContent>
                    </EmptyHeader>
                </Empty>
            ) : (viewMode === 'grid' || isMobile) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSearches.map((search) => {
                        const hasUnreadMessages = search.unreadMessagesCount > 0;

                        return (
                            <div
                                key={search.id}
                                onClick={() => handleSearchClick(search.id)}
                                className={`group bg-gray-50 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 relative flex flex-col
                                    border border-gray-200 shadow-md hover:border-gray-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4),0_0_40px_rgba(147,51,234,0.3),0_0_60px_rgba(236,72,153,0.2)]
                                    ${isAdmin && !search.isRevised ? 'ring-2 ring-red-200 bg-red-50' : ''}
                                `}
                            >
                                {/* Imagen del servicio - Arriba */}
                                <div className="relative w-full aspect-[3/1] bg-gray-100 overflow-hidden">
                                    {search.serviceImageUrl ? (
                                        <img
                                            src={search.serviceImageUrl}
                                            alt={search.title}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            onError={(e) => {
                                                console.error('[SearchDashboard] Error loading image:', search.serviceImageUrl);
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                                                if (placeholder) {
                                                    placeholder.style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    {/* Placeholder */}
                                    <div 
                                        className={`image-placeholder absolute inset-0 flex items-center justify-center bg-gray-200 ${search.serviceImageUrl ? 'hidden' : 'flex'}`}
                                    >
                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                    </div>
                                    
                                    {/* Badge de categoría superpuesto */}
                                    <div className="absolute top-3 left-3">
                                        <span 
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm shadow-sm"
                                            style={{
                                                fontSize: '12px',
                                                lineHeight: '16px',
                                                fontWeight: 500,
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                color: 'rgb(34, 34, 34)',
                                            }}
                                        >
                                            <CategoryImage categoryId={search.category} categoryName={search.categoryName || getCategoryName(search.category)} size="sm" />
                                            {search.categoryName || getCategoryName(search.category)}
                                        </span>
                                    </div>

                                    {/* Status Badge superpuesto */}
                                    {search.searchHire && (
                                        <div className="absolute top-3 right-3">
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
                                                className="shadow-sm bg-white/95 backdrop-blur-sm"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Contenido - Abajo */}
                                <div className="p-4 sm:p-5 flex flex-col flex-1">
                                    {/* Ubicación y disponibilidad */}
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {search.expertCity && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" style={{ color: 'rgb(106, 106, 106)' }} />
                                                <span 
                                                    style={{
                                                        fontSize: '12px',
                                                        lineHeight: '16px',
                                                        fontWeight: 400,
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        color: 'rgb(106, 106, 106)',
                                                    }}
                                                >
                                                    {search.expertCity}
                                                </span>
                                            </div>
                                        )}
                                        {search.expertAvailability && search.expertCity && (
                                            <span style={{ color: 'rgb(200, 200, 200)' }}>•</span>
                                        )}
                                        {search.expertAvailability && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" style={{ color: 'rgb(106, 106, 106)' }} />
                                                <span 
                                                    style={{
                                                        fontSize: '12px',
                                                        lineHeight: '16px',
                                                        fontWeight: 400,
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        color: 'rgb(106, 106, 106)',
                                                    }}
                                                >
                                                    Disponible
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Título */}
                                    <h3 
                                        className="mb-2 line-clamp-2"
                                        style={{
                                            fontSize: '16px',
                                            lineHeight: '22px',
                                            fontWeight: 600,
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            color: 'rgb(34, 34, 34)',
                                        }}
                                    >
                                        {search.title}
                                    </h3>

                                    {/* Descripción */}
                                    <p 
                                        className="mb-3 line-clamp-2 flex-1"
                                        style={{
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            fontWeight: 400,
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                            color: 'rgb(106, 106, 106)',
                                        }}
                                    >
                                        {search.description || 'Sin descripción adicional'}
                                    </p>

                                    {/* Disponibilidad detallada */}
                                    {search.expertAvailability && (
                                        <div 
                                            className="mb-3 flex flex-wrap items-center gap-1.5"
                                            style={{
                                                fontSize: '11px',
                                                lineHeight: '14px',
                                                fontWeight: 400,
                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                color: 'rgb(34, 34, 34)',
                                            }}
                                        >
                                            {search.expertAvailability.daysOfWeek.slice(0, 5).map((day: string, idx: number) => {
                                                const dayMap: Record<string, string> = {
                                                    'Monday': 'L',
                                                    'Tuesday': 'M',
                                                    'Wednesday': 'X',
                                                    'Thursday': 'J',
                                                    'Friday': 'V',
                                                    'Saturday': 'S',
                                                    'Sunday': 'D'
                                                };
                                                return (
                                                    <span key={idx} className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 text-xs">
                                                        {dayMap[day] || day.charAt(0)}
                                                    </span>
                                                );
                                            })}
                                            {search.expertAvailability.daysOfWeek.length > 5 && (
                                                <span className="text-gray-600 text-xs">+{search.expertAvailability.daysOfWeek.length - 5}</span>
                                            )}
                                            <span className="text-gray-600 text-xs">
                                                {search.expertAvailability.startTime.substring(0, 5)} - {search.expertAvailability.endTime.substring(0, 5)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Footer con acciones */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto gap-6">
                                        <div className="flex items-center gap-3">
                                            {/* Enlace "Ver más" */}
                                            <div 
                                                className="flex items-center gap-1.5 cursor-pointer group/link"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSearchClick(search.id);
                                                }}
                                                style={{
                                                    fontSize: '14px',
                                                    lineHeight: '20px',
                                                    fontWeight: 500,
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    color: 'rgb(34, 34, 34)',
                                                }}
                                            >
                                                <span className="group-hover/link:underline">Ver más</span>
                                                <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                            </div>

                                            {/* Mensajes no leídos */}
                                            {hasUnreadMessages && (
                                                <div 
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-[#ff385c]/10 rounded-full"
                                                    style={{
                                                        fontSize: '12px',
                                                        lineHeight: '16px',
                                                        fontWeight: 600,
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        color: '#ff385c',
                                                    }}
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    <span>{search.unreadMessagesCount}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Botón de acción (plus) */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSearchClick(search.id);
                                            }}
                                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 group/btn flex-shrink-0"
                                        >
                                            <Plus className="w-4 h-4 text-gray-700 group-hover/btn:text-gray-900" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th 
                                    className="px-6 py-4 text-left uppercase tracking-wider"
                                    style={{
                                        fontSize: '12px',
                                        lineHeight: '16px',
                                        fontWeight: 600,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        color: 'rgb(34, 34, 34)',
                                    }}
                                >
                                    Inspección
                                </th>
                                <th 
                                    className="px-6 py-4 text-left uppercase tracking-wider"
                                    style={{
                                        fontSize: '12px',
                                        lineHeight: '16px',
                                        fontWeight: 600,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        color: 'rgb(34, 34, 34)',
                                    }}
                                >
                                    Categoría
                                </th>
                                <th 
                                    className="px-6 py-4 text-left uppercase tracking-wider"
                                    style={{
                                        fontSize: '12px',
                                        lineHeight: '16px',
                                        fontWeight: 600,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        color: 'rgb(34, 34, 34)',
                                    }}
                                >
                                    Estado
                                </th>
                                <th 
                                    className="px-6 py-4 text-left uppercase tracking-wider"
                                    style={{
                                        fontSize: '12px',
                                        lineHeight: '16px',
                                        fontWeight: 600,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        color: 'rgb(34, 34, 34)',
                                    }}
                                >
                                    Fecha
                                </th>
                                <th 
                                    className="px-6 py-4 text-left uppercase tracking-wider"
                                    style={{
                                        fontSize: '12px',
                                        lineHeight: '16px',
                                        fontWeight: 600,
                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        color: 'rgb(34, 34, 34)',
                                    }}
                                >
                                    Experto
                                </th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredSearches.map((search) => {
                                const hasUnreadMessages = search.unreadMessagesCount > 0;

                                return (
                                    <tr key={search.id} onClick={() => handleSearchClick(search.id)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
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
                                                    <div 
                                                        className="mb-1 transition-colors"
                                                        style={{
                                                            fontSize: '14px',
                                                            lineHeight: '20px',
                                                            fontWeight: 500,
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                            color: 'rgb(34, 34, 34)',
                                                        }}
                                                    >
                                                        {search.title}
                                                    </div>
                                                    <div 
                                                        className="line-clamp-1"
                                                        style={{
                                                            fontSize: '12px',
                                                            lineHeight: '16px',
                                                            fontWeight: 400,
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                            color: 'rgb(113, 113, 113)',
                                                        }}
                                                    >
                                                        {search.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CategoryImage categoryId={search.category} categoryName={search.categoryName || getCategoryName(search.category)} size="sm" />
                                                <span 
                                                    className="font-medium"
                                                    style={{
                                                        fontSize: '14px',
                                                        lineHeight: '20px',
                                                        fontWeight: 400,
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        color: 'rgb(34, 34, 34)',
                                                    }}
                                                >
                                                {search.categoryName || getCategoryName(search.category)}
                                            </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span 
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                                                    getActivityStatus(search) === 'Activa' 
                                                        ? 'bg-gray-100' 
                                                        : 'bg-gray-100'
                                                }`}
                                                style={{
                                                    fontSize: '12px',
                                                    lineHeight: '16px',
                                                    fontWeight: 400,
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    color: getActivityStatus(search) === 'Activa' ? 'rgb(34, 34, 34)' : 'rgb(113, 113, 113)',
                                                }}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${getActivityStatus(search) === 'Activa' ? 'bg-gray-900' : 'bg-gray-400'}`}></span>
                                                {getActivityStatus(search)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div 
                                                    className="flex items-center gap-2"
                                                    style={{
                                                        fontSize: '14px',
                                                        lineHeight: '20px',
                                                        fontWeight: 400,
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        color: 'rgb(113, 113, 113)',
                                                    }}
                                                >
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    <span>{new Date(search.createdAt).toLocaleDateString('es-ES', { 
                                                        day: 'numeric', 
                                                        month: 'short' 
                                                    })}</span>
                                                </div>
                                                {search.locationName && (
                                                    <div 
                                                        className="flex items-center gap-2"
                                                        style={{
                                                            fontSize: '12px',
                                                            lineHeight: '16px',
                                                            fontWeight: 400,
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                            color: 'rgb(113, 113, 113)',
                                                        }}
                                                    >
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
                                                    <span 
                                                        className="font-medium"
                                                        style={{
                                                            fontSize: '14px',
                                                            lineHeight: '20px',
                                                            fontWeight: 400,
                                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                            color: 'rgb(34, 34, 34)',
                                                        }}
                                                    >
                                                        {search.searchHire.expert.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span 
                                                    style={{
                                                        fontSize: '14px',
                                                        lineHeight: '20px',
                                                        fontWeight: 400,
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                        color: 'rgb(113, 113, 113)',
                                                    }}
                                                >
                                                    —
                                                </span>
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
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                            currentPagination.hasPrevious
                                ? 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                        style={{
                            fontSize: '14px',
                            lineHeight: '20px',
                            fontWeight: 400,
                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                        }}
                    >
                        Anterior
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <span 
                            style={{
                                fontSize: '14px',
                                lineHeight: '20px',
                                fontWeight: 400,
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                color: 'rgb(113, 113, 113)',
                            }}
                        >
                            Página {currentPagination.currentPage} de {currentPagination.totalPages}
                        </span>
                    </div>
                    
                    <button
                        onClick={() => {
                            // TODO: Implementar cambio de página
                            console.log('Cambiar a página siguiente');
                        }}
                        disabled={!currentPagination.hasNext}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                            currentPagination.hasNext
                                ? 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                        style={{
                            fontSize: '14px',
                            lineHeight: '20px',
                            fontWeight: 400,
                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                        }}
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