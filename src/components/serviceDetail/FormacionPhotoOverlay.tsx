import { useEffect, useState } from 'react';
import { GraduationCap, BadgeCheck } from 'lucide-react';
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
const ROTATE_MS = 3500;

/**
 * Formación superpuesta SOBRE la foto del servicio.
 * Muestra UN chip a la vez y alterna entre los títulos con una animación suave.
 * Apariencia profesional: fondo blanco translúcido, anillo sutil, badge de oficial.
 * No intercepta clics. Si el experto no tiene formación, no renderiza nada.
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
            className={`formacion-chip pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full border border-white/40 bg-white/92 shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur-md ${
                isMobile ? 'px-3 py-1.5' : 'px-3 py-1.5'
            }`}
        >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eaf1fb]">
                <GraduationCap
                    size={12}
                    className="shrink-0 text-[#1C63B4]"
                    strokeWidth={2.2}
                />
            </span>
            <span
                className={`min-w-0 truncate font-semibold text-[#1c1c1c] ${
                    isMobile ? 'text-[13px] leading-tight' : 'text-[13px] leading-tight'
                }`}
                title={current.titulo}
            >
                {current.titulo}
            </span>
            {current.esOficial && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[#e8f5ee] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#0d7a4d]">
                    <BadgeCheck size={10} strokeWidth={2.5} />
                    <span className="hidden sm:inline">Oficial</span>
                </span>
            )}
        </div>
    );

    if (isAboveTitle) {
        return (
            <div className={`pointer-events-none ${className ?? ''}`} aria-hidden>
                {chip}
                <style>{`
                    @keyframes formacion-rise {
                        0%   { opacity: 0; transform: translateY(10px) scale(0.97); }
                        60%  { opacity: 1; }
                        100% { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .formacion-chip {
                        animation: formacion-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
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
                isMobile ? 'bottom-4 max-w-[82%] px-4' : 'bottom-6 max-w-[90%] px-5'
            } ${className ?? ''}`}
            aria-hidden
        >
            {chip}
            <style>{`
                @keyframes formacion-rise {
                    0%   { opacity: 0; transform: translateY(18px) scale(0.96); }
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
