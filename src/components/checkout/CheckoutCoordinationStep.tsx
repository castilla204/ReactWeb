// v2: improved checkout UX with full-card click, stronger visual state, and selection feedback
import { CalendarDays, Info, Lock, Send } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { EscrowCoinMark } from '../EscrowCoinMark';
import {
    CheckoutSellerCoordinationFields,
    CheckoutSelfCoordinationInfoNote,
    CheckoutSellerEnlaceInfoNote,
    SellerContactAvatar,
    COORD_OPTION_FREE_CANCEL,
    COORD_OPTION_SELF_DESC,
    COORD_OPTION_SELF_TAGLINE,
    COORD_OPTION_SELF_TITLE,
    COORD_OPTION_SELLER_DESC,
    COORD_OPTION_SELLER_TAGLINE,
    COORD_OPTION_SELLER_TITLE,
} from './CheckoutSellerCoordinationFields';
import { CheckoutEmbeddedStepHeader } from './CheckoutEmbeddedStepHeader';
import {
    SELLER_BOOKING_MIN_LEAD_DAYS,
    SELLER_BOOKING_TARGET_WINDOW_DAYS,
} from '../../utils/sellerBookingWindow';
import { getInspectionSubject, getInspectionSubjectCapitalized } from '../../utils/inspectionSubject';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { SD_CHECKOUT_EMBEDDED_STEP_CONTENT_CLASS, SD_CHECKOUT_MOBILE_CHOOSE_CARD_STACK_CLASS } from '../../constants/homepageTypography';
import { HP_FONT } from '../../constants/homepageTypography';
import { cn } from '../../lib/utils';

export type CoordinationView = 'choose' | 'seller' | 'seller-plazos' | 'seller-contact';
export type CoordinationSelection = 'self' | 'seller';

type Theme = 'blue' | 'amber';

const PANEL_BG: Record<Theme, string> = {
    amber: 'hsl(var(--ink-strong))',
    blue: 'hsl(var(--brand))',
};

const RECOMMENDED_BADGE_STYLE: CSSProperties = {
    border: '1px solid hsl(var(--brand)/0.22)',
    background: 'hsl(var(--brand)/0.08)',
};

interface OptionCardProps {
    theme: Theme;
    title: string;
    tagline?: string;
    description: ReactNode;
    recommended?: boolean;
    selected: boolean;
    dimmed: boolean;
    disabled?: boolean;
    compact?: boolean;
    infoLabel?: string;
    infoContent?: ReactNode;
    cancelHint?: string;
    /** Icono grande sutil que identifica la opción (sustituye al antiguo dígito 1/2). */
    icon?: ReactNode;
    /** Solo lectura: la tarjeta no responde a click/teclado; conserva el estilo selected/atenuado. */
    locked?: boolean;
    /** Texto de badge a mostrar cuando locked y selected (p.ej. "Lo ha elegido el comprador"). */
    lockedBadge?: string;
    onSelect: () => void;
}

function OptionCardInfoTrigger({
    label,
    children,
    onBlue,
}: {
    label: string;
    children: ReactNode;
    onBlue?: boolean;
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={label}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={cn(
                        'grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors',
                        onBlue
                            ? 'bg-white/15 text-white/90 hover:bg-white/25'
                            : 'bg-surface-tinted text-ink-muted ring-1 ring-line hover:bg-brand/10 hover:text-brand hover:ring-brand/20',
                    )}
                >
                    <Info className="h-3.5 w-3.5" aria-hidden />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="end"
                className="max-w-[18rem] border-line bg-white p-3 shadow-md"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </PopoverContent>
        </Popover>
    );
}

function OptionCardCancelNote({ hint, onBlue }: { hint: string; onBlue?: boolean }) {
    return (
        <p
            className={cn(
                'text-caption leading-[1.55] lg:text-caption',
                onBlue ? 'text-white' : 'text-ink-muted',
            )}
        >
            {COORD_OPTION_FREE_CANCEL} {hint}
        </p>
    );
}

