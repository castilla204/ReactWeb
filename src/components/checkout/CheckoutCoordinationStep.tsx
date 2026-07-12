// v2: improved checkout UX with full-card click, stronger visual state, and selection feedback
import { CalendarDays, Check, Info, Lock, Send } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
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
import { getInspectionSubjectCapitalized } from '../../utils/inspectionSubject';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { SD_CHECKOUT_EMBEDDED_STEP_CONTENT_CLASS } from '../../constants/homepageTypography';
import { HP_FONT } from '../../constants/homepageTypography';
import { cn } from '../../lib/utils';

export type CoordinationView = 'choose' | 'seller' | 'seller-plazos' | 'seller-map' | 'seller-contact';
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
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors',
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
                'text-kicker leading-[1.55] lg:text-caption',
                onBlue ? 'text-white/75' : 'text-ink-muted',
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
                    compact ? 'lg:px-4 lg:pb-3.5 lg:pt-3' : 'lg:px-4.5 lg:pb-4.5 lg:pt-4',
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
                            selected ? 'text-white/90' : 'text-line',
                        )}
                    >
                        {icon}
                    </span>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                    <h3
                        className={cn(
                            'min-w-0 flex-1 text-[16px] font-bold leading-snug tracking-[-0.02em]',
                            compact ? 'lg:text-[16px]' : 'lg:text-title',
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
                            selected ? 'text-white/80' : 'text-ink-muted',
                        )}
                    >
                        {tagline}
                    </p>
                ) : null}
                <p
                    className={cn(
                        'flex-1 text-meta',
                        selected ? 'text-white/90' : 'text-ink-muted',
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

/** Respuestas a «¿Quién elige la fecha?». Cortas y en primera persona.
 *  NO reutilizan COORD_OPTION_*_TITLE a propósito: esos títulos explícitos los necesitan
 *  el resumen del pedido (checkoutSummary) y las vistas de solo-lectura, donde un
 *  «Yo, ahora» suelto, sin la pregunta delante, no se entiende. */
const COORD_ANSWER_SELLER = 'El vendedor';
const COORD_ANSWER_SELF = 'Yo, ahora';

/** Los hechos DENTRO de cada tarjeta, estilo tabla (filetes etiqueta/valor): al usuario
 *  le funciona ese flow visual (decisión 2026-07-10 tras probar radios+nota y tabla
 *  comparativa compartida). La primera fila explica el MECANISMO (el enlace / tú
 *  reservas); las demás, las consecuencias. Valores CORTOS para caber en 1-2 líneas:
 *  «Tú haces: nada» justifica la preselección sin badge. */
const COORD_COMPARE_FACTS: ReadonlyArray<{
    label: string;
    seller: string;
    self: string;
}> = [
    {
        label: 'Cómo se fija la cita',
        seller: 'Le enviamos un enlace y él reserva',
        self: 'Tú reservas en el siguiente paso',
    },
    {
        label: 'Cuándo será',
        // «Normalmente»: la ventana real del backend es +3..+14 (SellerBookingWindow); solo se
        // ofrece 8-14 si el experto no tiene huecos en 3-7. Sin el matiz, una cita a +10 días
        // contradiría lo prometido en el checkout (auditoría 2026-07-12, M2).
        seller: `Normalmente en ${SELLER_BOOKING_MIN_LEAD_DAYS}–${SELLER_BOOKING_TARGET_WINDOW_DAYS} días`,
        self: 'El día que tú elijas',
    },
    {
        label: 'Tú haces',
        seller: 'Nada: te decimos día, hora y lugar',
        self: 'Eliges día, hora y lugar',
    },
    {
        label: 'Cancelas gratis',
        seller: 'Hasta que él reserve',
        self: 'Hasta que el experto confirme',
    },
];

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
            <h2 className="text-xl font-extrabold leading-[1.15] tracking-[-0.025em] text-ink-strong [text-wrap:balance]">
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

/**
 * Selector de «¿Quién elige la fecha?»: DOS tarjetas apiladas, cada una con su tabla de
 * hechos dentro (filetes etiqueta/valor). Mismo componente en móvil y desktop.
 *
 * Es el flow que el usuario validó (2026-07-10) tras probar y descartar: radios con nota
 * en prosa, tabla comparativa compartida de dos columnas, y TODA forma de chip/badge de
 * recomendación (12 variantes). Lo que queda de aquellas rondas: cabecera CLARA sin
 * bandas oscuras (las dos tarjetas se leen como pares), selección por borde ink +
 * check sólido, copy corto a 1 línea, y recomendación comunicada por el orden (el
 * vendedor primero) + la preselección — sin badge.
 *
 * Jerarquía tipográfica: etiqueta de fila tenue (el rótulo se repite en ambas tarjetas,
 * es el eje) y VALOR en semibold ink (la respuesta, lo que se compara).
 *
 * Las vistas de solo-lectura (coordinar/confirmar cita) siguen con CoordinationOptionCards.
 */
function CoordinationOptionCompare({
    selection,
    sellerOptionDisabled,
    /** Desktop embebido: no hay cabecera de pregunta encima (showStepHeader=false), así
     *  que el mt-4 pensado para separarse de esa cabecera sobra y desequilibraba el
     *  margen arriba/abajo de la columna (feedback 2026-07-12). */
    embedded,
    onSelect,
}: {
    selection: CoordinationSelection | null;
    sellerOptionDisabled?: boolean;
    embedded?: boolean;
    onSelect: (value: CoordinationSelection) => void;
}) {
    const sel: CoordinationSelection = selection ?? (sellerOptionDisabled ? 'self' : 'seller');

    const columns: Array<{
        value: CoordinationSelection;
        label: string;
        /** Subtítulo bajo el nombre (solo la recomendada): dice QUE es la recomendada y POR
         *  QUÉ, en texto plano — el chip/badge está vetado en este paso. Se oculta si la
         *  opción está deshabilitada (recomendar algo no elegible sería contradictorio). */
        note?: string;
        disabled?: boolean;
    }> = [
        {
            value: 'seller',
            label: COORD_ANSWER_SELLER,
            note: 'Recomendado: es la opción más sencilla',
            disabled: sellerOptionDisabled,
        },
        { value: 'self', label: COORD_ANSWER_SELF },
    ];

    return (
        <div className={cn(!embedded && 'mt-4')}>
            <div
                role="radiogroup"
                aria-label="Quién elige la fecha de la cita"
                className="flex flex-col gap-3"
            >
                {columns.map((col) => {
                    const active = sel === col.value;
                    return (
                        <div
                            key={col.value}
                            role="radio"
                            aria-checked={active}
                            aria-disabled={col.disabled || undefined}
                            tabIndex={col.disabled ? -1 : 0}
                            onClick={col.disabled ? undefined : () => onSelect(col.value)}
                            onKeyDown={(e) => {
                                if (col.disabled) return;
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelect(col.value);
                                }
                            }}
                            className={cn(
                                'cursor-pointer overflow-hidden rounded-xl border bg-white text-left',
                                'transition-[border-color,box-shadow] duration-200 ease-out',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2',
                                active
                                    ? 'border-ink-strong shadow-sm'
                                    : 'border-line hover:border-line',
                                col.disabled && 'pointer-events-none cursor-not-allowed opacity-45',
                            )}
                        >
                            {/* Cabecera clara: check + respuesta, sin banda de color ni chip. La
                                selección la marcan el borde ink de la tarjeta y el check sólido;
                                la recomendación, el orden + la preselección. */}
                            <div className="flex items-start gap-2.5 px-3.5 pb-2 pt-3">
                                <span
                                    aria-hidden
                                    className={cn(
                                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                                        active
                                            ? 'bg-ink-strong text-white'
                                            : 'border-2 border-line bg-white',
                                    )}
                                >
                                    {active ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-lead font-bold leading-tight tracking-[-0.01em] text-ink-strong">
                                        {col.label}
                                    </span>
                                    {col.note && !col.disabled ? (
                                        <span className="mt-0.5 block text-caption leading-snug text-ink-muted">
                                            {col.note}
                                        </span>
                                    ) : null}
                                </span>
                            </div>
                            {/* Tabla interior: filetes etiqueta/valor DENTRO de cada tarjeta, con
                                banda alterna (zebra) — la fila impar lleva fondo gris muy sutil en
                                vez de depender solo del hairline para separar renglones.
                                El pb ya NO vive en el <dl>: ese padding quedaba fuera del propio
                                div de la fila (que lleva el bg-*), así que bajo la última fila
                                (gris) se veía un filete blanco sin cubrir — parecía una fila
                                cortada. Ahora el aire extra es pb de la ÚLTIMA fila, dentro del
                                mismo div que pinta el fondo, así el gris llega hasta la esquina
                                redondeada de la tarjeta (que recorta con overflow-hidden). */}
                            <dl className="px-3.5">
                                {COORD_COMPARE_FACTS.map((fact, idx) => {
                                    const isLast = idx === COORD_COMPARE_FACTS.length - 1;
                                    return (
                                        <div
                                            key={fact.label}
                                            className={cn(
                                                'flex items-baseline justify-between gap-4 -mx-3.5 px-3.5 py-2',
                                                idx === 0 && 'border-t border-line-soft',
                                                idx % 2 === 1 && 'bg-surface-tinted',
                                                isLast && 'pb-3',
                                            )}
                                        >
                                            <dt className="shrink-0 text-[11.5px] text-ink-muted">{fact.label}</dt>
                                            <dd className="text-right text-caption font-semibold leading-[1.4] text-ink-strong">
                                                {col.value === 'seller' ? fact.seller : fact.self}
                                            </dd>
                                        </div>
                                    );
                                })}
                            </dl>
                        </div>
                    );
                })}
            </div>

            {sellerOptionDisabled ? (
                <p role="note" className="mt-2.5 text-caption leading-relaxed text-warning">
                    Este técnico no tiene disponibilidad en plazo. Elige «{COORD_ANSWER_SELF}» o prueba
                    más tarde.
                </p>
            ) : null}
        </div>
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
                        // Desktop interactivo: exactamente la misma comparativa que móvil
                        // (mismos datos y mismas opciones apiladas).
                        <CoordinationOptionCompare
                            selection={effectiveSelection}
                            sellerOptionDisabled={sellerOptionDisabled}
                            embedded
                            onSelect={onSelect}
                        />
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
                            isSubStep ? 'text-title sm:text-lg' : 'text-xl sm:text-[22px] lg:text-[24px]',
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
            <div className={cn(fillHeight ? 'w-full shrink-0 pb-4 [@media(min-height:700px)]:pt-2' : 'mt-3')}>
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
                        <CoordinationOptionCompare
                            selection={effectiveSelection}
                            sellerOptionDisabled={sellerOptionDisabled}
                            onSelect={onSelect}
                        />
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

            {/* La línea de confianza («tu pago queda protegido») vive ahora en el bottom bar,
                encima de Atrás/Continuar (ver CheckoutPage), no en el cuerpo. */}
        </div>
    );
}
