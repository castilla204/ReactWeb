import { MapPin, Check, Mail, Link2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MapAddressSearchBar, type MapAddressSelection } from '../MapAddressSearchBar';
import {
    PhoneInput,
    isValidSellerPhone,
    isValidSellerEmail,
} from './CheckoutSellerCoordinationFields';

export interface CheckoutDesktopLocationStepBodyProps {
    /** Modo: el cliente reserva (self) o Inspecciono coordina (seller). */
    mode: 'self' | 'seller';
    /** Coordenadas del experto para centrar la búsqueda. */
    expertLatitude?: number | string | null;
    expertLongitude?: number | string | null;
    expertCountry?: string | null;
    expertRange?: number | null;
    /** Ubicación actualmente elegida. */
    chosenLocation: {
        location: string;
        latitude: string | null;
        longitude: string | null;
        doorNumber: string | null;
        siteDetails: string | null;
    } | null;
    /** Callback cuando cambia la ubicación (dirección + detalles). */
    onLocationChange: (location: {
        location: string;
        latitude: string | null;
        longitude: string | null;
        doorNumber: string | null;
        siteDetails: string | null;
    } | null) => void;
    /** Datos de contacto del vendedor (solo modo self). */
    sellerPhone: string;
    sellerEmail: string;
    sellerListingUrl: string;
    onSellerPhoneChange: (value: string) => void;
    onSellerEmailChange: (value: string) => void;
    onSellerListingUrlChange: (value: string) => void;
    /** Resalta campos de contacto vacíos/inválidos tras intentar continuar. */
    showSellerValidation?: boolean;
}

const inputBaseClass =
    'w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 py-2.5 text-[13px] text-[#1c1c1c] placeholder:text-[#9ca3af] transition-colors focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/15';

const labelBaseClass = 'mb-1.5 block text-[12px] font-semibold text-[#374151]';

const phoneInputClass =
    '!w-full !h-11 !rounded-xl !border !border-[#e5e7eb] !bg-white !text-[13px] !text-[#1c1c1c] focus:!border-brand/40 focus:!ring-2 focus:!ring-brand/15';

