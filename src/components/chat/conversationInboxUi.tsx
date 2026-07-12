import { ShieldCheck } from 'lucide-react';

/**
 * Piezas de UI compartidas por las bandejas de conversaciones (cliente y experto).
 * Extraído de MessagesPage para reutilizarlo en la bandeja del experto sin
 * duplicar el sistema visual (chips de estado, tiempos relativos, tonos).
 */

export type FilterTab = 'all' | 'pre-hire' | 'post-hire';

export const FILTER_LABELS: Record<FilterTab, string> = {
    all: 'Todas',
    'pre-hire': 'Pre-contratación',
    'post-hire': 'Contratadas',
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
            className={`inline-flex h-[18px] shrink-0 items-center gap-1 rounded-full px-2 text-badge font-semibold leading-none tracking-tight ring-1 ${palette}`}
        >
            {icon === 'shield' && (
                <ShieldCheck className="h-[11px] w-[11px]" strokeWidth={2.25} aria-hidden />
            )}
            {label}
        </span>
    );
};

/**
 * Heurística para mapear un estado de contratación (string libre del backend)
 * a un tono de chip. Mantiene la coherencia con el sistema de la /busquedas.
 */
export function tonFromHireStatus(status: string | null | undefined): StatusChipProps['tone'] {
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
