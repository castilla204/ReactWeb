import { Info } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import {
    CheckoutSellerCoordinationFields,
    CheckoutSelfCoordinationInfoNote,
    CheckoutSellerEnlaceInfoNote,
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
    onSelect: () => void;
}

function OptionCardInfoTrigger({ label, children }: { label: string; children: ReactNode }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={label}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f4f5f7] text-[#6a6a6a] ring-1 ring-[#e8eaed] transition-colors hover:bg-brand/10 hover:text-brand hover:ring-brand/20"
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

function OptionCardCancelNote({ hint }: { hint: string }) {
    return (
        <p className="text-[11px] leading-[1.55] text-[#7a7a7a]">
            {COORD_OPTION_FREE_CANCEL} {hint}
        </p>
    );
}

function OptionCardSelectionIndicator({ selected }: { selected: boolean }) {
    return (
        <span
            aria-hidden
                className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-[border-color,background-color,box-shadow] duration-200',
                    selected
                        ? 'border-brand bg-brand shadow-[0_0_0_3px_hsl(var(--brand)/0.15)]'
                        : 'border-[#d1d5db] bg-white group-hover:border-[#9ca3af]',
                )}
        >
            <span
                className={cn(
                    'h-2 w-2 rounded-full bg-white transition-transform duration-200',
                    selected ? 'scale-100' : 'scale-0',
                )}
            />
        </span>
    );
}

