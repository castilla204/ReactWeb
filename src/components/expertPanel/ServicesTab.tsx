import React, { useState } from 'react';
import { Plus, Search, Loader2, Trash2, Edit3, MoreHorizontal, Image as ImageIcon, Euro, Package } from 'lucide-react';
import { useCategories } from '../../contexts/CategoryContext';
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
    durationInHours: number | null;
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
        <div className="p-3 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                    <h2 className="text-base sm:text-lg font-semibold">Mis Servicios</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">Gestiona tus servicios activos</p>
                </div>
            </div>

            {isLoadingServices ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
            ) : servicesError ? (
                <div className="text-center py-12 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                    <p>Error al cargar servicios: {servicesError.message}</p>
                </div>
            ) : services.length === 0 ? (
                <Empty className="py-12">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Package className="w-7 h-7 text-slate-500" />
                        </EmptyMedia>
                        <EmptyTitle>No tienes servicios activos</EmptyTitle>
                        <EmptyDescription>Crea tu primer servicio para empezar a recibir solicitudes de clientes</EmptyDescription>
                        <EmptyContent>
                            <Button 
                                onClick={() => setShowServiceForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Crear servicio
                            </Button>
                        </EmptyContent>
                    </EmptyHeader>
                </Empty>
            ) : (
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
                                const categoryName = categories?.find(c => c.id === service.categoryId)?.name || 'Sin categoría';
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
                                            <Badge variant="outline" className="text-xs">{categoryName}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                                                <Euro className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                                                <span className="font-semibold text-sm sm:text-base">
                                                    {new Intl.NumberFormat('es-ES', {
                                                        style: 'currency',
                                                        currency: 'EUR',
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 2,
                                                    }).format(service.price).replace('€', '').trim()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {service.durationInHours ? (
                                                <Badge variant="secondary" className="text-xs">{service.durationInHours}h</Badge>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20 text-xs">
                                                Activo
                                            </Badge>
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