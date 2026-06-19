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
    value,
    onClear,
}: MapAddressSearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MapboxAutocompleteItem[]>([]);
    const [showList, setShowList] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Query ya confirmada (al elegir un resultado) → evita re-buscar lo ya elegido.
    const committedRef = useRef<string | null>(null);

    const tokenOk = isMapboxTokenConfigured();

    useEffect(() => {
        if (value == null) return;
        committedRef.current = value.trim() || null;
        setQuery(value);
        setShowList(false);
        setResults([]);
    }, [value]);

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
        ? 'w-full rounded-xl border border-[#e5e7eb] bg-[#fafafa] py-2.5 pl-4 pr-10 text-[15px] text-[#1c1c1c] placeholder:text-[#9ca3af] transition-colors focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15'
        : overlay
          ? 'w-full rounded-full border-0 bg-white/96 py-3 pl-4 pr-10 text-[15px] text-[#1c1c1c] shadow-[0_4px_20px_rgba(15,23,42,0.14),0_1px_4px_rgba(15,23,42,0.08)] backdrop-blur-md placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-brand/25'
          : 'w-full rounded-full border-0 bg-white/95 py-2.5 pl-4 pr-10 font-display text-sm text-[#222222] shadow-[0_4px_14px_rgba(14,20,36,0.12),0_1px_3px_rgba(14,20,36,0.08)] ring-1 ring-black/[0.04] backdrop-blur-md placeholder:text-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-brand/30';

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
            <input
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
                    className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-black/[0.06] hover:text-[#1c1c1c]"
                    aria-label="Borrar búsqueda"
                >
                    <X className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                </button>
            ) : (
                <Search
                    className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#717171]"
                    strokeWidth={2.2}
                    aria-hidden
                />
            )}

            {showList && results.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-[10000] mt-2 max-h-60 overflow-y-auto rounded-2xl border border-black/[0.06] bg-white py-1 shadow-[0_12px_32px_rgba(14,20,36,0.18)]">
                    {results.map((item) => (
                        <li
                            key={item.id}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(item);
                            }}
                            className="flex cursor-pointer items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-[#f5f5f5]"
                        >
                            <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9aa0a6]" aria-hidden />
                            <span className="min-w-0">
                                <span className="block truncate font-display text-[13.5px] font-medium text-[#222222]">
                                    {item.address}
                                </span>
                                {item.locationName && item.locationName !== 'Ubicación' && (
                                    <span className="block truncate text-[12px] text-[#8a8a8a]">
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
