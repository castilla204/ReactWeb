import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { HP_FONT } from '../../constants/homepageTypography';
import type { SearchItem } from '../../hooks/useSearch.hooks';

// Assets reales del proyecto. Si el backend no envía serviceImageUrl,
// mapeamos categoría → foto local. Ningún `<FolderTree/>` placeholder.
import imgCasa from '../../media/revisioncasa.jpg';
import imgCoche from '../../media/revisioncoche.jpg';
import imgMoto from '../../media/revisionmoto.jpg';
import imgMotoAgua from '../../media/motoagua.png';
import imgCamara from '../../media/camarapng.png';

/**
 * SearchInspectionListItem — "Carpeta de archivo del despacho del perito"
 * (rediseño overdrive 2026-06).
 *
 * Card asimétrica: imagen del bien anclada a la izquierda (160-200px en
 * desktop, banda 96px arriba en mobile), pestaña manila sobresaliendo por
 * arriba con el número de referencia, contenido tipo ficha técnica a la
 * derecha. Sello terminal grande rotado para cancelada / disputada.
 *
 * Decisiones de diseño:
 *  · La pestaña es la firma visual del componente. Color brand para activas;
 *    rojo / ámbar para terminales. Sobresale 14px arriba del card body.
 *  · La imagen es el ancla; nunca un placeholder de carpeta. Si el backend
 *    no envía URL, usamos el asset local mapeado por categoría.
 *  · El sello "CANCELADA" / "EN DISPUTA" pesa: 28-36px font-mono, rotado
 *    -12°, opacity 0.14, cruza la mitad superior del contenido.
 *  · Hover: el card se eleva 2px + shadow paper-stack. La pestaña se inclina
 *    1° simulando que la carpeta "se abre".
 *  · `prefers-reduced-motion` desactiva todo motion (clase Tailwind utility).
 *
 * Reglas DESIGN.md respetadas: un solo brand (rojo/ámbar solo en estados
 * negativos como convención universal), Manrope única (mono solo para ID),
 * plano por defecto, sin glassmorphism, sin gradientes.
 */

interface SearchInspectionListItemProps {
    search: SearchItem;
    categoryLabel: string;
    onClick: () => void;
    highlightUnreviewed?: boolean;
}

type FlowStep = 0 | 1 | 2 | 3;
type Terminal = 'cancelled' | 'disputed';

const STEPS: { label: string; shortLabel: string }[] = [
    { label: 'Solicitada', shortLabel: 'Pedida' },
    { label: 'Asignada', shortLabel: 'Asignada' },
    { label: 'Inspeccionada', shortLabel: 'Revisada' },
    { label: 'Entregada', shortLabel: 'Entregada' },
];

const ASSIGNED_STATES = new Set([
    'pending',
    'awaiting_client_decision',
    'appointment_proposed',
]);
const INSPECTING_STATES = new Set([
    'awaiting_appointment',
    'appointment_confirmed',
    'appointment_awaiting_report',
]);
const DELIVERED_STATES = new Set(['appointment_report_sent', 'completed']);
const CANCELLED_STATES = new Set([
    'cancelled',
    'rejected',
    'appointment_cancelled',
    'appointment_rejected',
]);

function resolveProgress(search: SearchItem): FlowStep | Terminal {
    if (!search.searchHire) return 0;
    const raw =
        search.searchHire.statusInfo?.statusValue || search.searchHire.status || '';
    if (CANCELLED_STATES.has(raw)) return 'cancelled';
    if (raw === 'disputed' || raw.startsWith('dispute_')) return 'disputed';
    if (ASSIGNED_STATES.has(raw)) return 1;
    if (INSPECTING_STATES.has(raw)) return 2;
    if (
        DELIVERED_STATES.has(raw) ||
        search.searchHire.statusInfo?.isFinalizationStatus
    )
        return 3;
    return 1;
}

