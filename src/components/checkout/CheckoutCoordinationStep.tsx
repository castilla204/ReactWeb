import { Check } from 'lucide-react';
import { CheckoutSellerCoordinationFields } from './CheckoutSellerCoordinationFields';
import { HP_FONT, SD_CHECKOUT_EMBEDDED_SECTION_DESC_CLASS, SD_CHECKOUT_EMBEDDED_SECTION_TITLE_CLASS } from '../../constants/homepageTypography';
import { cn } from '../../lib/utils';
import coordSelfImg from '../../media/coord-self.jpg';
import coordSellerImg from '../../media/coord-seller.jpg';

export type CoordinationView = 'choose' | 'seller' | 'seller-plazos' | 'seller-contact';
export type CoordinationSelection = 'self' | 'seller';

type Theme = 'blue' | 'amber';

// Tinte suave alineado con el degradado de marca del checkout (ubicación / títulos).
// Deja ver la foto y mantiene legibilidad con la viñeta inferior.
const THEME_TINT: Record<Theme, string> = {
    blue: [
        'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 40%)',
        'linear-gradient(105deg, rgba(0,38,84,0.72) 0%, rgba(0,78,160,0.56) 50%, rgba(37,99,235,0.34) 100%)',
    ].join(', '),
    amber: [
        'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 38%)',
        'linear-gradient(105deg, rgba(251,191,36,0.34) 0%, rgba(245,158,11,0.5) 48%, rgba(180,83,9,0.62) 100%)',
    ].join(', '),
};

const FOOTER_TINT: Record<Theme, string> = {
    blue: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,51,102,0.42) 100%)',
    amber: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(146,64,14,0.4) 100%)',
};

interface OptionCardProps {
    image: string;
    theme: Theme;
    title: string;
    description: string;
    recommended?: boolean;
    selected: boolean;
    dimmed: boolean;
    disabled?: boolean;
    compact?: boolean;
    embedded?: boolean;
    onSelect: () => void;
}

function OptionCard({
    image,
    theme,
    title,
    description,
    recommended,
    selected,
    dimmed,
    disabled,
    compact,
    embedded,
    onSelect,
}: OptionCardProps) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={disabled ? undefined : onSelect}
            className={cn(
                'group relative isolate flex flex-col justify-end overflow-hidden text-left',
                compact ? 'aspect-[16/10] rounded-xl lg:aspect-[2/1]' : 'aspect-[5/3] rounded-xl sm:aspect-[3/2] sm:rounded-2xl',
                embedded
                    ? 'border-0 shadow-none'
                    : 'border border-[#ebebeb]/70 shadow-[0_1px_6px_rgba(15,23,42,0.05)]',
                'transition-[box-shadow,opacity,transform] duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2',
                selected
                    ? embedded
                        ? 'ring-2 ring-brand/50 ring-offset-2 ring-offset-white'
                        : 'border-brand/40 ring-2 ring-brand/20 shadow-[0_4px_16px_rgba(0,102,204,0.1)]'
                    : embedded
                      ? 'opacity-90 hover:opacity-100'
                      : 'hover:border-[#d1d5db] hover:shadow-[0_4px_12px_rgba(15,23,42,0.07)]',
                disabled
                    ? 'pointer-events-none cursor-not-allowed opacity-40 grayscale'
                    : dimmed ? 'opacity-55' : 'opacity-100',
            )}
        >
            <img
                src={image}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                draggable={false}
                className="absolute inset-0 -z-30 h-full w-full select-none object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div aria-hidden className="absolute inset-0 -z-20" style={{ background: THEME_TINT[theme] }} />
            <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent"
            />

            {recommended ? (
                <span
                    className="absolute left-3 top-2.5 z-10 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/35 backdrop-blur-sm"
                    style={{ fontFamily: HP_FONT }}
                >
                    Recomendado
                </span>
            ) : null}

            <span
                aria-hidden
                className={cn(
                    'absolute right-3 top-2.5 z-10 grid h-6 w-6 place-items-center rounded-full transition-all duration-200',
                    selected
                        ? 'bg-white text-brand shadow-md'
                        : 'bg-black/20 ring-1 ring-white/50 backdrop-blur-sm',
                )}
            >
                <Check className={cn('h-3.5 w-3.5 stroke-[2.75]', selected ? 'opacity-100' : 'opacity-0')} />
            </span>

            <div
                className={cn(
                    'relative z-[1] w-full border-t border-white/20',
                    compact ? 'px-3.5 py-2' : 'px-3.5 py-2',
                )}
                style={{ background: FOOTER_TINT[theme] }}
            >
                <h3
                    className={cn(
                        'font-bold leading-snug tracking-[-0.015em] text-white',
                        compact ? 'text-[14px]' : 'text-[15px]',
                    )}
                    style={{ fontFamily: HP_FONT }}
                >
                    {title}
                </h3>
                <p className={cn('leading-snug text-white/90', compact ? 'mt-0.5 text-[11px]' : 'mt-0.5 text-[12px]')}>
                    {description}
                </p>
            </div>
        </button>
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

