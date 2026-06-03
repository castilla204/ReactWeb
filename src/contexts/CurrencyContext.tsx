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

/**
 * Resultado de formatPriceWithSource: provee la cadena formateada lista para mostrar
 * Y los campos brutos por si el componente necesita renderizarlos diferente.
 *
 * Reglas de formato:
 *   - Mismo currency: "£100" (sin paréntesis)
 *   - Convertido: "≈ €115 EUR (£100 GBP)"
 *   - Tasa no disponible: "£100 GBP (conversion unavailable)"
 */
export interface PriceWithSourceResult {
    /** Cadena lista para mostrar (con "≈" y "(source)" si aplica). */
    display: string;
    /** Cadena solo del precio convertido (ej "€115 EUR") — sin "≈" ni paréntesis. */
    converted: string;
    /** Cadena solo del precio original (ej "£100 GBP"). */
    sourceFormatted: string;
    /** Importe convertido en mayor unidad (€/£/etc.). */
    convertedAmount: number;
    /** Importe original en mayor unidad. */
    sourceAmount: number;
    /** Currency code que se está mostrando. */
    displayCurrency: string;
    /** Currency code original. */
    sourceCurrency: string;
    /** True si hubo conversión (currencies distintas y rate válida). */
    wasConverted: boolean;
    /** True si la rate de destino no estaba disponible y se mostró el source en su lugar. */
    rateUnavailable: boolean;
}

interface CurrencyContextType {
    currencies: Currency[];
    rates: Record<string, number>; // rate FROM base (EUR) TO each currency
    baseCurrency: string;
    preferredCurrency: string; // user's choice
    setPreferredCurrency: (code: string) => void;
    convert: (amount: number, fromCurrency: string, toCurrency?: string) => number;
    formatPrice: (amountInCents: number, currencyCode?: string) => string;
    /**
     * Formatea un precio mostrando el original entre paréntesis si hubo conversión.
     * @param amount Importe en MAYOR unidad (€/£), NO en cents.
     * @param sourceCurrency Currency original del precio (ej "EUR" si viene del backend).
     * @param targetCurrency Currency en la que mostrar; default = preferredCurrency.
     */
    formatPriceWithSource: (
        amount: number,
        sourceCurrency?: string,
        targetCurrency?: string,
    ) => PriceWithSourceResult;
    /** True si la rate del currency dado está disponible (>0). */
    hasRate: (currencyCode: string) => boolean;
    /** Timestamp (ms) en el que se cargaron las rates con éxito; null si nunca. */
    ratesFetchedAt: number | null;
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
    const [ratesFetchedAt, setRatesFetchedAt] = useState<number | null>(null);

