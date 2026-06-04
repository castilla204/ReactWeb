import React, { useMemo } from 'react';
import { Globe } from 'lucide-react';
import { useCurrency, SUPPORTED_CURRENCIES } from '../contexts/CurrencyContext';

interface CurrencySelectorProps {
    variant?: 'compact' | 'full';
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ variant = 'compact' }) => {
    const { currencies, preferredCurrency, setPreferredCurrency } = useCurrency();
    const safeCurrencies = useMemo(() => {
        const seen = new Set<string>();
        const filtered = currencies
            .map((c) => ({
                ...c,
                code: (c?.code ?? (c as any)?.Code ?? '').toString().trim().toUpperCase(),
                name: c?.name ?? (c as any)?.Name ?? '',
                symbol: c?.symbol ?? (c as any)?.Symbol ?? '',
                locale: c?.locale ?? (c as any)?.Locale ?? 'en-US',
            }))
            .filter((c) => {
                if (!c.code || seen.has(c.code)) return false;
                seen.add(c.code);
                return true;
            });
        // 🛡️ Round 28 CUR-SEL-1: hard floor — si el backend devolvió un payload con shape
        // inesperado o lista vacía, NO dejamos el select sin opciones (lo que produce el
        // bug visual "parpadea y desaparece"). Caemos al fallback hardcoded EUR/USD/GBP/CHF/CAD.
        return filtered.length > 0 ? filtered : SUPPORTED_CURRENCIES;
    }, [currencies]);

    const sizeClasses =
        variant === 'full'
            ? 'pl-8 pr-9 py-2 text-sm rounded-lg border border-[#e8e8e8] bg-white font-medium text-[#1c1c1c] hover:bg-[#f9fafb]'
            : 'pl-7 pr-8 py-1.5 text-[13px] font-semibold text-[#222222] rounded-full border border-[#d1d5db] bg-white hover:border-[#222222] hover:bg-[#f9fafb]';

    return (
        <div className="relative inline-flex items-center">
            <Globe
                className={`pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 ${
                    variant === 'full' ? 'text-[#6a6a6a]' : 'text-[#222222]'
                }`}
                aria-hidden
            />
            <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className={`appearance-none ${sizeClasses} cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30`}
                aria-label="Select display currency"
            >
                {safeCurrencies.map(c => (
                    <option key={c.code} value={c.code}>
                        {variant === 'full' ? `${c.code} — ${c.symbol} ${c.name}` : `${c.code} — ${c.symbol}`}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default CurrencySelector;
