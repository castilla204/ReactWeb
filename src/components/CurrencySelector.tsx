import React from 'react';
import { Globe } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

interface CurrencySelectorProps {
    variant?: 'compact' | 'full';
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ variant = 'compact' }) => {
    const { currencies, preferredCurrency, setPreferredCurrency } = useCurrency();

    const sizeClasses = variant === 'full'
        ? 'pl-8 pr-9 py-2 text-sm'
        : 'pl-7 pr-8 py-1.5 text-sm';

    return (
        <div className="relative inline-flex items-center">
            <Globe className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className={`appearance-none ${sizeClasses} rounded-full bg-gray-100 hover:bg-gray-200 font-medium text-gray-700 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30`}
                aria-label="Select display currency"
            >
                {currencies.map(c => (
                    <option key={c.code} value={c.code}>
                        {variant === 'full' ? `${c.code} — ${c.symbol} ${c.name}` : `${c.code} — ${c.symbol}`}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default CurrencySelector;
