import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Check, Maximize2, X } from 'lucide-react';
import AppointmentMap from './AppointmentMap';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { cn } from '../lib/utils';
import {
    SD_CHECKOUT_DESKTOP_CARD_CLASS,
    SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS,
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
    variant?: 'default' | 'wizard';
}

const FIELD_INPUT_CLS =
    'w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#333] placeholder:text-[#b0b0b0] transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15';

interface LocationDetailsFieldsProps {
    picked: { address: string } | null;
    doorNumber: string;
    siteDetails: string;
    onDoorChange: (v: string) => void;
    onDetailsChange: (v: string) => void;
    compact?: boolean;
    doorInputRef?: React.RefObject<HTMLInputElement | null>;
}

function LocationDetailsFields({
    picked,
    doorNumber,
    siteDetails,
    onDoorChange,
    onDetailsChange,
    compact = false,
    doorInputRef,
}: LocationDetailsFieldsProps) {
    return (
        <>
            {picked ? (
                <div
                    className={cn(
                        'flex items-start gap-2 rounded-lg border border-[#e5e7eb] px-2.5 py-2',
                        compact ? 'mb-2.5 bg-white' : 'mb-3 bg-white',
                    )}
                >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1c1c1c]" aria-hidden />
                    <p className="text-sm font-medium leading-snug text-[#333]">{picked.address}</p>
                </div>
                ) : (
                    <p className={cn('text-xs leading-relaxed text-[#888]', compact ? 'mb-3' : 'mb-3.5')}>
                        Marca un punto en el mapa o búscalo arriba.
                    </p>
                )}

                <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
                    <div>
                        <label htmlFor="checkout-door" className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#888]">
                            Puerta / garaje
                            <span className="ml-1 normal-case tracking-normal text-[#bbb]">(opcional)</span>
                        </label>
                    <input
                        ref={doorInputRef}
                        id="checkout-door"
                        type="text"
                        value={doorNumber}
                        onChange={(e) => onDoorChange(e.target.value)}
                        placeholder="Ej. 3B, garaje 12…"
                        className={FIELD_INPUT_CLS}
                    />
                </div>
                    <div>
                        <label htmlFor="checkout-details" className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#888]">
                            Detalles del sitio
                            <span className="ml-1 normal-case tracking-normal text-[#bbb]">(opcional)</span>
                        </label>
                    <input
                        id="checkout-details"
                        type="text"
                        value={siteDetails}
                        onChange={(e) => onDetailsChange(e.target.value)}
                        placeholder="Ej. parking subterráneo, portal B…"
                        className={FIELD_INPUT_CLS}
                    />
                </div>
            </div>

            <p className={cn('leading-relaxed text-[#aaa]', compact ? 'mt-2.5 text-[10px]' : 'mt-3 text-[10px]')}>
                Solo el experto que contrates verá la dirección exacta.
            </p>
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
        <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] lg:hidden"
            aria-live="polite"
        >
            <div
                className={cn(
                    'pointer-events-auto rounded-t-[1.35rem] border-t border-[#e8e8e8] bg-white/97 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[max-height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                    expanded ? 'max-h-[min(52vh,340px)]' : 'max-h-[5.25rem]',
                )}
            >
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex w-full flex-col items-center pt-2.5 pb-1"
                    aria-expanded={expanded}
                    aria-label={expanded ? 'Contraer panel de ubicación' : 'Expandir panel de ubicación'}
                >
                    <span className="h-1 w-10 rounded-full bg-[#d4d4d4]" aria-hidden />
                </button>

                <div className="overflow-y-auto overscroll-contain px-5 pb-4">
                    {!expanded ? (
                        <button
                            type="button"
                            onClick={onToggle}
                            className="w-full pb-2 text-left"
                        >
                            {picked ? (
                                <p className="flex items-center gap-2 truncate text-sm font-medium text-[#1c1c1c]">
                                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                    <span className="truncate">{picked.address}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-[#888]">Toca para añadir puerta y detalles</p>
                            )}
                        </button>
                    ) : (
                        <LocationDetailsFields
                            picked={picked}
                            doorNumber={doorNumber}
                            siteDetails={siteDetails}
                            onDoorChange={onDoorChange}
                            onDetailsChange={onDetailsChange}
                            compact
                            doorInputRef={doorInputRef}
                        />
                    )}
                </div>
            </div>
        </div>
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
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 lg:mx-0">
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
    };

    const mapHeightCls = isWizard
        ? 'h-[calc(100dvh-9rem-env(safe-area-inset-top,0px))] min-h-[440px] max-h-[820px]'
        : 'h-[min(56vh,420px)] lg:h-full lg:min-h-0';

    const fieldProps = {
        picked,
        doorNumber,
        siteDetails,
        onDoorChange: setDoorNumber,
        onDetailsChange: setSiteDetails,
    };

    return (
        <div
            className={cn(
                isWizard
                    ? ''
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

            <div className="lg:grid lg:h-[248px] lg:grid-cols-[minmax(0,1fr)_260px] lg:items-stretch">
                <div
                    className={cn(
                        'relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 lg:relative lg:left-0 lg:h-full lg:w-full lg:max-w-none lg:translate-x-0 lg:overflow-hidden lg:border-r lg:border-[#f0f0f0]',
                        mapHeightCls,
                    )}
                >
                    <AppointmentMap {...mapProps} className="h-full w-full min-h-[inherit]" />

                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className={cn(
                            'absolute right-3 z-[10] inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#334155] shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-transform active:scale-95 lg:bottom-3 lg:right-3',
                            drawerExpanded ? 'bottom-[5.75rem]' : 'bottom-[4.75rem] lg:bottom-3',
                        )}
                        aria-label="Ampliar mapa a pantalla completa"
                    >
                        <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                    </button>

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
        </div>
    );
};

export default CheckoutLocationPicker;
