import { Check, Info, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { CheckoutSellerCoordinationFields, CheckoutSelfCoordinationInfoNote, CheckoutSellerEnlaceInfoNote, COORD_OPTION_SELF_DESC, COORD_OPTION_SELF_TITLE, COORD_OPTION_SELLER_OFFER, COORD_OPTION_SELLER_TITLE } from './CheckoutSellerCoordinationFields';
import { CheckoutEmbeddedStepHeader } from './CheckoutEmbeddedStepHeader';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { SD_CHECKOUT_EMBEDDED_STEP_CONTENT_CLASS } from '../../constants/homepageTypography';
import { HP_FONT } from '../../constants/homepageTypography';
import { cn } from '../../lib/utils';
import coordSellerImg from '../../media/la1.png';
import coordSelfImg from '../../media/la2.png';

export type CoordinationView = 'choose' | 'seller' | 'seller-plazos' | 'seller-map' | 'seller-contact';
export type CoordinationSelection = 'self' | 'seller';

type Theme = 'blue' | 'amber';

// Color de fondo del banner, igualado al fondo de cada ilustración 3D (la1/la2).
// Sirve de fallback bajo la imagen a sangre (object-cover) — sin costuras visibles.
const PANEL_BG: Record<Theme, string> = {
    amber: '#efdcb6',
    blue: '#c4ddf4',
};

interface OptionCardProps {
    theme: Theme;
    illustration: ReactNode;
    title: string;
    description: ReactNode;
    recommended?: boolean;
    selected: boolean;
    dimmed: boolean;
    disabled?: boolean;
    compact?: boolean;
    infoLabel?: string;
    infoContent?: ReactNode;
    /** Texto de oferta destacado en el cuerpo (p. ej. «Cancelación gratis»). */
    offerLabel?: string;
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
                    className="grid h-6 w-6 place-items-center rounded-full bg-white/70 text-[#475569] ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-white hover:text-[#1c1c1c]"
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

function OptionCard({
    theme,
    illustration,
    title,
    description,
    recommended,
    selected,
    dimmed,
    disabled,
    compact,
    infoLabel,
    infoContent,
    offerLabel,
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
                'group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white text-left',
                'transition-[border-color,box-shadow,opacity,transform] duration-200 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
                selected
                    ? 'border-brand shadow-[0_8px_28px_-8px_rgba(0,102,204,0.35)]'
                    : 'border-[#e7e9ee] shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:border-[#cdd5e0] hover:shadow-[0_10px_26px_-12px_rgba(15,23,42,0.22)]',
                disabled
                    ? 'pointer-events-none cursor-not-allowed opacity-45 grayscale'
                    : dimmed
                      ? 'opacity-90'
                      : 'opacity-100',
            )}
        >
            {/* Banner con ilustración */}
            <div
                className={cn('relative w-full overflow-hidden', compact ? 'aspect-[16/9]' : 'aspect-[16/10]')}
                style={{ background: PANEL_BG[theme] }}
            >
                {illustration}

                {recommended ? (
                    <span
                        className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.04em] text-white shadow-sm"
                        style={{ fontFamily: HP_FONT }}
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                        Recomendado
                    </span>
                ) : null}

                <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    {infoContent && infoLabel ? (
                        <OptionCardInfoTrigger label={infoLabel}>{infoContent}</OptionCardInfoTrigger>
                    ) : null}
                    <span
                        aria-hidden
                        className={cn(
                            'grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all duration-200',
                            selected
                                ? 'bg-brand text-white shadow-sm'
                                : 'border-2 border-white bg-white/70 text-transparent ring-1 ring-black/5 backdrop-blur-sm',
                        )}
                    >
                        <Check className={cn('h-3.5 w-3.5 stroke-[3]', selected ? 'opacity-100' : 'opacity-0')} />
                    </span>
                </div>
            </div>

            {/* Cuerpo */}
            <div className={cn('flex flex-1 flex-col', compact ? 'px-3.5 py-3' : 'px-4 py-3.5')}>
                <h3
                    className={cn(
                        'font-bold leading-snug tracking-[-0.015em] text-[#14161a]',
                        compact ? 'text-[14px]' : 'text-[15px]',
                    )}
                    style={{ fontFamily: HP_FONT }}
                >
                    {title}
                </h3>
                <p
                    className={cn(
                        'mt-1.5 leading-[1.55] text-[#565d6b]',
                        compact ? 'text-[12px]' : 'text-[13px]',
                    )}
                >
                    {description}
                </p>

                {offerLabel ? (
                    <span
                        className={cn(
                            'mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 font-semibold text-emerald-700 ring-1 ring-emerald-600/15',
                            compact ? 'px-2 py-0.5 text-[11px]' : 'mt-3 px-2.5 py-1 text-[12px]',
                        )}
                    >
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                        {offerLabel}
                    </span>
                ) : null}
            </div>
        </div>
    );
}