function CoordinationOptionCards({
    selection,
    compact,
    embedded,
    sellerOptionDisabled,
    onSelect,
}: {
    selection: CoordinationSelection | null;
    compact?: boolean;
    embedded?: boolean;
    sellerOptionDisabled?: boolean;
    onSelect: (value: CoordinationSelection) => void;
}) {
    return (
        <>
            <div
                role="radiogroup"
                aria-label="¿Cómo se fija la cita?"
                className={cn(
                    'coordination-step-from-left grid gap-2.5',
                    compact ? 'grid-cols-2 gap-3' : 'grid-cols-1 sm:grid-cols-2',
                )}
            >
                <OptionCard
                    image={coordSelfImg}
                    theme="blue"
                    title="Yo me encargo"
                    description={
                        embedded
                            ? 'Tú acuerdas con el vendedor y reservas aquí día, hora y dirección de la inspección.'
                            : 'Si ya hablas con el vendedor, eliges tú fecha, hora y dirección.'
                    }
                    compact={compact}
                    embedded={embedded}
                    selected={selection === 'self'}
                    dimmed={selection === 'seller'}
                    onSelect={() => onSelect('self')}
                />
                <OptionCard
                    image={coordSellerImg}
                    theme="amber"
                    title="Coordínalo Inspecciono"
                    description={
                        embedded
                            ? 'Compraste en un portal o anuncio: contactamos al vendedor y le enviamos un enlace para que elija cita.'
                            : 'Si compraste en un portal o anuncio, contactamos al vendedor por ti.'
                    }
                    recommended
                    compact={compact}
                    embedded={embedded}
                    disabled={sellerOptionDisabled}
                    selected={selection === 'seller'}
                    dimmed={selection === 'self'}
                    onSelect={() => onSelect('seller')}
                />
            </div>
            {sellerOptionDisabled ? (
                <p
                    role="note"
                    className="mt-2.5 text-[12px] leading-relaxed text-[#b45309]"
                >
                    Este técnico no tiene disponibilidad en plazo. Elige «Yo me encargo» o prueba más
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
                <div className={SD_CHECKOUT_EMBEDDED_SECTION_TITLE_CLASS}>
                    <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                        ¿Cómo se fija la cita?
                    </h3>
                    <p className={SD_CHECKOUT_EMBEDDED_SECTION_DESC_CLASS}>
                        Hay que acordar con el vendedor cuándo y dónde inspeccionar el coche. Elige si
                        lo gestionas tú —porque ya habláis— o si prefieres que Inspecciono le contacte
                        y le envíe un enlace para reservar.
                    </p>
                </div>
                <div className="px-5 pb-4 pt-2">
                    <CoordinationOptionCards
                        selection={effectiveSelection}
                        compact
                        embedded
                        sellerOptionDisabled={sellerOptionDisabled}
                        onSelect={onSelect}
                    />
                </div>
                {showSellerFields ? (
                    <div key="seller" className="coordination-step-from-right px-5 pb-2 pt-1">
                        <div className={cn(SD_CHECKOUT_EMBEDDED_SECTION_TITLE_CLASS, 'px-0 pt-2')}>
                            <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                                Plazos para el vendedor
                            </h3>
                            <p className={cn(SD_CHECKOUT_EMBEDDED_SECTION_DESC_CLASS, 'max-w-none')}>
                                Cuánto tiempo puede tardar el vendedor en reservar. El calendario de
                                abajo muestra la disponibilidad del experto dentro de ese plazo.
                            </p>
                        </div>
                        <div className="pt-3">
                            <CheckoutSellerCoordinationFields
                                variant="plazos"
                                sellerPhone={sellerPhone}
                                sellerEmail={sellerEmail}
                                sellerListingUrl={sellerListingUrl}
                                onSellerPhoneChange={onSellerPhoneChange}
                                onSellerEmailChange={onSellerEmailChange}
                                onSellerListingUrlChange={onSellerListingUrlChange}
                            />
                        </div>
                    </div>
                ) : null}
            </>
        );
    }

    const isSubStep = view === 'seller-plazos' || view === 'seller-contact';
    const title =
        view === 'choose'
            ? '¿Cómo se fija la cita?'
            : view === 'seller-plazos'
              ? 'Plazos para el vendedor'
              : 'Datos del vendedor';
    const subtitle =
        view === 'choose'
            ? 'Acuerda con el vendedor cuándo y dónde inspeccionar el coche. Elige la opción que encaje con tu compra.'
            : view === 'seller-plazos'
              ? null
              : 'Teléfono o email para enviarle el enlace de reserva. El anuncio es opcional.';

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
