import React from 'react';
import { Link2, Mail, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';

const fieldClass =
    'w-full rounded-xl bg-[#f4f5f7] py-3 pl-10 pr-3.5 text-sm text-[#1c1c1c] outline-none transition-colors placeholder:text-[#9aa0aa] focus:bg-white focus:ring-2 focus:ring-brand/30';

const listingUrlFieldClass =
    'w-full rounded-xl bg-[#f4f5f7] py-3 pl-10 pr-3.5 text-sm font-semibold text-[#1c1c1c] outline-none transition-colors placeholder:font-normal placeholder:text-[#9aa0aa] focus:bg-white focus:ring-2 focus:ring-brand/30';

export interface CheckoutSellerCoordinationFieldsProps {
    sellerPhone: string;
    sellerEmail: string;
    sellerListingUrl: string;
    onSellerPhoneChange: (value: string) => void;
    onSellerEmailChange: (value: string) => void;
    onSellerListingUrlChange: (value: string) => void;
    /** Móvil: paso plazos o contacto por separado; desktop usa full. */
    /** Texto mínimo en checkout desktop integrado (Coordínalo Inspecciono). */
    minimal?: boolean;
    className?: string;
}

export function sellerCoordinationCanContinue(phone: string, email: string) {
    return phone.trim().length > 0 || email.trim().length > 0;
}

/** Texto reutilizable del plazo del vendedor (checkout Coordínalo Inspecciono). */
export const CHECKOUT_SELLER_PLAZO_SUMMARY =
    'Plazo habitual: 3–7 días (máx. 14). Reembolso íntegro si el vendedor no reserva a tiempo.';

/** Copy tarjetas paso 1 — coordinación de la cita. */
export const COORD_OPTION_SELF_TITLE = 'Yo reservo la cita';
export const COORD_OPTION_SELF_DESC =
    'Ya hablas con el vendedor. Tú eliges aquí el día, la hora y el sitio al pagar.';
export const COORD_OPTION_SELLER_TITLE = 'Inspecciono lo coordina';
export const COORD_OPTION_SELLER_DESC =
    'Compraste por internet. El vendedor recibe un enlace y elige la cita.';
export const COORD_OPTION_SELLER_OFFER = 'Cancelación gratis';

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
export function CheckoutSellerEnlaceInfoNote({ className }: { className?: string }) {
    return (
        <p className={cn('text-[12px] leading-relaxed text-[#475569]', className)}>
            Para compras en portales o anuncios. Tras pagar, contactamos al vendedor y le enviamos un{' '}
            <span className="font-bold text-[#1c1c1c]">enlace</span> para que elija día, hora y lugar
            de la inspección. {CHECKOUT_SELLER_PLAZO_SUMMARY}
        </p>
    );
}

/** Aviso modo Yo reservo la cita (tarjeta de coordinación). */
export function CheckoutSelfCoordinationInfoNote({ className }: { className?: string }) {
    return (
        <p className={cn('text-[12px] leading-relaxed text-[#475569]', className)}>
            Úsalo si ya hablas con el vendedor o podéis acordar la visita entre vosotros. Al pagar,
            reservas tú el día, la hora y la dirección de la inspección.
        </p>
    );
}

/** Aviso de plazos del vendedor (checkout Coordínalo Inspecciono). */
export function CheckoutSellerPlazoNotice({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'rounded-xl border border-[#e8ecf1] bg-[#f8fafc] px-3.5 py-2.5',
                className,
            )}
            role="note"
        >
            <p className="text-[13px] leading-[1.55] text-[#374151]">{CHECKOUT_SELLER_PLAZO_SUMMARY}</p>
        </div>
    );
}

interface IconFieldProps {
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}

function IconField({ icon: Icon, children }: IconFieldProps) {
    return (
        <div className="relative">
            <Icon
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0aa]"
                aria-hidden
            />
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
    className,
}: CheckoutSellerCoordinationFieldsProps) {
    const showContact = variant === 'full' || variant === 'contact';
    const showPlazos = variant === 'full' || variant === 'plazos';

    return (
        <div className={cn(showContact && showPlazos ? 'space-y-6' : 'space-y-0', className)}>
            {showContact ? (
                <div className="space-y-2.5">
                    <IconField icon={Phone}>
                        <input
                            value={sellerPhone}
                            onChange={(e) => onSellerPhoneChange(e.target.value)}
                            placeholder="Teléfono del vendedor"
                            className={fieldClass}
                            autoComplete="tel"
                            inputMode="tel"
                        />
                    </IconField>
                    <IconField icon={Mail}>
                        <input
                            value={sellerEmail}
                            onChange={(e) => onSellerEmailChange(e.target.value)}
                            placeholder="Email del vendedor (opcional)"
                            type="email"
                            className={fieldClass}
                            autoComplete="email"
                        />
                    </IconField>
                    <IconField icon={Link2}>
                        <input
                            value={sellerListingUrl}
                            onChange={(e) => onSellerListingUrlChange(e.target.value)}
                            placeholder="Enlace del anuncio (opcional)"
                            type="url"
                            className={listingUrlFieldClass}
                            inputMode="url"
                        />
                    </IconField>
                    <p className="text-[13px] leading-[1.55] text-[#374151]">
                        Indica al menos un teléfono o email. Le enviaremos un{' '}
                        <span className="font-bold text-[#1c1c1c]">enlace</span> para que elija día, hora
                        y lugar.
                    </p>
                </div>
            ) : null}

            {showPlazos ? (
                minimal ? (
                    <CheckoutSellerPlazoNotice />
                ) : (
                <div className="space-y-1.5">
                    <p className="text-[15px] leading-snug text-[#1c1c1c]">
                        El técnico visitará al vendedor <span className="font-semibold">entre 3 y 7 días</span>.
                    </p>
                    <p className="text-[11px] leading-relaxed text-[#9ca3af]">
                        Si su agenda está completa, hasta un máximo de 14 días · reembolso 100% si no se reserva.
                    </p>
                </div>
                )
            ) : null}
        </div>
    );
}
