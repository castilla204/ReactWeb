import React from 'react';
import { Send, UserRound } from 'lucide-react';
import { PhoneInputField } from './PhoneInputField';
import { cn } from '../../lib/utils';
import {
    CHECKOUT_SELLER_PLAZO_SUMMARY,
    COORD_OPTION_SELLER_DESC,
    SELLER_BOOKING_MAX_DAYS,
    SELLER_BOOKING_MIN_LEAD_DAYS,
    SELLER_BOOKING_TARGET_WINDOW_DAYS,
    SELLER_COORD_CARD_NOTE,
    SELLER_COORD_ENLACE_DETAILED,
} from '../../utils/sellerBookingWindow';

export {
    CHECKOUT_SELLER_PLAZO_SUMMARY,
    COORD_OPTION_SELLER_DESC,
    SELLER_COORD_CALENDAR_PREVIEW_NOTE,
} from '../../utils/sellerBookingWindow';

// Estética de formulario profesional (Stripe / Linear): campo BLANCO con borde de 1px y una
// sombra muy sutil, esquinas de 8px, SIN icono decorativo dentro. La etiqueta identifica el
// campo; el interior queda limpio. Nada de píldoras ni rellenos grises (leen «de juguete»).
// Al enfocar: el borde pasa a la marca y aparece un halo suave de 3px.
const fieldBaseClass =
    'h-11 w-full rounded-lg border border-[#dcdfe4] bg-white px-3.5 text-[14px] text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.05)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#9aa0aa] focus:border-[#3d5afe] focus:shadow-[0_0_0_3px_rgba(61,90,254,0.14)]';

const fieldErrorClass =
    'border-[#f04438] focus:border-[#f04438] focus:shadow-[0_0_0_3px_rgba(240,68,56,0.14)]';

const fieldLabelClass = 'block text-[13px] font-semibold text-[#374151]';

const listingUrlFieldClass = fieldBaseClass;

export type SellerCoordinationFieldsVariant = 'full' | 'contact' | 'plazos';

/**
 * Icono circular para la cabecera de «Datos del vendedor». Decorativo (el título ya
 * describe la sección). Antes era una foto de stock (pravatar) que parecía un vendedor
 * falso; un icono de persona en un círculo de marca es honesto y más profesional.
 */
export function SellerContactAvatar({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand',
                className,
            )}
        >
            <UserRound className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
    );
}

export interface CheckoutSellerCoordinationFieldsProps {
    sellerPhone: string;
    sellerEmail: string;
    sellerListingUrl: string;
    onSellerPhoneChange: (value: string) => void;
    onSellerEmailChange: (value: string) => void;
    onSellerListingUrlChange: (value: string) => void;
    /** Móvil: paso plazos o contacto por separado; desktop usa full. */
    variant?: SellerCoordinationFieldsVariant;
    /** Texto mínimo en checkout desktop integrado (Coordínalo Inspecciono). */
    minimal?: boolean;
    /** Resalta campos vacíos tras intentar continuar sin contacto. */
    showValidation?: boolean;
    /**
     * Modo «Yo la reservo»: el contacto del vendedor es OPCIONAL y el cliente coordina
     * por su cuenta, así que se oculta el aviso del enlace de reserva (copy de seller).
     */
    selfMode?: boolean;
    className?: string;
}

const SELLER_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Compacta el teléfono: quita espacios/.-() para inspeccionar dígitos y prefijo.
const sellerPhoneCompact = (p: string) => p.trim().replace(/[\s.\-()]/g, '');

/** Email del vendedor con formato válido. */
export function isValidSellerEmail(email: string) {
    return SELLER_EMAIL_RE.test(email.trim());
}
/**
 * Teléfono VÁLIDO COMO CANAL DE SMS = móvil. ES (nacional o +34/0034): debe empezar por 6 o 7
 * (8/9 son FIJOS y NO reciben SMS). Internacional de otro país (+xx): se acepta (8–15 dígitos).
 */
export function isValidSellerPhone(phone: string) {
    const c = sellerPhoneCompact(phone);
    // Internacional de OTRO país (+, distinto de +34): aceptar 8–15 dígitos.
    if (/^\+/.test(c) && !/^\+34/.test(c)) {
        const d = c.replace(/\D/g, '');
        return d.length >= 8 && d.length <= 15;
    }
    // ES (nacional o +34/0034): móvil = empieza por 6 o 7, 9 dígitos.
    const nat = c.replace(/^(\+34|0034)/, '');
    return /^[67]\d{8}$/.test(nat);
}

export { PhoneInputField };

/**
 * Se puede continuar si hay AL MENOS un canal que FUNCIONE: email válido o MÓVIL válido (un fijo no
 * recibe SMS → no cuenta). Un campo presente pero inválido NO bloquea si el otro es válido (igual que
 * el backend, que descarta el canal inválido). El backend (SearchController) revalida (anti-bypass).
 */
