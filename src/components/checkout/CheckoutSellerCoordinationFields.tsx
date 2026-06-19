import React, { useMemo } from 'react';
import { Link2, Mail, Minus, Phone, Plus } from 'lucide-react';
import { HP_FONT } from '../../constants/homepageTypography';
import { cn } from '../../lib/utils';
import {
    SELLER_BOOKING_MAX_DAYS,
    SELLER_BOOKING_MIN_BUSINESS_DAYS,
    clampSellerBookingDays,
    formatSellerBookingDaysLabel,
    formatSellerBookingDeadlineDate,
    type SellerDaySummary,
} from '../../utils/sellerBookingWindow';

const fieldClass =
    'w-full rounded-xl bg-[#f4f5f7] py-3 pl-10 pr-3.5 text-sm text-[#1c1c1c] outline-none transition-colors placeholder:text-[#9aa0aa] focus:bg-white focus:ring-2 focus:ring-brand/30';

export interface CheckoutSellerCoordinationFieldsProps {
    sellerPhone: string;
    sellerEmail: string;
    sellerListingUrl: string;
    sellerMaxDays: number;
    sellerDeadlineHours: number;
    onSellerPhoneChange: (value: string) => void;
    onSellerEmailChange: (value: string) => void;
    onSellerListingUrlChange: (value: string) => void;
    onSellerMaxDaysChange: (value: number) => void;
    minBookingDays?: number;
    maxBookingDays?: number;
    daySummaries?: SellerDaySummary[];
    limitsLoading?: boolean;
    /** Móvil: paso plazos o contacto por separado; desktop usa full. */
    variant?: 'full' | 'plazos' | 'contact';
    className?: string;
}

export function sellerCoordinationCanContinue(phone: string, email: string) {
    return phone.trim().length > 0 || email.trim().length > 0;
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

interface SellerBookingWindowControlProps {
    value: number;
    minDays: number;
    maxDays: number;
    summaries: SellerDaySummary[];
    loading?: boolean;
    onChange: (value: number) => void;
}

function SellerBookingWindowControl({
    value,
    minDays,
    maxDays,
    summaries,
    loading,
    onChange,
}: SellerBookingWindowControlProps) {
    const deadlineLabel = useMemo(
        () => formatSellerBookingDeadlineDate(value, summaries),
        [value, summaries],
    );
    const fillPercent = maxDays > 1 ? ((value - minDays) / (maxDays - minDays)) * 100 : 100;
    const canDecrease = value > minDays && !loading;
    const canIncrease = value < maxDays && !loading;

    const step = (delta: number) => {
        onChange(clampSellerBookingDays(value + delta, minDays, maxDays));
    };

    return (
        <div className="space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
                <p className="text-[15px] leading-snug text-[#1c1c1c]">
                    <span className="font-semibold tabular-nums" style={{ fontFamily: HP_FONT }}>
                        {formatSellerBookingDaysLabel(value)}
                    </span>
                    <span className="text-[#b0b5bf]"> · </span>
                    <span className="text-[#6a6a6a]">
                        {loading ? 'Calculando…' : `hasta ${deadlineLabel.toLowerCase()}`}
                    </span>
                </p>
                <div className="flex shrink-0 items-center gap-1 text-[#9ca3af]">
                    <button
                        type="button"
                        onClick={() => step(-1)}
                        disabled={!canDecrease}
                        aria-label="Menos un día"
                        className="inline-flex h-7 w-7 items-center justify-center disabled:opacity-25"
                    >
                        <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => step(1)}
                        disabled={!canIncrease}
                        aria-label="Más un día"
                        className="inline-flex h-7 w-7 items-center justify-center disabled:opacity-25"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <input
                type="range"
                min={minDays}
                max={maxDays}
                step={1}
                value={value}
                disabled={loading}
                onChange={(e) =>
                    onChange(clampSellerBookingDays(Number(e.target.value), minDays, maxDays))
                }
                style={{
                    background: `linear-gradient(to right, hsl(var(--brand)) 0%, hsl(var(--brand)) ${fillPercent}%, #eceef2 ${fillPercent}%, #eceef2 100%)`,
                }}
                className="h-1 w-full cursor-pointer appearance-none rounded-full disabled:opacity-50 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-brand"
                aria-label="Días de plazo para el vendedor"
            />

            <p className="text-[11px] leading-relaxed text-[#9ca3af]">
                {loading
                    ? 'Calculando mínimo según agenda del experto…'
                    : `De ${formatSellerBookingDaysLabel(minDays)} a 2 semanas · reembolso 100% si no reserva`}
            </p>
        </div>
    );
}

export function CheckoutSellerCoordinationFields({
    sellerPhone,
    sellerEmail,
    sellerListingUrl,
    sellerMaxDays,
    onSellerPhoneChange,
    onSellerEmailChange,
    onSellerListingUrlChange,
    onSellerMaxDaysChange,
    minBookingDays = SELLER_BOOKING_MIN_BUSINESS_DAYS,
    maxBookingDays = SELLER_BOOKING_MAX_DAYS,
    daySummaries = [],
    limitsLoading = false,
    variant = 'full',
    className,
}: CheckoutSellerCoordinationFieldsProps) {
    const showContact = variant === 'full' || variant === 'contact';
    const showPlazos = variant === 'full' || variant === 'plazos';
    const minDays = clampSellerBookingDays(minBookingDays, 1, maxBookingDays);
    const windowDays = clampSellerBookingDays(sellerMaxDays, minDays, maxBookingDays);

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
                            className={fieldClass}
                            inputMode="url"
                        />
                    </IconField>
                    <p className="text-xs leading-relaxed text-[#6a6a6a]">
                        Indica al menos un teléfono o email. Le enviaremos un enlace para que elija
                        día, hora y lugar.
                    </p>
                </div>
            ) : null}

            {showPlazos ? (
                <SellerBookingWindowControl
                    value={windowDays}
                    minDays={minDays}
                    maxDays={maxBookingDays}
                    summaries={daySummaries}
                    loading={limitsLoading}
                    onChange={onSellerMaxDaysChange}
                />
            ) : null}
        </div>
    );
}