function OptionCard({
    title,
    tagline,
    description,
    recommended,
    selected,
    disabled,
    infoLabel,
    infoContent,
    cancelHint,
    icon,
    compact = false,
    locked,
    lockedBadge,
    onSelect,
}: OptionCardProps) {
    return (
        <div
            role={locked ? 'group' : 'radio'}
            aria-checked={locked ? undefined : selected}
            aria-disabled={disabled || locked || undefined}
            tabIndex={disabled || locked ? -1 : 0}
            onClick={disabled || locked ? undefined : onSelect}
            onKeyDown={(e) => {
                if (disabled || locked) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect();
                }
            }}
            className={cn(
                'group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border text-left',
                'transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2',
                selected
                    ? 'border-brand bg-brand shadow-[0_8px_24px_rgba(0,102,204,0.18)]'
                    : 'border-line bg-white hover:-translate-y-px hover:border-line hover:shadow-[0_2px_10px_rgba(15,23,42,0.06)]',
                disabled && 'pointer-events-none cursor-not-allowed opacity-40 grayscale hover:translate-y-0',
                locked && 'cursor-default hover:translate-y-0 hover:border-line hover:shadow-none',
                locked && !selected && 'opacity-55',
            )}
        >
            {recommended && !(locked && selected) ? (
                <span
                    className={cn(
                        'absolute right-3 top-3 z-10 rounded-full px-2 py-0.5 text-badge font-semibold',
                        selected ? 'bg-white text-brand' : 'bg-brand/10 text-brand',
                    )}
                >
                    Recomendado
                </span>
            ) : null}
            {locked && selected && lockedBadge ? (
                <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-badge font-semibold text-brand shadow-sm">
                    <Lock className="h-2.5 w-2.5" aria-hidden />
                    {lockedBadge}
                </span>
            ) : null}
            <div
                className={cn(
                    'flex flex-1 flex-col px-3.5 pb-3.5 pt-3.5',
                    compact ? 'lg:px-4 lg:pb-3.5 lg:pt-3' : 'lg:px-4 lg:pb-4 lg:pt-4',
                )}
            >
                {icon ? (
                    <span
                        aria-hidden
                        className={cn(
                            'select-none [&>svg]:stroke-[1.5]',
                            compact
                                ? 'mb-1.5 [&>svg]:h-[22px] [&>svg]:w-[22px]'
                                : 'mb-2 [&>svg]:h-7 [&>svg]:w-7 lg:[&>svg]:h-8 lg:[&>svg]:w-8',
                            selected ? 'text-white' : 'text-line',
                        )}
                    >
                        {icon}
                    </span>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                    <h3
                        className={cn(
                            'min-w-0 flex-1 text-subtitle font-bold leading-snug tracking-[-0.02em]',
                            compact ? 'lg:text-subtitle' : 'lg:text-title',
                            selected ? 'text-white' : 'text-ink-strong',
                        )}
                        style={{ fontFamily: HP_FONT }}
                    >
                        {title}
                    </h3>
                    {infoContent && infoLabel ? (
                        <OptionCardInfoTrigger label={infoLabel} onBlue={selected}>
                            {infoContent}
                        </OptionCardInfoTrigger>
                    ) : null}
                </div>
                {tagline ? (
                    <p
                        className={cn(
                            'mt-2 text-caption font-medium leading-snug',
                            selected ? 'text-white' : 'text-ink-muted',
                        )}
                    >
                        {tagline}
                    </p>
                ) : null}
                <p
                    className={cn(
                        'flex-1 text-meta',
                        selected ? 'text-white' : 'text-ink-muted',
                        compact
                            ? 'mt-2 leading-[1.55] lg:mt-2.5 lg:text-meta lg:leading-[1.6]'
                            : 'mt-2.5 leading-[1.6] lg:text-meta lg:leading-[1.6]',
                    )}
                >
                    {description}
                </p>
                {cancelHint ? (
                    <div
                        className={cn(
                            'border-t',
                            selected ? 'border-white/20' : 'border-line-soft',
                            compact ? 'mt-3 pt-3 lg:mt-4 lg:pt-4' : 'mt-3.5 pt-3.5',
                        )}
                    >
                        <OptionCardCancelNote hint={cancelHint} onBlue={selected} />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export const COORD_CHOOSE_TITLE = 'La cita de la inspección';
const COORD_CHOOSE_LEAD = '¿Quién elige la fecha de la inspección?';
// Desktop: la cabecera es el CONTEXTO de las dos columnas. Sin la pregunta, «El vendedor» /
// «Yo, ahora» se leían sin marco (feedback del usuario 2026-07-09), así que la description abre
// con «¿Quién elige la fecha?» en negrita y resalta «tu pago queda protegido». Las negritas usan
// la tinta principal (#1c1c1c) sobre el gris de la descripción para destacar sin cambiar de color.
// El sujeto sale de la categoría: antes decía «coche» aunque inspeccionaras una casa.
export function getCoordDesktopStep1Lead(categoryName?: string | null): ReactNode {
    // El lead enmarca las dos tarjetas de la izquierda: abre con la pregunta (en negrita)
    // y cierra con la promesa de protección del pago. La columna del calendario lleva su
    // propia guía, así que aquí no se repite «elige día y hora».
    return (
        <>
            <strong className="font-semibold text-ink-strong">¿Quién elige la fecha?</strong>{' '}
            {getInspectionSubjectCapitalized(categoryName)} lo tiene el vendedor, así que la cita tiene
            que cuadrar con su disponibilidad. Elijas lo que elijas,{' '}
            <strong className="font-semibold text-ink-strong">tu pago queda protegido</strong> hasta que
            termine la revisión.
        </>
    );
}

/** Respuestas cortas a «¿Quién elige la fecha?» — telegráficas, en primera persona. */
const COORD_ANSWER_SELLER = 'El vendedor';
const COORD_ANSWER_SELF = 'Yo, ahora';

/** Hechos comparativos dentro de cada tarjeta (etiqueta tenue / valor semibold). */
const COORD_COMPARE_FACTS: ReadonlyArray<{
    label: string;
    seller: string;
    self: string;
}> = [
    {
        label: 'Cómo se fija la cita',
        seller: 'Le mandamos un enlace; él elige hueco libre',
        self: 'Tú reservas en el calendario del experto',
    },
    {
        label: 'Cuándo será',
        seller: `Suele ser en ${SELLER_BOOKING_MIN_LEAD_DAYS}–${SELLER_BOOKING_TARGET_WINDOW_DAYS} días`,
        self: 'El día que encaje contigo',
    },
    {
        label: 'Tú haces',
        seller: 'Nada: te avisamos con día, hora y lugar',
        self: 'Día, hora y dónde se hace la inspección',
    },
    {
        label: 'Cancelas gratis',
        seller: 'Hasta que reserve con el enlace',
        self: 'Hasta que el experto confirme la cita',
    },
];

/** Esquinas desktop / embedded — uniformes. */
const COORD_CARD_SURFACE_CLASS = 'rounded-2xl';

/** Esquinas uniformes — misma superficie en móvil y desktop. */
const COORD_CARD_CHOOSE_SHAPE = [COORD_CARD_SURFACE_CLASS, COORD_CARD_SURFACE_CLASS] as const;

function CoordinationCompareCard({
    value,
    label,
    note,
    active,
    disabled,
    index,
    chooseLayout,
    onSelect,
}: {
    value: CoordinationSelection;
    label: string;
    note?: string;
    active: boolean;
    disabled?: boolean;
    index: number;
    chooseLayout?: boolean;
    onSelect: (value: CoordinationSelection) => void;
}) {
    return (
        <div
            role="radio"
            aria-checked={active}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : active ? 0 : -1}
            onClick={disabled ? undefined : () => onSelect(value)}
            onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(value);
                }
            }}
            style={{ ['--i' as string]: index } as CSSProperties}
            className={cn(
                'coordination-card-enter group/card relative cursor-pointer overflow-hidden border bg-white text-left',
                chooseLayout
                    ? (COORD_CARD_CHOOSE_SHAPE[index] ?? COORD_CARD_CHOOSE_SHAPE[0])
                    : COORD_CARD_SURFACE_CLASS,
                'transition-[border-color,background-color,box-shadow] duration-200 ease-out motion-safe:active:scale-[0.995] motion-reduce:transition-none motion-reduce:active:scale-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                active
                    ? cn(
                          'border-brand shadow-[0_2px_14px_hsl(var(--brand)/0.12)]',
                          chooseLayout
                              ? 'bg-white ring-1 ring-brand/12'
                              : 'bg-white ring-2 ring-brand/20',
                      )
                    : cn(
                          'border-line hover:border-ink-soft/50',
                          !chooseLayout && 'shadow-[0_1px_3px_rgba(15,23,42,0.04)]',
                      ),
                disabled && 'pointer-events-none cursor-not-allowed opacity-45',
            )}
        >
            <div className="flex items-start gap-3 px-5 pb-3 pt-4">
                <span
                    aria-hidden
                    className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ease-out',
                        active
                            ? 'bg-brand text-white coordination-radio-settle'
                            : 'border-2 border-line bg-white group-hover/card:border-ink-soft/60',
                    )}
                >
                    {active ? (
                        <svg
                            className="coordination-check-draw h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                        >
                            <path d="M5 13l4 4L19 7" />
                        </svg>
                    ) : null}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-body font-semibold leading-tight tracking-[-0.01em] text-ink-strong">
                        {label}
                    </p>
                    {note ? (
                        <p className="mt-1 text-caption leading-snug text-ink-muted">{note}</p>
                    ) : null}
                </div>
            </div>

            <dl className="border-t border-line-soft px-5">
                {COORD_COMPARE_FACTS.map((fact, rowIdx) => {
                    const isLast = rowIdx === COORD_COMPARE_FACTS.length - 1;
                    return (
                        <div
                            key={fact.label}
                            className={cn(
                                'flex items-baseline justify-between gap-3 py-2.5',
                                rowIdx > 0 && 'border-t border-line-soft/80',
                                isLast && 'pb-3.5',
                            )}
                        >
                            <dt className="shrink-0 text-caption text-ink-muted">{fact.label}</dt>
                            <dd className="text-right text-caption font-semibold leading-[1.45] text-ink-strong">
                                {value === 'seller' ? fact.seller : fact.self}
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </div>
    );
}

const TRUST_RAIL_EASE = [0.22, 1, 0.36, 1] as const;

const trustRailContainerVariants: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: TRUST_RAIL_EASE,
            when: 'beforeChildren',
            staggerChildren: 0.04,
            delayChildren: 0.1,
        },
    },
};