export function sellerCoordinationCanContinue(phone: string, email: string) {
    return isValidSellerEmail(email) || (phone.trim().length > 0 && isValidSellerPhone(phone));
}

/** Texto reutilizable del plazo del vendedor (checkout Coordínalo Inspecciono). */
// CHECKOUT_SELLER_PLAZO_SUMMARY — ver sellerBookingWindow.ts

/** Copy tarjetas paso 1 — quién elige la fecha. Los títulos RESPONDEN a la pregunta
 * de la cabecera («¿Quién elige la fecha?») en primera persona, como lo diría el usuario. */
export const COORD_OPTION_SELF_TITLE = 'La elijo yo ahora';
export const COORD_OPTION_SELF_TAGLINE = 'En el calendario del experto';
export const COORD_OPTION_SELF_DESC =
    'Ideal si ya has hablado con el vendedor. Eliges día, hora y dirección en el siguiente paso; el experto solo tiene que confirmar la cita.';
// COORD_OPTION_SELLER_TITLE + COORD_OPTION_SELLER_DESC — sellerBookingWindow.ts re-export arriba
export const COORD_OPTION_SELLER_TITLE = 'Que la elija el vendedor';
export const COORD_OPTION_SELLER_TAGLINE = 'Le enviamos un enlace tras el pago';
export const COORD_OPTION_FREE_CANCEL = 'Cancelación sin coste';
/** @deprecated Usar COORD_OPTION_FREE_CANCEL */
export const COORD_OPTION_SELLER_OFFER = COORD_OPTION_FREE_CANCEL;

/** Paso 2 checkout desktop — «Fecha y hora» (modo Yo reservo la cita). */
export const COORD_SELF_SLOT_STEP_DESC =
    'Tú reservas el hueco de la inspección con el experto. Pulsa un día en verde en el calendario y elige la hora concreta a la derecha.';

export const COORD_SELF_CALENDAR_HEADER_LEAD = 'Elige día y hora';
export const COORD_SELF_CALENDAR_HEADER_DETAIL =
    'Pulsa un día en verde y selecciona la hora concreta de la cita.';

export const COORD_SELF_LOCATION_HEADER_LEAD = 'Ubicación del taller';
export const COORD_SELF_LOCATION_HEADER_DETAIL =
    'La inspección es en el punto fijo del experto. Deberás desplazarte tú al taller.';

export const COORD_SELF_PICK_LOCATION_HEADER_LEAD = '¿Dónde es la inspección?';
export const COORD_SELF_PICK_LOCATION_HEADER_DETAIL =
    'Busca la dirección o marca un punto dentro del área azul del mapa.';

/** Aviso del enlace al vendedor (tarjeta Inspecciono lo coordina). */
export function CheckoutSellerEnlaceInfoNote({
    className,
    detailed = false,
}: {
    className?: string;
    /** Bloque ampliado en el formulario de contacto del vendedor */
    detailed?: boolean;
}) {
    if (detailed) {
        return (
            <div
                className={cn(
                    'flex items-start gap-2.5 rounded-lg border border-[#e7e9ee] bg-[#fafbfc] px-3.5 py-3',
                    className,
                )}
                role="note"
            >
                <Send className="mt-[2px] h-[15px] w-[15px] shrink-0 text-[#6b7280]" strokeWidth={2} aria-hidden />
                <p className="min-w-0 text-[12.5px] leading-relaxed text-[#5b6472]">
                    {SELLER_COORD_ENLACE_DETAILED}
                </p>
            </div>
        );
    }

    return (
        <p className={cn('text-[12px] leading-relaxed text-[#565d6b]', className)}>
            {SELLER_COORD_CARD_NOTE}
        </p>
    );
}

/** Aviso modo tú eliges la fecha (tarjeta de coordinación). */
export function CheckoutSelfCoordinationInfoNote({ className }: { className?: string }) {
    return (
        <p className={cn('text-[12px] leading-relaxed text-[#475569]', className)}>
            Al pagar, la cita queda reservada al instante con el día y la hora que elijas. El experto la
            confirma después.
        </p>
    );
}

/** Aviso de plazos del vendedor (checkout Coordínalo Inspecciono). */
export function CheckoutSellerPlazoNotice({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'rounded-xl border border-[#e8e8e8] bg-[#fafafa] px-3.5 py-2.5',
                className,
            )}
            role="note"
        >
            <p className="text-[13px] leading-[1.55] text-[#565d6b]">{CHECKOUT_SELLER_PLAZO_SUMMARY}</p>
        </div>
    );
}

interface LabeledFieldProps {
    id: string;
    label: string;
    optional?: boolean;
    children: React.ReactNode;
}

function LabeledField({ id, label, optional, children }: LabeledFieldProps) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className={fieldLabelClass}>
                {label}
                {optional ? (
                    <span className="ml-1.5 font-normal text-[#9ca3af]">(opcional)</span>
                ) : null}
            </label>
            {children}
        </div>
    );
}