export interface CheckoutCoordinationStepProps {
    view: CoordinationView;
    selection: CoordinationSelection | null;
    /** Integrado en la tarjeta de cita del checkout desktop (cards + calendario juntos). */
    embedded?: boolean;
    coordinationMode?: CoordinationSelection | null;
    onSelect: (value: CoordinationSelection) => void;
    sellerPhone: string;
    sellerEmail: string;
    sellerListingUrl: string;
    onSellerPhoneChange: (value: string) => void;
    onSellerEmailChange: (value: string) => void;
    onSellerListingUrlChange: (value: string) => void;
    /** El experto no tiene disponibilidad en plazo → opción "Coordínalo Inspecciono" deshabilitada. */
    sellerOptionDisabled?: boolean;
    headingClassName?: string;
}

interface MobileSplitCardProps {
    image: string;
    theme: Theme;
    title: string;
    description: ReactNode;
    recommended?: boolean;
    selected: boolean;
    dimmed: boolean;
    disabled?: boolean;
    infoLabel?: string;
    infoContent?: ReactNode;
    offerLabel?: string;
    onSelect: () => void;
}

const IMG_TILE_BG: Record<Theme, string> = {
    amber: '#ecd8b8',
    blue: '#cfe3f6',
};

/** Móvil: panel alto al 50% — tarjeta blanca, ilustración apaisada entera + texto oscuro. */
function MobileSplitCard({
    image,
    theme,
    title,
    description,
    recommended,
    selected,
    dimmed,
    disabled,
    infoLabel,
    infoContent,
    offerLabel,
    onSelect,
}: MobileSplitCardProps) {
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
                'group relative flex h-full cursor-pointer flex-col justify-center overflow-hidden rounded-2xl border bg-white px-3 py-3 text-left',
                'transition-[border-color,box-shadow,opacity] duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
                selected
                    ? 'border-brand shadow-[0_8px_28px_-10px_rgba(0,102,204,0.35)]'
                    : 'border-[#e7e9ee] shadow-[0_1px_3px_rgba(15,23,42,0.05)]',
                disabled ? 'pointer-events-none opacity-45 grayscale' : dimmed ? 'opacity-90' : 'opacity-100',
            )}
        >
            <div className="relative w-full overflow-hidden rounded-xl" style={{ background: IMG_TILE_BG[theme] }}>
                <img
                    src={image}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="block aspect-[16/10] w-full select-none object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />

                {recommended ? (
                    <span
                        className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] text-white shadow-sm"
                        style={{ fontFamily: HP_FONT }}
                    >
                        <span className="h-1 w-1 rounded-full bg-white/90" />
                        Recomendado
                    </span>
                ) : null}

                <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
                    {infoContent && infoLabel ? (
                        <OptionCardInfoTrigger label={infoLabel}>{infoContent}</OptionCardInfoTrigger>
                    ) : null}
                    <span
                        aria-hidden
                        className={cn(
                            'grid h-6 w-6 place-items-center rounded-full transition-all duration-200',
                            selected
                                ? 'bg-brand text-white shadow-sm'
                                : 'border-2 border-white bg-white/70 text-transparent ring-1 ring-black/5 backdrop-blur-sm',
                        )}
                    >
                        <Check className={cn('h-3.5 w-3.5 stroke-[3]', selected ? 'opacity-100' : 'opacity-0')} />
                    </span>
                </div>
            </div>

            <h3
                className="mt-3 text-[15px] font-bold leading-snug tracking-[-0.015em] text-[#14161a]"
                style={{ fontFamily: HP_FONT }}
            >
                {title}
            </h3>
            <p className="mt-1 text-[12px] leading-[1.5] text-[#565d6b]">{description}</p>
            {offerLabel ? (
                <span className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/15">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    {offerLabel}
                </span>
            ) : null}
        </div>
    );
}