const trustRailWordVariants: Variants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.26, ease: TRUST_RAIL_EASE } },
};

/** Revela el texto palabra a palabra (no letra a letra: en un paso de checkout que se
 *  ve en cada compra, una cascada de caracteres se vuelve ruido al segundo vistazo). */
function TrustRailAnimatedText({ text, className }: { text: string; className?: string }) {
    return (
        <span className={className}>
            {text.split(' ').map((word, i, words) => (
                <motion.span key={i} variants={trustRailWordVariants} className="inline-block">
                    {word}
                    {i < words.length - 1 ? ' ' : ''}
                </motion.span>
            ))}
        </span>
    );
}

/**
 * Nota de confianza animada — entrada con resorte + texto revelado palabra a
 * palabra, disco azul de marca con moneda «moneda → depósito» (EscrowCoinMark),
 * el mismo lenguaje visual que el badge de escrow del resto de la app: ver
 * HomepageTrustChip.tsx / HomepageMobileHeroTrustPill.tsx).
 * Sin card propia (bg/border/shadow): vive dentro del footer fijo blanco del
 * checkout móvil (CheckoutMobileStickyFooter), no flotando en el cuerpo con
 * scroll — "sale del propio bottom bar" en vez de ser una tarjeta aparte.
 */
export function CheckoutTrustNote({ lead, rest }: { lead: string; rest: string }) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.div
            className="relative mb-2.5 flex items-start gap-2.5"
            role="note"
            initial={prefersReducedMotion ? false : 'hidden'}
            animate={prefersReducedMotion ? undefined : 'visible'}
            variants={trustRailContainerVariants}
        >
            <span className="relative mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand">
                <EscrowCoinMark coinPx={14} />
            </span>
            <p className="text-caption leading-[1.45] text-ink-muted">
                {prefersReducedMotion ? (
                    <>
                        <span className="font-semibold text-ink-strong">{lead}</span> {rest}
                    </>
                ) : (
                    <>
                        <TrustRailAnimatedText text={lead} className="font-semibold text-ink-strong" />{' '}
                        <TrustRailAnimatedText text={rest} />
                    </>
                )}
            </p>
        </motion.div>
    );
}

