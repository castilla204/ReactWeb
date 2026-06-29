// v2: improved checkout UX with full-card click, stronger visual state, and selection feedback
import { Info, Lock } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import {
    CheckoutSellerCoordinationFields,
    CheckoutSelfCoordinationInfoNote,
    CheckoutSellerEnlaceInfoNote,
    SellerContactAvatar,
    COORD_OPTION_FREE_CANCEL,
    COORD_OPTION_SELF_TITLE,
    COORD_OPTION_SELLER_DESC,
    COORD_OPTION_SELLER_TITLE,
} from './CheckoutSellerCoordinationFields';
import { CheckoutEmbeddedStepHeader } from './CheckoutEmbeddedStepHeader';
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
    /** Número de orden (1, 2…) mostrado como dígito grande contorneado. */
    number?: number;
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
                onBlue ? 'text-[#bcd9f7]' : 'text-[#7a7a7a]',
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
    number,
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
                {typeof number === 'number' ? (
                    <span
                        aria-hidden
                        className={cn(
                            'select-none font-bold leading-none',
                            compact ? 'mb-1.5 text-[26px]' : 'mb-2 text-[36px] lg:text-[40px]',
                        )}
                        style={{
                            color: 'transparent',
                            WebkitTextStroke: selected
                                ? '1px rgba(255,255,255,0.9)'
                                : '1px #d3d8e0',
                        }}
                    >
                        {number}
                    </span>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                    <h3
                        className={cn(
                            'min-w-0 flex-1 text-[15px] font-semibold leading-snug tracking-[-0.01em]',
                            compact ? 'lg:text-[15px]' : 'lg:text-[16px]',
                            selected ? 'text-white' : 'text-[#1c1c1c]',
                        )}
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
                            selected ? 'text-[#d3e6fb]' : 'text-[#64748b]',
                        )}
                    >
                        {tagline}
                    </p>
                ) : null}
                <p
                    className={cn(
                        'flex-1 text-[13px]',
                        selected ? 'text-[#d3e6fb]' : 'text-[#565d6b]',
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

export const COORD_CHOOSE_TITLE = 'Coordinación de la cita';
const COORD_CHOOSE_LEAD = '¿Cómo quieres reservar?';
export const COORD_DESKTOP_STEP1_LEAD =
    '¿Cómo quieres reservar? Tras el pago hay que acordar el día, la hora y el lugar de la inspección con el vendedor. Puedes dejar que lo coordinemos nosotros por ti o encargarte tú directamente; en ambos casos tu pago queda protegido hasta que termine la revisión.';
const COORD_DESKTOP_CARDS_INTRO_TITLE = '¿Cómo quieres reservar?';
const COORD_DESKTOP_CARDS_INTRO_LEAD =
    'Nosotros nos encargamos de coordinarlo todo, o tú coordinas directamente con el vendedor.';

function CoordinationOptionCardsIntro({
    className,
    compact,
}: {
    className?: string;
    compact?: boolean;
}) {
    return (
        <div className={cn(compact ? 'mb-3 lg:mb-4' : 'mb-5', className)}>
            <p
                className={cn(
                    'font-semibold tracking-[-0.01em] text-[#1c1c1c]',
                    compact ? 'text-[13px] lg:text-[15px]' : 'text-[14px]',
                )}
            >
                {COORD_DESKTOP_CARDS_INTRO_TITLE}
            </p>
            <p
                className={cn(
                    'text-[#64748b]',
                    compact ? 'mt-1.5 text-[12px] leading-[1.5] lg:mt-2 lg:text-[13px] lg:leading-[1.55]' : 'mt-2 text-[13px] leading-[1.55]',
                )}
            >
                {COORD_DESKTOP_CARDS_INTRO_LEAD}
            </p>
        </div>
    );
}

function CoordinationChooseHeader({ className }: { className?: string }) {
    return (
        <header className={cn('max-w-xl', className)}>
            <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.02em] text-[#1c1c1c]">
                {COORD_CHOOSE_TITLE}
            </h2>
            <p className="mt-1 max-w-[46ch] text-[13px] leading-[1.5] text-[#6a6a6a]">{COORD_CHOOSE_LEAD}</p>
        </header>
    );
}

export interface CheckoutCoordinationStepProps {
    view: CoordinationView;
    selection: CoordinationSelection | null;
    embedded?: boolean;
    /** Oculta la cabecera numerada embebida (checkout desktop con header superior). */
    showStepHeader?: boolean;
    coordinationMode?: CoordinationSelection | null;
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
    const selfDescription = (
        <>
            Podéis hablar por WhatsApp o teléfono y acordar la inspección entre vosotros. Al pagar,{' '}
            <span className="font-semibold text-inherit">tú</span> eliges el día, la hora y la dirección en el
            calendario del experto. Queda reservada al instante, a falta de que el experto la confirme.
        </>
    );

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
                    number={1}
                    title={COORD_OPTION_SELLER_TITLE}
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
                    number={2}
                    title={COORD_OPTION_SELF_TITLE}
                    description={selfDescription}
                    compact={compact}
                    infoLabel={`Cuándo elegir ${COORD_OPTION_SELF_TITLE}`}
                    infoContent={<CheckoutSelfCoordinationInfoNote />}
                    cancelHint="mientras el experto no confirme; después se aplican tramos según la antelación."
                    selected={selection === 'self'}
                    dimmed={selection === 'seller'}
                    locked={readOnly}
                    lockedBadge="Lo ha elegido el comprador"
                    onSelect={() => onSelect('self')}
                />
            </div>
            {sellerOptionDisabled ? (
                <p role="note" className="mt-2.5 text-[12px] leading-relaxed text-[#b45309]">
                    Este técnico no tiene disponibilidad en plazo. Elige «{COORD_OPTION_SELF_TITLE}» o prueba más
                    tarde.
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
    coordinationMode = null,
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
                    <CoordinationOptionCards
                        selection={effectiveSelection}
                        compact
                        sellerOptionDisabled={sellerOptionDisabled}
                        readOnly={readOnly}
                        onSelect={onSelect}
                    />
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
        <div>
            {view === 'choose' || view === 'seller' ? (
                <CoordinationChooseHeader className={isSubStep ? 'hidden' : undefined} />
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

            <div className={cn(isSubStep ? 'mt-3' : 'mt-3')}>
                {view === 'choose' || view === 'seller' ? (
                    <CoordinationOptionCards
                        selection={effectiveSelection}
                        sellerOptionDisabled={sellerOptionDisabled}
                        readOnly={readOnly}
                        onSelect={onSelect}
                    />
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