export function CheckoutDesktopLocationStepBody({
    mode,
    expertLatitude,
    expertLongitude,
    expertCountry,
    expertRange,
    chosenLocation,
    onLocationChange,
    sellerPhone,
    sellerEmail,
    sellerListingUrl,
    onSellerPhoneChange,
    onSellerEmailChange,
    onSellerListingUrlChange,
    showSellerValidation = false,
}: CheckoutDesktopLocationStepBodyProps) {
    const latNum = expertLatitude != null ? Number(expertLatitude) : NaN;
    const lngNum = expertLongitude != null ? Number(expertLongitude) : NaN;
    const hasExpertCoords = Number.isFinite(latNum) && Number.isFinite(lngNum) && (latNum !== 0 || lngNum !== 0);
    const proximity = hasExpertCoords ? { lat: latNum, lng: lngNum } : null;

    const doorNumber = chosenLocation?.doorNumber ?? '';
    const siteDetails = chosenLocation?.siteDetails ?? '';

    const handleAddressSelect = (selection: MapAddressSelection) => {
        onLocationChange({
            location: selection.address,
            latitude: String(selection.lat),
            longitude: String(selection.lng),
            doorNumber: doorNumber.trim() || null,
            siteDetails: siteDetails.trim() || null,
        });
    };

    const handleClearAddress = () => {
        onLocationChange(null);
    };

    const updateDetails = (patch: { doorNumber?: string; siteDetails?: string }) => {
        if (!chosenLocation) return;
        onLocationChange({
            ...chosenLocation,
            doorNumber: patch.doorNumber?.trim() || null,
            siteDetails: patch.siteDetails?.trim() || null,
        });
    };

    const phoneFilled = sellerPhone.trim().length > 0;
    const emailFilled = sellerEmail.trim().length > 0;
    const bothEmpty = !phoneFilled && !emailFilled;
    const phoneBad = phoneFilled && !isValidSellerPhone(sellerPhone);
    const emailBad = emailFilled && !isValidSellerEmail(sellerEmail);
    // 🤝 El contacto del vendedor SOLO es obligatorio en "Que lo coordine Inspecciono"
    // (le enviamos el enlace de reserva). En "Yo la reservo" se pide pero es opcional, así
    // que nunca bloquea ni marca error (el cliente ya coordina con el vendedor por su cuenta).
    const sellerContactRequired = mode === 'seller';
    const sellerContactOk = isValidSellerEmail(sellerEmail) || isValidSellerPhone(sellerPhone);
    const showContactError = showSellerValidation && sellerContactRequired && !sellerContactOk;
    const phoneFieldError = showContactError && (phoneBad || bothEmpty);
    const emailFieldError = showContactError && (emailBad || bothEmpty);

    return (
        <div className="flex h-full flex-col gap-5">
            {/* Dirección + detalles SOLO en "Yo la reservo": el cliente marca el punto en el
                mapa. En "Que lo coordine Inspecciono" la dirección la fija el vendedor al reservar,
                así que aquí no se pide (el mapa de la derecha es solo la zona de cobertura). */}
            {mode === 'self' ? (
                <>
                    <section className="space-y-3">
                        <label className={labelBaseClass}>Dirección de la inspección</label>
                        <MapAddressSearchBar
                            embedded
                            country={expertCountry}
                            proximity={proximity}
                            placeholder="Buscar dirección…"
                            value={chosenLocation?.location ?? null}
                            onSelect={handleAddressSelect}
                            onClear={handleClearAddress}
                            className="w-full"
                        />

                        {chosenLocation ? (
                            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                                <p className="min-w-0 flex-1 text-[13px] leading-snug text-emerald-900">
                                    {chosenLocation.location}
                                </p>
                            </div>
                        ) : (
                            <p className="text-[12px] leading-relaxed text-[#64748b]">
                                Marca un punto en el mapa de la derecha o búscala aquí. Debe estar dentro del área de cobertura del experto.
                            </p>
                        )}
                    </section>

                    {chosenLocation ? (
                        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label htmlFor="checkout-door-desktop" className={labelBaseClass}>
                                    Puerta / garaje <span className="font-normal text-[#9ca3af]">(opc.)</span>
                                </label>
                                <input
                                    id="checkout-door-desktop"
                                    type="text"
                                    value={doorNumber}
                                    onChange={(e) => updateDetails({ doorNumber: e.target.value })}
                                    placeholder="3B, garaje 12…"
                                    className={inputBaseClass}
                                    autoComplete="address-line2"
                                />
                            </div>
                            <div>
                                <label htmlFor="checkout-details-desktop" className={labelBaseClass}>
                                    Indicaciones <span className="font-normal text-[#9ca3af]">(opc.)</span>
                                </label>
                                <input
                                    id="checkout-details-desktop"
                                    type="text"
                                    value={siteDetails}
                                    onChange={(e) => updateDetails({ siteDetails: e.target.value })}
                                    placeholder="Parking, portal, referencias…"
                                    className={inputBaseClass}
                                />
                            </div>
                        </section>
                    ) : null}
                </>
            ) : null}

            {/* 🤝 Datos del vendedor — en AMBOS modos. Obligatorios en "Que lo coordine
                Inspecciono" (le mandamos el enlace de reserva); opcionales en "Yo la reservo". */}
            <section className={cn('space-y-4', mode === 'self' && 'border-t border-[#f0f0f0] pt-5')}>
                <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6]">
                        <svg className="h-4 w-4 text-[#64748b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-semibold text-[#1c1c1c]">
                            Datos del vendedor
                            {mode === 'self' ? (
                                <span className="ml-1 font-normal text-[#9ca3af]">(opcional)</span>
                            ) : null}
                        </h3>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[#64748b]">
                            {mode === 'seller'
                                ? 'Indica al menos un medio de contacto. Le enviaremos un enlace para que elija día y hora con el experto.'
                                : 'Si quieres, deja un contacto para que el experto pueda coordinar el acceso al vehículo.'}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label htmlFor="location-seller-phone" className={labelBaseClass}>
                                Teléfono
                                {mode === 'self' ? (
                                    <span className="ml-1 font-normal text-[#9ca3af]">(opc.)</span>
                                ) : null}
                            </label>
                            <div className="relative">
                                <PhoneInput
                                    country={'es'}
                                    value={sellerPhone}
                                    onChange={(value) => onSellerPhoneChange(value ? '+' + value.replace(/^\+/, '') : '')}
                                    enableSearch
                                    searchPlaceholder="Buscar país…"
                                    inputProps={{
                                        id: 'location-seller-phone',
                                        name: 'location-seller-phone',
                                        autoComplete: 'tel',
                                        'aria-invalid': phoneFieldError,
                                    }}
                                    containerClass="!w-full"
                                    inputClass={cn(phoneInputClass, phoneFieldError && '!border-red-400/50 !ring-2 !ring-red-400/50')}
                                    buttonClass="!rounded-l-xl !border !border-[#e5e7eb] !bg-white"
                                    dropdownClass="!text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="location-seller-email" className={labelBaseClass}>
                                Email
                                {mode === 'self' ? (
                                    <span className="ml-1 font-normal text-[#9ca3af]">(opc.)</span>
                                ) : null}
                            </label>
                            <div className="relative">
                                <Mail
                                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0aa]"
                                    aria-hidden
                                />
                                <input
                                    id="location-seller-email"
                                    type="email"
                                    value={sellerEmail}
                                    onChange={(e) => onSellerEmailChange(e.target.value)}
                                    placeholder="vendedor@email.com"
                                    className={cn(inputBaseClass, 'pl-10', emailFieldError && 'border-red-400/50 ring-2 ring-red-400/50')}
                                    autoComplete="email"
                                    aria-invalid={emailFieldError}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="location-seller-listing" className={labelBaseClass}>
                            Enlace del anuncio <span className="font-normal text-[#9ca3af]">(opc.)</span>
                        </label>
                        <div className="relative">
                            <Link2
                                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0aa]"
                                aria-hidden
                            />
                            <input
                                id="location-seller-listing"
                                type="url"
                                value={sellerListingUrl}
                                onChange={(e) => onSellerListingUrlChange(e.target.value)}
                                placeholder="Wallapop, Milanuncios, etc."
                                className={cn(inputBaseClass, 'pl-10')}
                                inputMode="url"
                            />
                        </div>
                    </div>

                    {showContactError ? (
                        <p role="alert" className="text-[12px] font-medium text-red-600">
                            {bothEmpty
                                ? 'Añade un teléfono o un email para continuar.'
                                : 'Revisa el contacto: un móvil o un email válido.'}
                        </p>
                    ) : null}
                </div>
            </section>

            <div className="mt-auto flex items-start gap-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#64748b]" aria-hidden />
                <p className="text-[12px] leading-relaxed text-[#64748b]">
                    {mode === 'seller'
                        ? 'No hace falta indicar la dirección exacta. El vendedor la confirmará al reservar desde el enlace que le enviaremos.'
                        : 'Solo el experto que contrates verá la dirección exacta. El experto contactará con el vendedor para confirmar el acceso.'}
                </p>
            </div>
        </div>
    );
}