/**
 * Selector «¿Quién elige la fecha?»: dos opciones apiladas con tabla comparativa.
 */
function CoordinationOptionCompare({
    selection,
    sellerOptionDisabled,
    categoryName,
    embedded,
    chooseLayout,
    onSelect,
}: {
    selection: CoordinationSelection | null;
    sellerOptionDisabled?: boolean;
    categoryName?: string | null;
    embedded?: boolean;
    chooseLayout?: boolean;
    onSelect: (value: CoordinationSelection) => void;
}) {
    const sel: CoordinationSelection = selection ?? (sellerOptionDisabled ? 'self' : 'seller');
    const subject = getInspectionSubject(categoryName);

    const columns: Array<{
        value: CoordinationSelection;
        label: string;
        note?: string;
        disabled?: boolean;
    }> = [
        {
            value: 'seller',
            label: COORD_ANSWER_SELLER,
            note: `Lo más habitual si el vendedor tiene ${subject}.`,
            disabled: sellerOptionDisabled,
        },
        { value: 'self', label: COORD_ANSWER_SELF },
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
        const idx = columns.findIndex((c) => c.value === sel);
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            const next = columns[Math.min(idx + 1, columns.length - 1)];
            if (!next.disabled) onSelect(next.value);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = columns[Math.max(idx - 1, 0)];
            if (!prev.disabled) onSelect(prev.value);
        }
    };

    return (
        <div className={cn(!embedded && !chooseLayout && 'mt-1')}>
            <div
                role="radiogroup"
                aria-label="Quién elige la fecha de la cita"
                className={cn(
                    chooseLayout
                        ? SD_CHECKOUT_MOBILE_CHOOSE_CARD_STACK_CLASS
                        : 'flex flex-col gap-3',
                )}
                onKeyDown={handleKeyDown}
            >
                {columns.map((col, idx) => (
                    <CoordinationCompareCard
                        key={col.value}
                        value={col.value}
                        label={col.label}
                        note={col.disabled ? undefined : col.note}
                        active={sel === col.value}
                        disabled={col.disabled}
                        index={idx}
                        chooseLayout={chooseLayout}
                        onSelect={onSelect}
                    />
                ))}
            </div>

            {sellerOptionDisabled ? (
                <p role="note" className="mt-2.5 text-caption leading-relaxed text-warning">
                    Este técnico no tiene disponibilidad en plazo. Elige «{COORD_ANSWER_SELF}» o vuelve
                    cuando el experto abra huecos.
                </p>
            ) : null}
        </div>
    );
}

