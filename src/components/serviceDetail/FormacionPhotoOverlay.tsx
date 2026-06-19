import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { parseFormacion } from '../expertPanel/formacion';

interface FormacionPhotoOverlayProps {
    /** JSON de la formación del experto (campo `formacion` del perfil). */
    value?: string | null;
    variant?: 'desktop' | 'mobile';
    /** desktop: above-title = dentro del pie de foto, justo encima del título */
    placement?: 'floating' | 'above-title';
    className?: string;
}

/** Cada cuántos ms rota al siguiente título. */
const ROTATE_MS = 3000;

/**
 * Formación superpuesta SOBRE la foto del servicio. Para no recargar (y no
 * ocupar mucho), muestra UN solo chip cada vez y va alternando entre los
 * títulos, cada uno entrando con una animación que sube desde abajo.
 * Apariencia ligera (translúcida, sin borde). No intercepta clics.
 * Si el experto no tiene formación, no renderiza nada.
 */
export default function FormacionPhotoOverlay({
    value,
    variant = 'desktop',
    placement = 'floating',
    className,
}: FormacionPhotoOverlayProps) {
    const items = parseFormacion(value);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (items.length <= 1) return;
        const id = window.setInterval(() => {
            setIndex((i) => (i + 1) % items.length);
        }, ROTATE_MS);
        return () => window.clearInterval(id);
    }, [items.length]);

    if (items.length === 0) return null;

    const isMobile = variant === 'mobile';
    const isAboveTitle = !isMobile && placement === 'above-title';
    const current = items[index % items.length];

    const chip = (
        <div
            key={index}
            className={`formacion-chip flex max-w-full items-center rounded-full bg-white/85 text-[#1c1c1c] shadow-sm ring-1 ring-black/5 backdrop-blur-md ${
                isMobile ? 'gap-1.5 px-3 py-1' : 'gap-1.5 px-2.5 py-1'
            }`}
        >
            <GraduationCap
                size={14}
                className="shrink-0 text-[#1C63B4]"
                strokeWidth={2}
            />
            <span
                className={`min-w-0 truncate font-medium ${
                    isMobile ? 'text-[13px] leading-tight' : 'text-xs leading-tight'
                }`}
                title={current.titulo}
            >
                {current.titulo}
            </span>
        </div>
    );

    if (isAboveTitle) {
        return (
            <div className={`pointer-events-none ${className ?? ''}`} aria-hidden>
                {chip}
                <style>{`
                    @keyframes formacion-rise {
                        0%   { opacity: 0; transform: translateY(10px) scale(0.98); }
                        60%  { opacity: 1; }
                        100% { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .formacion-chip {
                        animation: formacion-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .formacion-chip { animation: none; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div
            className={`formacion-overlay pointer-events-none absolute left-0 z-20 flex flex-col items-start ${
                isMobile ? 'bottom-[46px] max-w-[80%] px-2.5' : 'bottom-28 max-w-[90%] px-5'
            } ${className ?? ''}`}
            aria-hidden
        >
            {chip}
            <style>{`
                @keyframes formacion-rise {
                    0%   { opacity: 0; transform: translateY(22px) scale(0.96); }
                    60%  { opacity: 1; }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .formacion-chip {
                    animation: formacion-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                @media (prefers-reduced-motion: reduce) {
                    .formacion-chip { animation: none; }
                }
            `}</style>
        </div>
    );
}