function referenceCode(search: SearchItem): string {
    let year = 2026;
    try {
        if (search.createdAt) {
            const y = new Date(search.createdAt).getFullYear();
            if (Number.isFinite(y) && y > 2000) year = y;
        }
    } catch {
        /* noop */
    }
    const raw = String(search.id ?? '0000');
    const numeric = Number(raw);
    const tail = Number.isFinite(numeric)
        ? String(numeric).padStart(4, '0').slice(-4)
        : raw.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase().padStart(4, '0');
    return `INSP-${year}-${tail}`;
}

function shortDate(iso: string): string {
    try {
        return new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'short',
        }).format(new Date(iso));
    } catch {
        return '';
    }
}

function relativeFromNow(iso: string): string {
    try {
        const diff = Date.now() - new Date(iso).getTime();
        const min = Math.round(diff / 60_000);
        if (min < 60) return min <= 1 ? 'ahora' : `${min} min`;
        const hr = Math.round(min / 60);
        if (hr < 24) return `${hr} h`;
        const days = Math.round(hr / 24);
        if (days === 1) return 'ayer';
        if (days < 30) return `${days} d`;
        const months = Math.round(days / 30);
        if (months < 12) return `${months} m`;
        return `${Math.round(months / 12)} a`;
    } catch {
        return '';
    }
}

/** Asset local por categoría. Sin "Sin categoría → folder icon". */
function fallbackImage(categoryName: string): string {
    const n = (categoryName || '').toLowerCase();
    if (n.includes('moto') && n.includes('agua')) return imgMotoAgua;
    if (n.includes('moto')) return imgMoto;
    if (n.includes('coche') || n.includes('vehíc') || n.includes('vehic'))
        return imgCoche;
    if (n.includes('inmobil') || n.includes('casa') || n.includes('inmueble'))
        return imgCasa;
    if (n.includes('cámar') || n.includes('camar')) return imgCamara;
    // Default: foto del oficio (inspección de coche), la más representativa
    return imgCoche;
}

