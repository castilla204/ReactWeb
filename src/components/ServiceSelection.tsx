import { useState, useEffect } from 'react';
import { ArrowRight, Star, CheckCircle, User, StarHalf, X, Eye, FileText, Video, XCircle, MapPin } from 'lucide-react';
import { GoogleMap, useLoadScript, Circle, Marker } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../contexts/CategoryContext';
import { useServices } from '../hooks/useServices';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { EnhancedReviewsList } from './EnhancedReviewCard';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from './ui/drawer';
import CountryFlag from './CountryFlag';

const libraries: ("geometry" | "places")[] = ['geometry', 'places'];

interface ServiceSelectionProps {
    onBack: () => void;
    onComplete: (serviceId: number, expertProfilePicture?: string, expertName?: string, servicePrice?: number, serviceDescription?: string, serviceImageUrls?: string[]) => void;
    selectedCategory: number;
    selectedServiceTypeId: number;
    latitude: string;
    longitude: string;
    locationRange: number;
}

export function ServiceSelection({
    onBack,
    onComplete,
    selectedCategory,
    selectedServiceTypeId,
    latitude,
    longitude,
    locationRange,
}: ServiceSelectionProps) {
    const navigate = useNavigate();
    const { categories } = useCategories();
    const { serviceTypes } = useServiceTypes();
    const [selectedService, setSelectedService] = useState<number | null>(null);
    const [detailServiceId, setDetailServiceId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [carouselIndices, setCarouselIndices] = useState<{ [key: number]: number }>({});
    const initialIsMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const [isDrawerOpen, setIsDrawerOpen] = useState(initialIsMobile);
    const [snap, setSnap] = useState<number | string | null>(0.7); // Inicia a 70% (más de la mitad)
    const drawerContentRef = React.useRef<HTMLDivElement>(null);
    const [filters, setFilters] = useState({
        priceRange: 'all' as 'all' | 'low' | 'medium' | 'high',
        rating: 'all' as 'all' | '4+' | '4.5+',
        experience: 'all' as 'all' | 'new' | 'experienced' | 'pro'
    });
    
    // Google Maps configuration
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBNEdqihExcXPnWw_TJgHFzsPXS7BIazyM",
        libraries
    });

    const mapCenter = {
        lat: parseFloat(latitude?.toString() || '40.4168') || 40.4168,
        lng: parseFloat(longitude?.toString() || '-3.7038') || -3.7038
    };

    const getZoomLevel = (range: number) => {
        if (range <= 5) return 13;
        if (range <= 10) return 12;
        if (range <= 25) return 11;
        if (range <= 50) return 10;
        return 9;
    };

    const { services: allServices, isLoading, error } = useServices({
        categoryId: selectedCategory,
        serviceTypeId: selectedServiceTypeId,
        latitude,
        longitude,
        locationRange,
    });

    // Aplicar filtros
    const services = allServices.filter(service => {
        // Filtro de precio
        if (filters.priceRange !== 'all') {
            const price = service.price || 0;
            if (filters.priceRange === 'low' && price > 50) return false;
            if (filters.priceRange === 'medium' && (price <= 50 || price > 150)) return false;
            if (filters.priceRange === 'high' && price <= 150) return false;
        }

        // Filtro de rating
        if (filters.rating !== 'all') {
            const rating = service.averageRating || 0;
            if (filters.rating === '4+' && rating < 4) return false;
            if (filters.rating === '4.5+' && rating < 4.5) return false;
        }

        // Filtro de experiencia
        if (filters.experience !== 'all') {
            const completedSearches = service.completedSearches || 0;
            if (filters.experience === 'new' && completedSearches > 2) return false;
            if (filters.experience === 'experienced' && (completedSearches <= 2 || completedSearches > 10)) return false;
            if (filters.experience === 'pro' && completedSearches <= 10) return false;
        }

        return true;
    });


    const truncateText = (text: string, maxLength: number = 120): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const truncateTextMobile = (text: string, maxLength: number = 80): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

    console.log('ServiceSelection - Services received:', services);
    
    // Abrir drawer automáticamente en móvil cuando hay servicios
    useEffect(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
        if (isMobile && services.length > 0 && !isLoading) {
            setIsDrawerOpen(true);
            setSnap(0.7); // Abrir al 70%
        }
    }, [services.length, isLoading]);
    console.log('ServiceSelection - Total services count:', services.length);
    
    // Buscar específicamente el servicio 154
    const service154 = services.find(s => s.id === 154);
    if (service154) {
        console.log('✅ ServiceSelection: Service 154 FOUND in filtered services:', {
            id: service154.id,
            isActive: service154.isActive,
            price: service154.price,
            averageRating: service154.averageRating,
            completedSearches: service154.completedSearches
        });
    } else {
        console.warn('⚠️ ServiceSelection: Service 154 NOT FOUND in filtered services');
        console.log('ServiceSelection - All service IDs:', services.map(s => s.id));
    }
    
    services.forEach((service, index) => {
        console.log(`ServiceSelection - Service ${index} (${service.id}):`, {
            id: service.id,
            selectedDeliverableTypes: service.selectedDeliverableTypes,
            hasSelectedDeliverableTypes: !!service.selectedDeliverableTypes,
            selectedDeliverableTypesLength: service.selectedDeliverableTypes?.length || 0
        });
    });

    // No mostrar estado de carga, simplemente renderizar vacío mientras carga

    if (error) {
        const errorMessage = `Error al cargar los servicios: ${error.message}`;
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-destructive/10 border border-destructive p-6 rounded-lg text-center">
                    <p className="text-destructive mb-4">{errorMessage}</p>
                    <Button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                                if (onBack) {
                                    onBack();
                                } else {
                                    navigate(-1);
                                }
                            } catch (error) {
                                console.error('Error in onBack:', error);
                                navigate(-1);
                            }
                        }} 
                        variant="outline"
                        type="button"
                    >
                        Volver
                    </Button>
                </div>
            </div>
        );
    }

    // Log para verificar condiciones de renderizado
    console.log('ServiceSelection - Render conditions:', {
        selectedCategory,
        selectedServiceTypeId,
        servicesLength: services.length,
        willShowServices: !(selectedCategory <= 0 || !selectedServiceTypeId || selectedServiceTypeId <= 0 || services.length === 0)
    });
    
    if (selectedCategory <= 0 || !selectedServiceTypeId || selectedServiceTypeId <= 0 || services.length === 0) {
        const serviceTypeName = serviceTypes.find((st) => st.id === selectedServiceTypeId)?.name || 'Servicios';
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-muted/50 p-6 rounded-lg text-center">
                    <p className="text-muted-foreground mb-4">No hay servicios disponibles para {serviceTypeName} en la ubicación seleccionada.</p>
                    <Button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                                if (onBack) {
                                    onBack();
                                } else {
                                    navigate(-1);
                                }
                            } catch (error) {
                                console.error('Error in onBack:', error);
                                navigate(-1);
                            }
                        }} 
                        variant="outline"
                        type="button"
                    >
                        Volver
                    </Button>
                </div>
            </div>
        );
    }

    const handleContinue = () => {
        if (selectedService === null) {
            setErrorMessage('Por favor, selecciona un servicio antes de continuar.');
            return;
        }

        const selectedServiceData = services.find((s) => s.id === selectedService);
        if (!selectedServiceData) {
            console.error('ServiceSelection - No service found for ID:', selectedService);
            setErrorMessage('Error: No se encontró el servicio seleccionado.');
            return;
        }

        const expertProfilePicture = selectedServiceData.expert?.profilePictureUrl ?? '';
        const expertName = selectedServiceData.expert?.user?.name ?? 'Experto desconocido';
        const servicePrice = selectedServiceData.price ?? 0;
        const serviceDescription = selectedServiceData.conditions ?? 'Sin descripción disponible';
        const serviceImageUrls = selectedServiceData.imageUrls ?? [];

        console.log('ServiceSelection - Selected service data:', {
            serviceId: selectedService,
            expertProfilePicture,
            expertName,
            servicePrice,
            serviceDescription,
            serviceImageUrls,
        });

        if (!expertName || servicePrice === 0) {
            console.warn('ServiceSelection - Missing critical data:', { expertName, servicePrice });
            setErrorMessage('Error: Los datos del servicio están incompletos (falta el nombre del experto o el precio).');
            return;
        }

        onComplete(selectedService, expertProfilePicture, expertName, servicePrice, serviceDescription, serviceImageUrls);
    };

    // Función auxiliar para manejar el carrusel de imágenes
    const handleCarouselChange = (serviceId: number, direction: 'prev' | 'next', isModal = false) => {
        const service = services.find(s => s.id === serviceId);
        if (!service || !service.imageUrls || service.imageUrls.length === 0) return;

        setCarouselIndices(prev => {
            const current = prev[serviceId] || 0;
            let newIndex;
            
            if (direction === 'prev') {
                newIndex = current === 0 ? service.imageUrls.length - 1 : current - 1;
            } else {
                newIndex = current === service.imageUrls.length - 1 ? 0 : current + 1;
            }
            
            return { ...prev, [serviceId]: newIndex };
        });
    };

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const stars = [];
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<Star key={i} className="w-3 h-3 fill-current text-yellow-500" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<StarHalf key={i} className="w-3 h-3 fill-current text-yellow-500" />);
            } else {
                stars.push(<Star key={i} className="w-3 h-3 text-gray-300" />);
            }
        }
        return stars;
    };

    const renderDeliverableTypes = (service: any, isOnColoredBg = false) => {
        if (!service) return null;
        const deliverableTypes = service.selectedDeliverableTypes || [];
        const hasPdf = deliverableTypes.some((dt: any) => dt.name === 'PDF');
        const hasVideo = deliverableTypes.some((dt: any) => dt.name === 'Video');
        
        if (isOnColoredBg) {
        return (
                <div className="flex items-center gap-1.5">
                    {hasPdf && (
                        <Badge className="bg-white/20 text-white border-white/30 text-xs px-2 py-0.5 gap-1">
                        <FileText className="w-3 h-3" />
                            PDF
                        </Badge>
                    )}
                    {hasVideo ? (
                        <Badge className="bg-white/20 text-white border-white/30 text-xs px-2 py-0.5 gap-1">
                            <Video className="w-3 h-3" />
                            Video
                        </Badge>
                    ) : (
                        <Badge className="bg-white/10 text-white/70 border-white/20 text-xs px-2 py-0.5 gap-1">
                            <XCircle className="w-3 h-3" />
                            Sin Video
                        </Badge>
                    )}
                        </div>
            );
        }
        
        return (
            <div className="flex items-center gap-1">
                {hasPdf && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                        <FileText className="w-2.5 h-2.5" />
                        PDF
                    </Badge>
                )}
                {hasVideo ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                        <Video className="w-2.5 h-2.5" />
                        Video
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 text-muted-foreground">
                        <XCircle className="w-2.5 h-2.5" />
                        Sin Video
                    </Badge>
                )}
            </div>
        );
    };

    const detailService = services.find((s) => s.id === detailServiceId);
    const categoryName = categories.find((c) => c.id === selectedCategory)?.name || 'Categoría';

    return (
        <div className="min-h-screen bg-background">
            {/* Header Section - Fixed */}
            <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                        if (onBack) {
                                            onBack();
                                        } else {
                                            navigate(-1);
                                        }
                                    } catch (error) {
                                        console.error('Error in onBack:', error);
                                        navigate(-1);
                                    }
                                }}
                                className="h-9 w-9"
                                type="button"
                            >
                                <ArrowRight className="h-4 w-4 rotate-180" />
                            </Button>
                                    <div>
                                <h1 className="text-xl font-semibold text-foreground">
                                    {selectedServiceTypeId === 1 ? 'Inspector especializado' : 'Experto en búsquedas'}
                                </h1>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {services.length} {services.length === 1 ? 'resultado' : 'resultados'} en {categoryName}
                                </p>
                                    </div>
                                </div>
                                            </div>
                                        </div>
                                    </div>

            {/* Main Layout - Split View */}
            <div className="flex h-[calc(100vh-73px)]">
                {/* Mobile: Map First, Desktop: Results First */}
                {/* Left Side - Results & Filters */}
                <div className="hidden lg:flex flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {/* Mobile Filters */}
                        <Card className="lg:hidden mb-6">
                            <Accordion type="single" collapsible>
                                <AccordionItem value="filters" className="border-0">
                                    <AccordionTrigger className="px-5 py-4 font-semibold">Filtros</AccordionTrigger>
                                    <AccordionContent className="px-5 pb-5">
                                <div className="space-y-4">
                                        <div>
                                                <Label className="text-sm font-medium text-foreground mb-2 block">Precio</Label>
                                                <Select value={filters.priceRange} onValueChange={(value: 'all' | 'low' | 'medium' | 'high') => setFilters({...filters, priceRange: value})}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Todos" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Todos</SelectItem>
                                                        <SelectItem value="low">Hasta €50</SelectItem>
                                                        <SelectItem value="medium">€50 - €150</SelectItem>
                                                        <SelectItem value="high">Más de €150</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                        </div>
                                        <div>
                                                <Label className="text-sm font-medium text-foreground mb-2 block">Valoración</Label>
                                                <Select value={filters.rating} onValueChange={(value: 'all' | '4+' | '4.5+') => setFilters({...filters, rating: value})}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Todas" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Todas</SelectItem>
                                                        <SelectItem value="4+">4+ ⭐</SelectItem>
                                                        <SelectItem value="4.5+">4.5+ ⭐</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </Card>

                        {/* Desktop Filters - Horizontal */}
                        <div className="hidden lg:flex items-center gap-3 mb-6 flex-wrap">
                            <Label className="text-sm font-medium text-foreground">Filtros:</Label>
                            <Select value={filters.priceRange} onValueChange={(value: 'all' | 'low' | 'medium' | 'high') => setFilters({...filters, priceRange: value})}>
                                <SelectTrigger className="h-9 w-[140px]">
                                    <SelectValue placeholder="Precio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="low">Hasta €50</SelectItem>
                                    <SelectItem value="medium">€50 - €150</SelectItem>
                                    <SelectItem value="high">Más de €150</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.rating} onValueChange={(value: 'all' | '4+' | '4.5+') => setFilters({...filters, rating: value})}>
                                <SelectTrigger className="h-9 w-[140px]">
                                    <SelectValue placeholder="Valoración" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="4+">4+ ⭐</SelectItem>
                                    <SelectItem value="4.5+">4.5+ ⭐</SelectItem>
                                </SelectContent>
                            </Select>
                                    </div>

                        {/* Results Grid */}
                        {errorMessage && (
                            <Card className="mb-6 border-destructive/50 bg-destructive/5">
                                <CardContent className="p-4">
                                    <p className="text-sm text-destructive">{errorMessage}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Results List - Vertical */}
                        <div className="space-y-4">
                {services.map((service) => {
                    const isPro = (service.completedSearches || 0) > 5;
                                 const geometricColors = [
                                     { shapes: ['#fb923c', '#f472b6', '#facc15'] }, // orange, pink, yellow
                                     { shapes: ['#60a5fa', '#22d3ee', '#a78bfa'] }, // blue, cyan, purple
                                     { shapes: ['#facc15', '#fb923c', '#f87171'] }, // yellow, orange, red
                                     { shapes: ['#f472b6', '#a78bfa', '#60a5fa'] }, // pink, purple, blue
                                     { shapes: ['#22d3ee', '#60a5fa', '#818cf8'] }, // cyan, blue, indigo
                                     { shapes: ['#fb923c', '#f87171', '#f472b6'] }, // orange, red, pink
                                 ];
                                 const colorIndex = service.id % geometricColors.length;
                                 const colorScheme = geometricColors[colorIndex];

                    return (
                                     <Card 
                            key={service.id}
                                         className={`group cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl overflow-hidden border rounded-2xl ${
                                                    selectedService === service.id
                                                 ? 'border-primary/60 shadow-lg' 
                                                 : 'border-border/50'
                                         }`}
                                         onClick={() => setSelectedService(service.id)}
                                     >
                                         {/* Background Section - Full Card Background with soft gradient */}
                                         <div className="relative overflow-hidden rounded-2xl" style={{ 
                                             minHeight: '300px',
                                             background: `linear-gradient(135deg, ${colorScheme.shapes[0]}20 0%, ${colorScheme.shapes[1]}25 50%, ${colorScheme.shapes[2]}20 100%)`
                                         }}>
                                             {/* Geometric Shapes - Blurred Background */}
                                             <div className="absolute inset-0">
                                                 <div 
                                                     className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-60"
                                                     style={{ backgroundColor: colorScheme.shapes[0] }}
                                                 ></div>
                                                 <div 
                                                     className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-3xl opacity-60"
                                                     style={{ backgroundColor: colorScheme.shapes[1] }}
                                                 ></div>
                                                 <div 
                                                     className="absolute top-1/2 right-1/4 w-28 h-28 rounded-full blur-2xl opacity-60"
                                                     style={{ backgroundColor: colorScheme.shapes[2] }}
                                                 ></div>
                                                 {/* Additional smaller shapes for depth */}
                                                 <div 
                                                     className="absolute top-1/3 left-1/4 w-20 h-20 rounded-full blur-xl opacity-40"
                                                     style={{ backgroundColor: colorScheme.shapes[0] }}
                                                 ></div>
                                                 {/* Star patterns - scattered white dots */}
                                                 <div className="absolute top-4 left-4 w-1 h-1 bg-white rounded-full opacity-80"></div>
                                                 <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                                                 <div className="absolute bottom-16 left-10 w-1 h-1 bg-white rounded-full opacity-80"></div>
                                                 <div className="absolute top-16 left-1/3 w-1 h-1 bg-white rounded-full opacity-80"></div>
                                                 <div className="absolute bottom-8 right-16 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                                                 <div className="absolute top-12 right-1/4 w-1 h-1 bg-white rounded-full opacity-80"></div>
                                    </div>

                                             {/* Avatar Section - Centered, overlapping with panel */}
                                             <div className="relative z-10 flex items-center justify-center pt-8 pb-2">
                                    <div className="relative">
                                                     <Avatar className="h-20 w-20 border-3 border-white/40 shadow-2xl ring-2 ring-white/30">
                                                         <AvatarImage src={service.expert?.profilePictureUrl} />
                                                         <AvatarFallback className="bg-slate-200 text-slate-700 border-white/40">
                                                             <User className="h-10 w-10" />
                                                         </AvatarFallback>
                                                     </Avatar>
                                                     {isPro && (
                                                         <div className="absolute -top-1 -right-1 bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full border border-primary/40 shadow-xl">
                                                             Pro
                                        </div>
                                    )}
                                    </div>
                                </div>

                                             {/* Glassmorphism Panel - Overlapping avatar, more integrated */}
                                             <div className="relative z-20 -mt-10">
                                                 <div className="bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/60 mx-4 mb-4 pt-12 pb-4 px-4 shadow-2xl" style={{ 
                                                     background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)',
                                                     boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)'
                                                 }}>
                                                     {/* Name - Large, bold, dark, centered */}
                                                     <h3 className="text-xl font-bold text-slate-900 mb-1 text-center tracking-tight">
                                                         {service.expert?.user?.name || 'Experto'}
                                                </h3>
                                                     
                                                     {/* Email/Price - Smaller, lighter, centered */}
                                                     <div className="text-center mb-2">
                                                         <p className="text-xs text-slate-700 font-medium">
                                                             {service.expert?.user?.email || `${service.price ? `€${service.price}` : '€72'} por servicio`}
                                                         </p>
                                                         {service.price && (
                                                             <p className="text-[10px] text-slate-500 mt-0.5">
                                                                 IVA incluido
                                                             </p>
                                                         )}
                                                     </div>

                                                     {/* Rating - Centered */}
                                                     <div className="flex items-center justify-center gap-1.5 mb-2">
                                                         {renderStars(service.averageRating || 0)}
                                                         <span className="text-xs text-slate-600 font-medium">({service.expert?.reviews?.length || 0})</span>
                                    </div>

                                                     {/* Deliverables - Centered */}
                                                     <div className="flex items-center justify-center gap-2 mb-3">
                                                         {renderDeliverableTypes(service, true)}
                                    </div>

                                                     {/* Action Buttons - Glassmorphism style */}
                                                     <div className="flex items-center gap-2 pt-2.5 border-t border-slate-200">
                                                         <Button
                                                             variant={selectedService === service.id ? "default" : "secondary"}
                                                             size="sm"
                                                             className="flex-1 bg-slate-900 hover:bg-slate-800 text-white border-slate-700 font-medium shadow-lg transition-all text-xs h-8"
                                                             onClick={(e) => {
                                                                 e.stopPropagation();
                                                                 setSelectedService(service.id);
                                                             }}
                                                         >
                                                             {selectedService === service.id ? (
                                                                 <>
                                                                     <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                                     Seleccionado
                                                                 </>
                                                             ) : (
                                                                 'Seleccionar'
                                                             )}
                                                         </Button>
                                                         <Button
                                                             variant="ghost"
                                                             size="icon"
                                                             className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 rounded-lg shadow-sm h-8 w-8"
                                                             onClick={(e) => {
                                                                 e.stopPropagation();
                                                                 setDetailServiceId(service.id);
                                                             }}
                                                         >
                                                             <Eye className="w-3.5 h-3.5" />
                                                         </Button>
                                </div>
                                    </div>
                            </div>
                                </div>
                                     </Card>
                    );
                })}
            </div>

                        {/* Continue Button */}
                        <div className="mt-6 pb-6">
                            <Button 
                                onClick={handleContinue}
                                disabled={!selectedService} 
                                size="lg"
                                className="w-full h-11 text-base font-medium shadow-lg"
                            >
                                Continuar
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile: Map View */}
                <div className="lg:hidden flex-1 relative">
                    <div className="h-full w-full">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={mapCenter}
                                zoom={getZoomLevel(locationRange)}
                                options={{
                                    disableDefaultUI: false,
                                    zoomControl: true,
                                    mapTypeControl: false,
                                    scaleControl: true,
                                    streetViewControl: false,
                                    rotateControl: false,
                                    fullscreenControl: true,
                                }}
                                onClick={(e) => {
                                    if (e.latLng) {
                                        setIsDrawerOpen(true);
                                    }
                                }}
                            >
                                {/* Circle for search range */}
                                <Circle
                                    center={mapCenter}
                                    radius={locationRange * 1000}
                                    options={{
                                        fillColor: '#3B82F6',
                                        fillOpacity: 0.1,
                                        strokeColor: '#3B82F6',
                                        strokeOpacity: 0.4,
                                        strokeWeight: 2
                                    }}
                                />
                                {/* Markers for each service */}
                                {services.map((service, index) => {
                                    const offset = index * 0.001;
                                    return (
                                        <Marker
                                            key={service.id}
                                            position={{
                                                lat: mapCenter.lat + offset,
                                                lng: mapCenter.lng + offset
                                            }}
                                            onClick={() => {
                                                setSelectedService(service.id);
                                                setIsDrawerOpen(true);
                                            }}
                                            icon={{
                                                url: selectedService === service.id 
                                                    ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                                            <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#1E40AF" stroke-width="3"/>
                                                            <circle cx="20" cy="20" r="8" fill="#FFFFFF"/>
                                                            <circle cx="20" cy="20" r="4" fill="#3B82F6"/>
                                                        </svg>
                                                    `)
                                                    : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                                            <circle cx="16" cy="16" r="14" fill="#6B7280" stroke="#4B5563" stroke-width="2"/>
                                                            <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
                                                            <circle cx="16" cy="16" r="3" fill="#6B7280"/>
                                                        </svg>
                                                    `),
                                                scaledSize: new window.google.maps.Size(
                                                    selectedService === service.id ? 40 : 32,
                                                    selectedService === service.id ? 40 : 32
                                                ),
                                                anchor: new window.google.maps.Point(
                                                    selectedService === service.id ? 20 : 16,
                                                    selectedService === service.id ? 20 : 16
                                                )
                                            }}
                                        />
                                    );
                                })}
                            </GoogleMap>
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-muted">
                                Cargando mapa...
                            </div>
                        )}
                    </div>
                    {/* Floating Button to Open Drawer */}
                    {services.length > 0 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                            <Button
                                onClick={() => {
                                    setIsDrawerOpen(true);
                                    setSnap(0.7); // Abrir a 70%
                                }}
                                size="lg"
                                className="shadow-lg"
                            >
                                <MapPin className="w-4 h-4 mr-2" />
                                Ver {services.length} {services.length === 1 ? 'profesional' : 'profesionales'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Desktop: Right Side - Map */}
                <div className="hidden lg:block w-1/2 border-l bg-muted/30">
                    <div className="h-full sticky top-[73px]">
                                {isLoaded ? (
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={mapCenter}
                                zoom={getZoomLevel(locationRange)}
                                        options={{
                                    disableDefaultUI: false,
                                    zoomControl: true,
                                    mapTypeControl: false,
                                    scaleControl: true,
                                    streetViewControl: false,
                                    rotateControl: false,
                                    fullscreenControl: true,
                                }}
                            >
                                {/* Circle for search range */}
                                        <Circle
                                            center={mapCenter}
                                            radius={locationRange * 1000}
                                            options={{
                                                fillColor: '#3B82F6',
                                        fillOpacity: 0.1,
                                        strokeColor: '#3B82F6',
                                        strokeOpacity: 0.4,
                                        strokeWeight: 2
                                    }}
                                />
                                {/* Markers for each service */}
                                {services.map((service, index) => {
                                    const offset = index * 0.001;
                                    return (
                                        <Marker
                                            key={service.id}
                                            position={{
                                                lat: mapCenter.lat + offset,
                                                lng: mapCenter.lng + offset
                                            }}
                                            onClick={() => setSelectedService(service.id)}
                                            icon={{
                                                url: selectedService === service.id 
                                                    ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                                            <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#1E40AF" stroke-width="3"/>
                                                            <circle cx="20" cy="20" r="8" fill="#FFFFFF"/>
                                                            <circle cx="20" cy="20" r="4" fill="#3B82F6"/>
                                                        </svg>
                                                    `)
                                                    : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                                            <circle cx="16" cy="16" r="14" fill="#6B7280" stroke="#4B5563" stroke-width="2"/>
                                                            <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
                                                            <circle cx="16" cy="16" r="3" fill="#6B7280"/>
                                                        </svg>
                                                    `),
                                                scaledSize: new window.google.maps.Size(
                                                    selectedService === service.id ? 40 : 32,
                                                    selectedService === service.id ? 40 : 32
                                                ),
                                                anchor: new window.google.maps.Point(
                                                    selectedService === service.id ? 20 : 16,
                                                    selectedService === service.id ? 20 : 16
                                                )
                                            }}
                                        />
                                    );
                                })}
                                    </GoogleMap>
                                ) : (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-muted">
                                Cargando mapa...
                                    </div>
                                )}
                                    </div>
                                </div>
                                    </div>

            {/* Mobile Drawer with Services */}
            <Drawer 
                open={isDrawerOpen} 
                onOpenChange={setIsDrawerOpen}
                snapPoints={[0.7, 1]} // 70% y 100%
                activeSnapPoint={snap}
                setActiveSnapPoint={setSnap}
                modal={false}
            >
                <DrawerContent className="max-h-[100vh] h-[100vh]">
                    <DrawerHeader className="border-b flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <DrawerTitle>Profesionales Disponibles</DrawerTitle>
                                <DrawerDescription>
                                    {services.length} {services.length === 1 ? 'resultado' : 'resultados'} en {categoryName}
                                </DrawerDescription>
                            </div>
                            <DrawerClose asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </DrawerClose>
                        </div>
                    </DrawerHeader>
                    <div 
                        ref={drawerContentRef}
                        className="overflow-y-auto flex-1 px-4 py-4" 
                        onScroll={(e) => {
                            const target = e.currentTarget;
                            const isMobile = window.innerWidth < 1024;
                            
                            if (!isMobile) return;
                            
                            // Si hace scroll hacia abajo (más de 50px) y no está al 100%, expandir
                            if (target.scrollTop > 50 && snap !== 1) {
                                setSnap(1);
                            }
                            // Si vuelve arriba (menos de 20px) y está al 100%, volver a 70%
                            else if (target.scrollTop < 20 && snap === 1) {
                                setSnap(0.7);
                            }
                        }}
                        style={{ 
                            overscrollBehavior: 'contain',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        {/* Mobile Filters */}
                        <Card className="mb-4">
                            <Accordion type="single" collapsible>
                                <AccordionItem value="filters" className="border-0">
                                    <AccordionTrigger className="px-4 py-3 font-semibold">Filtros</AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-sm font-medium text-foreground mb-2 block">Precio</Label>
                                                <Select value={filters.priceRange} onValueChange={(value: 'all' | 'low' | 'medium' | 'high') => setFilters({...filters, priceRange: value})}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Todos" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Todos</SelectItem>
                                                        <SelectItem value="low">Hasta €50</SelectItem>
                                                        <SelectItem value="medium">€50 - €150</SelectItem>
                                                        <SelectItem value="high">Más de €150</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-foreground mb-2 block">Valoración</Label>
                                                <Select value={filters.rating} onValueChange={(value: 'all' | '4+' | '4.5+') => setFilters({...filters, rating: value})}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Todas" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Todas</SelectItem>
                                                        <SelectItem value="4+">4+ ⭐</SelectItem>
                                                        <SelectItem value="4.5+">4.5+ ⭐</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </Card>

                        {/* Error Message */}
                        {errorMessage && (
                            <Card className="mb-4 border-destructive/50 bg-destructive/5">
                                <CardContent className="p-4">
                                    <p className="text-sm text-destructive">{errorMessage}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Services List */}
                        <div className="space-y-4">
                            {services.map((service) => {
                                const isPro = (service.completedSearches || 0) > 5;
                                const geometricColors = [
                                    { shapes: ['#fb923c', '#f472b6', '#facc15'] },
                                    { shapes: ['#60a5fa', '#22d3ee', '#a78bfa'] },
                                    { shapes: ['#facc15', '#fb923c', '#f87171'] },
                                    { shapes: ['#f472b6', '#a78bfa', '#60a5fa'] },
                                    { shapes: ['#22d3ee', '#60a5fa', '#818cf8'] },
                                    { shapes: ['#fb923c', '#f87171', '#f472b6'] },
                                ];
                                const colorIndex = service.id % geometricColors.length;
                                const colorScheme = geometricColors[colorIndex];

                                return (
                                    <Card 
                                        key={service.id}
                                        className={`group cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl overflow-hidden border rounded-2xl ${
                                            selectedService === service.id
                                            ? 'border-primary/60 shadow-lg' 
                                            : 'border-border/50'
                                        }`}
                                        onClick={() => setSelectedService(service.id)}
                                    >
                                        <div className="relative overflow-hidden rounded-2xl" style={{ 
                                            minHeight: '250px',
                                            background: `linear-gradient(135deg, ${colorScheme.shapes[0]}20 0%, ${colorScheme.shapes[1]}25 50%, ${colorScheme.shapes[2]}20 100%)`
                                        }}>
                                            <div className="absolute inset-0">
                                                <div 
                                                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-60"
                                                    style={{ backgroundColor: colorScheme.shapes[0] }}
                                                ></div>
                                                <div 
                                                    className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-3xl opacity-60"
                                                    style={{ backgroundColor: colorScheme.shapes[1] }}
                                                ></div>
                                            </div>

                                            <div className="relative z-10 flex items-center justify-center pt-6 pb-2">
                                                <div className="relative">
                                                    <Avatar className="h-16 w-16 border-3 border-white/40 shadow-2xl ring-2 ring-white/30">
                                                        <AvatarImage src={service.expert?.profilePictureUrl} />
                                                        <AvatarFallback className="bg-slate-200 text-slate-700 border-white/40">
                                                            <User className="h-8 w-8" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {isPro && (
                                                        <div className="absolute -top-1 -right-1 bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full border border-primary/40 shadow-xl">
                                                            Pro
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="relative z-20 -mt-8">
                                                <div className="bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/60 mx-4 mb-4 pt-10 pb-4 px-4 shadow-2xl">
                                                    <h3 className="text-lg font-bold text-slate-900 mb-1 text-center tracking-tight">
                                                        {service.expert?.user?.name || 'Experto'}
                                                    </h3>
                                                    
                                                    <p className="text-xs text-slate-700 text-center mb-2 font-medium">
                                                        {service.expert?.user?.email || `${service.price ? `€${service.price}` : '€72'} por servicio`}
                                                    </p>

                                                    {/* ✅ BANDERA DEL PAÍS DEL EXPERTO */}
                                                    {service.expert?.country && (
                                                        <div className="flex items-center justify-center mb-2">
                                                            <CountryFlag countryCode={service.expert.country} size="sm" />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-center gap-1.5 mb-2">
                                                        {renderStars(service.averageRating || 0)}
                                                        <span className="text-xs text-slate-600 font-medium">({service.expert?.reviews?.length || 0})</span>
                                                    </div>

                                                    <div className="flex items-center justify-center gap-2 mb-3">
                                                        {renderDeliverableTypes(service, true)}
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-2.5 border-t border-slate-200">
                                                        <Button
                                                            variant={selectedService === service.id ? "default" : "secondary"}
                                                            size="sm"
                                                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white border-slate-700 font-medium shadow-lg transition-all text-xs h-8"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedService(service.id);
                                                            }}
                                                        >
                                                            {selectedService === service.id ? (
                                                                <>
                                                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                                    Seleccionado
                                                                </>
                                                            ) : (
                                                                'Seleccionar'
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 rounded-lg shadow-sm h-8 w-8"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDetailServiceId(service.id);
                                                            }}
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Continue Button */}
                        <div className="mt-6 pb-4">
                            <Button 
                                onClick={() => {
                                    handleContinue();
                                    setIsDrawerOpen(false);
                                }}
                                disabled={!selectedService} 
                                size="lg"
                                className="w-full h-11 text-base font-medium shadow-lg"
                            >
                                Continuar
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
                                
            {/* Modal */}
            {detailService && (
                <Dialog open={!!detailServiceId} onOpenChange={() => setDetailServiceId(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <DialogTitle>{detailService.expert?.user?.name || 'Detalles del Servicio'}</DialogTitle>
                                {/* ✅ BANDERA DEL PAÍS DEL EXPERTO EN EL MODAL */}
                                {detailService.expert?.country && (
                                    <CountryFlag countryCode={detailService.expert.country} size="sm" />
                                )}
                            </div>
                            <DialogDescription className="sr-only">Información detallada del servicio seleccionado</DialogDescription>
                        </DialogHeader>
                        <DialogClose asChild>
                            <Button variant="ghost" className="absolute right-4 top-4"><X className="h-4 w-4" /></Button>
                        </DialogClose>
                        <Tabs defaultValue="details" className="relative mr-auto w-full">
                            <TabsList className="w-full">
                                <TabsTrigger value="details">Detalles</TabsTrigger>
                                <TabsTrigger value="reviews">Reseñas</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="space-y-4">
                                <p className="text-sm text-muted-foreground">{detailService.conditions}</p>
                                        {detailService.imageUrls && detailService.imageUrls.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {detailService.imageUrls.map((url, i) => (
                                            <img key={i} src={url} alt="" className="rounded-md w-full h-24 object-cover" />
                                        ))}
                                            </div>
                                        )}
                                <div className="flex gap-2">
                                            {renderDeliverableTypes(detailService)}
                                        </div>
                            </TabsContent>
                            <TabsContent value="reviews">
                                <EnhancedReviewsList reviews={detailService.expert?.reviews || []} maxReviews={3} />
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}