import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/** Pasos del wizard móvil del checkout en modo "La elijo yo ahora". */
export type CheckoutMobileWizardStep = 1 | 2 | 3 | 4;

interface CheckoutMobileStepHeaderProps {
    /** Posición actual (1-based) dentro del flujo. */
    step: number;
    /** Total de pasos del flujo. */
    total: number;
    /** Qué se pide en esta pantalla, en lenguaje hablado. */
    title: string;
    /** Una frase que explique el paso (por qué / qué pasa después). */
    description?: ReactNode;
    className?: string;
}

/**
 * Cabecera móvil del wizard de reserva: barra fina de progreso + "Paso X de Y"
 * + título y explicación del paso. Sustituye al timeline de círculos: en una
 * pantalla pequeña el usuario necesita saber QUÉ se le pide aquí y qué pasará
 * después, no el mapa completo de pasos.
 */
export function CheckoutMobileStepHeader({
    step,
    total,
    title,
    description,
    className,
}: CheckoutMobileStepHeaderProps) {
    return (
        <header className={cn('min-w-0 text-center', className)}>
            {/* Barra de progreso SEGMENTADA: un tramo azul por paso, con huequitos
                blancos brevísimos entre ellos que simbolizan cada paso del wizard. */}
            <div
                className="flex gap-1"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={total}
                aria-valuenow={step}
                aria-label={`Paso ${step} de ${total}`}
            >
                {Array.from({ length: total }).map((_, i) => (
                    <span
                        key={i}
                        aria-hidden
                        className={cn(
                            'h-[3px] flex-1 rounded-full transition-colors duration-300 ease-out motion-reduce:transition-none',
                            i < step ? 'bg-brand' : 'bg-[#e3e7ec]',
                        )}
                    />
                ))}
            </div>
            {/* Centrado y con la fuente del sistema (font-extrabold), igual que el paso
                "¿Quién elige la fecha?", para que TODOS los pasos se vean coherentes. */}
            <p className="mt-2.5 text-[12px] font-medium tabular-nums text-[#8b93a1]" aria-hidden>
                Paso {step} de {total}
            </p>
            <h2 className="mt-0.5 text-[20px] font-extrabold leading-[1.15] tracking-[-0.025em] text-[#14161a] [text-wrap:balance]">
                {title}
            </h2>
            {description ? (
                <p className="mx-auto mt-1.5 max-w-[42ch] text-[13px] leading-relaxed text-[#565d6b]">
                    {description}
                </p>
            ) : null}
        </header>
    );
}
