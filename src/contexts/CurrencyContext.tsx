import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';

/**
 * Definición de una moneda soportada por la UI.
 * `code` es el código ISO 4217 (EUR, USD, GBP, CHF, CAD, …).
 * `symbol` es el glifo a mostrar junto al código en el selector.
 * `locale` es el BCP 47 locale usado por Intl.NumberFormat para formatear precios.
 */
export interface Currency {
    code: string;
    name: string;
    symbol: string;
    locale: string;
}

/**
 * Lista de monedas soportadas por defecto, alineada con la whitelist EEA+US+CA+GB+CH
 * (ver TODO arquitectural en priceUtils.ts línea ~97). Se usa como fallback hasta
 * que /api/currencies responda con la lista oficial del backend.
 */
export const SUPPORTED_CURRENCIES: Currency[] = [
    { code: 'EUR', name: 'Euro', symbol: '€', locale: 'es-ES' },
    { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
    { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', locale: 'de-CH' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
];

/**
 * Tasas de cambio por defecto (relativas a EUR como moneda base).
 * Se sobreescriben con los valores reales que devuelva /api/currencies.
 */
const DEFAULT_RATES: Record<string, number> = {
    EUR: 1,
    USD: 1.08,
    GBP: 0.85,
    CHF: 0.96,
    CAD: 1.48,
};

interface CurrencyContextType {
    currencies: Currency[];
    rates: Record<string, number>; // rate FROM base (EUR) TO each currency
    baseCurrency: string;
    preferredCurrency: string; // user's choice
    setPreferredCurrency: (code: string) => void;
    convert: (amount: number, fromCurrency: string, toCurrency?: string) => number;
    formatPrice: (amountInCents: number, currencyCode?: string) => string;
    loading: boolean;
    error: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'preferredCurrency';
const BASE_CURRENCY = 'EUR';

/**
 * Detección best-effort de la moneda preferida a partir del locale del navegador.
 * No es una llamada real a IP (eso lo hace el backend); aquí simplemente mapeamos
 * idiomas/regiones comunes a su moneda más probable. /api/currencies + preferencia
 * persistida en backend siguen siendo la fuente de verdad.
 */
function detectFromIP(): string | null {
    try {
        if (typeof navigator === 'undefined') return null;
        const language = navigator.language || (navigator.languages && navigator.languages[0]);
        if (!language) return null;
        const localeMap: Record<string, string> = {
            'es-ES': 'EUR', 'fr-FR': 'EUR', 'de-DE': 'EUR', 'it-IT': 'EUR', 'pt-PT': 'EUR',
            'en-US': 'USD', 'en-GB': 'GBP', 'en-CA': 'CAD', 'fr-CA': 'CAD',
            'de-CH': 'CHF', 'fr-CH': 'CHF', 'it-CH': 'CHF',
        };
        if (localeMap[language]) return localeMap[language];
        const region = language.split('-')[0];
        const regionMap: Record<string, string> = {
            es: 'EUR', fr: 'EUR', de: 'EUR', it: 'EUR', pt: 'EUR', en: 'USD',
        };
        return regionMap[region] || null;
    } catch {
        return null;
    }
}

function readStoredCurrency(): string {
    if (typeof window === 'undefined') return BASE_CURRENCY;
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;
    } catch {
        // localStorage no disponible (modo privado/SSR): caer al detector
    }
    return detectFromIP() || BASE_CURRENCY;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currencies, setCurrencies] = useState<Currency[]>(SUPPORTED_CURRENCIES);
    const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
    const [preferredCurrency, setPreferredCurrencyState] = useState<string>(readStoredCurrency);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch /api/currencies en el mount para obtener la lista oficial y las tasas en vivo.
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${API_CONFIG.baseUrl}/api/currencies`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                if (cancelled) return;
                if (Array.isArray(data?.currencies) && data.currencies.length > 0) {
                    setCurrencies(data.currencies);
                }
                if (data?.rates && typeof data.rates === 'object') {
                    setRates(data.rates);
                }
            } catch (err) {
                if (cancelled) return;
                const message = err instanceof Error ? err.message : 'Unknown error';
                console.warn('[CurrencyContext] Failed to load /api/currencies, using defaults:', message);
                setError(message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const setPreferredCurrency = useCallback((code: string) => {
        setPreferredCurrencyState(code);
        try {
            window.localStorage.setItem(STORAGE_KEY, code);
        } catch {
            // ignorar errores de cuota/permiso de localStorage
        }
        // Si el usuario está autenticado, persistir también en backend para sincronizar dispositivos.
        const token = getAuthToken();
        if (token) {
            fetch(`${API_CONFIG.baseUrl}/api/Auth/preferred-currency`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currency: code }),
            }).catch((err) => {
                console.warn('[CurrencyContext] Failed to sync preferred currency to backend:', err);
            });
        }
    }, []);

    const convert = useCallback((
        amount: number,
        fromCurrency: string,
        toCurrency: string = preferredCurrency,
    ): number => {
        if (fromCurrency === toCurrency) return amount;
        const fromRate = rates[fromCurrency] ?? 1; // tasas relativas a EUR
        const toRate = rates[toCurrency] ?? 1;
        // amount está en fromCurrency. Convertir a EUR base y luego a toCurrency.
        const inBase = amount / fromRate;
        return inBase * toRate;
    }, [rates, preferredCurrency]);

    const formatPrice = useCallback((
        amountInCents: number,
        currencyCode: string = preferredCurrency,
    ): string => {
        const currency = currencies.find((c) => c.code === currencyCode);
        const amount = amountInCents / 100;
        try {
            return new Intl.NumberFormat(currency?.locale || 'en-US', {
                style: 'currency',
                currency: currencyCode,
            }).format(amount);
        } catch {
            // Intl puede tirar con códigos de moneda no soportados — degradar a símbolo manual.
            const symbol = currency?.symbol || currencyCode;
            return `${symbol}${amount.toFixed(2)}`;
        }
    }, [currencies, preferredCurrency]);

    const value = useMemo<CurrencyContextType>(() => ({
        currencies,
        rates,
        baseCurrency: BASE_CURRENCY,
        preferredCurrency,
        setPreferredCurrency,
        convert,
        formatPrice,
        loading,
        error,
    }), [currencies, rates, preferredCurrency, setPreferredCurrency, convert, formatPrice, loading, error]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency(): CurrencyContextType {
    const ctx = useContext(CurrencyContext);
    if (!ctx) {
        throw new Error('useCurrency debe usarse dentro de <CurrencyProvider>');
    }
    return ctx;
}
