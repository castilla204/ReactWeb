import React from 'react';
import { CalendarDays, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    COORD_SELF_CALENDAR_HEADER_DETAIL,
    COORD_SELF_CALENDAR_HEADER_LEAD,
    COORD_SELF_LOCATION_HEADER_DETAIL,
    COORD_SELF_LOCATION_HEADER_LEAD,
    COORD_SELF_PICK_LOCATION_HEADER_DETAIL,
    COORD_SELF_PICK_LOCATION_HEADER_LEAD,
} from './CheckoutSellerCoordinationFields';
import { SD_CHECKOUT_EMBEDDED_INTERACTIVE_SHELL_CLASS, SD_CHECKOUT_EMBEDDED_CALENDAR_SHELL_PADDING_CLASS } from '../../constants/homepageTypography';

/** Mismo contorno degradado fino que el botón «Chat» (padding-box / border-box). */
const SELLER_CHOICE_BADGE_BORDER_STYLE: React.CSSProperties = {
    border: '1px solid transparent',
    background:
        'linear-gradient(rgba(255,255,255,0.97), rgba(255,255,255,0.97)) padding-box, linear-gradient(to right, #0066CC, #F59E0B) border-box',
};

/** Borde inferior con degradado azul→ámbar (como footer móvil / botón Chat). */
const CHAT_GRADIENT_DIVIDER_CLASS =
    'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-gradient-to-r after:from-[#0066CC] after:to-[#F59E0B]';

const CHECKOUT_PREVIEW_HEADER_SHELL_CLASS =
    'relative bg-gradient-to-r from-sky-50/80 via-white to-amber-50/35 px-3.5 py-3 lg:px-4';

export function CheckoutSellerChoiceBadge({
    className,
    inline,
}: {
    className?: string;
    /** Pill compacto en la misma línea que el título del calendario/mapa. */
    inline?: boolean;
}) {
    if (inline) {
        return (
            <span
                className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#475569]',
                    className,
                )}
                style={SELLER_CHOICE_BADGE_BORDER_STYLE}
            >
                <Lock className="h-2.5 w-2.5 shrink-0 text-[#64748b]" aria-hidden />
                Lo elige el vendedor
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-[11px] font-semibold text-[#475569] shadow-sm backdrop-blur-sm',
                className,
            )}
            style={SELLER_CHOICE_BADGE_BORDER_STYLE}
        >
            <span
                className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-white/95 text-[#64748b] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]"
                aria-hidden
            >
                <Lock className="h-2.5 w-2.5" />
            </span>
            Lo elige el vendedor
        </span>
    );
}

export function CheckoutSelfChoiceBadge({
    className,
    inline,
}: {
    className?: string;
    /** Pill compacto en la misma línea que el título del calendario. */
    inline?: boolean;
}) {
    if (inline) {
        return (
            <span
                className={cn(
                    'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#475569]',
                    className,
                )}
                style={SELLER_CHOICE_BADGE_BORDER_STYLE}
            >
                Tú reservas
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-[11px] font-semibold text-[#475569] shadow-sm backdrop-blur-sm',
                className,
            )}
            style={SELLER_CHOICE_BADGE_BORDER_STYLE}
        >
            <span
                className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-white/95 text-brand shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]"
                aria-hidden
            >
                <CalendarDays className="h-2.5 w-2.5" />
            </span>
            Tú reservas
        </span>
    );
}

