import { cn } from '../../lib/utils';
import { MapAddressSearchBar, type MapAddressSelection } from '../MapAddressSearchBar';
import {
    isValidSellerPhone,
    isValidSellerEmail,
    SellerContactAvatar,
} from './CheckoutSellerCoordinationFields';
import { PhoneInputField } from './PhoneInputField';
import {
    GroupedFieldsCard,
    GroupedFieldRow,
    GroupedFieldsDivider,
    groupedLabelClass,
    bareGroupedInputClass,
    underlineFieldInputClass,
} from './GroupedFieldsCard';

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
    'h-11 w-full rounded-lg border border-line bg-white px-3.5 text-body text-ink-strong shadow-[0_1px_2px_rgba(16,24,40,0.05)] placeholder:text-ink-soft outline-none transition-[border-color,box-shadow] duration-150 focus:border-brand focus:shadow-[0_0_0_3px_rgba(0,102,204,0.14)]';

const labelBaseClass = 'mb-1 block text-caption font-semibold text-ink';

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
        <div className={cn('flex h-full flex-col', mode === 'seller' ? 'gap-5' : 'gap-4')}>
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
                            <p className="text-caption leading-relaxed text-ink-muted">
                                Búscala aquí o marca un punto en el mapa, dentro del área de cobertura del experto.
                            </p>
                        ) : null}
                    </section>

                    {chosenLocation ? (
                        <section className="space-y-2.5">
                            <div>
                                <label htmlFor="checkout-door-desktop" className={labelBaseClass}>
                                    Puerta / garaje <span className="font-normal text-ink-muted">(opc.)</span>
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
                                    Indicaciones <span className="font-normal text-ink-muted">(opc.)</span>
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
            <section className={cn('space-y-3.5', mode === 'self' && 'border-t border-line-soft pt-4')}>
                {/* En modo seller el título y el lead viven SOLO en la cabecera del paso
                    (CheckoutDesktopAppointmentHeader): nada de repetir «¿Cómo contactamos…?»
                    dentro de la tarjeta. En self la sección sí necesita su propio título
                    porque la página va de la ubicación y esto es un bloque secundario opcional. */}
                {mode === 'self' ? (
                    <div className="flex items-start gap-3">
                        <SellerContactAvatar />
                        <div className="min-w-0 flex-1">
                            <h3 className="text-body font-semibold text-ink-strong">
                                Datos del vendedor
                                <span className="ml-1 font-normal text-ink-muted">(opcional)</span>
                            </h3>
                            <p className="mt-0.5 text-caption leading-relaxed text-ink-muted">
                                Si quieres, deja un contacto para que el experto pueda coordinar el acceso al vehículo.
                            </p>
                        </div>
                    </div>
                ) : null}

                {/* Grupo de contacto: teléfono + email en un solo contenedor. */}
                <GroupedFieldsCard error={showContactError}>
                    <GroupedFieldRow
                        first
                        comfortable={mode === 'seller'}
                        htmlFor="location-seller-phone"
                        label={
                            <>
                                Teléfono
                                {mode === 'self' ? <span className="font-normal text-ink-muted"> (opc.)</span> : null}
                            </>
                        }
                    >
                        <PhoneInputField
                            bare
                            id="location-seller-phone"
                            name="location-seller-phone"
                            value={sellerPhone}
                            onChange={onSellerPhoneChange}
                            aria-invalid={phoneFieldError}
                            defaultCountry="ES"
                        />
                    </GroupedFieldRow>
                    {/* «o» sobre el filete: con uno de los dos basta. La fila siguiente lleva
                        `first` para no duplicar el border-t del separador. */}
                    <GroupedFieldsDivider label="o" />
                    <GroupedFieldRow
                        first
                        comfortable={mode === 'seller'}
                        htmlFor="location-seller-email"
                        label={
                            <>
                                Email
                                {mode === 'self' ? <span className="font-normal text-ink-muted"> (opc.)</span> : null}
                            </>
                        }
                    >
                        <input
                            id="location-seller-email"
                            type="email"
                            value={sellerEmail}
                            onChange={(e) => onSellerEmailChange(e.target.value)}
                            placeholder="vendedor@email.com"
                            className={bareGroupedInputClass}
                            autoComplete="email"
                            aria-invalid={emailFieldError}
                        />
                    </GroupedFieldRow>
                </GroupedFieldsCard>
                {showContactError ? (
                    <p role="alert" className="text-caption font-medium text-red-600">
                        {bothEmpty
                            ? 'Añade un teléfono o un email para continuar.'
                            : 'Revisa el contacto: un móvil o un email válido.'}
                    </p>
                ) : null}

                {/* Enlace del anuncio: campo secundario y opcional, fuera del grupo obligatorio.
                    Subrayado en vez de caja propia: lo demota deliberadamente por debajo del
                    contacto en peso visual (mismo recurso que Stripe usa para campos opcionales
                    de baja frecuencia), en vez de darle el mismo peso que un campo requerido. */}
                <div className="pt-0.5">
                    <label htmlFor="location-seller-listing" className={groupedLabelClass}>
                        Enlace del anuncio <span className="font-normal text-ink-muted">(opc.)</span>
                    </label>
                    <input
                        id="location-seller-listing"
                        type="url"
                        value={sellerListingUrl}
                        onChange={(e) => onSellerListingUrlChange(e.target.value)}
                        placeholder="Wallapop, Milanuncios, etc."
                        className={underlineFieldInputClass}
                        inputMode="url"
                    />
                </div>

                {mode === 'seller' ? (
                    <p className="text-caption leading-[1.55] text-ink-muted">
                        Tras pagar, el vendedor recibe un enlace para reservar. Tú recibirás la cita y la
                        dirección confirmadas.
                    </p>
                ) : null}
            </section>
        </div>
    );
}
