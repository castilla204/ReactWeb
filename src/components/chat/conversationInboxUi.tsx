import { ShieldCheck } from 'lucide-react';

/**
 * Piezas de UI compartidas por las bandejas de conversaciones (cliente y experto).
 * Extraído de MessagesPage para reutilizarlo en la bandeja del experto sin
 * duplicar el sistema visual (chips de estado, tiempos relativos, tonos).
 */

export type FilterTab = 'all' | 'pre-hire' | 'post-hire';

export const FILTER_LABELS: Record<FilterTab, string> = {
    all: 'Todas',
    'pre-hire': 'Consultas',
    'post-hire': 'Contrataciones',
};

export function formatRelative(iso: string): string {
    try {
        const date = new Date(iso);
        const diff = Date.now() - date.getTime();
        const min = Math.floor(diff / 60_000);
        if (min < 1) return 'ahora';
        if (min < 60) return `${min} min`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr} h`;
        const d = Math.floor(hr / 24);
        if (d === 1) return 'ayer';
        if (d < 7) return `${d} d`;
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
        return '';
    }
}

export type StatusChipTone = 'brand' | 'green' | 'amber' | 'red' | 'neutral';

export interface StatusChipProps {
    label: string;
    tone: StatusChipTone;
    /** Icono opcional al inicio del chip (p. ej. escudo para contratación). */
    icon?: 'shield';
}

export const STATUS_CHIP_PALETTE: Record<StatusChipTone, string> = {
    brand: 'bg-brand/[0.08] ring-brand/25 text-brand',
    green: 'bg-success-tint ring-success-border text-success',
    amber: 'bg-warning-tint ring-warning-border text-warning',
    red: 'bg-destructive/10 ring-destructive/30 text-destructive',
    neutral: 'bg-surface-tinted ring-line text-ink-muted',
};

export const StatusChip: React.FC<StatusChipProps> = ({ label, tone, icon }) => {
    const palette = STATUS_CHIP_PALETTE[tone];
    return (
        <span
            title={label}
            className={`inline-flex h-[18px] max-w-[150px] shrink-0 items-center gap-1 rounded-full px-2 text-badge font-semibold leading-none tracking-tight ring-1 ${palette}`}
        >
            {icon === 'shield' && (
                <ShieldCheck className="h-[11px] w-[11px] shrink-0" strokeWidth={2.25} aria-hidden />
            )}
            <span className="truncate">{label}</span>
        </span>
    );
};

/**
 * Heurística para mapear un estado de contratación (string libre del backend)
 * a un tono de chip. Mantiene la coherencia con el sistema de la /busquedas.
 *
 * `rawStatus` (el valor crudo de SearchHireStatus, p. ej. "dispute_resolved_expert")
 * se comprueba PRIMERO porque el string-matching sobre el texto traducido no
 * puede distinguir "Disputa Resuelta a Favor del Experto" (ganada) de "...del
 * Cliente" (perdida): ambas contienen "resuelt" y antes caían las dos en verde.
 * Ese colapso es justo el peor momento para equivocarse (¿cobré o no?), así que
 * el estado crudo manda cuando está disponible; el heurístico de texto queda
 * como fallback para el resto de estados.
 */
export function tonFromHireStatus(
    status: string | null | undefined,
    rawStatus?: string | null,
): StatusChipProps['tone'] {
    if (rawStatus === 'dispute_resolved_expert') return 'green';
    if (rawStatus === 'dispute_resolved_client') return 'red';

    const s = (status || '').toLowerCase();
    if (!s) return 'brand';
    if (s.includes('complet') || s.includes('entrega') || s.includes('resuelt')) return 'green';
    if (s.includes('disput') || s.includes('cita') || s.includes('pendient') || s.includes('esperan'))
        return 'amber';
    if (s.includes('cancel') || s.includes('rechaz')) return 'red';
    return 'brand';
}

/**
 * Estados que NO mostramos como chip "especial": el chip cae a "Contratación
 * activa" genérico. Coincide con el comportamiento de la bandeja del cliente.
 */
export const NEUTRAL_HIRE_STATUSES = new Set([
    'activa',
    'activo',
    'en curso',
    'en proceso',
    'pre-contratación',
    'pre contratación',
    'precontratación',
]);

/**
 * Fila-fantasma para el estado de carga inicial: mismo tamaño de avatar/línea
 * que ExpertConversationRow, para que el loading no salte al llegar los datos
 * reales (percepción de carga premium, en vez de un spinner centrado).
 */
export const ConversationRowSkeleton: React.FC<{ index: number; isLast: boolean }> = ({
    index,
    isLast,
}) => (
    <div
        className="relative flex w-full items-center gap-3 px-3 py-3 animate-fade-in motion-reduce:animate-none md:px-3.5"
        style={{ animationDelay: `${index * 55}ms` }}
    >
        <div className="h-[52px] w-[52px] shrink-0 animate-pulse rounded-full bg-line-soft" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
                <div className="h-3.5 w-40 animate-pulse rounded-full bg-line-soft" />
                <div className="h-3 w-10 animate-pulse rounded-full bg-line-soft" />
            </div>
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-line-soft" />
        </div>
        {!isLast && (
            <span className="pointer-events-none absolute bottom-0 left-[72px] right-0 h-px bg-line-soft" aria-hidden />
        )}
    </div>
);
