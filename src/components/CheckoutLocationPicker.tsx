import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Check, Maximize2, X } from 'lucide-react';
import { LazyAppointmentMap as AppointmentMap } from './Map/LazyAppointmentMap';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { cn } from '../lib/utils';
import {
    SD_CHECKOUT_DESKTOP_CARD_CLASS,
    SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS,
    SD_CHECKOUT_MOBILE_META_CLASS,
    SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS,
} from '../constants/homepageTypography';
import { showToast } from '../lib/toast';
import {
    CheckoutSellerChoicePreviewMap,
    CheckoutSellerChoicePreviewCalendar,
    CheckoutSelfChoicePreviewMap,
    CheckoutSelfChoicePickLocationShell,
} from './checkout/CheckoutSellerChoiceLocked';
import { CheckoutEmbeddedStepHeader } from './checkout/CheckoutEmbeddedStepHeader';
import MapAddressSearchBar, { type MapAddressSelection } from './MapAddressSearchBar';
import { haversineDistanceKm } from '../utils/mapboxCircle';
import { CheckoutLocationDetailsDrawer } from './checkout/CheckoutLocationDetailsDrawer';

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
    /** Mapa informativo (Coordínalo Inspecciono): misma UI, sin elegir ubicación. */
    referenceMode?: boolean;
    /** Oculta la cabecera numerada (layout 50/50 desktop: el paso va en la columna izquierda). */
    showEmbeddedHeader?: boolean;
    /** El formulario (dirección/puerta/indicaciones) vive FUERA del mapa, en la columna
     *  izquierda. El mapa no muestra buscador ni tarjeta superpuesta: solo deja clicar el punto
     *  y refleja la ubicación que controla el padre (`controlledLocation`). */
    externalForm?: boolean;
    /** Ubicación controlada por el padre (con `externalForm`): el mapa coloca aquí su marcador. */
    controlledLocation?: CheckoutLocationData | null;
}

const FIELD_INPUT_CLS =
    'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink-strong placeholder:text-ink-soft transition-colors focus:border-line focus:outline-none focus:ring-2 focus:ring-ink-strong/8';

const DRAWER_FIELD_INPUT_CLS =
    'h-12 w-full rounded-2xl border border-transparent bg-surface-tinted px-4 text-lead text-ink-strong placeholder:text-ink-soft transition-all focus:border-brand/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15';

const DRAWER_MOBILE_FIELD_INPUT_CLS =
    'h-11 w-full rounded-full bg-surface-tinted px-4 text-lead text-ink-strong outline-none placeholder:text-ink-soft transition-colors focus:bg-white focus:ring-2 focus:ring-brand/20';

const DESKTOP_SIDEBAR_FIELD_INPUT_CLS =
    'h-9 w-full rounded-lg border border-line bg-white px-2.5 text-meta text-ink-strong placeholder:text-ink-soft transition-colors focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/15';

