import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Pencil, Trash2, Plus, Search } from 'lucide-react';
import { formatCurrency } from '../../utils/priceUtils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

interface Service {
    id: number;
    categoryId: number;
    serviceTypeId: number;
    imageUrls: string[];
    conditions: string;
    price: number;
    priceCurrency?: string;
    currency?: string;
    durationInHours: number | null;
    categoryName?: string;
    serviceTypeName?: string;
    isActive?: boolean;
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
    deleteService?: (serviceId: number) => Promise<unknown>;
    isDeletingService?: boolean;
    onEditService?: (service: Service) => void;
    stripeStatus?: string | null;
    onboardingCompleted?: boolean | null;
    isOnVacation?: boolean | null;
    hasLocation?: boolean;
    profileIncomplete?: boolean;
    onGoToSetup?: () => void;
    serviceEditor?: React.ReactNode;
}

type VisibilityTone = 'visible' | 'paused' | 'hidden' | 'location';

interface VisibilityMeta {
    label: string;
    tone: VisibilityTone;
    hint?: string;
}

function getVisibilityMeta(
    service: Service,
    ctx: {
        stripeStatus?: string | null;
        onboardingCompleted?: boolean | null;
        isOnVacation?: boolean | null;
        hasLocation?: boolean;
    },
): VisibilityMeta {
    if (service.isActive === false) {
        return { label: 'Pausado', tone: 'paused', hint: 'No recibe nuevas contrataciones' };
    }
    if (ctx.isOnVacation === true) {
        return { label: 'Oculto', tone: 'hidden', hint: 'Modo vacaciones activo' };
    }
    const stripe = ctx.stripeStatus || '';
    const stripeOk =
        (stripe === 'Approved' && ctx.onboardingCompleted) || stripe === 'PendingVerification';
    if (!stripeOk) {
        return { label: 'Oculto', tone: 'hidden', hint: 'Revisa el estado de pagos' };
    }
    if (ctx.hasLocation === false) {
        return { label: 'Sin ubicación', tone: 'location', hint: 'Define tu zona en Mi perfil' };
    }
    return { label: 'Visible', tone: 'visible' };
}

