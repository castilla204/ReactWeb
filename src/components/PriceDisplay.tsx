import { useCurrency } from '../contexts/CurrencyContext';

/**
 * Round 24 — Componente centralizado para mostrar precios con conversión.
 *
 * Reglas:
 *   - Mismo currency  : "£100"
 *   - Convertido      : "≈ €115 EUR (£100 GBP)"
 *   - Rate no disponible: "£100 GBP (conversion unavailable)"
 *   - Free            : "Gratis" (cuando amount === 0 y allowFree)
 *
 * @example
 *   <PriceDisplay amount={service.price} sourceCurrency={service.currency} />
 *   <PriceDisplay amount={100} sourceCurrency="GBP" inline />
 */
export interface PriceDisplayProps {
    /** Importe en mayor unidad (€/£), NO en cents. */
    amount: number | null | undefined;
    /** Currency original; default 'EUR'. */
    sourceCurrency?: string;
    /** Currency en la que mostrar; default = preferredCurrency. */
    targetCurrency?: string;
    /** Si true, devuelve un span en línea. Si false (default), un div. */
    inline?: boolean;
    /** Si true, mostrar "Gratis" cuando amount es 0 o null. */
    allowFree?: boolean;
    /** Texto a mostrar cuando amount es null/0 si allowFree es false. Default "Consultar". */
    consultText?: string;
    /** ClassName CSS para el contenedor. */
    className?: string;
    /** ClassName para la parte del precio fuente (paréntesis). */
    sourceClassName?: string;
}

export function PriceDisplay({
    amount,
    sourceCurrency = 'EUR',
    targetCurrency,
    inline = false,
    allowFree = false,
    consultText = 'Consultar',
    className,
    sourceClassName,
}: PriceDisplayProps) {
    const { formatPriceWithSource } = useCurrency();

    // Caso null/0
    if (amount == null || !Number.isFinite(amount) || amount === 0) {
        const text = allowFree && amount === 0 ? 'Gratis' : consultText;
        return inline ? <span className={className}>{text}</span> : <div className={className}>{text}</div>;
    }

    const result = formatPriceWithSource(amount, sourceCurrency, targetCurrency);

    if (!result.wasConverted) {
        // Mismo currency o rate no disponible
        return inline
            ? <span className={className}>{result.display}</span>
            : <div className={className}>{result.display}</div>;
    }

    // Convertido: mostrar converted en primer plano y source en small
    const content = (
        <>
            <span>≈ {result.converted}</span>
            <span className={sourceClassName} style={sourceClassName ? undefined : { marginLeft: 6, color: '#6B7280', fontSize: '0.85em' }}>
                ({result.sourceFormatted})
            </span>
        </>
    );
    return inline ? <span className={className}>{content}</span> : <div className={className}>{content}</div>;
}

export default PriceDisplay;
