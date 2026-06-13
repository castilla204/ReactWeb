import React, { useState } from 'react';
import { Plus, Search, Loader2, Trash2, Edit3, MoreHorizontal, Image as ImageIcon, Package, CircleDollarSign } from 'lucide-react';
import { useCategories } from '../../contexts/CategoryContext';
// 🛡️ Round 28: formato de moneda real (no más EUR hardcoded en el panel de experto).
import { formatCurrency } from '../../utils/priceUtils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../ui/empty';

interface Service {
    id: number;
    categoryId: number;
    serviceTypeId: number;
    imageUrls: string[];
    conditions: string;
    price: number;
    /** 🛡️ Round 28: divisa ISO 4217 emitida por el backend (EUR/GBP/CHF/…). Default EUR si falta. */
    priceCurrency?: string;
    /** Alias PascalCase del backend. */
    currency?: string;
    durationInHours: number | null;
    categoryName?: string;
    serviceTypeName?: string;
}

interface ServicesTabProps {
    activeTab: 'services' | 'hires';
    services: Service[];
    isLoadingServices: boolean;
    servicesError: Error | null;
    showServiceForm: boolean;
    setShowServiceForm: (value: boolean) => void;
    currentImageIndex: { [key: number]: number };
    goToPreviousImage: (serviceId: number) => void;
    goToNextImage: (serviceId: number) => void;
    categories: { id: number; name: string }[] | undefined;
    deleteService?: (serviceId: number) => Promise<any>;
    isDeletingService?: boolean;
    onEditService?: (service: Service) => void;
    // 🛡️ MUD-DF — datos del contexto para badge real de visibilidad.
    stripeStatus?: string | null;
    onboardingCompleted?: boolean | null;
    isOnVacation?: boolean | null;
    hasLocation?: boolean;
}

