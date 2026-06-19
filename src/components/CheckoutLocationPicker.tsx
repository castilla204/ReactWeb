import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Check, Maximize2, X, ChevronUp } from 'lucide-react';
import AppointmentMap from './AppointmentMap';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { cn } from '../lib/utils';
import {
    SD_CHECKOUT_DESKTOP_CARD_CLASS,
    SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS,
    SD_CHECKOUT_MOBILE_META_CLASS,
    SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS,
} from '../constants/homepageTypography';
import { showToast } from '../lib/toast';

/** Ubicación de la cita elegida en el checkout (strings: viajan como metadata al backend). */
export interface CheckoutLocationData {
    location: string;
    latitude: string | null;
    longitude: string | null;
    doorNumber: string | null;
    siteDetails: string | null;
}

interface Props {
    expertLatitude?: number | string | null;
    expertLongitude?: number | string | null;
    expertCountry?: string | null;
    expertRange?: number | null;
    workRadiusKm?: number | null;
    onChange: (data: CheckoutLocationData | null) => void;
    /** Paso dedicado del wizard móvil: mapa a pantalla casi completa + drawer inferior. */
    variant?: 'default' | 'wizard' | 'sidebar';
}

const FIELD_INPUT_CLS =
    'w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#1c1c1c] placeholder:text-[#b0b0b0] transition-colors focus:border-[#c5c9d0] focus:outline-none focus:ring-2 focus:ring-[#1c1c1c]/8';

const DRAWER_FIELD_INPUT_CLS =
    'h-11 w-full rounded-lg border border-[#ebebeb] bg-white px-3 text-[15px] text-[#1c1c1c] placeholder:text-[#b0b0b0] transition-colors focus:border-[#1c1c1c]/30 focus:outline-none disabled:cursor-not-allowed disabled:bg-[#fafafa] disabled:text-[#a3a3a3]';

/** Degradado de marca suave en todo el header del drawer. */
const DRAWER_HEADER_GRADIENT =
    'linear-gradient(128deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.44) 100%), linear-gradient(128deg, rgba(0,102,204,0.28) 0%, rgba(37,99,235,0.22) 52%, rgba(245,158,11,0.26) 100%)';

interface LocationDetailsFieldsProps {
    picked: { address: string } | null;
    doorNumber: string;
    siteDetails: string;
    onDoorChange: (v: string) => void;
    onDetailsChange: (v: string) => void;
    compact?: boolean;
    minimal?: boolean;
    drawer?: boolean;
    doorInputRef?: React.RefObject<HTMLInputElement | null>;
}

