import React, { useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Pencil, PauseCircle, Plus, Search, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../../utils/priceUtils';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';
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
    setShowServiceForm: (value: boolean) => void;
    currentImageIndex: { [key: number]: number };
    goToPreviousImage: (serviceId: number) => void;
    goToNextImage: (serviceId: number) => void;
    categories: { id: number; name: string }[] | undefined;
    deleteService?: (serviceId: number) => Promise<unknown>;
    isDeletingService?: boolean;
    reactivateService?: (serviceId: number) => Promise<unknown>;
    isReactivatingService?: boolean;
    onEditService?: (service: Service) => void;
    stripeStatus?: string | null;
    onboardingCompleted?: boolean | null;
    isOnVacation?: boolean | null;
    hasLocation?: boolean;
    profileIncomplete?: boolean;
    pendingRequired?: number;
    onGoToSetup?: () => void;
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

const STATUS_CLASS: Record<VisibilityTone, string> = {
    visible: 'expert-service-status--visible',
    paused: 'expert-service-status--paused',
    hidden: 'expert-service-status--hidden',
    location: 'expert-service-status--location',
};

function ServiceRowSkeleton() {
    return (
        <div className="sf-services__day sf-services__day--skeleton" aria-hidden>
            <div className="sf-services__row">
                <Skeleton className="sf-services__media !rounded-none" />
                <div className="sf-services__info">
                    <Skeleton className="h-4 w-36 rounded" />
                    <Skeleton className="mt-2 h-3 w-28 rounded" />
                </div>
                <div className="sf-services__actions">
                    <Skeleton className="h-9 w-[76px] rounded-lg" />
                </div>
            </div>
        </div>
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
    pendingRequired,
    onGoToSetup,
    deleteService,
    reactivateService,
    onEditService,
}: ServicesTabProps) {
    const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [reactivatingServiceId, setReactivatingServiceId] = useState<number | null>(null);
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

    const visibleCount = useMemo(
        () => services.filter((s) => getVisibilityMeta(s, visCtx).tone === 'visible').length,
        [services, visCtx],
    );

    if (!activeTab || activeTab !== 'services') return null;

    const handleDeleteService = async (serviceId: number) => {
        if (!deleteService) return;
        try {
            setDeletingServiceId(serviceId);
            await deleteService(serviceId);
            setDeleteTargetId(null);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { type: 'success', message: 'Servicio pausado correctamente' },
            }));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al pausar el servicio';
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { type: 'error', message },
            }));
        } finally {
            setDeletingServiceId(null);
        }
    };

    const handleReactivateService = async (service: Service) => {
        if (!reactivateService) return;
        try {
            setReactivatingServiceId(service.id);
            await reactivateService(service.id);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { type: 'success', message: `"${resolveCategoryName(service)}" reactivado correctamente` },
            }));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error al reactivar el servicio';
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { type: 'error', message },
            }));
        } finally {
            setReactivatingServiceId(null);
        }
    };

    const resolveCategoryName = (service: Service): string => {
        const category = categories?.find((c) => {
            const catId = c.id ?? (c as { Id?: number }).Id;
            return catId === service.categoryId;
        });
        return (
            category?.name
            ?? (category as { Name?: string })?.Name
            ?? service.categoryName
            ?? 'Sin categoría'
        );
    };

    const deleteTarget = deleteTargetId != null
        ? services.find((s) => s.id === deleteTargetId)
        : null;

    const catalogStats = (
        <>
            {isLoadingServices ? (
                <span>Cargando catálogo…</span>
            ) : servicesError ? (
                <span>No se pudieron cargar</span>
            ) : services.length === 0 ? (
                <span>Sin servicios publicados</span>
            ) : (
                <>
                    <span>{services.length} en catálogo</span>
                    <span className="av-calendar__stats-sep" aria-hidden>·</span>
                    <span>{visibleCount} visible{visibleCount === 1 ? '' : 's'}</span>
                </>
            )}
        </>
    );

    return (
        <div className="av-page">
            <header className="av-page-intro">
                <p className="av-page-intro__lead">
                    Cada <strong>servicio</strong> fija categoría, precio y condiciones de lo que ofreces.
                    Mantén la lista al día y publica nuevos cuando amplies tu catálogo.
                </p>
                <ol className="av-page-intro__steps" aria-label="Cómo gestionar servicios">
                    <li>Revisa precio y visibilidad de cada fila</li>
                    <li>Pulsa <strong>Nuevo servicio</strong> para añadir otro</li>
                </ol>
                {profileIncomplete && onGoToSetup && (
                    <div className="pf-profile-pending-banner" role="status">
                        <AlertTriangle className="pf-profile-pending-banner__icon" aria-hidden />
                        <div className="pf-profile-pending-banner__body">
                            <p className="pf-profile-pending-banner__title">
                                {pendingRequired
                                    ? `Falta${pendingRequired === 1 ? '' : 'n'} ${pendingRequired} requisito${pendingRequired === 1 ? '' : 's'} obligatorio${pendingRequired === 1 ? '' : 's'}`
                                    : 'Faltan requisitos obligatorios'}
                            </p>
                            <p className="pf-profile-pending-banner__text">
                                Tus servicios no aparecen en búsquedas hasta completarlos en Configuración.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="pf-profile-pending-banner__cta"
                            onClick={onGoToSetup}
                        >
                            Ir a configuración
                        </Button>
                    </div>
                )}
            </header>

            <section className="av-calendar sf-services-catalog" aria-labelledby="sf-services-heading">
                <div className="av-calendar__main">
                    <div className="av-calendar__toolbar sf-services-catalog__toolbar">
                        <div className="sf-services-catalog__toolbar-main">
                            <div className="sf-services-catalog__toolbar-head">
                                <h3 id="sf-services-heading" className="av-calendar__month">
                                    Tus servicios
                                </h3>
                                {services.length > 0 && (
                                    <Button
                                        type="button"
                                        className="pf-btn-save sf-services-catalog__add-mobile"
                                        onClick={() => setShowServiceForm(true)}
                                        disabled={profileIncomplete || isLoadingServices}
                                    >
                                        <Plus className="h-4 w-4 shrink-0" aria-hidden />
                                        Nuevo servicio
                                    </Button>
                                )}
                            </div>
                            <div className="av-calendar__stats sf-services-catalog__stats--mobile">
                                {catalogStats}
                            </div>
                            <div className="av-calendar__stats sf-services-catalog__stats--desktop">
                                {catalogStats}
                            </div>
                        </div>
                        <div className="av-calendar__toolbar-actions sf-services-catalog__add-desktop">
                            <Button
                                type="button"
                                className="pf-btn-save"
                                onClick={() => setShowServiceForm(true)}
                                disabled={profileIncomplete || isLoadingServices}
                            >
                                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                                Nuevo servicio
                            </Button>
                        </div>
                    </div>

                    {!isLoadingServices && !servicesError && services.length > 0 && (
                        <label className="sf-services-catalog__search sf-services-catalog__search--desktop">
                            <Search className="sf-services-catalog__search-icon" aria-hidden />
                            <input
                                type="search"
                                className="sf-services-catalog__search-input"
                                placeholder="Buscar por categoría o tipo…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </label>
                    )}

                    {isLoadingServices ? (
                        <div className="sf-services__days">
                            {[0, 1, 2].map((i) => (
                                <ServiceRowSkeleton key={i} />
                            ))}
                        </div>
                    ) : servicesError ? (
                        <p className="ep-alert ep-alert--error" role="alert">
                            {servicesError.message}
                        </p>
                    ) : services.length === 0 ? (
                        <div className="ep-empty-state" role="status">
                            <p className="ep-empty-state-title">Aún no tienes servicios</p>
                            <p className="ep-empty-state-text">
                                Añade categoría, precio y condiciones para que los clientes puedan contratarte.
                            </p>
                            <Button
                                type="button"
                                className="pf-btn-save mt-4"
                                onClick={() => setShowServiceForm(true)}
                                disabled={profileIncomplete}
                            >
                                Crear primer servicio
                            </Button>
                        </div>
                    ) : filteredAndSortedServices.length === 0 ? (
                        <div className="ep-empty-state" role="status">
                            <p className="ep-empty-state-title">
                                Sin resultados para &ldquo;{searchQuery}&rdquo;
                            </p>
                            <button
                                type="button"
                                className="sf-services-catalog__clear"
                                onClick={() => setSearchQuery('')}
                            >
                                Limpiar búsqueda
                            </button>
                        </div>
                    ) : (
                        <div className="sf-services__days">
                            {filteredAndSortedServices.map((service) => {
                                const categoryName = resolveCategoryName(service);
                                const serviceTypeName =
                                    service.serviceTypeName
                                    ?? (service as { ServiceTypeName?: string }).ServiceTypeName
                                    ?? '';
                                const imageUrl = service.imageUrls?.length > 0 ? service.imageUrls[0] : null;
                                const vis = getVisibilityMeta(service, visCtx);
                                const currencyCode = (service.priceCurrency ?? service.currency ?? 'EUR')
                                    .toString()
                                    .trim()
                                    .toUpperCase();

                                return (
                                    <article
                                        key={service.id}
                                        className={cn(
                                            'sf-services__day',
                                            vis.tone === 'visible' && 'sf-services__day--visible',
                                        )}
                                    >
                                        <div className="sf-services__row">
                                            <div className="sf-services__media" aria-hidden>
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt=""
                                                        loading="lazy"
                                                        className="sf-services__thumb"
                                                    />
                                                ) : (
                                                    <span className="sf-services__thumb sf-services__thumb-fallback">
                                                        {categoryName.slice(0, 1).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="sf-services__info">
                                                <h4 className="sf-services__title">{categoryName}</h4>
                                                <div className="sf-services__head">
                                                    {serviceTypeName ? (
                                                        <span className="sf-services__type">{serviceTypeName}</span>
                                                    ) : null}
                                                    <span
                                                        className={cn(
                                                            'expert-service-status',
                                                            STATUS_CLASS[vis.tone],
                                                        )}
                                                    >
                                                        <span className="expert-service-status-dot" aria-hidden />
                                                        {vis.label}
                                                    </span>
                                                </div>
                                                {vis.hint && vis.tone !== 'visible' ? (
                                                    <p className="expert-service-hint">{vis.hint}</p>
                                                ) : null}
                                                <div className="sf-services__price expert-service-price-block">
                                                    <span className="expert-service-price">
                                                        {formatCurrency(service.price, currencyCode)}
                                                    </span>
                                                    <span className="expert-service-price-sub">
                                                        IVA incl.
                                                        {service.durationInHours != null
                                                            && service.durationInHours > 0 && (
                                                            <> · {service.durationInHours} h</>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="sf-services__actions expert-service-actions">
                                                {vis.tone === 'paused' && reactivateService ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReactivateService(service)}
                                                        aria-label={`Reactivar ${categoryName}`}
                                                        disabled={reactivatingServiceId === service.id}
                                                        className="expert-service-action expert-service-action--reactivate"
                                                    >
                                                        {reactivatingServiceId === service.id ? (
                                                            <Loader2 className="expert-service-action-icon animate-spin" aria-hidden />
                                                        ) : (
                                                            <RotateCcw className="expert-service-action-icon" aria-hidden />
                                                        )}
                                                    </button>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => onEditService?.(service)}
                                                    aria-label={`Editar ${categoryName}`}
                                                    className="expert-service-action"
                                                >
                                                    <Pencil className="expert-service-action-icon" aria-hidden />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTargetId(service.id)}
                                                    aria-label={`Pausar ${categoryName}`}
                                                    className="expert-service-action expert-service-action--danger"
                                                >
                                                    <PauseCircle className="expert-service-action-icon" aria-hidden />
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <Dialog open={deleteTargetId != null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>¿Pausar este servicio?</DialogTitle>
                        <DialogDescription>
                            {deleteTarget
                                ? `Se desactivará "${resolveCategoryName(deleteTarget)}" y dejará de recibir contrataciones. Podrás reactivarlo cuando quieras.`
                                : 'Se desactivará el servicio y dejará de recibir contrataciones. Podrás reactivarlo cuando quieras.'}
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
                                    Pausando…
                                </>
                            ) : (
                                'Pausar servicio'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
