import React from 'react';
import { UserRound } from 'lucide-react';
import { PhoneInputField } from './PhoneInputField';
import { cn } from '../../lib/utils';
import {
    GroupedFieldsCard,
    GroupedFieldRow,
    GroupedFieldsDivider,
    groupedLabelClass,
    bareGroupedInputClass,
    underlineFieldInputClass,
} from './GroupedFieldsCard';
import {
    CHECKOUT_SELLER_PLAZO_SUMMARY,
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
        // Texto plano, sin caja teñida ni icono: el checkout habla en tipografía + filetes
        // (feedback 2026-07-10, misma regla que descartó los chips y las tarjetas con
        // numeración). La caja con Send encima del grupo de campos eran dos recuadros
        // apilados compitiendo antes de llegar al formulario.
        return (
            <p role="note" className={cn('text-caption leading-relaxed text-ink-muted', className)}>
                {SELLER_COORD_ENLACE_DETAILED}
            </p>
        );
    }

    return (
        <p className={cn('text-caption leading-relaxed text-ink-muted', className)}>
            {SELLER_COORD_CARD_NOTE}
        </p>
    );
}

/** Aviso modo tú eliges la fecha (tarjeta de coordinación). */
export function CheckoutSelfCoordinationInfoNote({ className }: { className?: string }) {
    return (
        <p className={cn('text-caption leading-relaxed text-ink-muted', className)}>
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
                'rounded-xl border border-line bg-surface-tinted px-3.5 py-2.5',
                className,
            )}
            role="note"
        >
            <p className="text-meta leading-[1.55] text-ink-muted">{CHECKOUT_SELLER_PLAZO_SUMMARY}</p>
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
                    {/* Teléfono + email responden a UNA sola pregunta (cómo llegamos al vendedor):
                        van en UN contenedor con filete interno — patrón Stripe/Linear — en vez de
                        dos cajas independientes con su propio borde y sombra cada una (leía a
                        formulario genérico, feedback 2026-07-10). El foco/error se pinta en el
                        contenedor entero: mismo componente que la versión desktop de este paso
                        (CheckoutDesktopLocationStepBody), un solo look para el mismo dato. */}
                    <GroupedFieldsCard error={showContactError}>
                        {/* Etiquetas cortas «Teléfono»/«Email» (como en desktop): el paso ya se
                            titula «Datos del vendedor», repetirlo en cada fila era ruido. */}
                        <GroupedFieldRow first htmlFor="seller-phone" label="Teléfono">
                            <PhoneInputField
                                bare
                                id="seller-phone"
                                name="seller-phone"
                                value={sellerPhone}
                                onChange={onSellerPhoneChange}
                                aria-invalid={phoneFieldError}
                                defaultCountry="ES"
                            />
                        </GroupedFieldRow>
                        {/* «o» sobre el filete: con uno de los dos basta (la fila siguiente lleva
                            `first` para no duplicar el border-t). */}
                        <GroupedFieldsDivider label="o" />
                        <GroupedFieldRow first htmlFor="seller-email" label="Email">
                            <input
                                id="seller-email"
                                value={sellerEmail}
                                onChange={(e) => onSellerEmailChange(e.target.value)}
                                placeholder="vendedor@email.com"
                                type="email"
                                className={bareGroupedInputClass}
                                autoComplete="email"
                                aria-invalid={emailFieldError}
                            />
                        </GroupedFieldRow>
                    </GroupedFieldsCard>
                    {variant !== 'contact' ? (
                        <p className="text-caption leading-relaxed text-ink-muted">
                            Indica móvil o email del vendedor y le enviaremos un enlace para que reserve.
                        </p>
                    ) : null}
                    {showContactError ? (
                        <p role="alert" className="text-caption font-medium text-red-600">
                            {bothEmpty
                                ? 'Añade un teléfono o un email para continuar.'
                                : 'Revisa el contacto: un móvil o un email válido.'}
                        </p>
                    ) : null}
                    {/* Enlace del anuncio: secundario y opcional, fuera del grupo obligatorio.
                        Subrayado en vez de caja propia: lo demota deliberadamente por debajo del
                        contacto en peso visual. */}
                    <div>
                        <label htmlFor="seller-listing" className={groupedLabelClass}>
                            Enlace del anuncio <span className="font-normal text-ink-muted">(opcional)</span>
                        </label>
                        <input
                            id="seller-listing"
                            value={sellerListingUrl}
                            onChange={(e) => onSellerListingUrlChange(e.target.value)}
                            placeholder="Wallapop, Milanuncios, etc."
                            type="url"
                            className={underlineFieldInputClass}
                            inputMode="url"
                        />
                    </div>
                </div>
            ) : null}

            {showPlazos ? (
                minimal ? (
                    <CheckoutSellerPlazoNotice />
                ) : (
                <div className="space-y-1.5">
                    <p className="text-lead leading-snug text-ink-strong">
                        El vendedor reserva entre los huecos del experto, habitualmente de{' '}
                        <span className="font-semibold">
                            {SELLER_BOOKING_MIN_LEAD_DAYS} a {SELLER_BOOKING_TARGET_WINDOW_DAYS} días
                        </span>{' '}
                        tras tu pago (hasta {SELLER_BOOKING_MAX_DAYS} si la agenda está llena).
                    </p>
                    <p className="text-kicker leading-relaxed text-ink-muted">
                        Solo podrá elegir días y horas que el experto tenga libres en su calendario.
                    </p>
                </div>
                )
            ) : null}
        </div>
    );
}