function LocationDetailsFields({
    picked,
    doorNumber,
    siteDetails,
    onDoorChange,
    onDetailsChange,
    compact = false,
    minimal = false,
    drawer = false,
    doorInputRef,
}: LocationDetailsFieldsProps) {
    const labelCls = drawer
        ? 'text-[13px] font-medium leading-snug text-[#1c1c1c]'
        : minimal
          ? 'mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-[#999]'
          : 'mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#888]';

    const optionalCls = drawer
        ? 'shrink-0 text-[11px] font-normal text-[#9ca3af]'
        : 'ml-1 normal-case tracking-normal text-[#bbb]';

    const inputCls = drawer
        ? DRAWER_FIELD_INPUT_CLS
        : minimal
          ? 'w-full rounded-md border border-[#e8e8e8] bg-white px-2 py-1.5 text-xs text-[#1c1c1c] placeholder:text-[#c4c4c4] focus:border-[#c5c9d0] focus:outline-none focus:ring-1 focus:ring-[#1c1c1c]/8'
          : FIELD_INPUT_CLS;

    if (drawer) {
        const fieldsDisabled = !picked;

        return (
            <div className="space-y-0">
                {picked ? (
                    <div className="border-b border-[#f0f0f0] pb-4">
                        <p className={SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS}>Dirección</p>
                        <p className="mt-1.5 text-[13px] font-medium leading-snug text-[#1c1c1c]">
                            {picked.address}
                        </p>
                    </div>
                ) : null}

                <fieldset
                    className={cn(
                        'min-w-0 space-y-3.5 border-0 p-0',
                        picked ? 'pt-4' : 'pt-0',
                        fieldsDisabled && 'pointer-events-none opacity-40',
                    )}
                    disabled={fieldsDisabled}
                >
                    <div>
                        <label htmlFor="checkout-door" className="mb-1.5 block text-xs text-[#6a6a6a]">
                            Puerta o garaje <span className="text-[#b0b0b0]">(opcional)</span>
                        </label>
                        <input
                            ref={doorInputRef}
                            id="checkout-door"
                            type="text"
                            value={doorNumber}
                            onChange={(e) => onDoorChange(e.target.value)}
                            placeholder="3B, garaje 12…"
                            className={inputCls}
                            autoComplete="address-line2"
                        />
                    </div>
                    <div>
                        <label htmlFor="checkout-details" className="mb-1.5 block text-xs text-[#6a6a6a]">
                            Indicaciones de acceso <span className="text-[#b0b0b0]">(opcional)</span>
                        </label>
                        <input
                            id="checkout-details"
                            type="text"
                            value={siteDetails}
                            onChange={(e) => onDetailsChange(e.target.value)}
                            placeholder="Parking, portal, referencias…"
                            className={inputCls}
                        />
                    </div>
                </fieldset>

                <p className={cn('border-t border-[#f5f5f5] pt-3.5', SD_CHECKOUT_MOBILE_META_CLASS)}>
                    Solo el experto que contrates verá la dirección exacta.
                </p>
            </div>
        );
    }

    return (
        <>
            {picked ? (
                <div
                    className={cn(
                        'flex items-start gap-1.5 rounded-md border border-[#ececec] px-2 py-1.5',
                        minimal ? 'mb-2 bg-[#fafafa]' : compact ? 'mb-2.5 bg-white' : 'mb-3 bg-white',
                    )}
                >
                    <Check
                        className={cn('shrink-0 text-[#1c1c1c]', minimal ? 'mt-px h-3 w-3' : 'mt-0.5 h-4 w-4')}
                        aria-hidden
                    />
                    <p
                        className={cn(
                            'font-medium leading-snug text-[#333]',
                            minimal ? 'line-clamp-2 text-[11px]' : 'text-sm',
                        )}
                    >
                        {picked.address}
                    </p>
                </div>
            ) : minimal ? null : (
                <p
                    className={cn(
                        'leading-relaxed text-[#888]',
                        compact ? 'mb-3 text-xs' : 'mb-3.5 text-xs',
                    )}
                >
                    Marca un punto en el mapa o búscalo arriba.
                </p>
            )}

            <div className={cn(minimal ? 'space-y-1.5' : compact ? 'space-y-2.5' : 'space-y-3')}>
                <div>
                    <label htmlFor="checkout-door" className={labelCls}>
                        Puerta / garaje
                        <span className={optionalCls}> (opcional)</span>
                    </label>
                    <input
                        ref={doorInputRef}
                        id="checkout-door"
                        type="text"
                        value={doorNumber}
                        onChange={(e) => onDoorChange(e.target.value)}
                        placeholder={minimal ? '3B, garaje…' : 'Ej. 3B, garaje 12…'}
                        className={inputCls}
                        autoComplete="address-line2"
                    />
                </div>
                {!minimal ? (
                    <div>
                        <label htmlFor="checkout-details" className={labelCls}>
                            Detalles del sitio
                            <span className={optionalCls}> (opcional)</span>
                        </label>
                        <input
                            id="checkout-details"
                            type="text"
                            value={siteDetails}
                            onChange={(e) => onDetailsChange(e.target.value)}
                            placeholder="Ej. parking subterráneo, portal B…"
                            className={inputCls}
                        />
                    </div>
                ) : null}
            </div>

            {!minimal ? (
                <p className={cn('leading-relaxed text-[#aaa]', compact ? 'mt-2.5 text-[10px]' : 'mt-3 text-[10px]')}>
                    Solo el experto que contrates verá la dirección exacta.
                </p>
            ) : null}
        </>
    );
}