function stripHtmlToText(raw: string): string {
    return raw
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function ServiceRowSkeleton() {
    return (
        <li className="expert-service-row expert-service-row--skeleton" aria-hidden>
            <div className="expert-service-media">
                <Skeleton className="expert-service-thumb !rounded-none" />
            </div>
            <div className="expert-service-body">
                <Skeleton className="h-4 w-44 rounded" />
                <Skeleton className="h-3 w-full max-w-md rounded mt-2" />
            </div>
            <Skeleton className="h-8 w-20 rounded hidden sm:block" />
        </li>
    );
}

export function ServicesTab({
    activeTab,
    services,
    isLoadingServices,
    servicesError,
    setShowServiceForm,
    categories,
    stripeStatus,
    onboardingCompleted,
    isOnVacation,
    hasLocation,
    profileIncomplete,
    onGoToSetup,
    serviceEditor,
    deleteService,
    onEditService,
}: ServicesTabProps) {
    const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const visCtx = useMemo(
        () => ({ stripeStatus, onboardingCompleted, isOnVacation, hasLocation }),
        [stripeStatus, onboardingCompleted, isOnVacation, hasLocation],
    );

    const filteredAndSortedServices = useMemo(() => {
        let filtered = services;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = services.filter((s) => {
                const cat = categories?.find((c) => c.id === s.categoryId);
                const catName = (cat?.name || s.categoryName || '').toLowerCase();
                const typeName = (s.serviceTypeName || '').toLowerCase();
                const conditions = (s.conditions || '').toLowerCase();
                return catName.includes(q) || typeName.includes(q) || conditions.includes(q);
            });
        }
        return [...filtered].sort((a, b) => {
            const catA = categories?.find((c) => c.id === a.categoryId)?.name || a.categoryName || '';
            const catB = categories?.find((c) => c.id === b.categoryId)?.name || b.categoryName || '';
            return catA.localeCompare(catB, 'es');
        });
    }, [services, searchQuery, categories]);

    const showMobileActionBar =
        activeTab === 'services' && !serviceEditor && !isLoadingServices && !servicesError;

    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent('expert-services-mobile-bar', { detail: { active: showMobileActionBar } }),
        );
        return () => {
            window.dispatchEvent(
                new CustomEvent('expert-services-mobile-bar', { detail: { active: false } }),
            );
        };
    }, [showMobileActionBar]);

    if (!activeTab || activeTab !== 'services') return null;

    if (serviceEditor) {
        return <>{serviceEditor}</>;
    }

    const handleDeleteService = async (serviceId: number) => {
        if (!deleteService) return;
        try {
            setDeletingServiceId(serviceId);
            await deleteService(serviceId);
            setDeleteTargetId(null);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { type: 'success', message: 'Servicio eliminado correctamente' },
            }));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al eliminar el servicio';
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { type: 'error', message },
            }));
        } finally {
            setDeletingServiceId(null);
        }
    };

    const deleteTarget = deleteTargetId != null
        ? services.find((s) => s.id === deleteTargetId)
        : null;

    return (
        <div className={`expert-services${showMobileActionBar ? ' expert-services--mobile-action' : ''}`}>
            {profileIncomplete && onGoToSetup && (
                <p className="expert-services-hint" role="status">
                    Completa tu perfil para que tus servicios sean visibles.{' '}
                    <button type="button" onClick={onGoToSetup} className="expert-services-hint-link">
                        Ir a configuración
                    </button>
                </p>
            )}

            {!isLoadingServices && !servicesError && services.length > 0 && (
                <header className="expert-services-bar">
                    <label className="expert-services-search-wrap">
                        <Search aria-hidden className="expert-services-search-icon" />
                        <Input
                            type="search"
                            placeholder="Buscar…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="expert-services-search"
                        />
                    </label>
                    <span className="expert-services-bar-spacer" aria-hidden="true" />
                    <Button
                        onClick={() => setShowServiceForm(true)}
                        size="sm"
                        variant="outline"
                        className="expert-services-add"
                        disabled={profileIncomplete}
                    >
                        <Plus aria-hidden className="expert-services-add-icon" />
                        Nuevo servicio
                    </Button>
                </header>
            )}

            {isLoadingServices ? (
                <ul className="expert-services-list" aria-busy="true" aria-label="Cargando servicios">
                    {[0, 1, 2].map((i) => (
                        <ServiceRowSkeleton key={i} />
                    ))}
                </ul>
            ) : servicesError ? (
                <div className="expert-services-state expert-services-state--error" role="alert">
                    <p className="expert-services-state-title">No se pudieron cargar los servicios</p>
                    <p className="expert-services-state-text">{servicesError.message}</p>
                </div>
            ) : services.length === 0 ? (
                <div className="expert-services-state" role="status">
                    <p className="expert-services-state-title">Aún no tienes servicios</p>
                    <p className="expert-services-state-text">
                        Publica tu primer servicio con categoría, precio y condiciones para aparecer en búsquedas.
                    </p>
                    <Button
                        className="expert-btn-brand mt-5 expert-services-state-cta"
                        onClick={() => setShowServiceForm(true)}
                        disabled={profileIncomplete}
                    >
                        Crear primer servicio
                    </Button>
                </div>
            ) : (
                <>
                    <div className="expert-services-list-head" aria-hidden="true">
                        <span className="expert-services-list-head-media" />
                        <span className="expert-services-list-head-label">Servicio</span>
                        <span className="expert-services-list-head-label expert-services-list-head-label--end">Precio</span>
                    </div>
                    <ul className="expert-services-list" aria-label="Lista de servicios">
                    {filteredAndSortedServices.length === 0 ? (
                        <li className="expert-services-empty-filter">
                            <p>No hay resultados para &ldquo;{searchQuery}&rdquo;</p>
                            <button type="button" className="expert-services-hint-link" onClick={() => setSearchQuery('')}>
                                Limpiar búsqueda
                            </button>
                        </li>
                    ) : (
                        filteredAndSortedServices.map((service) => {
                            const category = categories?.find((c) => {
                                const catId = c.id ?? (c as { Id?: number }).Id;
                                return catId === service.categoryId;
                            });
                            const categoryName =
                                category?.name ?? (category as { Name?: string })?.Name ?? service.categoryName ?? 'Sin categoría';
                            const serviceTypeName =
                                service.serviceTypeName ?? (service as { ServiceTypeName?: string }).ServiceTypeName ?? '';
                            const imageUrl =
                                service.imageUrls?.length > 0 ? service.imageUrls[0] : null;
                            const vis = getVisibilityMeta(service, visCtx);
                            const currencyCode = (service.priceCurrency ?? service.currency ?? 'EUR')
                                .toString()
                                .trim()
                                .toUpperCase();
                            const descriptionText = stripHtmlToText(service.conditions || '');

                            return (
                                <li
                                    key={service.id}
                                    className={`expert-service-row expert-service-row--${vis.tone}`}
                                >
                                    <div className="expert-service-media">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt=""
                                                className="expert-service-thumb"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span className="expert-service-thumb expert-service-thumb--empty" aria-hidden>
                                                {categoryName.slice(0, 1).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="expert-service-body">
                                        <h3 className="expert-service-title">{categoryName}</h3>
                                        <div className="expert-service-meta">
                                            {serviceTypeName ? (
                                                <span className="expert-service-type">{serviceTypeName}</span>
                                            ) : null}
                                            <span className={`expert-service-status expert-service-status--${vis.tone}`}>
                                                <span className="expert-service-status-dot" aria-hidden />
                                                {vis.label}
                                            </span>
                                        </div>
                                        {descriptionText && (
                                            <p className="expert-service-desc">{descriptionText}</p>
                                        )}
                                        {vis.hint && vis.tone !== 'visible' && (
                                            <p className="expert-service-hint">{vis.hint}</p>
                                        )}
                                    </div>

                                    <div className="expert-service-end">
                                        <div className="expert-service-price-block">
                                            <span className="expert-service-price">
                                                {formatCurrency(service.price, currencyCode)}
                                            </span>
                                            <span className="expert-service-price-sub">
                                                IVA incl.
                                                {service.durationInHours != null && service.durationInHours > 0 && (
                                                    <> · {service.durationInHours} h</>
                                                )}
                                            </span>
                                        </div>
                                        <div className="expert-service-actions">
                                            <button
                                                type="button"
                                                className="expert-service-action"
                                                onClick={() => onEditService?.(service)}
                                                aria-label={`Editar ${categoryName}`}
                                            >
                                                <Pencil aria-hidden className="expert-service-action-icon" />
                                            </button>
                                            <button
                                                type="button"
                                                className="expert-service-action expert-service-action--danger"
                                                onClick={() => setDeleteTargetId(service.id)}
                                                aria-label={`Eliminar ${categoryName}`}
                                            >
                                                <Trash2 aria-hidden className="expert-service-action-icon" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })
                    )}
                </ul>
                </>
            )}

            <Dialog open={deleteTargetId != null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>¿Eliminar servicio?</DialogTitle>
                        <DialogDescription>
                            {deleteTarget
                                ? `Se desactivará "${deleteTarget.categoryName || 'este servicio'}" y dejará de recibir contrataciones.`
                                : 'Se desactivará el servicio y dejará de recibir contrataciones.'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteTargetId != null && handleDeleteService(deleteTargetId)}
                            disabled={deletingServiceId === deleteTargetId}
                        >
                            {deletingServiceId === deleteTargetId ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Eliminando…
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showMobileActionBar && (
                <div className="expert-services-mobile-bar">
                    <Button
                        onClick={() => setShowServiceForm(true)}
                        className="expert-btn-brand expert-services-mobile-add"
                        disabled={profileIncomplete}
                    >
                        <Plus aria-hidden className="expert-services-add-icon" />
                        Nuevo servicio
                    </Button>
                </div>
            )}
        </div>
    );
}