function CoordinationOptionCards({
    selection,
    compact,
    sellerOptionDisabled,
    onSelect,
}: {
    selection: CoordinationSelection | null;
    compact?: boolean;
    sellerOptionDisabled?: boolean;
    onSelect: (value: CoordinationSelection) => void;
}) {
    const sellerDescription = (
        <>
            Compraste por internet. El vendedor recibe un{' '}
            <span className="font-bold text-inherit">enlace</span> y elige la cita.
        </>
    );
    const sellerInfoLabel = 'Cómo funciona el enlace al vendedor';
    const selfInfoLabel = `Cuándo elegir ${COORD_OPTION_SELF_TITLE}`;
    const sellerSelected = selection === 'seller';
    const selfSelected = selection === 'self';

    const sellerImg = (
        <img
            src={coordSellerImg}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover"
        />
    );
    const selfImg = (
        <img
            src={coordSelfImg}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover"
        />
    );

    const disabledNote = sellerOptionDisabled ? (
        <p role="note" className="mt-2.5 text-[12px] leading-relaxed text-[#b45309]">
            Este técnico no tiene disponibilidad en plazo. Elige «{COORD_OPTION_SELF_TITLE}» o prueba más tarde.
        </p>
    ) : null;

    // Checkout desktop integrado (embedded): tarjetas compactas en 2 columnas.
    if (compact) {
        return (
            <>
                <div
                    role="radiogroup"
                    aria-label="¿Quién fija la cita?"
                    className="coordination-step-from-left grid grid-cols-2 items-stretch gap-3"
                >
                    <OptionCard
                        theme="amber"
                        illustration={sellerImg}
                        title={COORD_OPTION_SELLER_TITLE}
                        description={sellerDescription}
                        infoLabel={sellerInfoLabel}
                        infoContent={<CheckoutSellerEnlaceInfoNote />}
                        offerLabel={COORD_OPTION_SELLER_OFFER}
                        recommended
                        compact
                        disabled={sellerOptionDisabled}
                        selected={sellerSelected}
                        dimmed={selfSelected}
                        onSelect={() => onSelect('seller')}
                    />
                    <OptionCard
                        theme="blue"
                        illustration={selfImg}
                        title={COORD_OPTION_SELF_TITLE}
                        description={COORD_OPTION_SELF_DESC}
                        infoLabel={selfInfoLabel}
                        infoContent={<CheckoutSelfCoordinationInfoNote />}
                        compact
                        selected={selfSelected}
                        dimmed={sellerSelected}
                        onSelect={() => onSelect('self')}
                    />
                </div>
                {disabledNote}
            </>
        );
    }

    return (
        <>
            {/* Móvil: split a sangre 50/50, alto grande (imagen a sangre + texto sobre degradado). */}
            <div
                role="radiogroup"
                aria-label="¿Quién fija la cita?"
                className="coordination-step-from-left -mx-5 grid h-[56svh] min-h-[400px] grid-cols-2 gap-2 sm:hidden"
            >
                <MobileSplitCard
                    image={coordSellerImg}
                    theme="amber"
                    title={COORD_OPTION_SELLER_TITLE}
                    description={sellerDescription}
                    infoLabel={sellerInfoLabel}
                    infoContent={<CheckoutSellerEnlaceInfoNote />}
                    offerLabel={COORD_OPTION_SELLER_OFFER}
                    recommended
                    disabled={sellerOptionDisabled}
                    selected={sellerSelected}
                    dimmed={selfSelected}
                    onSelect={() => onSelect('seller')}
                />
                <MobileSplitCard
                    image={coordSelfImg}
                    theme="blue"
                    title={COORD_OPTION_SELF_TITLE}
                    description={COORD_OPTION_SELF_DESC}
                    infoLabel={selfInfoLabel}
                    infoContent={<CheckoutSelfCoordinationInfoNote />}
                    selected={selfSelected}
                    dimmed={sellerSelected}
                    onSelect={() => onSelect('self')}
                />
            </div>

            {/* Tablet/desktop: tarjetas verticales (imagen + texto debajo). */}
            <div
                role="radiogroup"
                aria-label="¿Quién fija la cita?"
                className="coordination-step-from-left hidden grid-cols-2 items-stretch gap-3 sm:grid"
            >
                <OptionCard
                    theme="amber"
                    illustration={sellerImg}
                    title={COORD_OPTION_SELLER_TITLE}
                    description={sellerDescription}
                    infoLabel={sellerInfoLabel}
                    infoContent={<CheckoutSellerEnlaceInfoNote />}
                    offerLabel={COORD_OPTION_SELLER_OFFER}
                    recommended
                    disabled={sellerOptionDisabled}
                    selected={sellerSelected}
                    dimmed={selfSelected}
                    onSelect={() => onSelect('seller')}
                />
                <OptionCard
                    theme="blue"
                    illustration={selfImg}
                    title={COORD_OPTION_SELF_TITLE}
                    description={COORD_OPTION_SELF_DESC}
                    infoLabel={selfInfoLabel}
                    infoContent={<CheckoutSelfCoordinationInfoNote />}
                    selected={selfSelected}
                    dimmed={sellerSelected}
                    onSelect={() => onSelect('self')}
                />
            </div>

            {disabledNote}
        </>
    );
}