/** Franja superior modo «Yo reservo la cita» — calendario (columna split desktop). */
export function CheckoutSelfChoiceLockedStripe({
    className,
    compactSplit,
}: {
    className?: string;
    compactSplit?: boolean;
}) {
    return (
        <div
            className={cn(
                'relative flex items-start gap-2 bg-gradient-to-r from-sky-50 via-white to-amber-50/40 px-3 py-2',
                CHAT_GRADIENT_DIVIDER_CLASS,
                className,
            )}
            role="status"
        >
            <span
                className={cn(
                    'mt-px inline-flex shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-[inset_0_0_0_1px_rgba(0,102,204,0.2)]',
                    compactSplit ? 'size-6' : 'size-7',
                )}
                aria-hidden
            >
                <CalendarDays className="h-3 w-3" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
                <p className="text-[12px] font-semibold leading-snug text-[#1c1c1c] lg:text-[13px]">
                    {COORD_SELF_CALENDAR_HEADER_LEAD}
                    <span className="font-medium text-[#64748b]"> · tú reservas la cita</span>
                </p>
                {!compactSplit ? (
                    <p className="mt-1 text-[12px] font-medium leading-snug text-[#475569]">
                        {COORD_SELF_CALENDAR_HEADER_DETAIL}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

/** Franja superior modo «Yo reservo la cita» — calendario. */
export function CheckoutSelfChoicePreviewHeader({ className }: { className?: string }) {
    return (
        <div
            className={cn(CHECKOUT_PREVIEW_HEADER_SHELL_CLASS, CHAT_GRADIENT_DIVIDER_CLASS, className)}
            role="status"
        >
            <div className="flex min-w-0 items-center justify-between gap-3">
                <h3 className="min-w-0 text-[14px] font-semibold tracking-[-0.02em] text-[#1c1c1c]">
                    {COORD_SELF_CALENDAR_HEADER_LEAD}
                </h3>
                <CheckoutSelfChoiceBadge inline />
            </div>
            <p className="mt-1.5 text-[12px] leading-[1.5] text-[#64748b]">
                {COORD_SELF_CALENDAR_HEADER_DETAIL}
            </p>
        </div>
    );
}

/** Cabecera mapa taller fijo — modo «Yo reservo la cita». */
export function CheckoutSelfChoicePreviewLocationHeader({ className }: { className?: string }) {
    return (
        <div
            className={cn(CHECKOUT_PREVIEW_HEADER_SHELL_CLASS, CHAT_GRADIENT_DIVIDER_CLASS, className)}
            role="status"
        >
            <div className="flex min-w-0 items-center justify-between gap-3">
                <h3 className="min-w-0 text-[14px] font-semibold tracking-[-0.02em] text-[#1c1c1c]">
                    {COORD_SELF_LOCATION_HEADER_LEAD}
                </h3>
                <CheckoutSelfChoiceBadge inline />
            </div>
            <p className="mt-1.5 text-[12px] leading-[1.5] text-[#64748b]">
                {COORD_SELF_LOCATION_HEADER_DETAIL}
            </p>
        </div>
    );
}

/** Cabecera mapa con elección libre — modo «Yo reservo la cita». */
export function CheckoutSelfChoicePickLocationHeader({ className }: { className?: string }) {
    return (
        <div
            className={cn(CHECKOUT_PREVIEW_HEADER_SHELL_CLASS, CHAT_GRADIENT_DIVIDER_CLASS, className)}
            role="status"
        >
            <div className="flex min-w-0 items-center justify-between gap-3">
                <h3 className="min-w-0 text-[14px] font-semibold tracking-[-0.02em] text-[#1c1c1c]">
                    {COORD_SELF_PICK_LOCATION_HEADER_LEAD}
                </h3>
                <CheckoutSelfChoiceBadge inline />
            </div>
            <p className="mt-1 line-clamp-1 text-[11px] leading-snug text-[#64748b]">
                {COORD_SELF_PICK_LOCATION_HEADER_DETAIL}
            </p>
        </div>
    );
}

/** Wizard móvil: cabecera compacta + buscador pill flotante sobre el mapa. */
export function CheckoutSelfChoicePickLocationShell({
    children,
    searchBar,
    className,
    showInnerHeader = true,
}: {
    children: React.ReactNode;
    searchBar?: React.ReactNode;
    className?: string;
    showInnerHeader?: boolean;
}) {
    return (
        <div className={cn('flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-white', className)}>
            {showInnerHeader ? (
                <CheckoutSelfChoicePickLocationHeader className="w-full shrink-0 py-2.5" />
            ) : null}
            <div className="relative min-h-0 w-full flex-1">
                {searchBar ? (
                    <div
                        className="pointer-events-none absolute inset-x-0 top-0 z-[20] bg-gradient-to-b from-white/95 via-white/70 to-transparent px-3.5 pb-5 pt-2.5"
                        aria-hidden={false}
                    >
                        <div className="pointer-events-auto">{searchBar}</div>
                    </div>
                ) : null}
                {children}
            </div>
        </div>
    );
}

/** Mapa taller fijo — aviso + mapa a pantalla completa (wizard móvil / sidebar desktop). */
export function CheckoutSelfChoicePreviewMap({
    children,
    className,
    showInnerHeader = true,
}: {
    children: React.ReactNode;
    className?: string;
    showInnerHeader?: boolean;
}) {
    return (
        <div className={cn('flex min-h-0 w-full flex-1 flex-col overflow-hidden', className)}>
            {showInnerHeader ? (
                <CheckoutSelfChoicePreviewLocationHeader className="w-full shrink-0" />
            ) : null}
            <div className="relative min-h-0 w-full flex-1">{children}</div>
        </div>
    );
}

/** Calendario modo «Yo reservo la cita»: aviso + calendario + horas en un solo contorno. */
export function CheckoutSelfChoicePreviewCalendar({
    children,
    className,
    splitColumn = false,
    showInnerHeader = true,
}: {
    children: React.ReactNode;
    className?: string;
    splitColumn?: boolean;
    showInnerHeader?: boolean;
}) {
    return (
        <div
            className={cn(
                splitColumn
                    ? 'flex h-full w-full flex-col px-3 py-2 lg:px-4 lg:py-2'
                    : 'w-full pb-3 pt-2 max-lg:px-0 lg:pl-[calc(1.25rem+1.5rem+0.625rem)] lg:pr-5',
                className,
            )}
        >
            <div
                className={cn(
                    SD_CHECKOUT_EMBEDDED_INTERACTIVE_SHELL_CLASS,
                    splitColumn
                        ? 'mx-auto flex h-full min-h-0 w-full max-w-[46rem] flex-col xl:max-w-[48rem]'
                        : 'mx-auto w-full lg:w-fit lg:max-w-full',
                )}
            >
                {showInnerHeader ? <CheckoutSelfChoicePreviewHeader /> : null}
                {splitColumn && !showInnerHeader ? (
                    <CheckoutSelfChoiceLockedStripe className="px-3 py-2" compactSplit />
                ) : null}
                <div
                    className={cn(
                        SD_CHECKOUT_EMBEDDED_CALENDAR_SHELL_PADDING_CLASS,
                        splitColumn && 'flex min-h-0 flex-1 flex-col lg:p-2.5',
                    )}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

const LOCKED_COPY = {
    location: {
        title: 'Ubicación de la inspección',
        description:
            'Puedes mover y ampliar el mapa. El vendedor indicará la dirección exacta al reservar; el círculo marca el área de cobertura.',
        headerLead: 'Explora la zona del experto',
        headerDetail: 'El vendedor confirma la dirección exacta al reservar.',
        stripeLead: 'Solo consulta',
        stripeMessage:
            'El vendedor indicará la dirección exacta al reservar desde el enlace que le enviamos.',
    },
    calendar: {
        title: 'Día y hora de la cita',
        description:
            'Puedes consultar días y horarios libres. El vendedor elegirá el hueco definitivo al reservar.',
        headerLead: 'Consulta la disponibilidad',
        headerDetail: 'El vendedor confirma el día y la hora al reservar.',
        stripeLead: 'Solo consulta',
        stripeMessage:
            'Tras pagar, el vendedor recibe un enlace para agendar el día y la hora con el experto.',
    },
} as const;

const LOCKED_PANEL_CLASS =
    'mx-auto flex max-w-[20rem] flex-col items-center rounded-xl border border-[#eceef2] bg-white px-4 py-3.5 text-center shadow-[0_1px_4px_rgba(15,23,42,0.05)]';

export function CheckoutSellerChoiceLockedPanel({
    variant,
    className,
}: {
    variant: keyof typeof LOCKED_COPY;
    className?: string;
}) {
    const { title, description } = LOCKED_COPY[variant];

    return (
        <div className={cn(LOCKED_PANEL_CLASS, className)} role="status">
            <CheckoutSellerChoiceBadge className="mb-2.5" />
            <p className="text-[13px] font-semibold leading-snug text-[#1c1c1c]">{title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#6b7280]">{description}</p>
        </div>
    );
}

/** Franja superior modo «Inspecciono lo coordina» (calendario / mapa). */
export function CheckoutSellerChoicePreviewHeader({
    variant,
    className,
}: {
    variant: keyof typeof LOCKED_COPY;
    className?: string;
}) {
    const { headerLead } = LOCKED_COPY[variant];

    return (
        <div
            className={cn(CHECKOUT_PREVIEW_HEADER_SHELL_CLASS, CHAT_GRADIENT_DIVIDER_CLASS, className)}
            role="status"
        >
            {/* El detalle vive en el aviso de abajo (CheckoutSellerChoiceLockedStripe)
                para no repetir el mismo mensaje dos veces, sobre todo en móvil. */}
            <h3 className="min-w-0 text-[14px] font-semibold tracking-[-0.02em] text-[#1c1c1c]">
                {headerLead}
            </h3>
        </div>
    );
}

/** Resalta en negrita la palabra «enlace» dentro del mensaje de solo lectura. */
function highlightEnlace(text: string): React.ReactNode {
    return text.split(/(enlace)/).map((part, i) =>
        part === 'enlace' ? (
            <strong key={i} className="font-bold text-[#1c1c1c]">
                {part}
            </strong>
        ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
        ),
    );
}

/** Franja de solo lectura bajo la cabecera (calendario / mapa). */
export function CheckoutSellerChoiceLockedStripe({
    variant,
    className,
    compactSplit,
}: {
    variant: keyof typeof LOCKED_COPY;
    className?: string;
    compactSplit?: boolean;
}) {
    const { stripeLead, stripeMessage } = LOCKED_COPY[variant];

    return (
        <div
            className={cn(
                'relative flex items-start gap-2 bg-gradient-to-r from-sky-50 via-white to-amber-50/40 px-3 py-2',
                CHAT_GRADIENT_DIVIDER_CLASS,
                className,
            )}
            role="status"
        >
            <span
                className={cn(
                    'mt-px inline-flex shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-[inset_0_0_0_1px_rgba(0,102,204,0.2)]',
                    compactSplit ? 'size-6' : 'size-7',
                )}
                aria-hidden
            >
                <Lock className="h-3 w-3" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
                <p className="text-[12px] font-semibold leading-snug text-[#1c1c1c] lg:text-[13px]">
                    {stripeLead}
                    <span className="font-medium text-[#64748b]"> · no necesitas elegir nada aquí</span>
                </p>
                {!compactSplit ? (
                    <p className="mt-1 text-[12px] font-medium leading-snug text-[#475569]">
                        {highlightEnlace(stripeMessage)}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

/** Barra inferior: mismo alineado horizontal que la cabecera. */
export function CheckoutSellerChoicePreviewFooter({
    variant,
    className,
}: {
    variant: keyof typeof LOCKED_COPY;
    className?: string;
}) {
    const { title, description } = LOCKED_COPY[variant];

    return (
        <div
            className={cn(
                'shrink-0 border-t border-amber-200/80 bg-gradient-to-r from-amber-50 via-amber-50/70 to-sky-50 px-5 py-3',
                className,
            )}
        >
            <p className="text-[13px] font-semibold text-[#1c1c1c]">{title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#64748b]">{description}</p>
        </div>
    );
}

/** Mapa explorables (pan/zoom): aviso superior a ancho completo, sin caja contorneada. */
export function CheckoutSellerChoicePreviewMap({
    children,
    className,
    showFooter = false,
}: {
    children: React.ReactNode;
    className?: string;
    /** Pie desactivado en referencia: el aviso superior basta. */
    showFooter?: boolean;
}) {
    return (
        <div className={cn('flex min-h-0 w-full flex-1 flex-col overflow-hidden', className)}>
            <CheckoutSellerChoicePreviewHeader variant="location" className="w-full shrink-0" />
            <CheckoutSellerChoiceLockedStripe variant="location" className="w-full shrink-0" />
            <div className="relative min-h-0 w-full flex-1">{children}</div>
            {showFooter ? <CheckoutSellerChoicePreviewFooter variant="location" /> : null}
        </div>
    );
}

/** Calendario explorables: aviso + calendario + horas en un solo contorno. */
export function CheckoutSellerChoicePreviewCalendar({
    children,
    className,
    splitColumn = false,
    showInnerHeader = true,
}: {
    children: React.ReactNode;
    className?: string;
    splitColumn?: boolean;
    showInnerHeader?: boolean;
}) {
    return (
        <div
            className={cn(
                splitColumn
                    ? 'flex h-full w-full flex-col px-3 py-2 lg:px-4 lg:py-2'
                    : 'pb-3 pt-2 max-lg:px-0 lg:pl-[calc(1.25rem+1.5rem+0.625rem)] lg:pr-5',
                className,
            )}
        >
            <div
                className={cn(
                    SD_CHECKOUT_EMBEDDED_INTERACTIVE_SHELL_CLASS,
                    splitColumn
                        ? 'flex h-full min-h-0 w-full max-w-none flex-col'
                        : 'w-fit max-w-full',
                )}
            >
                {showInnerHeader ? (
                    <CheckoutSellerChoicePreviewHeader variant="calendar" />
                ) : null}
                <CheckoutSellerChoiceLockedStripe
                    variant="calendar"
                    compactSplit={splitColumn}
                />
                <div
                    className={cn(
                        SD_CHECKOUT_EMBEDDED_CALENDAR_SHELL_PADDING_CLASS,
                        !splitColumn &&
                            'select-none [&_td_button]:pointer-events-none [&_td_button]:cursor-default',
                        splitColumn && 'flex min-h-0 flex-1 flex-col lg:p-2.5',
                    )}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

/** @deprecated Usar PreviewMap / PreviewCalendar. */
export function CheckoutSellerChoiceBlockedShell({
    variant,
    children,
    className,
}: {
    variant: keyof typeof LOCKED_COPY;
    children: React.ReactNode;
    className?: string;
}) {
    if (variant === 'location') {
        return <CheckoutSellerChoicePreviewMap className={className}>{children}</CheckoutSellerChoicePreviewMap>;
    }
    return <CheckoutSellerChoicePreviewCalendar className={className}>{children}</CheckoutSellerChoicePreviewCalendar>;
}

/** Nota sobre el mapa en modo referencia (legacy). */
export function CheckoutSellerChoiceMapFootnote({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 z-[8] bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-4 pt-10',
                className,
            )}
        >
            <CheckoutSellerChoiceLockedPanel variant="location" className="max-w-none" />
        </div>
    );
}

/** Capa a pantalla completa sobre el mapa (legacy). */
export function CheckoutSellerChoiceMapOverlay({ className }: { className?: string }) {
    return <CheckoutSellerChoiceLockedVeil variant="location" className={className} />;
}

/** Capa sobre mapa/calendario: contenido visible pero no interactivo. */
export function CheckoutSellerChoiceLockedVeil({
    variant,
    className,
}: {
    variant: keyof typeof LOCKED_COPY;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'pointer-events-none absolute inset-0 z-[6] flex items-center justify-center bg-white/50 px-3 backdrop-blur-[1px]',
                className,
            )}
            aria-hidden
        >
            <CheckoutSellerChoiceLockedPanel variant={variant} />
        </div>
    );
}