interface LocationDetailsFieldsProps {
    picked: { address: string } | null;
    doorNumber: string;
    siteDetails: string;
    onDoorChange: (v: string) => void;
    onDetailsChange: (v: string) => void;
    compact?: boolean;
    minimal?: boolean;
    drawer?: boolean;
    drawerDesktop?: boolean;
    /** Drawer checkout móvil: la dirección va en la cabecera del panel. */
    drawerCompact?: boolean;
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
    drawerDesktop = false,
    drawerCompact = false,
    doorInputRef,
}: LocationDetailsFieldsProps) {
    const labelCls = drawerCompact
        ? 'mb-1.5 block text-caption font-medium text-ink-muted'
        : drawer
          ? 'mb-2 block text-meta font-medium leading-snug text-ink'
          : minimal
          ? 'mb-0.5 block text-badge font-medium uppercase tracking-wide text-ink-soft'
          : 'mb-1 block text-kicker font-medium uppercase tracking-wide text-ink-muted';

    const optionalCls = drawerCompact
        ? 'font-normal text-ink-soft'
        : drawer
          ? 'shrink-0 text-kicker font-normal text-ink-soft'
          : 'ml-1 normal-case tracking-normal text-ink-soft';

    const inputCls = drawerDesktop
        ? DESKTOP_SIDEBAR_FIELD_INPUT_CLS
        : drawerCompact
          ? DRAWER_MOBILE_FIELD_INPUT_CLS
          : drawer
            ? DRAWER_FIELD_INPUT_CLS
            : minimal
            ? 'w-full rounded-md border border-line bg-white px-2 py-1.5 text-xs text-ink-strong placeholder:text-ink-soft focus:border-line focus:outline-none focus:ring-1 focus:ring-ink-strong/8'
            : FIELD_INPUT_CLS;

    if (drawerDesktop) {
        return (
            <div className="space-y-2.5">
                {picked ? (
                    <p className="flex items-start gap-1.5 text-caption font-medium leading-snug text-ink-strong">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                        <span className="line-clamp-1">{picked.address}</span>
                    </p>
                ) : (
                    <p className="text-caption font-medium leading-snug text-ink-muted">
                        Marca un punto en el mapa o búscalo arriba
                    </p>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                    <div>
                        <label
                            htmlFor="checkout-door-sidebar"
                            className="mb-1 block text-kicker font-medium text-ink-muted"
                        >
                            Puerta / garaje{' '}
                            <span className="font-normal text-ink-soft">(opc.)</span>
                        </label>
                        <input
                            ref={doorInputRef}
                            id="checkout-door-sidebar"
                            type="text"
                            value={doorNumber}
                            onChange={(e) => onDoorChange(e.target.value)}
                            placeholder="3B, garaje 12…"
                            className={inputCls}
                            autoComplete="address-line2"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="checkout-details-sidebar"
                            className="mb-1 block text-kicker font-medium text-ink-muted"
                        >
                            Indicaciones{' '}
                            <span className="font-normal text-ink-soft">(opc.)</span>
                        </label>
                        <input
                            id="checkout-details-sidebar"
                            type="text"
                            value={siteDetails}
                            onChange={(e) => onDetailsChange(e.target.value)}
                            placeholder="Parking, portal…"
                            className={inputCls}
                        />
                    </div>
                </div>
                <p className="text-badge leading-snug text-ink-soft">
                    Solo el experto que contrates verá la dirección exacta.
                </p>
            </div>
        );
    }

    if (drawer) {
        return (
            <div className={cn('space-y-0', drawerCompact && 'pb-1')}>
                {picked && !drawerCompact ? (
                    <div className="border-b border-line-soft pb-4">
                        <p className={SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS}>Dirección</p>
                        <p className="mt-1.5 text-meta font-medium leading-snug text-ink-strong">
                            {picked.address}
                        </p>
                    </div>
                ) : null}

                <fieldset
                    className={cn(
                        'min-w-0 space-y-3 border-0 p-0',
                        picked && !drawerCompact ? 'pt-4' : 'pt-0',
                    )}
                >
                        <div>
                            <label htmlFor="checkout-door" className={labelCls}>
                                Puerta o garaje{' '}
                                <span className={optionalCls}>(opcional)</span>
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
                            <label htmlFor="checkout-details" className={labelCls}>
                                Indicaciones de acceso{' '}
                                <span className={optionalCls}>(opcional)</span>
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

                <p
                    className={cn(
                        drawerCompact
                            ? 'mt-3 text-kicker leading-relaxed text-ink-soft'
                            : cn('border-t border-line-soft pt-3.5', SD_CHECKOUT_MOBILE_META_CLASS),
                    )}
                >
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
                        'flex items-start gap-1.5 rounded-md border border-line px-2 py-1.5',
                        minimal ? 'mb-2 bg-surface-tinted' : compact ? 'mb-2.5 bg-white' : 'mb-3 bg-white',
                    )}
                >
                    <Check
                        className={cn('shrink-0 text-ink-strong', minimal ? 'mt-px h-3 w-3' : 'mt-0.5 h-4 w-4')}
                        aria-hidden
                    />
                    <p
                        className={cn(
                            'font-medium leading-snug text-ink',
                            minimal ? 'line-clamp-2 text-kicker' : 'text-sm',
                        )}
                    >
                        {picked.address}
                    </p>
                </div>
            ) : minimal ? null : (
                <p
                    className={cn(
                        'leading-relaxed text-ink-muted',
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
                <p className={cn('leading-relaxed text-ink-soft', compact ? 'mt-2 text-badge' : 'mt-3 text-badge')}>
                    Solo el experto verá la dirección exacta.
                </p>
            ) : null}
        </>
    );
}

/** Drawer inferior superpuesto al mapa (móvil / wizard / sidebar desktop). */
function LocationMapDrawer({
    picked,
    doorNumber,
    siteDetails,
    onDoorChange,
    onDetailsChange,
    expanded,
    onToggle,
    doorInputRef,
    desktopSidebar = false,
}: LocationDetailsFieldsProps & {
    expanded: boolean;
    onToggle: () => void;
    desktopSidebar?: boolean;
}) {
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        if (!desktopSidebar) return;
        const frame = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(frame);
    }, [desktopSidebar]);

    if (desktopSidebar) {
        return (
            <div
                className={cn(
                    'absolute inset-x-0 bottom-0 z-[15] px-3 pb-3',
                    entered ? 'translate-y-0' : 'translate-y-full',
                    'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                )}
                aria-live="polite"
            >
                <div className="overflow-hidden rounded-xl border border-line bg-white/98 px-3.5 py-3 shadow-[0_-6px_28px_rgba(15,23,42,0.1)] backdrop-blur-sm">
                    <LocationDetailsFields
                        picked={picked}
                        doorNumber={doorNumber}
                        siteDetails={siteDetails}
                        onDoorChange={onDoorChange}
                        onDetailsChange={onDetailsChange}
                        drawerDesktop
                        doorInputRef={doorInputRef}
                    />
                </div>
            </div>
        );
    }

    const detailBadge =
        doorNumber.trim() || siteDetails.trim()
            ? [doorNumber.trim(), siteDetails.trim()].filter(Boolean).join(' · ')
            : null;

    return (
        <CheckoutLocationDetailsDrawer
            open={!!picked}
            addressLabel={picked?.address ?? ''}
            detailBadge={detailBadge}
            expanded={expanded}
            onToggle={onToggle}
        >
            <LocationDetailsFields
                picked={picked}
                doorNumber={doorNumber}
                siteDetails={siteDetails}
                onDoorChange={onDoorChange}
                onDetailsChange={onDetailsChange}
                drawer
                drawerCompact
                doorInputRef={doorInputRef}
            />
        </CheckoutLocationDetailsDrawer>
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
    referenceMode = false,
    showEmbeddedHeader = true,
    externalForm = false,
    controlledLocation = null,
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
    const [externalAddressPick, setExternalAddressPick] = useState<{
        address: string;
        latitude: number;
        longitude: number;
        nonce: number;
    } | null>(null);
    const emittedStatic = useRef(false);
    const doorInputRef = useRef<HTMLInputElement>(null);
    // 🔁 Rompe el eco mapa↔padre: cuando el Efecto B sincroniza `picked` DESDE el padre
    // (controlledLocation), marca este flag y el Efecto A NO reemite onChange (que volvería a
    // cambiar controlledLocation → bucle infinito "Maximum update depth"). Robusto aunque la
    // dirección sufra «drift» (reverse-geocode ≠ texto buscado).
    const syncingFromParent = useRef(false);
    // Contador determinista para forzar la recolocación del marcador (sustituye a Date.now(),
    // que generaba un valor distinto en cada pasada / doble invocación de StrictMode).
    const externalPickNonce = useRef(0);

    const expandDrawerForEdit = () => {
        if (isSidebar) {
            window.setTimeout(() => doorInputRef.current?.focus(), 180);
            return;
        }
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
        if (isWorkshopOnly || referenceMode) return;
        // Este cambio de `picked` lo provocó el Efecto B sincronizando desde el padre:
        // consumimos el flag y NO reemitimos (evita el bucle de eco).
        if (syncingFromParent.current) {
            syncingFromParent.current = false;
            return;
        }
        if (picked) {
            const payload = {
                location: picked.address,
                latitude: String(picked.latitude),
                longitude: String(picked.longitude),
                // En externalForm la puerta/indicaciones las gestiona la columna izquierda; las
                // tomamos de `controlledLocation` para no machacarlas al recolocar el punto.
                doorNumber: externalForm ? (controlledLocation?.doorNumber ?? null) : (doorNumber.trim() || null),
                siteDetails: externalForm ? (controlledLocation?.siteDetails ?? null) : (siteDetails.trim() || null),
            };
            // 🔁 En externalForm el Efecto B ya sincroniza `picked` DESDE `controlledLocation`.
            // Si lo que íbamos a emitir coincide con lo que ya hay arriba, NO re-emitimos: si no,
            // creamos un objeto nuevo en cada render → el padre re-renderiza → bucle infinito
            // (Maximum update depth) al volver a esta pantalla.
            const alreadySynced =
                externalForm &&
                !!controlledLocation &&
                controlledLocation.location === payload.location &&
                Math.abs(Number(controlledLocation.latitude) - picked.latitude) < 1e-7 &&
                Math.abs(Number(controlledLocation.longitude) - picked.longitude) < 1e-7 &&
                (controlledLocation.doorNumber ?? null) === payload.doorNumber &&
                (controlledLocation.siteDetails ?? null) === payload.siteDetails;
            if (alreadySynced) return;
            onChange(payload);
        } else {
            onChange(null);
            setDrawerExpanded(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [picked, doorNumber, siteDetails, isWorkshopOnly]);

    // 🔁 externalForm: el formulario vive en la columna izquierda y el mapa SOLO refleja la
    //    ubicación que controla el padre. Cuando el padre cambia la dirección (búsqueda a la
    //    izquierda), recolocamos el marcador con un externalAddressPick. Guard por lat/lng
    //    (epsilon) para NO entrar en bucle con nuestro propio onChange: click en mapa → padre →
    //    aquí → mismo punto → no hace nada.
    useEffect(() => {
        if (!externalForm || referenceMode || isWorkshopOnly) return;
        const cl = controlledLocation;
        if (cl && cl.latitude != null && cl.longitude != null) {
            const lat = Number(cl.latitude);
            const lng = Number(cl.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
            const samePoint =
                !!picked &&
                Math.abs(picked.latitude - lat) < 1e-7 &&
                Math.abs(picked.longitude - lng) < 1e-7;
            if (!samePoint) {
                syncingFromParent.current = true;
                externalPickNonce.current += 1;
                setPicked({ address: cl.location, latitude: lat, longitude: lng });
                setExternalAddressPick({ address: cl.location, latitude: lat, longitude: lng, nonce: externalPickNonce.current });
            }
        } else if (!cl && picked) {
            syncingFromParent.current = true;
            setPicked(null);
            setExternalAddressPick(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controlledLocation, externalForm, referenceMode, isWorkshopOnly]);

    const workshopMapProps = expertLocation
        ? {
              onLocationSelect: () => {},
              onLocationRejected: () => {},
              onLocationClear: () => {},
              initialLocation: {
                  latitude: expertLocation.latitude,
                  longitude: expertLocation.longitude,
              },
              expertLocation,
              expertRange: 0,
              expertCountry,
              disabled: true,
              showSearch: false,
              showCountrySelector: false as const,
              frameless: true as const,
              searchMinimal: true as const,
              coverageStyle: 'minimal' as const,
              referencePreview: true,
          }
        : null;

    if (isWorkshopOnly && workshopMapProps && (isWizard || isSidebar)) {
        return (
            <div
                className={cn(
                    isWizard ? 'relative h-full min-h-0' : 'flex h-full min-h-0 w-full flex-1 flex-col bg-white',
                )}
            >
                <CheckoutSelfChoicePreviewMap className="h-full min-h-0" showInnerHeader={!isWizard}>
                    <AppointmentMap
                        {...workshopMapProps}
                        className="h-full w-full min-h-[inherit]"
                    />
                </CheckoutSelfChoicePreviewMap>
            </div>
        );
    }

    if (isWorkshopOnly) {
        return (
            <div className={cn('overflow-hidden', SD_CHECKOUT_DESKTOP_CARD_CLASS)}>
                <div className={SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS}>
                    <h3 className="text-sm font-semibold tracking-[-0.01em] text-ink-strong">
                        Ubicación del taller
                    </h3>
                    <p className="mt-0.5 text-kicker text-ink-muted">
                        La inspección es en el punto fijo del experto.
                    </p>
                </div>
                {workshopMapProps ? (
                    <div className="h-[min(56vh,420px)]">
                        <AppointmentMap {...workshopMapProps} className="h-full w-full" />
                    </div>
                ) : (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                        <div className="flex items-center gap-2 text-blue-900">
                            <MapPin className="h-5 w-5" />
                            <h3 className="text-base font-semibold">La inspección es en el taller del experto</h3>
                        </div>
                        <p className="mt-1 text-sm text-blue-800">
                            Este experto trabaja en su punto fijo, así que no necesitas elegir ubicación.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    const handleLocationSelect = (location: { address: string; latitude: number; longitude: number }) => {
        if (referenceMode) return;
        setPicked(location);
        expandDrawerForEdit();
    };

    const handleLocationRejected = (_info: { reason: 'out_of_range'; address: string }) => {
        if (referenceMode) return;
        showToast('error', 'Esta dirección está fuera del área del experto. Elige un punto dentro del círculo.');
    };

    const handleLocationClear = () => {
        if (referenceMode) return;
        setPicked(null);
        setExternalAddressPick(null);
    };

    const handleSearchAddressSelect = (selection: MapAddressSelection) => {
        if (referenceMode || !expertLocation) return;

        const rangeKm = expertRange ?? 25;
        const distanceKm = haversineDistanceKm(
            expertLocation.latitude,
            expertLocation.longitude,
            selection.lat,
            selection.lng,
        );

        if (distanceKm > rangeKm) {
            handleLocationRejected({ reason: 'out_of_range', address: selection.address });
            return;
        }

        setExternalAddressPick({
            address: selection.address,
            latitude: selection.lat,
            longitude: selection.lng,
            nonce: Date.now(),
        });
        handleLocationSelect({
            address: selection.address,
            latitude: selection.lat,
            longitude: selection.lng,
        });
    };

    const wizardPickLocation = isWizard && !referenceMode && !isWorkshopOnly;

    const mapProps = {
        onLocationSelect: handleLocationSelect,
        onLocationRejected: handleLocationRejected,
        onLocationClear: handleLocationClear,
        initialLocation: picked ? { latitude: picked.latitude, longitude: picked.longitude } : undefined,
        expertLocation,
        expertRange,
        expertCountry,
        disabled: false,
        showSearch: !referenceMode && !wizardPickLocation && !externalForm,
        showCountrySelector: false as const,
        frameless: true as const,
        searchMinimal: true as const,
        coverageStyle: 'minimal' as const,
        referencePreview: referenceMode,
        externalAddressPick: wizardPickLocation || externalForm ? externalAddressPick : null,
    };

    const mapHeightCls = isWizard || isSidebar ? 'h-full min-h-[inherit]' : 'h-[min(56vh,420px)] lg:h-full lg:min-h-0';

    const fieldProps = {
        picked,
        doorNumber,
        siteDetails,
        onDoorChange: setDoorNumber,
        onDetailsChange: setSiteDetails,
    };

    if (wizardPickLocation) {
        return (
            <CheckoutSelfChoicePickLocationShell
                showInnerHeader={false}
                searchBar={
                    <MapAddressSearchBar
                        overlay
                        country={expertCountry}
                        proximity={
                            expertLocation
                                ? { lat: expertLocation.latitude, lng: expertLocation.longitude }
                                : null
                        }
                        placeholder="Buscar dirección…"
                        value={picked?.address ?? null}
                        onSelect={handleSearchAddressSelect}
                        onClear={handleLocationClear}
                    />
                }
            >
                <div className="relative h-full min-h-0 w-full">
                    <AppointmentMap
                        {...mapProps}
                        boundsPadding={{ top: 88, bottom: 96, left: 28, right: 28 }}
                        className="h-full w-full min-h-[inherit]"
                    />
                    <LocationMapDrawer
                        {...fieldProps}
                        expanded={drawerExpanded}
                        onToggle={() => setDrawerExpanded((v) => !v)}
                        doorInputRef={doorInputRef}
                    />
                </div>
            </CheckoutSelfChoicePickLocationShell>
        );
    }

    if (isSidebar) {
        return (
            <div className="flex h-full min-h-0 w-full flex-col bg-white">
                {showEmbeddedHeader ? (
                    <CheckoutEmbeddedStepHeader
                        step={3}
                        title="¿Dónde es la inspección?"
                        description={
                            referenceMode
                                ? 'Explora el mapa y la zona de cobertura del experto. Puedes mover y ampliar la vista; la dirección exacta la confirmará el vendedor al reservar.'
                                : 'Indica dónde está el vehículo para que el experto acuda a revisarlo. La inspección debe ser dentro del área marcada en el mapa. Solo el profesional que contrates verá la dirección exacta.'
                        }
                    />
                ) : null}
                <div className="relative min-h-0 w-full flex-1">
                    {referenceMode ? (
                        <CheckoutSellerChoicePreviewMap
                            className="h-full min-h-0 w-full flex-1"
                            overlayLegend
                        >
                            <AppointmentMap
                                {...mapProps}
                                className="h-full w-full"
                            />
                        </CheckoutSellerChoicePreviewMap>
                    ) : (
                    <>
                    <AppointmentMap
                        {...mapProps}
                        className="h-full w-full"
                    />
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className={cn(
                            'absolute right-4 z-[10] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-muted shadow-sm backdrop-blur-sm transition-[transform,bottom,top] duration-300 active:scale-95',
                            externalForm ? 'bottom-4 top-auto' : 'bottom-[8.75rem] top-auto',
                        )}
                        aria-label="Ampliar mapa a pantalla completa"
                    >
                        <Maximize2 className="h-4 w-4" aria-hidden />
                    </button>
                    {!externalForm ? (
                    <LocationMapDrawer
                        {...fieldProps}
                        expanded={drawerExpanded}
                        onToggle={() => setDrawerExpanded((v) => !v)}
                        doorInputRef={doorInputRef}
                        desktopSidebar
                    />
                    ) : null}
                    </>
                    )}
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
                        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-ink-strong">Ubicación de la inspección</p>
                                <p className="truncate text-xs text-ink-muted">
                                    {referenceMode
                                        ? 'Zona de cobertura del experto'
                                        : picked?.address ?? 'Marca un punto dentro del área del experto'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setExpanded(false)}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink"
                                aria-label="Cerrar mapa ampliado"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>
                        <div className="relative min-h-0 flex-1">
                            <AppointmentMap {...mapProps} className="h-full w-full" />
                        </div>
                        {!referenceMode && !externalForm && picked ? (
                        <footer className="shrink-0 border-t border-line-soft p-4">
                            <LocationDetailsFields {...fieldProps} drawerDesktop doorInputRef={doorInputRef} />
                        </footer>
                        ) : null}
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
                    <h3 className="text-sm font-semibold tracking-[-0.01em] text-ink-strong">
                        ¿Dónde es la inspección?
                    </h3>
                    <p className="mt-0.5 text-kicker text-ink-muted lg:block">
                        {referenceMode
                            ? 'Vista previa de la zona. La dirección la elige el vendedor al reservar.'
                            : 'Busca la dirección o haz clic en el mapa.'}
                    </p>
                </div>
            ) : null}

            <div
                className={cn(
                    'lg:grid lg:h-[248px] lg:items-stretch',
                    picked && !referenceMode
                        ? 'lg:grid-cols-[minmax(0,1fr)_260px]'
                        : 'lg:grid-cols-1',
                    isWizard && 'absolute inset-0',
                )}
            >
                <div
                    className={cn(
                        isWizard
                            ? 'absolute inset-0 h-full w-full'
                            : 'relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 lg:relative lg:left-0 lg:h-full lg:w-full lg:max-w-none lg:translate-x-0 lg:overflow-hidden lg:border-r lg:border-line-soft',
                        mapHeightCls,
                    )}
                >
                    {referenceMode ? (
                        <CheckoutSellerChoicePreviewMap className="h-full min-h-0">
                            <AppointmentMap
                                {...mapProps}
                                className="h-full w-full min-h-[inherit]"
                            />
                        </CheckoutSellerChoicePreviewMap>
                    ) : (
                    <>
                    <AppointmentMap
                        {...mapProps}
                        className="h-full w-full min-h-[inherit]"
                    />

                    {!isWizard ? (
                        <button
                            type="button"
                            onClick={() => setExpanded(true)}
                            className={cn(
                                'absolute right-3 z-[10] inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/95 text-ink shadow-[0_4px_16px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-[transform,bottom] duration-300 active:scale-95 lg:bottom-3 lg:right-3',
                                picked && drawerExpanded
                                    ? 'bottom-[min(calc(54vh+0.5rem),calc(380px+0.5rem))] lg:bottom-3'
                                    : picked
                                      ? 'bottom-[7rem] lg:bottom-3'
                                      : 'bottom-3 lg:bottom-3',
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
                    </>
                    )}
                </div>

                {/* Desktop: panel lateral solo tras elegir ubicación */}
                {!referenceMode && picked ? (
                <div className="hidden h-full min-h-0 flex-col overflow-y-auto bg-white p-3.5 lg:flex">
                    <LocationDetailsFields {...fieldProps} doorInputRef={doorInputRef} compact />
                </div>
                ) : null}
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

                    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink-strong">Ubicación de la inspección</p>
                            <p className="truncate text-xs text-ink-muted">
                                {picked?.address ?? 'Marca un punto dentro del área del experto'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setExpanded(false)}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-tinted text-ink transition-colors hover:bg-line-soft"
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

                    <div className="shrink-0 rounded-t-[1.25rem] border-t border-line bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                        {picked ? (
                            <p className="mb-2 flex items-start gap-1.5 text-meta text-ink">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-strong" aria-hidden />
                                <span className="line-clamp-2">{picked.address}</span>
                            </p>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => setExpanded(false)}
                            disabled={!picked}
                            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand text-lead font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
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