function OptionCard({
    theme,
    title,
    tagline,
    description,
    recommended,
    selected,
    dimmed,
    disabled,
    infoLabel,
    infoContent,
    cancelHint,
    compact = false,
    onSelect,
}: OptionCardProps) {
    return (
        <div
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={disabled ? undefined : onSelect}
            onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect();
                }
            }}
            className={cn(
                'group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-b-2xl rounded-t-sm border bg-white text-left',
                'shadow-[0_1px_2px_rgba(15,23,42,0.05),0_4px_14px_rgba(15,23,42,0.04)]',
                'transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out',
                'hover:-translate-y-px hover:shadow-[0_2px_6px_rgba(15,23,42,0.07),0_8px_20px_rgba(15,23,42,0.06)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2',
                selected
                    ? theme === 'blue'
                        ? 'border-brand/40 bg-brand/[0.03] shadow-[0_0_0_1px_hsl(var(--brand)/0.15),0_6px_20px_rgba(0,102,204,0.08)] hover:translate-y-0'
                        : 'border-[#1c1c1c] bg-white shadow-[0_0_0_1px_rgba(28,28,28,0.12),0_6px_20px_rgba(0,0,0,0.06)] hover:translate-y-0'
                    : cn(
                          theme === 'blue'
                              ? 'border-[#d2d2d2] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_3px_8px_rgba(0,0,0,0.03)] hover:border-[#b8b8b8] hover:shadow-[0_2px_6px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.04)]'
                              : 'border-[#e0e0e0] bg-[#f8f8f8] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#c0c0c0] hover:shadow-[0_2px_6px_rgba(0,0,0,0.04)]',
                          dimmed && 'border-[#dedede] bg-[#f3f3f3]/80 opacity-85 hover:opacity-100',
                      ),
                disabled && 'pointer-events-none cursor-not-allowed opacity-40 grayscale hover:translate-y-0',
            )}
        >
            {recommended ? (
                <span className="absolute right-0 top-0 z-10 rounded-bl-lg bg-brand px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    Recomendado
                </span>
            ) : null}
            <div
                className={cn('w-full shrink-0', compact ? 'h-1.5' : 'h-2')}
                style={{ background: PANEL_BG[theme] }}
                aria-hidden
            />
            <div
                className={cn(
                    'flex flex-1 flex-col px-3.5 pb-3.5 pt-3',
                    compact ? 'lg:px-3.5 lg:pb-2.5 lg:pt-2.5' : 'lg:px-4.5 lg:pb-4.5 lg:pt-3.5',
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h3
                            className={cn(
                                'text-[15px] font-semibold leading-snug tracking-[-0.01em]',
                                compact ? 'lg:text-[14px]' : 'lg:text-[16px]',
                                selected ? 'text-[#1c1c1c]' : 'text-[#1c1c1c]',
                            )}
                        >
                            {title}
                        </h3>
                    </div>
                    <div className="flex shrink-0 items-start gap-2">
                        {infoContent && infoLabel ? (
                            <OptionCardInfoTrigger label={infoLabel}>{infoContent}</OptionCardInfoTrigger>
                        ) : null}
                        <OptionCardSelectionIndicator selected={selected} />
                    </div>
                </div>
                {tagline ? (
                    <p className="mt-2 text-[12px] font-medium leading-snug text-[#64748b]">{tagline}</p>
                ) : null}
                <p
                    className={cn(
                        'flex-1 text-[13px] text-[#565d6b]',
                        compact
                            ? 'mt-2 leading-[1.55] lg:text-[12px] lg:leading-[1.52]'
                            : 'mt-2.5 leading-[1.6] lg:text-[13px] lg:leading-[1.6]',
                    )}
                >
                    {description}
                </p>
                {cancelHint ? (
                    <div className={cn('border-t border-[#eef0f3]', compact ? 'mt-3 pt-3' : 'mt-3.5 pt-3.5')}>
                        <OptionCardCancelNote hint={cancelHint} />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export const COORD_CHOOSE_TITLE = 'Coordinación de la cita';
const COORD_CHOOSE_LEAD = 'Elige quién fijará día y hora con el vendedor.';
export const COORD_DESKTOP_STEP1_LEAD =
    'Elige quién fijará día y hora con el vendedor.';
const COORD_DESKTOP_CARDS_INTRO_TITLE = '¿Quién coordina la cita?';
const COORD_DESKTOP_CARDS_INTRO_LEAD =
    'Inspecciono puede gestionarlo por ti, o puedes reservar tú mismo.';

function CoordinationOptionCardsIntro({
    className,
    compact,
}: {
    className?: string;
    compact?: boolean;
}) {
    return (
        <div className={cn(compact ? 'mb-3' : 'mb-5', className)}>
            <p
                className={cn(
                    'font-semibold tracking-[-0.01em] text-[#1c1c1c]',
                    compact ? 'text-[13px]' : 'text-[14px]',
                )}
            >
                {COORD_DESKTOP_CARDS_INTRO_TITLE}
            </p>
            <p
                className={cn(
                    'text-[#64748b]',
                    compact ? 'mt-1.5 text-[12px] leading-[1.5]' : 'mt-2 text-[13px] leading-[1.55]',
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
    onSelect,
}: {
    selection: CoordinationSelection | null;
    duo?: boolean;
    compact?: boolean;
    sellerOptionDisabled?: boolean;
    onSelect: (value: CoordinationSelection) => void;
}) {
    const selfDescription = (
        <>
            Podéis hablar por WhatsApp o teléfono y acordar la inspección entre vosotros. Al pagar,{' '}
            <span className="font-semibold text-inherit">tú</span> eliges el día, la hora y la dirección en el
            calendario del experto. La cita queda cerrada en el acto.
        </>
    );

    return (
        <>
            <div
                role="radiogroup"
                aria-label="Coordinación de la visita"
                className={cn(
                    'coordination-step-from-left grid items-stretch',
                    compact
                        ? duo
                            ? 'grid-cols-2 gap-3 lg:gap-4'
                            : 'grid-cols-1 gap-3.5'
                        : duo
                          ? 'grid-cols-2 gap-4 lg:gap-5'
                          : 'grid-cols-1 gap-4',
                )}
            >
                <OptionCard
                    theme="amber"
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
                    onSelect={() => onSelect('seller')}
                />
                <OptionCard
                    theme="blue"
                    title={COORD_OPTION_SELF_TITLE}
                    description={selfDescription}
                    compact={compact}
                    infoLabel={`Cuándo elegir ${COORD_OPTION_SELF_TITLE}`}
                    infoContent={<CheckoutSelfCoordinationInfoNote />}
                    cancelHint="si cambias de idea antes de la visita."
                    selected={selection === 'self'}
                    dimmed={selection === 'seller'}
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
                    {!showStepHeader ? <CoordinationOptionCardsIntro compact /> : null}
                    <CoordinationOptionCards
                        selection={effectiveSelection}
                        compact
                        sellerOptionDisabled={sellerOptionDisabled}
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