    // Fetch /api/currencies en el mount para obtener la lista oficial y las tasas en vivo.
    // Round 24: retry exponencial (3 intentos, 2s→4s→8s) + sanitización de rates 0/null.
    useEffect(() => {
        let cancelled = false;

        const sanitizeRates = (raw: Record<string, unknown>): Record<string, number> => {
            const clean: Record<string, number> = { EUR: 1 };
            for (const [code, val] of Object.entries(raw)) {
                const n = typeof val === 'number' ? val : Number(val);
                if (Number.isFinite(n) && n > 0) {
                    clean[code] = n;
                } else {
                    console.warn(`[CurrencyContext] Skipping invalid rate for ${code}:`, val);
                }
            }
            return clean;
        };

        const attempt = async (i: number): Promise<void> => {
            try {
                setError(null);
                const response = await fetch(`${API_CONFIG.baseUrl}/api/currencies`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (cancelled) return;
                if (Array.isArray(data?.currencies) && data.currencies.length > 0) {
                    // 🛡️ Round 28 CUR-SEL-1: normalizar a lowercase para que sobreviva
                    // independientemente del PropertyNamingPolicy del backend. Soporta tanto
                    // `code/name/symbol/locale` (lowercase, contrato correcto) como
                    // `Code/Name/Symbol/Locale` (PascalCase, regresión anterior). Sin esto,
                    // el filtro de CurrencySelector descartaba todos los items y el dropdown
                    // se quedaba vacío.
                    const normalized: Currency[] = (data.currencies as any[])
                        .map((c) => ({
                            code: String(c?.code ?? c?.Code ?? '').trim().toUpperCase(),
                            name: String(c?.name ?? c?.Name ?? ''),
                            symbol: String(c?.symbol ?? c?.Symbol ?? ''),
                            locale: String(c?.locale ?? c?.Locale ?? 'en-US'),
                        }))
                        .filter((c) => c.code.length > 0);
                    if (normalized.length > 0) {
                        setCurrencies(normalized);
                    }
                }
                if (data?.rates && typeof data.rates === 'object') {
                    setRates(sanitizeRates(data.rates as Record<string, unknown>));
                }
                setRatesFetchedAt(Date.now());
            } catch (err) {
                if (cancelled) return;
                const message = err instanceof Error ? err.message : 'Unknown error';
                if (i < 2) {
                    const delay = 2000 * Math.pow(2, i); // 2s, 4s, 8s
                    console.warn(`[CurrencyContext] /api/currencies attempt ${i + 1} failed (${message}), retrying in ${delay}ms`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    if (!cancelled) await attempt(i + 1);
                } else {
                    console.warn('[CurrencyContext] Failed to load /api/currencies after retries, using defaults:', message);
                    setError(message);
                }
            }
        };

        setLoading(true);
        attempt(0).finally(() => {
            if (!cancelled) setLoading(false);
        });
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
            // 🛡️ Round 28 CUR-2: endpoint correcto es /api/User/preferred-currency (controller
            // UserController con [Route("api/[controller]")]). Antes apuntaba a /api/Auth → 404
            // silencioso (catch solo console.warn) → sync multi-device roto desde Round 22.
            fetch(`${API_CONFIG.baseUrl}/api/User/preferred-currency`, {
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

    const hasRate = useCallback((currencyCode: string): boolean => {
        if (!currencyCode) return false;
        if (currencyCode === BASE_CURRENCY) return true;
        const r = rates[currencyCode];
        return typeof r === 'number' && Number.isFinite(r) && r > 0;
    }, [rates]);

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

    const formatPriceWithSource = useCallback((
        amount: number,
        sourceCurrency: string = BASE_CURRENCY,
        targetCurrency: string = preferredCurrency,
    ): PriceWithSourceResult => {
        const safeAmount = Number.isFinite(amount) ? amount : 0;
        const source = sourceCurrency || BASE_CURRENCY;
        const target = targetCurrency || preferredCurrency || BASE_CURRENCY;

        // Caso 1: misma moneda → sin paréntesis
        if (source === target) {
            const formatted = formatPrice(safeAmount * 100, target);
            return {
                display: formatted,
                converted: formatted,
                sourceFormatted: formatted,
                convertedAmount: safeAmount,
                sourceAmount: safeAmount,
                displayCurrency: target,
                sourceCurrency: source,
                wasConverted: false,
                rateUnavailable: false,
            };
        }

        const sourceFormatted = formatPrice(safeAmount * 100, source);

        // Caso 2: rate de destino no disponible → mostrar solo el source con aviso
        if (!hasRate(target)) {
            return {
                display: `${sourceFormatted} (conversion unavailable)`,
                converted: sourceFormatted,
                sourceFormatted,
                convertedAmount: safeAmount,
                sourceAmount: safeAmount,
                displayCurrency: source,
                sourceCurrency: source,
                wasConverted: false,
                rateUnavailable: true,
            };
        }

        // Caso 3: conversión normal → "≈ €115 EUR (£100 GBP)"
        const convertedAmount = convert(safeAmount, source, target);
        const convertedFormatted = formatPrice(convertedAmount * 100, target);
        return {
            display: `≈ ${convertedFormatted} ${target} (${sourceFormatted} ${source})`,
            converted: `${convertedFormatted} ${target}`,
            sourceFormatted: `${sourceFormatted} ${source}`,
            convertedAmount,
            sourceAmount: safeAmount,
            displayCurrency: target,
            sourceCurrency: source,
            wasConverted: true,
            rateUnavailable: false,
        };
    }, [convert, formatPrice, hasRate, preferredCurrency]);

    const value = useMemo<CurrencyContextType>(() => ({
        currencies,
        rates,
        baseCurrency: BASE_CURRENCY,
        preferredCurrency,
        setPreferredCurrency,
        convert,
        formatPrice,
        formatPriceWithSource,
        hasRate,
        ratesFetchedAt,
        loading,
        error,
    }), [currencies, rates, preferredCurrency, setPreferredCurrency, convert, formatPrice, formatPriceWithSource, hasRate, ratesFetchedAt, loading, error]);

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