const StatusChip: React.FC<{
    progress: FlowStep | Terminal;
    unread: number;
}> = ({ progress, unread }) => {
    const hasUnread = unread > 0;
    const palette = (() => {
        if (progress === 'cancelled')
            return { bg: 'bg-[#FEF2F2]', ring: 'ring-[#FECACA]', text: 'text-[#DC2626]', label: 'Cancelada' };
        if (progress === 'disputed')
            return { bg: 'bg-[#FFFBEB]', ring: 'ring-[#FED7AA]', text: 'text-[#D97706]', label: 'En disputa' };
        if (progress === 3)
            return { bg: 'bg-[#F0F9F4]', ring: 'ring-[#BBE5C9]', text: 'text-[#0F6A3E]', label: 'Entregada' };
        return { bg: 'bg-brand/[0.08]', ring: 'ring-brand/25', text: 'text-brand', label: STEPS[progress].label };
    })();
    return (
        <div className="flex items-center gap-1.5">
            {hasUnread && (
                <span
                    className="inline-flex items-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                    aria-label={`${unread} ${unread === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}`}
                >
                    {unread}
                </span>
            )}
            <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight ring-1 ${palette.bg} ${palette.ring} ${palette.text}`}
            >
                {palette.label}
            </span>
        </div>
    );
};

// (Sello terminal eliminado por feedback del usuario: el chip de estado
// junto al título + la nota inline del footer ya comunican el estado
// terminal. El sello, en cualquier tamaño, añadía ruido sin aportar valor.)

/**
 * Timeline horizontal compacta. Acepta un step (0-3) y un opcional `terminal`
 * que pinta dots+línea en rojo/ámbar en lugar de brand. Si terminal está set,
 * el step es virtual ("hasta dónde llegó antes de cancelarse / disputarse"):
 *   · cancelled → 0 (no avanzó)
 *   · disputed  → 2 (llegó a inspección y se abrió disputa)
 */
const CompactTimeline: React.FC<{
    step: FlowStep;
    terminal?: Terminal | null;
}> = ({ step, terminal }) => {
    const palette = (() => {
        if (terminal === 'cancelled')
            return { active: 'bg-[#DC2626]', past: 'bg-[#DC2626]', line: 'bg-[#DC2626]', ring: 'ring-[#DC2626]/20' };
        if (terminal === 'disputed')
            return { active: 'bg-[#D97706]', past: 'bg-[#D97706]', line: 'bg-[#D97706]', ring: 'ring-[#D97706]/20' };
        return { active: 'bg-brand', past: 'bg-brand', line: 'bg-brand', ring: 'ring-brand/20' };
    })();
    return (
        <div
            className="flex items-center gap-1"
            aria-label={`Paso ${step + 1} de 4: ${STEPS[step].label}${terminal ? ` (${terminal === 'cancelled' ? 'cancelada' : 'en disputa'})` : ''}`}
        >
            {STEPS.map((_, idx) => {
                const isPast = idx < step;
                const isActive = idx === step;
                return (
                    <React.Fragment key={idx}>
                        {idx > 0 && (
                            <span
                                className={`block h-px w-3 ${idx <= step ? palette.line : 'bg-[#d4d4d4]'}`}
                                aria-hidden
                            />
                        )}
                        <span
                            className={[
                                'block h-2 w-2 rounded-full',
                                isActive
                                    ? `${palette.active} ring-[3px] ${palette.ring}`
                                    : isPast
                                      ? palette.past
                                      : 'border border-[#d4d4d4] bg-white',
                            ].join(' ')}
                            aria-hidden
                        />
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const DataCell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="min-w-0">
        <div className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#737373]">
            {label}
        </div>
        <div className="mt-0.5 truncate text-[13.5px] font-semibold leading-snug text-[#1c1c1c]">
            {value}
        </div>
    </div>
);

export const SearchInspectionListItem: React.FC<SearchInspectionListItemProps> = ({
    search,
    categoryLabel,
    onClick,
    highlightUnreviewed = false,
}) => {
    const progress = resolveProgress(search);
    const isTerminal = progress === 'cancelled' || progress === 'disputed';
    const ref = referenceCode(search);
    const dateAbs = search.createdAt ? shortDate(search.createdAt) : '';
    const dateRel = search.createdAt ? relativeFromNow(search.createdAt) : '';
    const dateValue = dateAbs && dateRel ? `${dateAbs} · ${dateRel}` : dateAbs || '—';

    // Construimos la lista de celdas a partir de datos REALES.
    // "Sin categoría" del backend no es un dato; lo tratamos como vacío.
    // Si tras filtrar solo queda la fecha, no usamos grid: mostramos meta inline.
    const isRealCategory =
        !!categoryLabel &&
        categoryLabel.trim() !== '' &&
        !/^sin\s+categor/i.test(categoryLabel);
    const locationValue =
        (search as { locationName?: string | null }).locationName || search.expertCity || null;
    const statusDescription = search.searchHire?.statusInfo?.displayName || null;

    const cells: Array<{ label: string; value: string }> = [];
    if (isRealCategory) cells.push({ label: 'Categoría', value: categoryLabel });
    if (locationValue) cells.push({ label: 'Ubicación', value: locationValue });
    // Detalle del estado del backend: aparece SIEMPRE que exista, también para
    // estados terminales (Cancelada / Disputada). Solo lo suprimimos cuando es
    // literalmente igual al label del chip (info duplicada).
    const chipLabelLower = isTerminal
        ? progress === 'cancelled'
            ? 'cancelada'
            : 'en disputa'
        : STEPS[progress as FlowStep].label.toLowerCase();
    if (statusDescription && statusDescription.toLowerCase() !== chipLabelLower) {
        cells.push({ label: 'Detalle', value: statusDescription });
    }
    cells.push({ label: 'Solicitada', value: dateValue });
    const useGrid = cells.length >= 2;

    // Paso virtual para terminales (sin info real de hasta dónde llegó).
    // Usado solo para colorear la timeline; el label del footer dice "Cancelada"
    // o "En disputa", no "Paso N".
    const virtualStep: FlowStep = isTerminal
        ? progress === 'cancelled'
            ? 0
            : 2
        : (progress as FlowStep);

    const imgSrc = useMemo(
        () => search.serviceImageUrl || fallbackImage(categoryLabel),
        [search.serviceImageUrl, categoryLabel],
    );

    // Pestaña manila: brand para activas, terminal-color para cerradas.
    const tabStyle = (() => {
        if (progress === 'cancelled')
            return { bg: '#DC2626', text: '#FFFFFF', shadow: 'rgba(220, 38, 38, 0.25)' };
        if (progress === 'disputed')
            return { bg: '#D97706', text: '#FFFFFF', shadow: 'rgba(217, 119, 6, 0.25)' };
        return { bg: 'hsl(var(--brand))', text: '#FFFFFF', shadow: 'hsl(var(--brand) / 0.28)' };
    })();

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Informe ${ref} sobre ${search.title}. Estado: ${
                isTerminal
                    ? progress === 'cancelled'
                        ? 'cancelada'
                        : 'en disputa'
                    : STEPS[progress as FlowStep].label
            }${search.unreadMessagesCount > 0 ? `. ${search.unreadMessagesCount} mensajes nuevos` : ''}`}
            className={[
                'group relative block w-full text-left',
                // z-index alto para que la pestaña no quede tapada por el card adyacente.
                // El hover sube aún más para asegurar foco visual.
                'z-[1] hover:z-[2]',
                'rounded-[14px] bg-white border border-[#e8e8e8]',
                // motion: solo transform + shadow + border-color (no layout)
                'transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                'hover:-translate-y-0.5 hover:border-[#d4d4d4]',
                // Sombra simple + mayor profundidad en hover, sin invadir el card adyacente
                'shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
                'hover:shadow-[0_12px_28px_-12px_rgba(15,23,42,0.18)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                highlightUnreviewed ? '!bg-[#FFFBEB]/40' : '',
            ].join(' ')}
            style={{ fontFamily: HP_FONT }}
        >
            {/* PESTAÑA MANILA — sobresale por encima del card.
                Forma rectangular con top corners redondeados (carpeta de archivo
                real); el clip-path inclinado anterior era una geometría tímida
                que se leía como "rectángulo mordido", no como tab orgánica.
                z-[3] para asegurar que se ve por encima de cards adyacentes. */}
            <div
                aria-hidden
                className="absolute left-4 -top-[18px] z-[3] flex h-[26px] items-center sm:left-6"
                style={{
                    background: tabStyle.bg,
                    color: tabStyle.text,
                    padding: '0 14px',
                    boxShadow: `0 2px 8px ${tabStyle.shadow}`,
                    borderRadius: '6px 6px 0 0',
                }}
            >
                <span className="font-mono text-[12.5px] font-semibold tracking-[0.06em] leading-none">
                    {ref}
                </span>
            </div>

            {/* CUERPO ASIMÉTRICO: imagen lateral (desktop) o banda arriba (mobile).
                Mobile image bajada a 92px (antes 120) para densidad: el usuario
                quiere ver MÁS cards en una pantalla, no menos. */}
            <div className="grid grid-cols-1 overflow-hidden rounded-[14px] sm:grid-cols-[180px_1fr]">
                {/* LADO IMAGEN */}
                <div className="relative h-[92px] overflow-hidden bg-[#f5f5f5] sm:h-auto sm:min-h-[180px]">
                    <img
                        src={imgSrc}
                        alt={search.title || categoryValue}
                        loading="lazy"
                        decoding="async"
                        className={[
                            'h-full w-full object-cover',
                            // Imagen pierde saturación en estados terminales
                            isTerminal ? 'grayscale-[0.6] opacity-90' : '',
                        ].join(' ')}
                    />
                </div>

                {/* LADO CONTENIDO */}
                <div className="relative flex flex-col gap-3 px-4 pt-5 pb-4 sm:px-5 sm:pt-6 sm:pb-5">
                    {/* Header: título + chip de estado + chevron */}
                    <div className="relative z-[2] flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-1 text-[14px] font-medium leading-tight text-[#1c1c1c] sm:text-[14.5px]">
                                {search.title}
                            </h3>
                            {isRealCategory && (
                                <p className="mt-0.5 truncate text-[12px] leading-snug text-[#737373]">
                                    {categoryLabel}
                                    {locationValue ? ` · ${locationValue}` : ''}
                                </p>
                            )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                            <StatusChip progress={progress} unread={search.unreadMessagesCount} />
                            <ChevronRight
                                className="h-4 w-4 text-[#cccccc] transition-colors group-hover:text-brand"
                                strokeWidth={2}
                                aria-hidden
                            />
                        </div>
                    </div>

                    {/* Ficha técnica DINÁMICA o meta-line inline si solo hay
                        un dato. Sin nested card, sin slots vacíos. */}
                    {useGrid ? (
                        <div
                            className="relative z-[2] grid gap-x-5 gap-y-2.5 border-t border-[#ebebeb] pt-3"
                            style={{
                                gridTemplateColumns: `repeat(${Math.min(cells.length, 3)}, minmax(0, 1fr))`,
                            }}
                        >
                            {cells.slice(0, 3).map((c) => (
                                <DataCell key={c.label} label={c.label} value={c.value} />
                            ))}
                        </div>
                    ) : (
                        <div className="relative z-[2] flex items-center gap-2 border-t border-[#ebebeb] pt-3 text-[12.5px] leading-snug text-[#6a6a6a]">
                            <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#737373]">
                                Solicitada
                            </span>
                            <span className="font-semibold text-[#1c1c1c]">{dateValue}</span>
                        </div>
                    )}

                    {/* Footer SIEMPRE muestra label + timeline horizontal.
                        Para activos: "Paso N de 4 · Etiqueta" en brand.
                        Para terminales: "Cancelada" / "En disputa" en su color
                        + timeline coloreada del mismo tono (firma del estado). */}
                    <div className="relative z-[2] flex items-center justify-between gap-3">
                        <div className="min-w-0 truncate text-[11.5px] font-semibold tracking-tight">
                            {isTerminal ? (
                                <span
                                    className={
                                        progress === 'cancelled'
                                            ? 'text-[#DC2626]'
                                            : 'text-[#D97706]'
                                    }
                                >
                                    {progress === 'cancelled' ? 'Cerrada sin emitir informe' : 'Disputa abierta'}
                                </span>
                            ) : (
                                <>
                                    <span className="text-[#737373]">Paso </span>
                                    <span className="text-brand">
                                        {(progress as FlowStep) + 1} de 4
                                    </span>
                                    <span className="text-[#737373]"> · </span>
                                    <span className="text-[#1c1c1c]">
                                        {STEPS[progress as FlowStep].label}
                                    </span>
                                </>
                            )}
                        </div>
                        <CompactTimeline
                            step={virtualStep}
                            terminal={isTerminal ? (progress as Terminal) : null}
                        />
                    </div>

                    {/* Cita pendiente como meta extra al pie (solo activos) */}
                    {search.hasPendingAppointment && !isTerminal && (
                        <div className="relative z-[2] flex items-center gap-1.5 text-[11px] font-semibold tracking-tight text-[#D97706]">
                            <span className="h-1 w-1 rounded-full bg-[#D97706]" aria-hidden />
                            Cita pendiente de confirmar
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
};
