import React from 'react';
import { SileoSkeleton } from './ui/sileo-skeleton';
import {
    SD_SEARCH_DETAILS_DESKTOP_PAGE_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_CHAT_CARD_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CARD_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_INNER_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_LAYOUT_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CLASS,
    SD_SEARCH_DETAILS_DESKTOP_CHAT_CLASS,
} from '../constants/homepageTypography';

/**
 * Skeleton de la ficha de contratación (SearchDetails).
 *
 * Espeja el FRAME REAL —cabecera de página + panel de chat + sidebar de detalles—
 * reutilizando las MISMAS constantes de layout que el componente real, de modo que
 * cuando llegan los datos no hay salto (los paneles ya ocupan su sitio exacto). No
 * es un spinner centrado ni una card genérica: es la silueta de la pantalla.
 *
 * `embedded` refleja el mismo modo del componente real (bandeja unificada de
 * /mis-mensajes vs. página suelta), así que sus clases de marco coinciden 1:1.
 *
 * Movimiento: SileoSkeleton aporta el barrido (`.sk-shimmer`, GPU, gated en
 * `prefers-reduced-motion`). Los `shimmerDelayMs` crecientes escalonan las burbujas
 * del chat en una onda descendente → se percibe como progreso, no como "cargando".
 */

/** Una burbuja de mensaje del stream del chat. */
function MessageBubble({
    side,
    widthClass,
    heightClass,
    delayMs,
}: {
    side: 'in' | 'out';
    widthClass: string;
    heightClass: string;
    delayMs: number;
}) {
    return (
        <div className={side === 'out' ? 'flex justify-end' : 'flex justify-start'}>
            <SileoSkeleton
                rounded="xl"
                shimmerDelayMs={delayMs}
                className={`${widthClass} ${heightClass} ${
                    side === 'out' ? 'rounded-br-md' : 'rounded-bl-md'
                }`}
            />
        </div>
    );
}

