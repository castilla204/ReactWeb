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
const ROTATE_MS = 4000;

/**
 * Formación superpuesta sobre la foto del servicio (móvil) o pie de foto (desktop).
 * Alterna títulos con animación suave. Móvil: chip sobrio bajo el top bar.
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
    const metaParts = [current.centro, current.anio].filter(Boolean);

    const chip = isMobile ? (
        <div
            key={index}
            className="formacion-chip pointer-events-none inline-flex max-w-[min(100%,15.5rem)] flex-col gap-0.5 rounded-sm border border-white/35 bg-white/94 px-2.5 py-2 shadow-[0_1px_8px_rgba(0,0,0,0.14)] backdrop-blur-sm"
        >
            <span
                className="truncate text-caption font-semibold leading-tight text-ink-strong"
                title={current.titulo}
            >
                {current.titulo}
                {current.esOficial ? (
                    <span className="font-normal text-ink-muted"> · Oficial</span>
                ) : null}
            </span>
            {metaParts.length > 0 ? (
                <span className="truncate text-kicker leading-tight text-ink-muted">
                    {metaParts.join(' · ')}
                </span>
            ) : null}
            {items.length > 1 ? (
                <span className="mt-0.5 flex gap-1" aria-hidden>
                    {items.map((_, i) => (
                        <span
                            key={i}
                            className={`h-1 w-1 rounded-full transition-colors duration-300 ${
                                i === index % items.length ? 'bg-ink-strong/70' : 'bg-ink-strong/20'
                            }`}
                        />
                    ))}
                </span>
            ) : null}
        </div>
    ) : (
        <div
            key={index}
            className="formacion-chip pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full border border-white/40 bg-white/92 px-3 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur-md"
        >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <GraduationCap size={12} className="shrink-0 text-brand" strokeWidth={2.2} />
            </span>
            <span
                className="min-w-0 truncate text-meta font-semibold leading-tight text-ink-strong"
                title={current.titulo}
            >
                {current.titulo}
            </span>
            {current.esOficial ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-success-tint px-1.5 py-0.5 text-badge font-semibold leading-none text-success">
                    <BadgeCheck size={10} strokeWidth={2.5} />
                    <span className="hidden sm:inline">Oficial</span>
                </span>
            ) : null}
        </div>
    );

    const motionStyles = `
        @keyframes formacion-rise {
            0%   { opacity: 0; transform: translateY(${isMobile ? '8px' : '10px'}) scale(0.98); }
            60%  { opacity: 1; }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .formacion-chip {
            animation: formacion-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
            .formacion-chip { animation: none; }
        }
    `;

    if (isAboveTitle) {
        return (
            <div className={`pointer-events-none ${className ?? ''}`} aria-hidden>
                {chip}
                <style>{motionStyles}</style>
            </div>
        );
    }

    return (
        <div
            className={`formacion-overlay pointer-events-none absolute z-20 flex flex-col items-start ${
                isMobile
                    ? 'left-3 top-[3.25rem] max-w-[calc(100%-0.75rem)]'
                    : 'bottom-6 left-0 max-w-[90%] px-5'
            } ${className ?? ''}`}
            aria-live="polite"
            aria-label={`Formación del experto: ${current.titulo}`}
        >
            {chip}
            <style>{motionStyles}</style>
        </div>
    );
}