function CoordinationChooseHeader({
    className,
    categoryName,
}: {
    className?: string;
    categoryName?: string | null;
}) {
    return (
        <header className={cn('mx-auto max-w-xl text-center', className)}>
            {/* Centrado y con la fuente del sistema (como las maquetas). Copy corto:
                pregunta + una línea de contexto. */}
            {/* text-xl = mismo tamaño de título que CheckoutMobileStepHeader en el resto
                de pasos del checkout (antes 21px, un punto más grande). */}
            <h2 className="text-title font-bold leading-[1.15] tracking-[-0.02em] text-ink-strong [text-wrap:balance]">
                ¿Quién elige la fecha?
            </h2>
            {/* 48ch ≈ ancho del gutter móvil (375-40px): 2 líneas anchas, no una columnita
                de 4. Sin «Elige quién pone…»: el título ya hace esa pregunta.
                El sujeto lo pone la categoría: «El coche» / «El inmueble» / «La moto». */}
            <p className="mx-auto mt-2 max-w-[48ch] text-meta leading-[1.5] text-ink-muted">
                {getInspectionSubjectCapitalized(categoryName)} lo tiene el vendedor, así que la cita
                de la inspección tiene que cuadrar con su disponibilidad.
            </p>
        </header>
    );
}

export interface CheckoutCoordinationStepProps {
    view: CoordinationView;
    selection: CoordinationSelection | null;
    embedded?: boolean;
    /** Oculta la cabecera numerada embebida (checkout desktop con header superior). */
    showStepHeader?: boolean;
    /** Oculta la cabecera propia del paso (móvil: el título lo pone CheckoutMobileStepHeader). */
    hideHeader?: boolean;
    /** Móvil paso de elección: ocupa el alto disponible y centra los botones verticalmente. */
    fillHeight?: boolean;
    coordinationMode?: CoordinationSelection | null;
    /** Nombre de la categoría del servicio: decide el sujeto de la copy (coche/inmueble/moto). */
    categoryName?: string | null;
    /** Tarjetas no interactivas (apagadas). La elegida mantiene estilo selected + badge. */
    readOnly?: boolean;
    onSelect: (value: CoordinationSelection) => void;
    sellerPhone: string;
    sellerEmail: string;
    sellerListingUrl: string;
    onSellerPhoneChange: (value: string) => void;
    onSellerEmailChange: (value: string) => void;
    onSellerListingUrlChange: (value: string) => void;
    sellerOptionDisabled?: boolean;
    showSellerValidation?: boolean;
    headingClassName?: string;
    /** Móvil paso choose: overlap + formas irregulares + tabla sin zebra. */
    chooseLayout?: boolean;
}