/** Panel de chat: cabecera + stream de burbujas + barra de entrada anclada abajo. */
function ChatPanelSkeleton() {
    return (
        <div className="flex h-full min-h-0 w-full flex-col bg-white">
            {/* Cabecera del chat (avatar + nombre/estado). En desktop no-embebido el
                chat real oculta su cabecera, pero el marco de altura lo absorbe el flujo. */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <SileoSkeleton rounded="full" className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                    <SileoSkeleton className="h-3.5 w-40 rounded" />
                    <SileoSkeleton className="h-3 w-24 rounded" />
                </div>
            </div>

            {/* Stream de mensajes: alternado izq/dcha, anchos variables, onda escalonada. */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-5">
                <MessageBubble side="in" widthClass="w-[62%]" heightClass="h-12" delayMs={0} />
                <MessageBubble side="out" widthClass="w-[48%]" heightClass="h-10" delayMs={120} />
                <MessageBubble side="in" widthClass="w-[70%]" heightClass="h-16" delayMs={240} />
                <MessageBubble side="out" widthClass="w-[40%]" heightClass="h-9" delayMs={360} />
                <MessageBubble side="in" widthClass="w-[54%]" heightClass="h-11" delayMs={480} />
                <MessageBubble side="out" widthClass="w-[58%]" heightClass="h-12" delayMs={600} />
            </div>

            {/* Barra de entrada anclada abajo (campo + botón enviar). */}
            <div className="flex items-center gap-2 border-t border-line px-4 py-3">
                <SileoSkeleton className="h-11 flex-1 rounded-full" />
                <SileoSkeleton rounded="full" className="h-11 w-11 shrink-0" />
            </div>
        </div>
    );
}

/** Sidebar de detalles (solo desktop): estado, datos del servicio, precio, acciones. */
function SidebarSkeleton() {
    return (
        <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden bg-white p-5">
            {/* Badges de estado */}
            <div className="flex flex-wrap items-center gap-2">
                <SileoSkeleton rounded="full" className="h-6 w-28" />
                <SileoSkeleton rounded="full" className="h-6 w-20" />
            </div>

            {/* Datos del servicio (categoría, tipo, descripción, radio) */}
            <div className="space-y-2.5">
                <SileoSkeleton className="h-4 w-3/5 rounded" />
                <SileoSkeleton className="h-3.5 w-2/5 rounded" />
                <SileoSkeleton className="h-3.5 w-full rounded" />
                <SileoSkeleton className="h-3.5 w-11/12 rounded" />
                <SileoSkeleton className="h-3.5 w-1/2 rounded" />
            </div>

            {/* Bloque de precio (separado por hairline) */}
            <div className="border-t border-line-soft pt-4">
                <div className="flex items-baseline justify-between gap-3">
                    <SileoSkeleton className="h-3.5 w-20 rounded" />
                    <SileoSkeleton className="h-6 w-24 rounded" />
                </div>
            </div>

            {/* Acciones al pie */}
            <div className="mt-auto space-y-2.5">
                <SileoSkeleton className="h-11 w-full rounded-lg" />
                <SileoSkeleton className="h-11 w-full rounded-lg" />
            </div>
        </div>
    );
}

export interface SearchDetailsSkeletonProps {
    /** Debe coincidir con el `embedded` del SearchDetails real para clonar su marco. */
    embedded?: boolean;
}

/**
 * Skeleton listo para usar tanto como estado `isLoading` interno como fallback de
 * Suspense (chunk cargando) → misma silueta en ambos, sin parpadeo entre fases.
 */
export const SearchDetailsSkeleton: React.FC<SearchDetailsSkeletonProps> = ({
    embedded = false,
}) => {
    // Mismas expresiones de clase que SearchDetails: el marco es idéntico → 0 salto.
    const outerClass = embedded
        ? 'relative flex h-full min-h-0 flex-col overflow-hidden bg-surface-tinted'
        : `fixed inset-0 z-30 flex flex-col overflow-hidden bg-surface-tinted h-[calc(var(--vh,1vh)*100)] md:relative md:inset-auto md:z-auto md:h-[calc(var(--vh,1vh)*100-4rem)] md:max-h-[calc(var(--vh,1vh)*100-4rem)] ${SD_SEARCH_DETAILS_DESKTOP_PAGE_CLASS}`;

    const innerClass = embedded
        ? 'flex h-full w-full min-h-0 flex-1 flex-col'
        : SD_SEARCH_DETAILS_DESKTOP_INNER_CLASS;

    const layoutClass = embedded
        ? 'flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row md:items-stretch'
        : `${SD_SEARCH_DETAILS_DESKTOP_LAYOUT_CLASS} max-md:gap-0 max-md:p-0`;

    const chatClass = embedded
        ? `${SD_SEARCH_DETAILS_DESKTOP_CHAT_CLASS} overflow-hidden md:border-r md:border-line`
        : `${SD_SEARCH_DETAILS_DESKTOP_CHAT_CLASS} ${SD_SEARCH_DETAILS_DESKTOP_CHAT_CARD_CLASS} max-md:rounded-none max-md:border-0 max-md:shadow-none`;

    const sidebarClass = embedded
        ? `${SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CLASS} overflow-hidden bg-white`
        : `${SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CLASS} ${SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CARD_CLASS}`;

    return (
        <div className={outerClass} aria-busy="true" role="status" aria-label="Cargando la contratación">
            <span className="sr-only">Cargando…</span>

            {/* Cabecera de página — solo desktop y solo en página suelta (igual que el real). */}
            {!embedded && (
                <header className="hidden md:flex flex-shrink-0 border-b border-line bg-white">
                    <div className={`${SD_SEARCH_DETAILS_DESKTOP_INNER_CLASS} px-6 py-3.5`}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <SileoSkeleton rounded="full" className="h-9 w-9 shrink-0" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <SileoSkeleton className="h-5 w-64 max-w-[60%] rounded" />
                                    <SileoSkeleton rounded="full" className="h-5 w-28" />
                                </div>
                            </div>
                            <SileoSkeleton rounded="full" className="h-9 w-9 shrink-0" />
                        </div>
                    </div>
                </header>
            )}

            <div className={innerClass}>
                <div className={`${layoutClass} ${embedded ? 'bg-white' : 'bg-surface-tinted md:bg-transparent'}`} style={{ minHeight: 0, flex: '1 1 0%' }}>
                    <div className={chatClass}>
                        <ChatPanelSkeleton />
                    </div>
                    <aside className={sidebarClass}>
                        <SidebarSkeleton />
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default SearchDetailsSkeleton;
