import { MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MapAddressSearchBar, type MapAddressSelection } from '../MapAddressSearchBar';
import {
    isValidSellerPhone,
    isValidSellerEmail,
    SellerContactAvatar,
} from './CheckoutSellerCoordinationFields';
import { PhoneInputField } from './PhoneInputField';

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
    'h-11 w-full rounded-lg border border-[#dcdfe4] bg-white px-3.5 text-[14px] text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.05)] placeholder:text-[#9aa0aa] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#3d5afe] focus:shadow-[0_0_0_3px_rgba(61,90,254,0.14)]';

const labelBaseClass = 'mb-1 block text-[12px] font-semibold text-[#374151]';

export function CheckoutDesktopLocationStepBody({
    mode,
    expertLatitude,
    expertLongitude,
    expertCountry,
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
        <div className="flex h-full flex-col gap-4">
            {/* Dirección + detalles SOLO en "Yo la reservo": el cliente marca el punto en el
                mapa de la derecha (que ya no lleva formulario superpuesto) y rellena aquí los
                datos. En "Que lo coordine Inspecciono" la dirección la fija el vendedor al
                reservar, así que aquí no se pide (el mapa es solo la zona de cobertura). */}
            {mode === 'self' ? (
                <>
                    <section className="space-y-2.5">
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
                        {!chosenLocation ? (
                            <p className="text-[12px] leading-relaxed text-[#64748b]">
                                Búscala aquí o marca un punto en el mapa, dentro del área de cobertura del experto.
                            </p>
                        ) : null}
                    </section>

                    {chosenLocation ? (
                        <section className="space-y-2.5">
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
            <section className={cn('space-y-3', mode === 'self' && 'border-t border-[#f0f0f0] pt-4')}>
                <div className="flex items-start gap-3">
                    <SellerContactAvatar />
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

                <div className="space-y-2.5">
                    <div className="space-y-2.5">
                        <div>
                            <label htmlFor="location-seller-phone" className={labelBaseClass}>
                                Teléfono
                                {mode === 'self' ? (
                                    <span className="ml-1 font-normal text-[#9ca3af]">(opc.)</span>
                                ) : null}
                            </label>
                            <PhoneInputField
                                id="location-seller-phone"
                                name="location-seller-phone"
                                value={sellerPhone}
                                onChange={onSellerPhoneChange}
                                error={phoneFieldError}
                                aria-invalid={phoneFieldError}
                                defaultCountry="ES"
                            />
                        </div>

                        <div>
                            <label htmlFor="location-seller-email" className={labelBaseClass}>
                                Email
                                {mode === 'self' ? (
                                    <span className="ml-1 font-normal text-[#9ca3af]">(opc.)</span>
                                ) : null}
                            </label>
                            <input
                                id="location-seller-email"
                                type="email"
                                value={sellerEmail}
                                onChange={(e) => onSellerEmailChange(e.target.value)}
                                placeholder="vendedor@email.com"
                                className={cn(inputBaseClass, emailFieldError && 'border-[#f04438] focus:border-[#f04438] focus:shadow-[0_0_0_3px_rgba(240,68,56,0.14)]')}
                                autoComplete="email"
                                aria-invalid={emailFieldError}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="location-seller-listing" className={labelBaseClass}>
                            Enlace del anuncio <span className="font-normal text-[#9ca3af]">(opc.)</span>
                        </label>
                        <input
                            id="location-seller-listing"
                            type="url"
                            value={sellerListingUrl}
                            onChange={(e) => onSellerListingUrlChange(e.target.value)}
                            placeholder="Wallapop, Milanuncios, etc."
                            className={inputBaseClass}
                            inputMode="url"
                        />
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

            {mode === 'seller' ? (
                <div className="mt-auto flex items-start gap-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#64748b]" aria-hidden />
                    <p className="text-[12px] leading-relaxed text-[#64748b]">
                        No hace falta indicar la dirección exacta. El vendedor la confirmará al reservar desde el enlace que le enviaremos.
                    </p>
                </div>
            ) : null}
        </div>
    );
}
