import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import {
    searchMapboxAutocomplete,
    isMapboxTokenConfigured,
    MapboxAutocompleteItem,
} from '../utils/mapboxGeocoding';

export interface MapAddressSelection {
    address: string;
    locationName: string;
    lat: number;
    lng: number;
    countryCode: string | null;
}

interface MapAddressSearchBarProps {
    /** Se llama al elegir una dirección del autocompletado. */
    onSelect: (selection: MapAddressSelection) => void;
    /** País (ISO alpha-2) para sesgar resultados. */
    country?: string | null;
    /** Centro actual del mapa para priorizar resultados cercanos. */
    proximity?: { lat: number; lng: number } | null;
    placeholder?: string;
    /** Clase del wrapper (controla el ancho/posición desde fuera). */
    className?: string;
    /** Estilo integrado en cabecera (sin sombra flotante sobre el mapa). */
    embedded?: boolean;
    /** Pill flotante sobre el mapa (checkout wizard). */
    overlay?: boolean;
    /** Sin marco propio (transparente, sin sombra ni borde): para incrustar el input
     *  dentro de una barra contenedora que ya aporta fondo/redondeo/sombra. */
    bare?: boolean;
    /** Enfoca el input al montar (para el overlay de búsqueda a pantalla completa). */
    autoFocus?: boolean;
    /** Sincroniza el texto cuando la dirección viene del mapa u otra fuente. */
    value?: string | null;
    /** Al borrar el campo de búsqueda. */
    onClear?: () => void;
}

/**
 * Barra de búsqueda de direcciones flotante para el mapa de "buscar servicios".
 *
 * Reutiliza el mismo patrón Mapbox que AppointmentMap (autocomplete v6 con debounce
 * de 300 ms + dropdown de sugerencias). Es autónoma: gestiona su propio estado de
 * query/resultados; el padre solo recibe la selección final vía `onSelect` y se
 * encarga de recentrar el mapa.
 *
 * Si el token de Mapbox no está configurado, NO se renderiza (evita una barra rota).
 */
export function MapAddressSearchBar({
    onSelect,
    country,
    proximity,
    placeholder = 'Buscar dirección, ciudad o código postal…',
    className = '',
    embedded = false,
    overlay = false,
    bare = false,
    autoFocus = false,
    value,
    onClear,
}: MapAddressSearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MapboxAutocompleteItem[]>([]);
    const [showList, setShowList] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    // Query ya confirmada (al elegir un resultado) → evita re-buscar lo ya elegido.
    const committedRef = useRef<string | null>(null);

    const tokenOk = isMapboxTokenConfigured();

    useEffect(() => {
        if (value == null) return;
        committedRef.current = value.trim() || null;
        // Idempotente: no cambiar estado si ya coincide (evita re-render y bucles cuando
        // el padre nos pasa el mismo `value` en cada render).
        setQuery((prev) => (prev === value ? prev : value));
        setShowList(false);
        setResults((prev) => (prev.length === 0 ? prev : []));
    }, [value]);

    // Enfoque al montar (overlay de búsqueda a pantalla completa). El pequeño retardo
    // asegura que el teclado móvil se abra tras la transición de apertura del overlay.
    useEffect(() => {
        if (!autoFocus) return;
        const t = setTimeout(() => inputRef.current?.focus(), 60);
        return () => clearTimeout(t);
    }, [autoFocus]);

    useEffect(() => {
        if (!tokenOk) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const trimmed = query.trim();
        if (trimmed.length < 3) {
            setResults([]);
            setShowList(false);
            setError(null);
            return;
        }
        if (trimmed === committedRef.current) {
            setShowList(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                setError(null);
                const items = await searchMapboxAutocomplete(trimmed, {
                    language: 'es',
                    country: country || undefined,
                    proximity: proximity || undefined,
                });
                setResults(items);
                setShowList(items.length > 0);
            } catch (err: any) {
                console.warn('[MapAddressSearchBar] Autocomplete falló:', err);
                setError(err?.message || 'Error en la búsqueda');
                setResults([]);
                setShowList(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, country, proximity?.lat, proximity?.lng, tokenOk]);

    const handleSelect = useCallback(
        (item: MapboxAutocompleteItem) => {
            const address = item.address || item.place_name || '';
            committedRef.current = address.trim();
            setQuery(address);
            setShowList(false);
            setResults([]);
            onSelect({
                address,
                locationName: item.locationName || address || 'Ubicación seleccionada',
                lat: item.lat ?? 0,
                lng: item.lng ?? 0,
                countryCode: item.countryCode ?? null,
            });
        },
        [onSelect],
    );

    if (!tokenOk) return null;

    const hasQuery = query.length > 0;

    const inputCls = embedded
        ? 'w-full rounded-full border border-line bg-white py-2.5 pl-11 pr-10 text-meta text-ink-strong placeholder:text-ink-muted transition-colors focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/15'
        : overlay
          ? 'w-full rounded-full border-0 bg-white/96 py-3 pl-4 pr-10 text-lead text-ink-strong shadow-[0_4px_20px_rgba(15,23,42,0.14),0_1px_4px_rgba(15,23,42,0.08)] backdrop-blur-md placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/25'
          : bare
            ? 'h-11 w-full rounded-none border-0 bg-transparent pl-9 pr-9 font-display text-body text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0'
            : 'h-11 w-full rounded-full border-0 bg-white/95 pl-4 pr-10 font-display text-lead text-ink shadow-[0_4px_14px_rgba(14,20,36,0.12),0_1px_3px_rgba(14,20,36,0.08)] ring-1 ring-black/[0.04] backdrop-blur-md placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30';

    const handleClear = () => {
        committedRef.current = null;
        setQuery('');
        setShowList(false);
        setResults([]);
        setError(null);
        onClear?.();
    };

    return (
        <div className={`relative ${className}`}>
            {embedded || bare ? (
                <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
                    strokeWidth={2.1}
                    aria-hidden
                />
            ) : null}
            <input
                ref={inputRef}
                type="text"
                value={query}
                placeholder={placeholder}
                onChange={(e) => {
                    committedRef.current = null;
                    setQuery(e.target.value);
                }}
                onFocus={() => {
                    if (results.length > 0 && query.trim() !== committedRef.current) {
                        setShowList(true);
                    }
                }}
                onBlur={() => setTimeout(() => setShowList(false), 150)}
                className={inputCls}
                aria-label="Buscar dirección"
            />
            {hasQuery ? (
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClear}
                    className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-black/[0.06] hover:text-ink-strong"
                    aria-label="Borrar búsqueda"
                >
                    <X className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                </button>
            ) : !embedded && !bare ? (
                <Search
                    className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                    strokeWidth={2.2}
                    aria-hidden
                />
            ) : null}

            {showList && results.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-[10000] mt-2 max-h-60 overflow-y-auto rounded-2xl border border-black/[0.06] bg-white py-1 shadow-[0_12px_32px_rgba(14,20,36,0.18)]">
                    {results.map((item) => (
                        <li
                            key={item.id}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(item);
                            }}
                            className="flex cursor-pointer items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-surface-tinted"
                        >
                            <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" aria-hidden />
                            <span className="min-w-0">
                                <span className="block truncate font-display text-meta font-medium text-ink">
                                    {item.address}
                                </span>
                                {item.locationName && item.locationName !== 'Ubicación' && (
                                    <span className="block truncate text-caption text-ink-muted">
                                        {item.locationName}
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {error && (
                <div className="absolute left-0 right-0 top-full z-[10000] mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 shadow">
                    {error}
                </div>
            )}
        </div>
    );
}

export default MapAddressSearchBar;