function CoordinationOptionCards({
    selection,
    duo,
    compact,
    sellerOptionDisabled,
    readOnly,
    onSelect,
}: {
    selection: CoordinationSelection | null;
    duo?: boolean;
    compact?: boolean;
    sellerOptionDisabled?: boolean;
    readOnly?: boolean;
    onSelect: (value: CoordinationSelection) => void;
}) {
    return (
        <>
            <div
                role={readOnly ? 'group' : 'radiogroup'}
                aria-label="Coordinación de la visita"
                className={cn(
                    'coordination-step-from-left grid items-stretch',
                    compact
                        ? duo
                            ? 'grid-cols-2 gap-3 lg:gap-4'
                            : 'grid-cols-1 gap-3.5 lg:gap-4'
                        : duo
                          ? 'grid-cols-2 gap-4 lg:gap-5'
                          : 'grid-cols-1 gap-4',
                    readOnly && 'pointer-events-none',
                )}
            >
                <OptionCard
                    theme="amber"
                    icon={<Send />}
                    title={COORD_OPTION_SELLER_TITLE}
                    tagline={COORD_OPTION_SELLER_TAGLINE}
                    description={COORD_OPTION_SELLER_DESC}
                    compact={compact}
                    infoLabel="Cómo funciona el enlace al vendedor"
                    infoContent={<CheckoutSellerEnlaceInfoNote />}
                    cancelHint="si cambias de idea antes de que el vendedor reserve."
                    recommended
                    disabled={sellerOptionDisabled}
                    selected={selection === 'seller'}
                    dimmed={selection === 'self'}
                    locked={readOnly}
                    lockedBadge="Lo ha elegido el comprador"
                    onSelect={() => onSelect('seller')}
                />
                <OptionCard
                    theme="blue"
                    icon={<CalendarDays />}
                    title={COORD_OPTION_SELF_TITLE}
                    tagline={COORD_OPTION_SELF_TAGLINE}
                    description={COORD_OPTION_SELF_DESC}
                    compact={compact}
                    infoLabel="Cuándo elegir esta opción"
                    infoContent={<CheckoutSelfCoordinationInfoNote />}
                    cancelHint="mientras el experto no confirme; después depende de la antelación."
                    selected={selection === 'self'}
                    dimmed={selection === 'seller'}
                    locked={readOnly}
                    lockedBadge="Lo ha elegido el comprador"
                    onSelect={() => onSelect('self')}
                />
            </div>
            {sellerOptionDisabled ? (
                <p role="note" className="mt-2.5 text-caption leading-relaxed text-warning">
                    Este técnico no tiene disponibilidad en plazo. Elige la opción «{COORD_OPTION_SELF_TITLE}» o
                    prueba más tarde.
                </p>
            ) : null}
        </>
    );
}

