import { useEffect, useRef, useState } from 'react';

/**
 * Monta sus hijos solo cuando el contenedor entra al viewport.
 * Útil para diferir mapas (maplibre-gl ~295 KB gz, mapbox-gl ~513 KB gz)
 * fuera del crítico cuando el mapa está below-the-fold.
 *
 * - Reserva el layout con `aspectRatio` para que el `IntersectionObserver`
 *   tenga algo que medir y para evitar CLS al montar.
 * - `rootMargin` por defecto = 200px → arranca la descarga un poco antes de
 *   que el usuario llegue al mapa, suficiente para que esté listo cuando
 *   entra al viewport.
 * - `once = true`: tras montar, no se vuelve a desmontar al salir del viewport.
 */
export function LazyMount({
    children,
    fallback = null,
    rootMargin = '200px',
    className,
    style,
    aspectRatio,
    minHeight,
}: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    rootMargin?: string;
    className?: string;
    style?: React.CSSProperties;
    aspectRatio?: React.CSSProperties['aspectRatio'];
    minHeight?: React.CSSProperties['minHeight'];
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (visible) return;
        if (typeof IntersectionObserver === 'undefined') {
            // Navegadores sin IntersectionObserver (legacy WebViews): renderizar
            // de inmediato — el coste de no hacerlo es peor que la regresión.
            setVisible(true);
            return;
        }
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setVisible(true);
                    io.disconnect();
                }
            },
            { rootMargin },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [rootMargin, visible]);

    return (
        <div
            ref={ref}
            className={className}
            style={{ aspectRatio, minHeight, ...style }}
        >
            {visible ? children : fallback}
        </div>
    );
}