/** Drawer inferior superpuesto al mapa (móvil / wizard). */
function LocationMapDrawer({
    picked,
    doorNumber,
    siteDetails,
    onDoorChange,
    onDetailsChange,
    expanded,
    onToggle,
    doorInputRef,
}: LocationDetailsFieldsProps & { expanded: boolean; onToggle: () => void }) {
    return (
        <>
            {expanded ? (
                <button
                    type="button"
                    className="absolute inset-0 z-[14] bg-black/15 transition-opacity duration-300 lg:hidden"
                    onClick={onToggle}
                    aria-label="Cerrar detalles de ubicación"
                />
            ) : null}

            <div className="absolute inset-x-0 bottom-0 z-[15] lg:hidden" aria-live="polite">
                <div
                    className={cn(
                        'relative flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.1)] transition-[max-height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                        expanded ? 'max-h-[min(54vh,380px)]' : 'max-h-[6.5rem]',
                    )}
                >
                    <div
                        className="relative shrink-0 overflow-hidden rounded-t-2xl"
                        style={{ background: DRAWER_HEADER_GRADIENT }}
                    >
                        <button
                            type="button"
                            onClick={onToggle}
                            className="relative flex w-full flex-col items-center pt-2.5 pb-0"
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Contraer panel de ubicación' : 'Expandir panel de ubicación'}
                        >
                            <span className="h-[3px] w-9 rounded-full bg-[#d4d4d4]" aria-hidden />
                        </button>

                        <button
                            type="button"
                            onClick={onToggle}
                            className="relative flex w-full items-center justify-between gap-3 px-5 pb-3.5 pt-1.5 text-left"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">
                                    {picked ? 'Detalles del lugar' : 'Ubicación'}
                                </p>
                                {!expanded ? (
                                    picked ? (
                                        <p className="mt-1 truncate text-[13px] font-medium text-[#2a2a2a]">
                                            {picked.address}
                                        </p>
                                    ) : (
                                        <p className="mt-0.5 text-[13px] font-medium text-[#3d3d3d]">
                                            Marca un punto en el mapa
                                        </p>
                                    )
                                ) : (
                                    <p className="mt-1 text-[13px] leading-snug text-[#525252]">
                                        {picked
                                            ? 'Puerta, garaje o referencias para llegar.'
                                            : 'Elige primero la dirección en el mapa.'}
                                    </p>
                                )}
                            </div>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8] bg-white/90">
                                <ChevronUp
                                    className={cn(
                                        'h-[18px] w-[18px] text-[#555555] transition-transform duration-300',
                                        expanded ? 'rotate-0' : 'rotate-180',
                                    )}
                                    aria-hidden
                                />
                            </span>
                        </button>

                        <span
                            className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-[#ebebeb]"
                            aria-hidden
                        />
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col">
                        <div
                            className={cn(
                                'min-h-0 overflow-y-auto overscroll-contain bg-white px-5 transition-[opacity,max-height] duration-300',
                                expanded
                                    ? 'max-h-[min(40vh,300px)] pb-5 pt-4 opacity-100'
                                    : 'max-h-0 pb-0 pt-0 opacity-0',
                            )}
                        >
                            <LocationDetailsFields
                                picked={picked}
                                doorNumber={doorNumber}
                                siteDetails={siteDetails}
                                onDoorChange={onDoorChange}
                                onDetailsChange={onDetailsChange}
                                drawer
                                doorInputRef={doorInputRef}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * 🗓️ Fase E: el cliente elige DÓNDE es la cita antes de pagar.
 */
const CheckoutLocationPicker: React.FC<Props> = ({
    expertLatitude,
    expertLongitude,
    expertCountry,
    expertRange,
    workRadiusKm,
    onChange,
    variant = 'default',
}) => {
    const isWizard = variant === 'wizard';
    const isSidebar = variant === 'sidebar';
    const latNum = expertLatitude != null ? Number(expertLatitude) : NaN;
    const lngNum = expertLongitude != null ? Number(expertLongitude) : NaN;
    const hasExpertCoords = Number.isFinite(latNum) && Number.isFinite(lngNum) && (latNum !== 0 || lngNum !== 0);
    const isWorkshopOnly = workRadiusKm === 0 && hasExpertCoords;
    const expertLocation = hasExpertCoords ? { latitude: latNum, longitude: lngNum } : null;

    const [picked, setPicked] = useState<{ address: string; latitude: number; longitude: number } | null>(null);
    const [doorNumber, setDoorNumber] = useState('');
    const [siteDetails, setSiteDetails] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [drawerExpanded, setDrawerExpanded] = useState(false);
    const emittedStatic = useRef(false);
    const doorInputRef = useRef<HTMLInputElement>(null);

    const expandDrawerForEdit = () => {
        setDrawerExpanded(true);
        window.setTimeout(() => doorInputRef.current?.focus(), 320);
    };

    useEffect(() => {
        if (isWorkshopOnly && expertLocation && !emittedStatic.current) {
            emittedStatic.current = true;
            onChange({
                location: 'Taller del experto (punto fijo)',
                latitude: String(expertLocation.latitude),
                longitude: String(expertLocation.longitude),
                doorNumber: null,
                siteDetails: null,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWorkshopOnly]);

    useEffect(() => {
        if (isWorkshopOnly) return;
        if (picked) {
            onChange({
                location: picked.address,
                latitude: String(picked.latitude),
                longitude: String(picked.longitude),
                doorNumber: doorNumber.trim() || null,
                siteDetails: siteDetails.trim() || null,
            });
        } else {
            onChange(null);
            setDrawerExpanded(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [picked, doorNumber, siteDetails, isWorkshopOnly]);

    if (isWorkshopOnly) {
        return (
            <div
                className={cn(
                    'rounded-2xl border border-blue-100 bg-blue-50/60 p-4 lg:mx-0',
                    isSidebar && SD_CHECKOUT_DESKTOP_CARD_CLASS,
                )}
            >
                <div className="flex items-center gap-2 text-blue-900">
                    <MapPin className="h-5 w-5" />
                    <h3 className="text-base font-semibold">La inspección es en el taller del experto</h3>
                </div>
                <p className="mt-1 text-sm text-blue-800">
                    Este experto trabaja en su punto fijo, así que no necesitas elegir ubicación: te desplazarás tú a su taller.
                </p>
            </div>
        );
    }

    const handleLocationSelect = (location: { address: string; latitude: number; longitude: number }) => {
        setPicked(location);
        expandDrawerForEdit();
    };

    const handleLocationRejected = (_info: { reason: 'out_of_range'; address: string }) => {
        showToast('error', 'Esta dirección está fuera del área del experto. Elige un punto dentro del círculo.');
    };

    const mapProps = {
        onLocationSelect: handleLocationSelect,
        onLocationRejected: handleLocationRejected,
        initialLocation: picked ? { latitude: picked.latitude, longitude: picked.longitude } : undefined,
        expertLocation,
        expertRange,
        expertCountry,
        showSearch: true as const,
        showCountrySelector: false as const,
        frameless: true as const,
        searchMinimal: true as const,
        coverageStyle: 'minimal' as const,
        searchOverlayClassName: isWizard
            ? 'left-3 right-3 top-[calc(max(0.75rem,env(safe-area-inset-top,0px))+4rem)]'
            : undefined,
    };

    const mapHeightCls = isWizard || isSidebar ? 'h-full min-h-[inherit]' : 'h-[min(56vh,420px)] lg:h-full lg:min-h-0';

    const fieldProps = {
        picked,
        doorNumber,
        siteDetails,
        onDoorChange: setDoorNumber,
        onDetailsChange: setSiteDetails,
    };

    if (isSidebar) {
        return (
            <div className="flex h-full min-h-0 flex-col">
                <div className="relative min-h-0 flex-1 lg:min-h-[300px]">
                    <AppointmentMap {...mapProps} className="h-full w-full min-h-[inherit]" />
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="absolute bottom-3 right-3 z-[10] inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/95 text-[#334155] shadow-sm backdrop-blur-sm transition-transform active:scale-95"
                        aria-label="Ampliar mapa a pantalla completa"
                    >
                        <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                </div>
                <div className="shrink-0 border-t border-[#f0f0f0] bg-white px-3.5 py-3">
                    <LocationDetailsFields {...fieldProps} compact doorInputRef={doorInputRef} />
                </div>
                <Dialog open={expanded} onOpenChange={setExpanded}>
                    <DialogContent
                        hideCloseButton
                        overlayClassName="bg-black/60"
                        className="fixed inset-0 left-0 top-0 z-[200] flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-white p-0 shadow-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 sm:rounded-none"
                        style={{ zIndex: 200 }}
                    >
                        <DialogTitle className="sr-only">Elegir ubicación de la inspección</DialogTitle>
                        <DialogDescription className="sr-only">
                            Mapa interactivo para marcar dónde será la inspección
                        </DialogDescription>
                        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#f0f0f0] px-4 py-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#1c1c1c]">Ubicación de la inspección</p>
                                <p className="truncate text-xs text-[#6a6a6a]">
                                    {picked?.address ?? 'Marca un punto dentro del área del experto'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setExpanded(false)}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#333]"
                                aria-label="Cerrar mapa ampliado"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>
                        <div className="relative min-h-0 flex-1">
                            <AppointmentMap {...mapProps} className="h-full w-full" />
                        </div>
                        <footer className="shrink-0 border-t border-[#f0f0f0] p-4">
                            <LocationDetailsFields {...fieldProps} doorInputRef={doorInputRef} />
                        </footer>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div
            className={cn(
                isWizard
                    ? 'relative h-full min-h-0'
                    : SD_CHECKOUT_DESKTOP_CARD_CLASS,
            )}
        >
            {!isWizard ? (
                <div className={SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS}>
                    <h3 className="text-sm font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                        ¿Dónde es la inspección?
                    </h3>
                    <p className="mt-0.5 hidden text-[11px] text-[#6a6a6a] lg:block">
                        Busca la dirección o haz clic en el mapa.
                    </p>
                </div>
            ) : null}

            <div
                className={cn(
                    'lg:grid lg:h-[248px] lg:grid-cols-[minmax(0,1fr)_260px] lg:items-stretch',
                    isWizard && 'absolute inset-0',
                )}
            >
                <div
                    className={cn(
                        isWizard
                            ? 'absolute inset-0 h-full w-full'
                            : 'relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 lg:relative lg:left-0 lg:h-full lg:w-full lg:max-w-none lg:translate-x-0 lg:overflow-hidden lg:border-r lg:border-[#f0f0f0]',
                        mapHeightCls,
                    )}
                >
                    <AppointmentMap {...mapProps} className="h-full w-full min-h-[inherit]" />

                    {!isWizard ? (
                        <button
                            type="button"
                            onClick={() => setExpanded(true)}
                            className={cn(
                                'absolute right-3 z-[10] inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/95 text-[#334155] shadow-[0_4px_16px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-[transform,bottom] duration-300 active:scale-95 lg:bottom-3 lg:right-3',
                                drawerExpanded
                                    ? 'bottom-[min(calc(54vh+0.5rem),calc(380px+0.5rem))] lg:bottom-3'
                                    : 'bottom-[7rem] lg:bottom-3',
                            )}
                            aria-label="Ampliar mapa a pantalla completa"
                        >
                            <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                    ) : null}

                    <LocationMapDrawer
                        {...fieldProps}
                        expanded={drawerExpanded}
                        onToggle={() => setDrawerExpanded((v) => !v)}
                        doorInputRef={doorInputRef}
                    />
                </div>

                {/* Desktop: panel lateral alineado con el mapa */}
                <div className="hidden h-full min-h-0 flex-col overflow-y-auto bg-white p-3.5 lg:flex">
                    <LocationDetailsFields {...fieldProps} doorInputRef={doorInputRef} compact />
                </div>
            </div>

            {!isWizard ? (
            <Dialog open={expanded} onOpenChange={setExpanded}>
                <DialogContent
                    hideCloseButton
                    overlayClassName="bg-black/60"
                    className="fixed inset-0 left-0 top-0 z-[200] flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-white p-0 shadow-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 sm:rounded-none"
                    style={{ zIndex: 200 }}
                >
                    <DialogTitle className="sr-only">Elegir ubicación de la inspección</DialogTitle>
                    <DialogDescription className="sr-only">
                        Mapa interactivo para marcar dónde será la inspección
                    </DialogDescription>

                    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#f0f0f0] px-4 py-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1c1c1c]">Ubicación de la inspección</p>
                            <p className="truncate text-xs text-[#6a6a6a]">
                                {picked?.address ?? 'Marca un punto dentro del área del experto'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setExpanded(false)}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#444] transition-colors hover:bg-[#ebebeb]"
                            aria-label="Cerrar mapa"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </header>

                    <div className="relative min-h-0 flex-1">
                        {expanded && (
                            <AppointmentMap {...mapProps} className="absolute inset-0 h-full w-full" />
                        )}
                    </div>

                    <div className="shrink-0 rounded-t-[1.25rem] border-t border-[#ececec] bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                        {picked ? (
                            <p className="mb-2 flex items-start gap-1.5 text-[13px] text-[#333]">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1c1c1c]" aria-hidden />
                                <span className="line-clamp-2">{picked.address}</span>
                            </p>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => setExpanded(false)}
                            disabled={!picked}
                            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {picked ? 'Confirmar ubicación' : 'Marca un punto en el mapa'}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
            ) : null}
        </div>
    );
};

export default CheckoutLocationPicker;
