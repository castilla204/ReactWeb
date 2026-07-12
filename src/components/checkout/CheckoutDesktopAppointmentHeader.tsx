import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface DesktopCrumbStep {
    id: number;
    label: string;
}

/**
 * Miga de pasos del checkout desktop (patrón Shopify/Baymard: los pasos completados son
 * clicables y hacen de "volver", el actual va en negrita, los futuros atenuados). Da el
 * contexto que faltaba: en qué paso estás y qué viene después.
 */
export function CheckoutDesktopStepCrumbs({
    steps,
    currentId,
    onStepSelect,
    className,
}: {
    steps: readonly DesktopCrumbStep[];
    currentId: number;
    /** Si falta, la miga es solo indicador (no navegable). */
    onStepSelect?: (id: number) => void;
    className?: string;
}) {
    return (
        <nav aria-label="Pasos del proceso" className={cn('flex items-center gap-1.5 text-[12px] leading-none', className)}>
            {steps.map((step, i) => {
                const isCurrent = step.id === currentId;
                const isDone = step.id < currentId;
                return (
                    <Fragment key={step.id}>
                        {i > 0 ? (
                            <ChevronRight className="h-3 w-3 shrink-0 text-[#c7ccd4]" aria-hidden />
                        ) : null}
                        {isDone && onStepSelect ? (
                            <button
                                type="button"
                                onClick={() => onStepSelect(step.id)}
                                className="font-medium text-[#475569] underline-offset-2 transition-colors hover:text-[#1c1c1c] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2"
                            >
                                {step.label}
                            </button>
                        ) : (
                            <span
                                aria-current={isCurrent ? 'step' : undefined}
                                className={cn(
                                    isCurrent
                                        ? 'font-semibold text-[#1c1c1c]'
                                        : isDone
                                          ? 'font-medium text-[#475569]'
                                          : 'text-[#9aa3b0]',
                                )}
                            >
                                {step.label}
                            </span>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}

/**
 * Cabecera de paso del checkout desktop. Fila superior de navegación (chip «Volver …» que
 * NOMBRA el destino + miga de pasos a la derecha) y debajo título + lead AL RAS del borde
 * izquierdo, alineados con las columnas de contenido.
 */
export function CheckoutDesktopAppointmentHeader({
    title,
    description,
    onBack,
    backLabel = 'Volver',
    steps,
    currentStepId,
    onStepSelect,
    className,
}: {
    /** Si falta, no se pinta título ni lead (paso de pago: la miga ya dice "Pago"). */
    title?: string;
    description?: ReactNode;
    onBack?: () => void;
    /** Nombra el destino («Volver al servicio», «Volver a la cita»…), no un «Volver» huérfano. */
    backLabel?: string;
    steps?: readonly DesktopCrumbStep[];
    currentStepId?: number;
    onStepSelect?: (id: number) => void;
    className?: string;
}) {
    const showNavRow = Boolean(onBack || (steps && steps.length > 0));
    return (
        <header className={cn('shrink-0', className)}>
            {showNavRow ? (
                <div className="mb-5 flex items-center justify-between gap-4">
                    {onBack ? (
                        <button
                            type="button"
                            onClick={onBack}
                            className="group/back inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white pl-2.5 pr-3.5 text-[13px] font-medium text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-[#cdd3db] hover:bg-[#f7f8fa] hover:text-[#1c1c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2"
                        >
                            <ArrowLeft
                                className="h-4 w-4 transition-transform duration-200 group-hover/back:-translate-x-0.5"
                                strokeWidth={2}
                                aria-hidden
                            />
                            {backLabel}
                        </button>
                    ) : (
                        <span />
                    )}
                    {steps && steps.length > 0 && currentStepId !== undefined ? (
                        <CheckoutDesktopStepCrumbs
                            steps={steps}
                            currentId={currentStepId}
                            onStepSelect={onStepSelect}
                        />
                    ) : null}
                </div>
            ) : null}
            {title ? (
                <>
                    <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.02em] text-[#1c1c1c] lg:text-[19px]">
                        {title}
                    </h2>
                    <p className="mt-1.5 max-w-2xl text-[13px] leading-[1.5] text-[#565d6b] lg:text-[14px]">
                        {description}
                    </p>
                </>
            ) : null}
        </header>
    );
}