export function CheckoutSellerCoordinationFields({
    sellerPhone,
    sellerEmail,
    sellerListingUrl,
    onSellerPhoneChange,
    onSellerEmailChange,
    onSellerListingUrlChange,
    variant = 'full',
    minimal = false,
    showValidation = false,
    selfMode = false,
    className,
}: CheckoutSellerCoordinationFieldsProps) {
    const showContact = variant === 'full' || variant === 'contact';
    const showPlazos = variant === 'full' || variant === 'plazos';
    const phoneFilled = sellerPhone.trim().length > 0;
    const emailFilled = sellerEmail.trim().length > 0;
    const bothEmpty = !phoneFilled && !emailFilled;
    const phoneBad = phoneFilled && !isValidSellerPhone(sellerPhone);
    const emailBad = emailFilled && !isValidSellerEmail(sellerEmail);
    // Solo resaltamos campos cuando de verdad NO se puede continuar (ningún canal válido). Así un fijo
    // junto a un email válido NO marca error (el email es el canal; el fijo se descarta en el backend).
    const showContactError = showValidation && !sellerCoordinationCanContinue(sellerPhone, sellerEmail);
    const phoneFieldError = showContactError && (phoneBad || bothEmpty);
    const emailFieldError = showContactError && (emailBad || bothEmpty);

    return (
        <div className={cn(showContact && showPlazos ? 'space-y-6' : 'space-y-0', className)}>
            {showContact ? (
                <div className="space-y-3.5">
                    {variant === 'contact' && !selfMode ? (
                        <CheckoutSellerEnlaceInfoNote detailed />
                    ) : null}
                    {/* Canal de contacto (móvil o email): uno de los dos basta. Se agrupan juntos
                        con separación menor entre sí que con el enlace opcional de debajo. */}
                    <div className="space-y-2.5">
                        {/* 🌍 Móvil del vendedor con selector de país (cualquier prefijo, no solo ES):
                            el Messaging Service de Twilio es global. Emite E.164 (+xx...) que el backend
                            ya entiende. Mismo componente que la verificación del experto. */}
                        <div className="space-y-1.5">
                            <label htmlFor="seller-phone" className={fieldLabelClass}>
                                Teléfono del vendedor
                            </label>
                            <PhoneInputField
                                id="seller-phone"
                                name="seller-phone"
                                value={sellerPhone}
                                onChange={onSellerPhoneChange}
                                error={phoneFieldError}
                                aria-invalid={phoneFieldError}
                                defaultCountry="ES"
                            />
                        </div>
                        <LabeledField id="seller-email" label="Email del vendedor">
                            <input
                                id="seller-email"
                                value={sellerEmail}
                                onChange={(e) => onSellerEmailChange(e.target.value)}
                                placeholder="vendedor@email.com"
                                type="email"
                                className={cn(fieldBaseClass, emailFieldError && fieldErrorClass)}
                                autoComplete="email"
                                aria-invalid={emailFieldError}
                            />
                        </LabeledField>
                        {variant !== 'contact' ? (
                            <p className="text-[12px] leading-relaxed text-[#6b7280]">
                                Indica móvil o email del vendedor y le enviaremos un enlace para que reserve.
                            </p>
                        ) : null}
                        {showContactError ? (
                            <p role="alert" className="text-[12px] font-medium text-red-600">
                                {bothEmpty
                                    ? 'Añade un teléfono o un email para continuar.'
                                    : 'Revisa el contacto: un móvil o un email válido.'}
                            </p>
                        ) : null}
                    </div>
                    <LabeledField id="seller-listing" label="Enlace del anuncio" optional>
                        <input
                            id="seller-listing"
                            value={sellerListingUrl}
                            onChange={(e) => onSellerListingUrlChange(e.target.value)}
                            placeholder="Wallapop, Milanuncios, etc."
                            type="url"
                            className={listingUrlFieldClass}
                            inputMode="url"
                        />
                    </LabeledField>
                </div>
            ) : null}

            {showPlazos ? (
                minimal ? (
                    <CheckoutSellerPlazoNotice />
                ) : (
                <div className="space-y-1.5">
                    <p className="text-[15px] leading-snug text-[#1c1c1c]">
                        El vendedor reserva entre los huecos del experto, habitualmente de{' '}
                        <span className="font-semibold">
                            {SELLER_BOOKING_MIN_LEAD_DAYS} a {SELLER_BOOKING_TARGET_WINDOW_DAYS} días
                        </span>{' '}
                        tras tu pago (hasta {SELLER_BOOKING_MAX_DAYS} si la agenda está llena).
                    </p>
                    <p className="text-[11px] leading-relaxed text-[#9ca3af]">
                        Solo podrá elegir días y horas que el experto tenga libres en su calendario.
                    </p>
                </div>
                )
            ) : null}
        </div>
    );
}