export function ServicesTab({
    activeTab,
    services,
    isLoadingServices,
    servicesError,
    showServiceForm,
    setShowServiceForm,
    currentImageIndex,
    goToPreviousImage,
    goToNextImage,
    categories,
    stripeStatus,
    onboardingCompleted,
    isOnVacation,
    hasLocation,
    deleteService,
    isDeletingService,
    onEditService,
}: ServicesTabProps) {
    const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
    
    if (!activeTab || activeTab !== 'services') return null;

    const handleDeleteService = async (serviceId: number) => {
        if (!deleteService) return;
        
        try {
            setDeletingServiceId(serviceId);
            await deleteService(serviceId);
            setShowDeleteConfirm(null);
            
            // Mostrar notificación de éxito
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: 'Servicio eliminado correctamente'
                }
            }));
        } catch (error: any) {
            console.error('Error deleting service:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: error.message || 'Error al eliminar el servicio'
                }
            }));
        } finally {
            setDeletingServiceId(null);
        }
    };

    return (
        <div className="p-3 sm:p-6 expert-animate-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Mis Servicios</h2>
                    <p className="text-sm text-slate-500 mt-1">Gestiona tus servicios activos y mantén tu perfil actualizado</p>
                </div>
            </div>

            {isLoadingServices ? (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Cargando servicios...</p>
                    </div>
                </div>
            ) : servicesError ? (
                <div className="text-center py-12 bg-red-50 text-red-700 rounded-xl border border-red-100">
                    <p className="font-medium">Error al cargar servicios</p>
                    <p className="text-sm mt-1 text-red-600">{servicesError.message}</p>
                </div>
            ) : services.length === 0 ? (
                <div className="py-12">
                    <div className="max-w-md mx-auto text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100">
                            <Package className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No tienes servicios activos</h3>
                        <p className="text-sm text-slate-500 mb-6">Crea tu primer servicio para empezar a recibir solicitudes de clientes</p>
                        <Button
                            onClick={() => setShowServiceForm(true)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Crear primer servicio
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Header con botón de crear servicio */}
                    <div className="flex items-center justify-between px-4 sm:px-6 pt-4">
                        <h3 className="text-lg font-semibold text-foreground">Servicios</h3>
                        <Button 
                            onClick={() => setShowServiceForm(true)}
                            variant="default"
                            size="sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Crear servicio
                        </Button>
                    </div>
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] sm:w-[50px] hidden sm:table-cell">Imagen</TableHead>
                                <TableHead className="min-w-[150px]">Servicio</TableHead>
                                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="hidden lg:table-cell">Duración</TableHead>
                                <TableHead className="w-[80px] sm:w-[100px]">Estado</TableHead>
                                <TableHead className="w-[40px] sm:w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((service) => {
                                // ✅ CRÍTICO: Normalizar búsqueda de categoría (manejar PascalCase y camelCase)
                                const category = categories?.find(c => {
                                    const catId = c.id ?? (c as any).Id;
                                    return catId === service.categoryId;
                                });
                                const categoryName = category?.name ?? (category as any)?.Name ?? service.categoryName ?? 'Sin categoría';
                                const serviceTypeName = service.serviceTypeName ?? (service as any).ServiceTypeName ?? 'Sin categoría';
                                const hasImages = service.imageUrls && Array.isArray(service.imageUrls) && service.imageUrls.length > 0;
                                
                                return (
                                    <TableRow key={service.id} className="hover:bg-muted/50">
                                        <TableCell className="hidden sm:table-cell">
                                            {hasImages ? (
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden border border-border">
                                                    <img
                                                        src={service.imageUrls[currentImageIndex[service.id] || 0]}
                                                        alt={categoryName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md border border-border bg-muted flex items-center justify-center">
                                                    <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 sm:gap-0 sm:block">
                                                {hasImages && (
                                                    <div className="w-8 h-8 sm:hidden rounded-md overflow-hidden border border-border flex-shrink-0">
                                                        <img
                                                            src={service.imageUrls[currentImageIndex[service.id] || 0]}
                                                            alt={categoryName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm sm:text-base">{categoryName}</div>
                                                    <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:max-w-md">
                                                        {service.conditions}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant="outline" className="text-xs">{serviceTypeName}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(() => {
                                                // 🛡️ Round 28: usar la moneda REAL del servicio. Antes se
                                                // forzaba EUR + icono €, dando "€350" a expertos UK que en
                                                // realidad cobran en GBP. Intl.NumberFormat añade el símbolo
                                                // correcto (£, CHF, kr, etc.) y un icono genérico de divisa.
                                                const code = (service.priceCurrency ?? service.currency ?? 'EUR')
                                                    .toString()
                                                    .trim()
                                                    .toUpperCase();
                                                return (
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                                                            <CircleDollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                                                            <span className="font-semibold text-sm sm:text-base">
                                                                {formatCurrency(service.price, code)}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            IVA incluido
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {service.durationInHours ? (
                                                <Badge variant="secondary" className="text-xs">{service.durationInHours}h</Badge>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                // 🛡️ MUD-DF — Badge REAL de visibilidad (sustituye al "Activo" hardcoded).
                                                // El backend filtra servicios del mapa público por
                                                // (StripeStatus Approved+OnboardingCompleted o PendingVerification)
                                                // + IsOnVacation=false + lat/lng válidos + service.IsActive.
                                                // El badge muestra el motivo dominante de ocultación.
                                                const isInvisibleByStripe = (() => {
                                                    const s = stripeStatus || '';
                                                    if (s === 'Approved' && onboardingCompleted) return false;
                                                    if (s === 'PendingVerification') return false;
                                                    return true;
                                                })();
                                                const inactive = service.isActive === false;
                                                const onVacation = isOnVacation === true;
                                                const noLocation = hasLocation === false;

                                                if (inactive) {
                                                    return (
                                                        <Badge title="Lo pausaste tú" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                                            Pausado
                                                        </Badge>
                                                    );
                                                }
                                                if (onVacation) {
                                                    return (
                                                        <Badge title="Modo vacaciones activo — desactívalo para volver a aparecer" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                            Oculto · vacaciones
                                                        </Badge>
                                                    );
                                                }
                                                if (isInvisibleByStripe) {
                                                    return (
                                                        <Badge title="Tu cuenta de pagos requiere atención — los clientes no te ven" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                                                            Oculto · Stripe
                                                        </Badge>
                                                    );
                                                }
                                                if (noLocation) {
                                                    return (
                                                        <Badge title="Sin ubicación válida — edita tu perfil para añadirla" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                                            Oculto · sin ubicación
                                                        </Badge>
                                                    );
                                                }
                                                return (
                                                    <Badge title="Tus clientes te ven en búsquedas" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20 text-xs">
                                                        Visible
                                                    </Badge>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                                                        <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onEditService?.(service)}>
                                                        <Edit3 className="w-4 h-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => setShowDeleteConfirm(service.id)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    </div>
                </div>
            )}

            {/* Modal de confirmación de eliminación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg p-6 max-w-md w-full border shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">¿Eliminar servicio?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Esta acción desactivará el servicio y no podrá recibir más contrataciones. ¿Estás seguro?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(null)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleDeleteService(showDeleteConfirm)}
                                disabled={deletingServiceId === showDeleteConfirm}
                            >
                                {deletingServiceId === showDeleteConfirm ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Eliminando...
                                    </>
                                ) : (
                                    'Eliminar'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}