export function CheckoutCoordinationStep({
    view,
    selection,
    embedded = false,
    coordinationMode = null,
    onSelect,
    sellerPhone,
    sellerEmail,
    sellerListingUrl,
    onSellerPhoneChange,
    onSellerEmailChange,
    onSellerListingUrlChange,
    sellerOptionDisabled,
    headingClassName,
}: CheckoutCoordinationStepProps) {
    const showSellerFields =
        view === 'seller' ||
        view === 'seller-plazos' ||
        view === 'seller-contact' ||
        coordinationMode === 'seller' ||
        selection === 'seller';
    const sellerFieldsVariant =
        view === 'seller-plazos' ? 'plazos' : view === 'seller-contact' ? 'contact' : 'full';
    const effectiveSelection = selection ?? coordinationMode;

    if (embedded) {
        return (
            <>
                <CheckoutEmbeddedStepHeader
                    step={1}
                    title="¿Quién fija la cita?"
                    description={
                        !showSellerFields
                            ? '¿Compraste por internet o ya hablas con el vendedor?'
                            : (
                                  <>
                                      Indica teléfono o email del vendedor para enviarle el{' '}
                                      <span className="font-bold text-[#1c1c1c]">enlace</span> de reserva.
                                  </>
                              )
                    }
                />
                <div className={cn(SD_CHECKOUT_EMBEDDED_STEP_CONTENT_CLASS, 'pb-3 pt-2.5')}>
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
            ? '¿Quién fija la cita?'
            : view === 'seller-plazos'
              ? 'Plazos para el vendedor'
              : 'Datos del vendedor';
    const subtitle =
        view === 'choose'
            ? '¿Compraste por internet o ya hablas con el vendedor?'
            : view === 'seller-plazos'
              ? null
              : (
                  <>
                      Teléfono o email para enviarle el <span className="font-bold text-[#1c1c1c]">enlace</span>{' '}
                      de reserva. El anuncio es opcional.
                  </>
              );

    return (
        <div>
            <header className={cn('max-w-xl', isSubStep && 'mb-1')}>
                {!isSubStep ? (
                    <span
                        aria-hidden
                        className="block h-[3px] w-9 rounded-full bg-gradient-to-r from-[#0066cc] to-[#f59e0b]"
                    />
                ) : null}
                <h2
                    className={cn(
                        'font-bold leading-[1.15] tracking-[-0.02em] text-[#14161a] [text-wrap:balance]',
                        isSubStep
                            ? 'text-[17px] sm:text-lg'
                            : 'mt-3 text-[20px] sm:text-[22px] lg:text-[24px]',
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

            <div className={cn(isSubStep ? 'mt-3' : 'mt-4 sm:mt-5')}>
                {view === 'choose' ? (
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
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
