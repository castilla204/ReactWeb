import React, { useMemo, useState } from 'react';
import { ServiceDetailDesktopPhotoMapHero } from '../serviceDetail/ServiceDetailDesktopPhotoMapHero';
import { ServiceDetailPageHeadline } from '../serviceDetail/ServiceDetailPageHeadline';
import { ServiceDetailExpertHostRow } from '../serviceDetail/ServiceDetailExpertHostRow';
import {
    ServiceDetailDeliverablesGuide,
    type ServiceDeliverableType,
} from '../serviceDetail/ServiceDetailDeliverablesGuide';
import {
    SD_DESKTOP_ASIDE_MAX_H_CLASS,
    SD_DESKTOP_CONTENT_STACK_CLASS,
} from '../../constants/homepageTypography';

export interface ServiceEditorExpertPreview {
    name: string;
    profilePictureUrl?: string | null;
    city?: string | null;
    country?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    workRadiusKm?: number | null;
}

interface ServiceEditorDesktopPreviewProps {
    images: string[];
    title: string;
    locationLabel?: string | null;
    conditions: string;
    priceDisplay: string;
    priceHint?: string | null;
    durationHours?: string | null;
    deliverables: ServiceDeliverableType[];
    expert: ServiceEditorExpertPreview;
    onAddImages?: () => void;
    readOnly?: boolean;
}

function parseCoord(value: number | string | null | undefined): number | null {
    if (value == null || value === '') return null;
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    return Number.isFinite(n) ? n : null;
}

export function ServiceEditorDesktopPreview({
    images,
    title,
    locationLabel,
    conditions,
    priceDisplay,
    priceHint,
    durationHours,
    deliverables,
    expert,
    onAddImages,
    readOnly = false,
}: ServiceEditorDesktopPreviewProps) {
    const [loadingImages] = useState(() => new Set<string>());
    const [failedImages] = useState(() => new Set<string>());
    const noop = () => {};

    const expertLocation = useMemo(() => {
        const lat = parseCoord(expert.latitude);
        const lng = parseCoord(expert.longitude);
        if (lat == null || lng == null) return null;
        return { latitude: lat, longitude: lng };
    }, [expert.latitude, expert.longitude]);

    const rangeKm = expert.workRadiusKm ?? 25;
    const conditionsText = conditions.trim()
        || 'Describe aquí qué incluye el servicio, plazos y condiciones. Este texto aparecerá en la ficha pública.';

    const handleGalleryOpen = () => {
        if (!readOnly) onAddImages?.();
    };

    return (
        <div className="sf-desktop-preview">
            {!readOnly && (
                <p className="sf-desktop-preview-label">Vista del cliente · escritorio</p>
            )}

            <div className="sf-desktop-preview-page service-detail-desktop">
                <ServiceDetailDesktopPhotoMapHero
                    className="sf-desktop-preview-hero"
                    images={images}
                    onOpen={handleGalleryOpen}
                    loadingImages={loadingImages}
                    failedImages={failedImages}
                    onImageError={noop}
                    onImageLoad={noop}
                    onImageLoadStart={noop}
                    location={expertLocation}
                    locationLabel={locationLabel || undefined}
                    rangeKm={rangeKm}
                />

                <div className="sf-desktop-preview-grid">
                    <div className={`min-w-0 ${SD_DESKTOP_CONTENT_STACK_CLASS}`}>
                        <header>
                            <ServiceDetailPageHeadline
                                title={title}
                                locationLabel={locationLabel || undefined}
                            />
                            <ServiceDetailExpertHostRow
                                variant="desktop"
                                expertName={expert.name || 'Tu perfil'}
                                expertPicture={expert.profilePictureUrl || undefined}
                                onAvatarClick={noop}
                                onChatClick={noop}
                            />
                        </header>

                        <section>
                            <h2 className="hp-section-title mb-3">Acerca del servicio</h2>
                            <p className={`sd-body whitespace-pre-line${!conditions.trim() ? ' text-[#a3a3a3]' : ''}`}>
                                {conditionsText}
                            </p>
                            {deliverables.length > 0 && (
                                <ServiceDetailDeliverablesGuide
                                    items={deliverables}
                                    variant="inline"
                                    presentation="chips"
                                    className="mt-4"
                                />
                            )}
                        </section>
                    </div>

                    <aside className="min-w-0 sf-desktop-preview-aside">
                        <article className={`sd-aside-card flex flex-col ${SD_DESKTOP_ASIDE_MAX_H_CLASS}`}>
                            <div className="flex gap-3 pb-1">
                                {images[0] ? (
                                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-[#ececec]">
                                        <img src={images[0]} alt="" className="h-full w-full object-cover" />
                                    </div>
                                ) : null}
                                <div className="min-w-0 flex-1">
                                    <p className="sd-aside-summary-title line-clamp-2">{title}</p>
                                    <p className="sd-aside-summary-meta mt-0.5 truncate">
                                        con {expert.name || 'tu perfil'}
                                    </p>
                                </div>
                            </div>

                            <section className="shrink-0 border-t border-[#ebebeb] py-4">
                                <p className="text-xs leading-snug text-[#6a6a6a]">
                                    Precio · impuestos incluidos
                                </p>
                                <p className={`sd-aside-price mt-0.5${priceDisplay === '—' ? ' text-[#a3a3a3]' : ''}`}>
                                    {priceDisplay}
                                </p>
                                {priceHint ? (
                                    <p className="mt-1 text-[11px] text-[#6a6a6a]">{priceHint}</p>
                                ) : null}
                                {durationHours && parseInt(durationHours, 10) > 0 ? (
                                    <p className="mt-2 text-xs text-[#6a6a6a]">
                                        Duración estimada: {durationHours} h
                                    </p>
                                ) : null}
                            </section>

                            <footer className="mt-auto space-y-2 border-t border-[#ebebeb] pt-4">
                                <button type="button" className="sd-aside-cta pointer-events-none opacity-70" tabIndex={-1}>
                                    Reservar
                                </button>
                                <p className="text-center text-[11px] text-[#a3a3a3]">
                                    Los clientes verán este botón activo
                                </p>
                            </footer>
                        </article>
                    </aside>
                </div>
            </div>
        </div>
    );
}
