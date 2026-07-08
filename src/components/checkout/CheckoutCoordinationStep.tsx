// v2: improved checkout UX with full-card click, stronger visual state, and selection feedback
import { CalendarDays, Check, Info, Lock, Send, Sparkles } from 'lucide-react';
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
    amber: '#1c1c1c',
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
                            : 'bg-[#f4f5f7] text-[#6a6a6a] ring-1 ring-[#e8eaed] hover:bg-brand/10 hover:text-brand hover:ring-brand/20',
                    )}
                >
                    <Info className="h-3.5 w-3.5" aria-hidden />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="end"
                className="max-w-[18rem] border-[#e8ecf1] bg-white p-3 shadow-md"
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
                'text-[11px] leading-[1.55] lg:text-[12px]',
                onBlue ? 'text-white/75' : 'text-[#7a7a7a]',
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
                    : 'border-[#e6e9ef] bg-white hover:-translate-y-px hover:border-[#cfd4dc] hover:shadow-[0_2px_10px_rgba(15,23,42,0.06)]',
                disabled && 'pointer-events-none cursor-not-allowed opacity-40 grayscale hover:translate-y-0',
                locked && 'cursor-default hover:translate-y-0 hover:border-[#e6e9ef] hover:shadow-none',
                locked && !selected && 'opacity-55',
            )}
        >
            {recommended && !(locked && selected) ? (
                <span
                    className={cn(
                        'absolute right-3 top-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        selected ? 'bg-white text-brand' : 'bg-brand/10 text-brand',
                    )}
                >
                    Recomendado
                </span>
            ) : null}
            {locked && selected && lockedBadge ? (
                <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-brand shadow-sm">
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
                            selected ? 'text-white/90' : 'text-[#c8cfda]',
                        )}
                    >
                        {icon}
                    </span>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                    <h3
                        className={cn(
                            'min-w-0 flex-1 text-[16px] font-bold leading-snug tracking-[-0.02em]',
                            compact ? 'lg:text-[16px]' : 'lg:text-[17px]',
                            selected ? 'text-white' : 'text-[#14161a]',
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
                            'mt-2 text-[12px] font-medium leading-snug',
                            selected ? 'text-white/80' : 'text-[#64748b]',
                        )}
                    >
                        {tagline}
                    </p>
                ) : null}
                <p
                    className={cn(
                        'flex-1 text-[13px]',
                        selected ? 'text-white/90' : 'text-[#565d6b]',
                        compact
                            ? 'mt-2 leading-[1.55] lg:mt-2.5 lg:text-[13px] lg:leading-[1.6]'
                            : 'mt-2.5 leading-[1.6] lg:text-[13px] lg:leading-[1.6]',
                    )}
                >
                    {description}
                </p>
                {cancelHint ? (
                    <div
                        className={cn(
                            'border-t',
                            selected ? 'border-white/20' : 'border-[#eef0f3]',
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
// Desktop: mismo arranque que móvil. Se quita la pregunta redundante («¿La fecha la elige
// él o la eliges tú?»): las propias opciones la responden. La frase del escrow SÍ se queda:
// en desktop este lead es el único sitio donde aparece (en móvil vive en el sticky footer).
// El sujeto sale de la categoría: antes decía «coche» aunque inspeccionaras una casa.
export function getCoordDesktopStep1Lead(categoryName?: string | null): string {
    return `${getInspectionSubjectCapitalized(categoryName)} lo tiene el vendedor, así que la cita tiene que cuadrar con su disponibilidad. Elijas lo que elijas, tu pago queda protegido hasta que termine la revisión.`;
}

/** Respuestas a «¿Quién elige la fecha?». Cortas y en primera persona.
 *  NO reutilizan COORD_OPTION_*_TITLE a propósito: esos títulos explícitos los necesitan
 *  el resumen del pedido (checkoutSummary) y las vistas de solo-lectura, donde un
 *  «Yo, ahora» suelto, sin la pregunta delante, no se entiende. */
const COORD_ANSWER_SELLER = 'El vendedor';
const COORD_ANSWER_SELF = 'Yo, ahora';

/** Los hechos que de verdad cambian entre las dos opciones. Sustituyen a la prosa:
 *  la primera fila explica el MECANISMO (el enlace al vendedor / tú reservas el hueco);
 *  las demás dan las consecuencias. Así la recomendación se justifica sola («Tú haces:
 *  nada») sin apoyarse en un badge. Las opciones van apiladas a todo el ancho, así que
 *  los valores pueden ser frases cortas; aun así, cuanto más cortos, mejor se comparan. */
const COORD_COMPARE_FACTS: ReadonlyArray<{
    label: string;
    seller: string;
    self: string;
}> = [
    {
        label: 'Cómo se fija la cita',
        seller: 'Le enviamos un enlace y él reserva un hueco libre del experto',
        self: 'Tú reservas el hueco en el siguiente paso',
    },
    {
        label: 'Cuándo será',
        seller: `En ${SELLER_BOOKING_MIN_LEAD_DAYS}–${SELLER_BOOKING_TARGET_WINDOW_DAYS} días tras el pago`,
        self: 'El día que tú elijas',
    },
    // Fila idéntica en ambas columnas A PROPÓSITO: comunica que, elijas lo que elijas,
    // el comprador no tiene que asistir (la vean el vendedor y el experto).
    {
        label: 'Quién va a la cita',
        seller: 'El vendedor y el experto; tú, solo si quieres',
        self: 'El vendedor y el experto; tú, solo si quieres',
    },
    {
        label: 'Tú haces',
        seller: 'Nada: te avisamos con el día, la hora y el lugar',
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
            <h2 className="text-[21px] font-extrabold leading-[1.15] tracking-[-0.025em] text-[#14161a] [text-wrap:balance]">
                ¿Quién elige la fecha?
            </h2>
            {/* 48ch ≈ ancho del gutter móvil (375-40px): 2 líneas anchas, no una columnita
                de 4. Sin «Elige quién pone…»: el título ya hace esa pregunta.
                El sujeto lo pone la categoría: «El coche» / «El inmueble» / «La moto». */}
            <p className="mx-auto mt-2 max-w-[48ch] text-[13.5px] leading-[1.5] text-[#565d6b]">
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
                <p role="note" className="mt-2.5 text-[12px] leading-relaxed text-[#b45309]">
                    Este técnico no tiene disponibilidad en plazo. Elige la opción «{COORD_OPTION_SELF_TITLE}» o
                    prueba más tarde.
                </p>
            ) : null}
        </>
    );
}

/**
 * Comparativa de las dos opciones, estilo tabla. Mismo componente, MISMOS datos y MISMA
 * disposición (apiladas, una encima de otra) en móvil y desktop. Antes había dos
 * vocabularios para el mismo paso: botones negros en móvil, tarjetas azules en desktop.
 *
 * Cada opción es una columna seleccionable: cabecera (radio + respuesta + chip
 * «Recomendado») y las tres filas de COORD_COMPARE_FACTS. Se decide comparando hechos,
 * no leyendo prosa ni fiándose de un badge de color: «Tú haces: nada» justifica la
 * recomendación por sí solo.
 *
 * La selección se marca tiñendo la cabecera de un gris azulado MUY claro + check sólido,
 * nunca con relleno de color de marca ni banda oscura: poca superficie de color, el acento
 * vive en el check. Los hechos siguen sobre blanco, así que el contraste del cuerpo se
 * mantiene ≥4,5:1.
 *
 * Las vistas de solo-lectura (coordinar/confirmar cita) siguen con CoordinationOptionCards.
 */
function CoordinationOptionCompare({
    selection,
    sellerOptionDisabled,
    onSelect,
}: {
    selection: CoordinationSelection | null;
    sellerOptionDisabled?: boolean;
    onSelect: (value: CoordinationSelection) => void;
}) {
    const sel: CoordinationSelection = selection ?? (sellerOptionDisabled ? 'self' : 'seller');

    const columns: Array<{
        value: CoordinationSelection;
        label: string;
        recommended?: boolean;
        disabled?: boolean;
    }> = [
        {
            value: 'seller',
            label: COORD_ANSWER_SELLER,
            recommended: true,
            disabled: sellerOptionDisabled,
        },
        { value: 'self', label: COORD_ANSWER_SELF },
    ];

    return (
        <div className="mt-4">
            <div
                role="radiogroup"
                aria-label="Quién elige la fecha de la cita"
                className="flex flex-col gap-2.5"
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
                                'cursor-pointer overflow-hidden rounded-2xl border bg-white text-left',
                                'transition-[border-color,box-shadow] duration-200 ease-out',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2',
                                active
                                    ? 'border-[#c2cee0]'
                                    : 'border-[#e6e9ef] hover:border-[#cfd4dc]',
                                col.disabled && 'pointer-events-none cursor-not-allowed opacity-45',
                            )}
                        >
                            {/* Cabecera: LAS DOS opciones llevan fondo OSCURO para que ambas se
                                lean como opción (si la no elegida quedaba clara, parecía apagada).
                                Grises oscuros, NO negro puro (que pesaba demasiado): la elegida en
                                gris azulado (#33445c) + check sólido blanco; la no elegida en gris
                                neutro (#3b414b) + aro vacío. Texto en blanco en ambas. El azulado
                                enlaza con el azul del pago sin SER azul-de-selección. El antiguo
                                badge «Recomendado» (genérico) se sustituye por el beneficio real:
                                «Lo más cómodo», que se apoya en la fila «Tú haces: nada». */}
                            <div
                                className={cn(
                                    'flex items-center gap-2.5 px-3.5 py-2.5',
                                    active ? 'bg-[#33445c]' : 'bg-[#3b414b]',
                                )}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                                        active
                                            ? 'bg-white text-[#33445c]'
                                            : 'border-2 border-white/35 bg-transparent',
                                    )}
                                >
                                    {active ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                                </span>
                                <span className="text-[15px] font-bold tracking-[-0.01em] text-white">
                                    {col.label}
                                </span>
                                {col.recommended ? (
                                    <span
                                        className={cn(
                                            'ml-auto flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-semibold text-white',
                                            active ? 'bg-white/[0.16]' : 'bg-white/[0.12]',
                                        )}
                                    >
                                        <Sparkles className="h-3 w-3" aria-hidden />
                                        Lo más cómodo
                                    </span>
                                ) : null}
                            </div>
                            <dl className="px-3.5 pb-3">
                                {COORD_COMPARE_FACTS.map((fact) => (
                                    <div
                                        key={fact.label}
                                        className="flex items-baseline justify-between gap-3 border-t border-[#f0f2f5] py-2"
                                    >
                                        <dt className="shrink-0 text-[11.5px] text-[#8a93a0]">{fact.label}</dt>
                                        <dd className="max-w-[36ch] text-right text-[12px] font-medium leading-[1.4] text-[#14161a]">
                                            {col.value === 'seller' ? fact.seller : fact.self}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    );
                })}
            </div>

            {sellerOptionDisabled ? (
                <p role="note" className="mt-2.5 text-[12px] leading-relaxed text-[#b45309]">
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
                                'font-bold leading-[1.15] tracking-[-0.02em] text-[#14161a] [text-wrap:balance]',
                                'text-[17px] sm:text-lg',
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
                            'font-bold leading-[1.15] tracking-[-0.02em] text-[#14161a] [text-wrap:balance]',
                            isSubStep ? 'text-[17px] sm:text-lg' : 'text-[20px] sm:text-[22px] lg:text-[24px]',
                            headingClassName,
                        )}
                        style={{ fontFamily: HP_FONT }}
                    >
                        {title}
                    </h2>
                )}
                {subtitle ? (
                    <p className="mt-2 max-w-[46ch] text-[13px] leading-relaxed text-[#565d6b] sm:text-sm">
                        {subtitle}
                    </p>
                ) : null}
            </header>
            )}

            {/* fillHeight (móvil, paso de elección): el ROOT es el único scroll container y
                este div es un flex item con `my-auto`. Los márgenes automáticos centran cuando
                sobra alto y COLAPSAN A 0 cuando falta, así nada queda inalcanzable.
                Antes llevaba `flex-1`, que lo fijaba al alto sobrante: la tabla desbordaba ESTE
                div (no el root), el scroll no llegaba al final y el `pb-4` del root quedaba por
                detrás del desbordamiento → «Yo, ahora» pegado a la franja del pago protegido.
                El `pb-4` va AQUÍ, como padding del propio item: así siempre forma parte del área
                scrollable, sin depender de que el navegador honre el padding-bottom de un
                contenedor de scroll. Sin mt-3: desplazaría el centro óptico. */}
            <div className={cn(fillHeight ? 'my-auto w-full shrink-0 pb-4' : 'mt-3')}>
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
