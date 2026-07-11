const SEAL_PATH =
    'M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z';

interface VerifiedBadgeProps {
    /** Clases de posición/tamaño, p.ej. "absolute -bottom-1 -right-1 h-5 w-5" */
    className?: string;
}

/**
 * Insignia de "verificado" estilo medalla: sello negro con borde blanco y
 * check blanco. Pensada para superponerse en la esquina de un avatar.
 */
export function VerifiedBadge({ className = 'h-5 w-5' }: VerifiedBadgeProps) {
    return (
        <span className={`pointer-events-none ${className}`.trim()} aria-hidden>
            <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]">
                {/* Borde blanco (sello ampliado) */}
                <path
                    d={SEAL_PATH}
                    fill="#ffffff"
                    transform="translate(12 12) scale(1.16) translate(-12 -12)"
                />
                {/* Sello negro */}
                <path d={SEAL_PATH} fill="#171717" />
                {/* Check blanco */}
                <path
                    d="m8.5 12 2.5 2.5 4.5-4.5"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
}