export function CheckoutCoordinationStep({
    view,
    selection,
    embedded = false,
    showStepHeader = true,
    hideHeader = false,
    fillHeight = false,
    coordinationMode = null,
    categoryName = null,
    readOnly,
    onSelect,
    sellerPhone,
    sellerEmail,
    sellerListingUrl,
    onSellerPhoneChange,
    onSellerEmailChange,
    onSellerListingUrlChange,
    sellerOptionDisabled,
    showSellerValidation,
    headingClassName,
    chooseLayout = false,
}: CheckoutCoordinationStepProps) {
    const sellerFieldsVariant =
        view === 'seller-plazos' ? 'plazos' : view === 'seller-contact' ? 'contact' : 'full';
    const effectiveSelection = selection ?? coordinationMode;

    if (embedded) {
        return (
            <>
                {showStepHeader ? (
                    <CheckoutEmbeddedStepHeader
                        step={1}
                        title={COORD_CHOOSE_TITLE}
                        description={COORD_CHOOSE_LEAD}
                    />
                ) : null}
                <div
                    className={cn(
                        showStepHeader ? SD_CHECKOUT_EMBEDDED_STEP_CONTENT_CLASS : undefined,
                        showStepHeader ? 'pb-3 pt-2' : 'flex min-h-0 flex-col pb-3',
                    )}
                >
                    {readOnly ? (
                        <CoordinationOptionCards
                            selection={effectiveSelection}
                            compact
                            sellerOptionDisabled={sellerOptionDisabled}
                            readOnly
                            onSelect={onSelect}
                        />
                    ) : (
                        <>
                            <CoordinationOptionCompare
                                selection={effectiveSelection}
                                sellerOptionDisabled={sellerOptionDisabled}
                                categoryName={categoryName}
                                chooseLayout={chooseLayout}
                                embedded
                                onSelect={onSelect}
                            />
                        </>
                    )}
                </div>
            </>
        );
    }

    const isSubStep = view === 'seller-plazos' || view === 'seller-contact';
    const title =
        view === 'choose'
            ? COORD_CHOOSE_TITLE
            : view === 'seller-plazos'
              ? 'Plazos para el vendedor'
              : 'Datos del vendedor';
    const subtitle =
        view === 'choose'
            ? null
            : view === 'seller-plazos'
              ? 'Así es la agenda del experto: el vendedor elegirá un hueco libre al recibir el enlace.'
              : view === 'seller-contact'
              ? 'Móvil o email del vendedor. El anuncio es opcional.'
              : null;

    return (
        <div className={cn(fillHeight && 'flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden')}>
            {hideHeader ? null : view === 'choose' || view === 'seller' ? (
                <CoordinationChooseHeader
                    className={cn(isSubStep && 'hidden', fillHeight && 'shrink-0')}
                    categoryName={categoryName}
                />
            ) : (
            <header className={cn('max-w-xl', isSubStep && 'mb-1')}>
                {view === 'seller-contact' ? (
                    <div className="flex items-center gap-2.5">
                        <SellerContactAvatar />
                        <h2
                            className={cn(
                                'font-bold leading-[1.15] tracking-[-0.02em] text-ink-strong [text-wrap:balance]',
                                'text-title sm:text-lg',
                                headingClassName,
                            )}
                            style={{ fontFamily: HP_FONT }}
                        >
                            {title}
                        </h2>
                    </div>
                ) : (
                    <h2
                        className={cn(
                            'font-bold leading-[1.15] tracking-[-0.02em] text-ink-strong [text-wrap:balance]',
                            isSubStep ? 'text-title sm:text-lg' : 'text-title sm:text-lg lg:text-title',
                            headingClassName,
                        )}
                        style={{ fontFamily: HP_FONT }}
                    >
                        {title}
                    </h2>
                )}
                {subtitle ? (
                    <p className="mt-2 max-w-[46ch] text-meta leading-relaxed text-ink-muted sm:text-sm">
                        {subtitle}
                    </p>
                ) : null}
            </header>
            )}

            {/* fillHeight (móvil, paso de elección): el ROOT es el único scroll container y
                este div fluye desde arriba, como el resto de pasos del wizard (título anclado
                bajo la barra, aire sobrante al fondo). Antes llevaba `my-auto`, que centraba
                SOLO las tarjetas: en viewports altos (iPhone XR 896px) abría un vacío de
                ~120px entre el subtítulo y la primera tarjeta (decisión 2026-07-10).
                Nada de `flex-1`: fijaba el alto al sobrante y la tabla desbordaba ESTE div
                (no el root), dejando el final inalcanzable al scroll y el pb-4 por detrás
                del desbordamiento → «Yo, ahora» pegado a la franja del pago protegido.
                El `pb-4` va AQUÍ, como padding del propio item: así siempre forma parte del
                área scrollable, sin depender de que el navegador honre el padding-bottom de
                un contenedor de scroll. */}
            <div className={cn(fillHeight ? 'w-full shrink-0 pb-4 [@media(min-height:700px)]:pt-2' : !chooseLayout && 'mt-3')}>
                {view === 'choose' || view === 'seller' ? (
                    readOnly ? (
                        // Solo-lectura (coordinar/confirmar cita): la tarjeta muestra la opción
                        // elegida con badge; el toggle segmentado no aplica (no hay nada que elegir).
                        <CoordinationOptionCards
                            selection={effectiveSelection}
                            sellerOptionDisabled={sellerOptionDisabled}
                            readOnly
                            onSelect={onSelect}
                        />
                    ) : (
                        <>
                            <CoordinationOptionCompare
                                selection={effectiveSelection}
                                sellerOptionDisabled={sellerOptionDisabled}
                                categoryName={categoryName}
                                chooseLayout={chooseLayout}
                                onSelect={onSelect}
                            />
                        </>
                    )
                ) : (
                    <div key={view} className="coordination-step-from-right">
                        <CheckoutSellerCoordinationFields
                            variant={sellerFieldsVariant}
                            sellerPhone={sellerPhone}
                            sellerEmail={sellerEmail}
                            sellerListingUrl={sellerListingUrl}
                            onSellerPhoneChange={onSellerPhoneChange}
                            onSellerEmailChange={onSellerEmailChange}
                            onSellerListingUrlChange={onSellerListingUrlChange}
                            showValidation={showSellerValidation}
                        />
                    </div>
                )}
            </div>

        </div>
    );
}
