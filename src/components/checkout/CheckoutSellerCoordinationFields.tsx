import React from 'react';
import { Link2, Mail } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
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

const fieldBaseClass =
    'w-full rounded-xl bg-[#f4f5f7] py-3 pl-10 pr-3.5 text-sm text-[#1c1c1c] outline-none transition-[background-color,box-shadow] placeholder:text-[#6b7280] focus:bg-white focus:ring-2 focus:ring-brand/30';

const fieldErrorClass = 'ring-2 ring-red-400/50 focus:ring-red-400/60';

const listingUrlFieldClass =
    'w-full rounded-xl bg-[#f4f5f7] py-3 pl-10 pr-3.5 text-sm font-semibold text-[#1c1c1c] outline-none transition-[background-color,box-shadow] placeholder:font-normal placeholder:text-[#6b7280] focus:bg-white focus:ring-2 focus:ring-brand/30';

export type SellerCoordinationFieldsVariant = 'full' | 'contact' | 'plazos';

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

export { PhoneInput };

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

/** Copy tarjetas paso 1 — coordinación de la cita. */
export const COORD_OPTION_SELF_TITLE = 'Yo la reservo';
export const COORD_OPTION_SELF_DESC =
    'Tú eliges día, hora y lugar en el calendario del experto al pagar. La cita queda confirmada en el acto.';
// COORD_OPTION_SELLER_TITLE + COORD_OPTION_SELLER_DESC — sellerBookingWindow.ts re-export arriba
export const COORD_OPTION_SELLER_TITLE = 'Que lo coordine Inspecciono';
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
                    'rounded-xl border border-[#e8e8e8] bg-[#fafafa] px-3.5 py-2.5',
                    className,
                )}
                role="note"
            >
                <p className="text-[12px] leading-relaxed text-[#565d6b]">
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

/** Aviso modo Yo reservo la cita (tarjeta de coordinación). */
export function CheckoutSelfCoordinationInfoNote({ className }: { className?: string }) {
    return (
        <p className={cn('text-[12px] leading-relaxed text-[#475569]', className)}>
            Ideal si ya tienes contacto con el vendedor. Al pagar, eliges tú el día, la hora y la dirección.
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

interface IconFieldProps {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    optional?: boolean;
    children: React.ReactNode;
}

function IconField({ id, label, icon: Icon, optional, children }: IconFieldProps) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-[12px] font-semibold text-[#374151]">
                {label}
                {optional ? (
                    <span className="ml-1 font-medium text-[#9ca3af]">(opcional)</span>
                ) : null}
            </label>
            <div className="relative">
                <Icon
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0aa]"
                    aria-hidden
                />
                {children}
            </div>
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
                <div className="space-y-3">
                    {variant === 'contact' ? (
                        <CheckoutSellerEnlaceInfoNote detailed className="mb-1" />
                    ) : null}
                    {/* 🌍 Móvil del vendedor con selector de país (cualquier prefijo, no solo ES):
                        el Messaging Service de Twilio es global. Emite E.164 (+xx...) que el backend
                        ya entiende. Mismo componente que la verificación del experto. */}
                    <div className="space-y-1.5">
                        <label htmlFor="seller-phone" className="block text-[12px] font-semibold text-[#374151]">
                            Teléfono del vendedor
                        </label>
                        <PhoneInput
                            country={'es'}
                            value={sellerPhone}
                            onChange={(value) => onSellerPhoneChange(value ? '+' + value.replace(/^\+/, '') : '')}
                            enableSearch
                            searchPlaceholder="Buscar país..."
                            inputProps={{ id: 'seller-phone', name: 'seller-phone', autoComplete: 'tel', 'aria-invalid': phoneFieldError }}
                            containerClass="!w-full"
                            inputClass={cn(
                                '!w-full !h-12 !rounded-xl !border !border-transparent !bg-[#f4f5f7] !text-sm !text-[#1c1c1c] focus:!bg-white focus:!ring-2 focus:!ring-brand/30',
                                phoneFieldError && '!border-red-400/50 !ring-2 !ring-red-400/50',
                            )}
                            buttonClass="!rounded-l-xl !border !border-transparent !bg-[#f4f5f7]"
                            dropdownClass="!text-sm"
                        />
                    </div>
                    <IconField id="seller-email" label="Email del vendedor" icon={Mail}>
                        <input
                            id="seller-email"
                            value={sellerEmail}
                            onChange={(e) => onSellerEmailChange(e.target.value)}
                            placeholder="Ej. vendedor@email.com"
                            type="email"
                            className={cn(fieldBaseClass, emailFieldError && fieldErrorClass)}
                            autoComplete="email"
                            aria-invalid={emailFieldError}
                        />
                    </IconField>
                    {variant !== 'contact' ? (
                        <p className="text-[12px] leading-relaxed text-[#6b7280]">
                            Indica móvil o email del vendedor y le enviaremos un enlace para que reserve.
                        </p>
                    ) : null}
                    <IconField id="seller-listing" label="Enlace del anuncio" icon={Link2} optional>
                        <input
                            id="seller-listing"
                            value={sellerListingUrl}
                            onChange={(e) => onSellerListingUrlChange(e.target.value)}
                            placeholder="Wallapop, Milanuncios, etc."
                            type="url"
                            className={listingUrlFieldClass}
                            inputMode="url"
                        />
                    </IconField>
                    {showContactError ? (
                        <p role="alert" className="text-[12px] font-medium text-red-600">
                            {bothEmpty
                                ? 'Añade un teléfono o un email para continuar.'
                                : 'Revisa el contacto: un móvil o un email válido.'}
                        </p>
                    ) : null}
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
