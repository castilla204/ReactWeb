import { Suspense, lazy, useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MessageCircle, Search as SearchIcon, ShieldCheck, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';
import { ClientConversationSummaryDto, MessageSummaryDto } from '../types/chat.types';
import { useApi } from '../hooks/useApi';
import { useIsMobile } from '../hooks/useIsMobile';
import { HP_FONT } from '../constants/homepageTypography';
import { buildClientPreHireChatPath } from '../utils/preHireChatNavigation';

type PendingPreHireOpen = { serviceId: number; conversationId?: number };

function buildPendingPreHireConversation(
    pending: PendingPreHireOpen,
): ClientConversationSummaryDto {
    return {
        conversationId: pending.conversationId ?? 0,
        conversationType: 'pre-hire',
        createdAt: '',
        updatedAt: '',
        unreadCount: 0,
        lastMessage: null,
        expertId: null,
        expertName: 'Experto',
        expertProfilePictureUrl: null,
        searchServiceId: pending.serviceId,
        serviceName: 'Pregunta antes de contratar',
        servicePrice: null,
        serviceImageUrl: null,
    };
}

const MobileBottomBar = lazy(() =>
    import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

const PreHireChat = lazy(() =>
    import('../components/PreHireChat').then((m) => ({ default: m.PreHireChat })),
);

const SearchDetails = lazy(() => import('../components/SearchDetails'));

/**
 * MessagesPage — Rediseño 2026-06 "El gabinete del perito" (iter. 2).
 *
 * Iteración 2 (Claude design, desktop + móvil):
 *  · Loading con SKELETON de filas (no spinner) → percepción de carga premium.
 *  · Filtros como SEGMENTED CONTROL con contador por pestaña (Todas 12 ·
 *    Pre-contratación 4 · Contratadas 8). Scroll horizontal en móvil.
 *  · Entrada de la lista con reveal escalonado (animate-fade-in + animationDelay),
 *    desactivado con prefers-reduced-motion.
 *  · Señal de NO LEÍDO = punto de marca a la izquierda (estilo Mail), nunca el
 *    side-stripe baneado; texto en negrita + timestamp de marca + badge de conteo.
 *  · Avatar 44px con badge de TIPO (burbuja = pre-contratación, escudo = contratada)
 *    para escaneo rápido sin depender solo del chip de estado.
 *  · Header sticky con blur translúcido + hairline, consistente con topbars de marca.
 *  · Empty / NoResults cuidados; hint "revisión nueva" cuando la lista es corta.
 *
 * Iteración 1 (base, se mantiene):
 *  · Sin side-stripe ni hover tintados ni rings decorativos (manual Impeccable).
 *  · Brand #0066CC como único acento; verde/ámbar/rojo SOLO en chips de estado.
 *  · fontFamily heredado del container raíz vía HP_FONT.
 */

type FilterTab = 'all' | 'pre-hire' | 'post-hire';

const FILTER_LABELS: Record<FilterTab, string> = {
    all: 'Todas',
    'pre-hire': 'Pre-contratación',
    'post-hire': 'Contratadas',
};

function formatRelative(iso: string): string {
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

interface StatusChipProps {
    label: string;
    tone: 'brand' | 'green' | 'amber' | 'red' | 'neutral';
    /** Icono opcional al inicio del chip (p. ej. escudo para contratación). */
    icon?: 'shield';
}

const StatusChip: React.FC<StatusChipProps> = ({ label, tone, icon }) => {
    const palette = (() => {
        switch (tone) {
            case 'brand':
                return 'bg-brand/[0.08] ring-brand/25 text-brand';
            case 'green':
                return 'bg-[#F0F9F4] ring-[#BBE5C9] text-[#0F6A3E]';
            case 'amber':
                return 'bg-[#FFFBEB] ring-[#FED7AA] text-[#D97706]';
            case 'red':
                return 'bg-[#FEF2F2] ring-[#FECACA] text-[#DC2626]';
            default:
                return 'bg-[#fafafa] ring-[#e8e8e8] text-[#6a6a6a]';
        }
    })();
    return (
        <span
            className={`inline-flex h-[18px] shrink-0 items-center gap-1 rounded-full px-2 text-[10.5px] font-semibold leading-none tracking-tight ring-1 ${palette}`}
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
function tonFromHireStatus(status: string | null | undefined): StatusChipProps['tone'] {
    const s = (status || '').toLowerCase();
    if (!s) return 'brand';
    if (s.includes('complet') || s.includes('entrega') || s.includes('resuelt')) return 'green';
    if (s.includes('disput') || s.includes('cita') || s.includes('pendient') || s.includes('esperan'))
        return 'amber';
    if (s.includes('cancel') || s.includes('rechaz')) return 'red';
    return 'brand';
}

export function MessagesPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { fetchApi } = useApi();
    const isMobile = useIsMobile();
    const token = authService.getAccessToken() || '';

    const [searchInput, setSearchInput] = useState('');
    const [filter, setFilter] = useState<FilterTab>('all');
    // Conversación abierta en el panel derecho (solo desktop). En móvil se navega.
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [pendingPreHire, setPendingPreHire] = useState<PendingPreHireOpen | null>(null);
    const deepLinkHandledRef = useRef(false);

    const { data: conversations, isLoading, error, refetch } = useQuery<
        ClientConversationSummaryDto[]
    >({
        queryKey: ['my-conversations'],
        queryFn: async () => {
            try {
                const response = await fetchApi<unknown>(API_CONFIG.endpoints.chat.myConversations);
                if (!response || (Array.isArray(response) && response.length === 0)) return [];
                return ((response as Record<string, unknown>[]) || []).map((conv) => {
                    const get = <T,>(...keys: string[]): T | undefined => {
                        for (const k of keys) {
                            if (conv[k] !== undefined && conv[k] !== null) return conv[k] as T;
                        }
                        return undefined;
                    };
                    const lastMessage = get<Record<string, unknown>>('lastMessage', 'LastMessage');
                    const normalizedLastMessage: MessageSummaryDto | null = lastMessage
                        ? {
                              id: (lastMessage.id ?? lastMessage.Id) as number,
                              content: (lastMessage.content ?? lastMessage.Content ?? '') as string,
                              sentAt: (lastMessage.sentAt ?? lastMessage.SentAt) as string,
                              senderId: (lastMessage.senderId ?? lastMessage.SenderId ?? null) as number | null,
                              senderName: (lastMessage.senderName ??
                                  lastMessage.SenderName ??
                                  '[Usuario]') as string,
                              isRead: (lastMessage.isRead ?? lastMessage.IsRead ?? false) as boolean,
                              Id: (lastMessage.id ?? lastMessage.Id) as number,
                              Content: (lastMessage.content ?? lastMessage.Content ?? '') as string,
                              SentAt: (lastMessage.sentAt ?? lastMessage.SentAt) as string,
                              SenderId: (lastMessage.senderId ?? lastMessage.SenderId ?? null) as number | null,
                              SenderName: (lastMessage.senderName ??
                                  lastMessage.SenderName ??
                                  '[Usuario]') as string,
                              IsRead: (lastMessage.isRead ?? lastMessage.IsRead ?? false) as boolean,
                          }
                        : null;
                    return {
                        conversationId: get<number>('conversationId', 'ConversationId') ?? 0,
                        conversationType:
                            get<string>('conversationType', 'ConversationType') ??
                            (get('searchServiceId', 'SearchServiceId') ? 'pre-hire' : 'post-hire'),
                        createdAt: get<string>('createdAt', 'CreatedAt') ?? '',
                        updatedAt: get<string>('updatedAt', 'UpdatedAt') ?? '',
                        unreadCount: get<number>('unreadCount', 'UnreadCount') ?? 0,
                        lastMessage: normalizedLastMessage,
                        expertId: get<number>('expertId', 'ExpertId') ?? null,
                        expertName: get<string>('expertName', 'ExpertName') ?? '[Experto]',
                        expertProfilePictureUrl:
                            get<string>('expertProfilePictureUrl', 'ExpertProfilePictureUrl') ?? null,
                        searchServiceId: get<number>('searchServiceId', 'SearchServiceId') ?? null,
                        serviceName: get<string>('serviceName', 'ServiceName') ?? null,
                        servicePrice: get<number>('servicePrice', 'ServicePrice') ?? null,
                        serviceImageUrl: get<string>('serviceImageUrl', 'ServiceImageUrl') ?? null,
                        searchHireId: get<number>('searchHireId', 'SearchHireId') ?? null,
                        hireStatus: get<string>('hireStatus', 'HireStatus') ?? null,
                        hireStatusTranslated:
                            get<string>('hireStatusTranslated', 'HireStatusTranslated') ?? null,
                        hireCreatedAt: get<string>('hireCreatedAt', 'HireCreatedAt') ?? null,
                        hireAmount: get<number>('hireAmount', 'HireAmount') ?? null,
                        hireBaseAmount: get<number>('hireBaseAmount', 'HireBaseAmount') ?? null,
                        hireTaxAmount: get<number>('hireTaxAmount', 'HireTaxAmount') ?? null,
                        serviceCurrency: get<string>('serviceCurrency', 'ServiceCurrency') ?? 'EUR',
                        hireCurrency:
                            get<string>('hireCurrency', 'HireCurrency', 'chargeCurrency', 'ChargeCurrency') ??
                            'EUR',
                        searchTitle: get<string>('searchTitle', 'SearchTitle') ?? null,
                        searchDescription: get<string>('searchDescription', 'SearchDescription') ?? null,
                    } as ClientConversationSummaryDto;
                });
            } catch (err: unknown) {
                if ((err as { status?: number })?.status === 404) return [];
                throw err;
            }
        },
        enabled: !!token && !!user,
        staleTime: 30_000,
        refetchInterval: 60_000,
        retry: 2,
    });

    const sortedConversations = useMemo(() => {
        if (!conversations) return [];
        return [...conversations].sort((a, b) => {
            const dA = new Date(a.updatedAt || a.createdAt).getTime();
            const dB = new Date(b.updatedAt || b.createdAt).getTime();
            return dB - dA;
        });
    }, [conversations]);

    const visibleConversations = useMemo(() => {
        const q = searchInput.trim().toLowerCase();
        return sortedConversations.filter((c) => {
            if (filter === 'pre-hire' && c.conversationType !== 'pre-hire') return false;
            if (filter === 'post-hire' && c.conversationType !== 'post-hire') return false;
            if (!q) return true;
            const fields = [
                c.expertName,
                c.serviceName,
                c.searchTitle,
                c.lastMessage?.content,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return fields.includes(q);
        });
    }, [sortedConversations, filter, searchInput]);

    const totalCount = sortedConversations.length;
    const totalUnread = useMemo(
        () => sortedConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
        [sortedConversations],
    );

    /** Conteo por pestaña — alimenta el segmented control. */
    const filterCounts = useMemo<Record<FilterTab, number>>(
        () => ({
            all: sortedConversations.length,
            'pre-hire': sortedConversations.filter((c) => c.conversationType === 'pre-hire').length,
            'post-hire': sortedConversations.filter((c) => c.conversationType === 'post-hire')
                .length,
        }),
        [sortedConversations],
    );

    const handleOpenChat = (conversation: ClientConversationSummaryDto) => {
        if (conversation.conversationType === 'pre-hire' && conversation.searchServiceId) {
            setPendingPreHire(null);
            if (isMobile) {
                navigate(
                    buildClientPreHireChatPath(conversation.searchServiceId, {
                        conversationId: conversation.conversationId,
                        mobile: true,
                    }),
                );
            } else {
                setSelectedId(conversation.conversationId);
            }
        } else if (conversation.conversationType === 'post-hire' && conversation.searchHireId) {
            // Desktop: abrir el chat de la contratación incrustado en el panel derecho,
            // como una conversación más de la bandeja. Móvil: navegar a la página completa
            // del hire (ya optimizada para móvil con su propia cabecera y detalles).
            if (isMobile) {
                navigate(`/searchhire/${conversation.searchHireId}`);
            } else {
                setPendingPreHire(null);
                setSelectedId(conversation.conversationId);
            }
        }
    };

    const selectedConversation = useMemo(
        () =>
            selectedId == null
                ? null
                : sortedConversations.find((c) => c.conversationId === selectedId) ?? null,
        [selectedId, sortedConversations],
    );

    const activePreHireConversation = useMemo(() => {
        if (
            selectedConversation?.conversationType === 'pre-hire' &&
            selectedConversation.searchServiceId
        ) {
            return selectedConversation;
        }
        if (pendingPreHire) {
            return buildPendingPreHireConversation(pendingPreHire);
        }
        return null;
    }, [selectedConversation, pendingPreHire]);

    useEffect(() => {
        if (isLoading || deepLinkHandledRef.current) return;

        const serviceIdParam = searchParams.get('serviceId');
        const conversationIdParam = searchParams.get('conversationId');
        const hireIdParam = searchParams.get('searchHireId');
        if (!serviceIdParam && !conversationIdParam && !hireIdParam) return;

        deepLinkHandledRef.current = true;
        setSearchParams({}, { replace: true });

        // --- Contratación (post-hire): abrir el chat del hire incrustado, como
        // una conversación más. En móvil se navega a la página completa del hire. ---
        const hireId = hireIdParam ? Number.parseInt(hireIdParam, 10) : null;
        if (hireId && hireId > 0) {
            if (isMobile) {
                navigate(`/searchhire/${hireId}`, { replace: true });
                return;
            }
            const byHire = sortedConversations.find(
                (c) => c.conversationType === 'post-hire' && c.searchHireId === hireId,
            );
            if (byHire) {
                setSelectedId(byHire.conversationId);
                setPendingPreHire(null);
            } else {
                // Sin fila de conversación para este hire → página completa del hire.
                navigate(`/searchhire/${hireId}`, { replace: true });
            }
            return;
        }

        // --- Pre-contratación: solo desktop (en móvil se navega a su página). ---
        if (isMobile) return;

        const conversationId = conversationIdParam ? Number.parseInt(conversationIdParam, 10) : null;
        const serviceId = serviceIdParam ? Number.parseInt(serviceIdParam, 10) : null;

        if (conversationId && conversationId > 0) {
            const byId = sortedConversations.find((c) => c.conversationId === conversationId);
            if (byId) {
                setSelectedId(conversationId);
                setPendingPreHire(null);
                return;
            }
            if (serviceId && serviceId > 0) {
                setPendingPreHire({ serviceId, conversationId });
                return;
            }
        }

        if (serviceId && serviceId > 0) {
            const byService = sortedConversations.find(
                (c) => c.conversationType === 'pre-hire' && c.searchServiceId === serviceId,
            );
            if (byService) {
                setSelectedId(byService.conversationId);
                setPendingPreHire(null);
            } else {
                setPendingPreHire({ serviceId });
            }
        }
    }, [isMobile, isLoading, searchParams, setSearchParams, sortedConversations, navigate]);

    const handlePreHireConversationLoaded = (conversationId: number) => {
        if (!pendingPreHire) return;
        setPendingPreHire(null);
        setSelectedId(conversationId);
        void refetch();
    };

    const formatAmount = (value: number | null | undefined, currency: string | null | undefined) => {
        if (value == null) return '';
        try {
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: (currency || 'EUR').toUpperCase(),
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(value);
        } catch {
            return `${value} ${currency || 'EUR'}`;
        }
    };

    // -------------- Loading / Error --------------

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col bg-white" style={{ fontFamily: HP_FONT }}>
                <Header
                    onBack={() => navigate(-1)}
                    title="Mis mensajes"
                    counter="Cargando conversaciones…"
                />
                <main className="w-full flex-1 px-0 pb-6 pt-1 md:max-w-[380px]">
                    <ul className="flex flex-col" aria-hidden>
                        {Array.from({ length: 7 }).map((_, i) => (
                            <li key={i}>
                                <SkeletonRow index={i} isLast={i === 6} />
                            </li>
                        ))}
                    </ul>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen flex-col bg-white" style={{ fontFamily: HP_FONT }}>
                <Header onBack={() => navigate(-1)} title="Mis mensajes" counter={null} />
                <div className="flex flex-1 items-center justify-center p-4">
                    <div className="text-center">
                        <p className="mb-4 text-[14px] text-[#DC2626]">
                            No pudimos cargar tus conversaciones.
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="rounded-full bg-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-colors hover:bg-brand-hover"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // -------------- Render principal --------------

    const counterText =
        totalCount > 0
            ? `${totalCount} ${totalCount === 1 ? 'conversación' : 'conversaciones'}${
                  totalUnread > 0 ? ` · ${totalUnread} sin leer` : ''
              }`
            : null;

    // Buscador siempre visible cuando hay conversaciones (estilo WhatsApp/Telegram):
    // ancla la parte superior en móvil ahora que no hay header de página.
    const showSearch = totalCount > 0;
    const showFilters = totalCount > 0;

    // Sin ninguna conversación → estado vacío a pantalla completa (sin two-pane).
    if (sortedConversations.length === 0) {
        return (
            <div className="flex min-h-screen flex-col bg-white" style={{ fontFamily: HP_FONT }}>
                <Header onBack={() => navigate(-1)} title="Mis mensajes" counter={null} />
                <EmptyState onCreate={() => navigate('/crear-busqueda')} />
                {isMobile && (
                    <Suspense fallback={null}>
                        <MobileBottomBar />
                    </Suspense>
                )}
            </div>
        );
    }

    return (
        <div
            className="flex min-h-screen flex-col bg-white md:h-[calc(100dvh-3rem)] md:min-h-0 md:overflow-hidden"
            style={{ fontFamily: HP_FONT }}
        >
            <Header onBack={() => navigate(-1)} title="Mis mensajes" counter={counterText} />

            {/* Cuerpo: una columna en móvil · dos paneles (lista + conversación) en desktop */}
            <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[minmax(330px,380px)_minmax(0,1fr)]">
                {/* ----- Panel lista ----- */}
                <section className="flex min-h-0 min-w-0 flex-col md:bg-[#fafafa]">
                    {(showSearch || showFilters) && (
                        <div className="shrink-0 space-y-3 border-b border-[#f0f0f0] bg-white px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] md:px-3.5 md:pt-3">
                            {showSearch && (
                                <div className="flex items-center gap-2">
                                    {/* Volver — solo móvil (en desktop el botón vive en la cabecera del panel) */}
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        aria-label="Volver"
                                        className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1c1c1c] transition-colors hover:bg-[#f2f2f2] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:hidden"
                                    >
                                        <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <SearchInput
                                            value={searchInput}
                                            onChange={setSearchInput}
                                            onClear={() => setSearchInput('')}
                                        />
                                    </div>
                                </div>
                            )}
                            {showFilters && (
                                <FilterPills
                                    value={filter}
                                    onChange={setFilter}
                                    counts={filterCounts}
                                />
                            )}
                        </div>
                    )}

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(65px+1rem+env(safe-area-inset-bottom,0px))] md:pb-6">
                        {visibleConversations.length === 0 ? (
                            <NoResultsState
                                query={searchInput}
                                onClearFilters={() => {
                                    setSearchInput('');
                                    setFilter('all');
                                }}
                            />
                        ) : (
                            <>
                                <ul className="flex flex-col">
                                    {visibleConversations.map((conversation, index) => (
                                        <li
                                            key={conversation.conversationId}
                                            className="animate-fade-in motion-reduce:animate-none"
                                            style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                                        >
                                            <ConversationRow
                                                conversation={conversation}
                                                isOwnLastMessage={
                                                    conversation.lastMessage?.senderId === user?.id
                                                }
                                                isActive={
                                                    selectedId === conversation.conversationId
                                                }
                                                formatAmount={formatAmount}
                                                onOpen={() => handleOpenChat(conversation)}
                                                isLast={index === visibleConversations.length - 1}
                                            />
                                        </li>
                                    ))}
                                </ul>

                                {visibleConversations.length < 3 && (
                                    <div className="px-3 pt-5 text-center md:px-3.5">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/crear-busqueda')}
                                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand transition-colors hover:text-brand-hover"
                                        >
                                            Pedir una revisión nueva
                                            <svg
                                                aria-hidden
                                                className="h-3.5 w-3.5"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M5 12h14M13 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* ----- Panel conversación — solo desktop ----- */}
                {selectedConversation?.conversationType === 'post-hire' &&
                selectedConversation.searchHireId ? (
                    <HireConversationPanel
                        key={`hire-${selectedConversation.searchHireId}`}
                        conversation={selectedConversation}
                        amountLabel={formatAmount(
                            selectedConversation.hireAmount,
                            selectedConversation.hireCurrency,
                        )}
                        onClose={() => setSelectedId(null)}
                    />
                ) : activePreHireConversation?.searchServiceId ? (
                    <ConversationPanel
                        key={
                            activePreHireConversation.conversationId > 0
                                ? activePreHireConversation.conversationId
                                : `pending-${activePreHireConversation.searchServiceId}`
                        }
                        conversation={activePreHireConversation}
                        token={token}
                        userId={user?.id ?? 0}
                        amountLabel={formatAmount(
                            activePreHireConversation.servicePrice,
                            activePreHireConversation.serviceCurrency,
                        )}
                        onHire={() =>
                            navigate(`/checkout/${activePreHireConversation.searchServiceId}`)
                        }
                        onClose={() => {
                            setSelectedId(null);
                            setPendingPreHire(null);
                        }}
                        onConversationLoaded={handlePreHireConversationLoaded}
                    />
                ) : (
                    <ConversationPlaceholder />
                )}
            </div>

            {isMobile && (
                <Suspense fallback={null}>
                    <MobileBottomBar />
                </Suspense>
            )}
        </div>
    );
}

/**
 * Panel derecho en desktop (estilo WhatsApp Web / Telegram): mientras no hay una
 * conversación abierta dentro de la página, ocupa el espacio con un placeholder
 * de marca en lugar de dejar un vacío blanco. Al pulsar una fila se navega a la
 * vista de chat completa.
 */
const ConversationPlaceholder: React.FC = () => (
    <section className="hidden items-center justify-center bg-[#fbfbfb] px-8 md:flex">
        <div className="max-w-xs text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand/[0.08]">
                <MessageCircle className="h-7 w-7 text-brand" strokeWidth={1.5} aria-hidden />
            </div>
            <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                Selecciona una conversación
            </h2>
            <p className="mx-auto mt-1.5 text-[13px] leading-relaxed text-[#737373]">
                Elige una conversación de la lista para ver los mensajes y seguir con tu inspección.
            </p>
        </div>
    </section>
);

interface ConversationPanelProps {
    conversation: ClientConversationSummaryDto;
    token: string;
    userId: number;
    amountLabel: string;
    onHire: () => void;
    onClose: () => void;
    onConversationLoaded?: (conversationId: number) => void;
}

/**
 * Panel derecho en desktop con el chat de pre-contratación incrustado (estilo
 * WhatsApp Web): cabecera con experto + acción de contratar, y la conversación
 * dentro. Antes esto navegaba a /chat-pre-contratacion (página suelta); ahora se
 * abre aquí mismo sin salir de la bandeja. En móvil se sigue navegando.
 */
const ConversationPanel: React.FC<ConversationPanelProps> = ({
    conversation,
    token,
    userId,
    amountLabel,
    onHire,
    onClose,
    onConversationLoaded,
}) => (
    <section className="hidden min-h-0 min-w-0 flex-col bg-white md:flex">
        <div className="flex shrink-0 items-center gap-3 border-b border-[#f0f0f0] px-3 py-2.5 md:px-3.5">
            <Avatar className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#f0f0f0]">
                <AvatarImage
                    src={conversation.expertProfilePictureUrl || undefined}
                    alt=""
                    className="h-full w-full object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-brand to-brand-hover text-[15px] font-semibold text-white">
                    {(conversation.expertName || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                    {conversation.expertName}
                </p>
                <p className="truncate text-[12px] text-[#737373]">
                    {conversation.serviceName || 'Pregunta antes de contratar'}
                </p>
            </div>
            <button
                type="button"
                onClick={onHire}
                className="hidden shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-colors hover:bg-brand-hover lg:inline-flex"
            >
                Contratar{amountLabel ? ` · ${amountLabel}` : ''}
            </button>
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar conversación"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#737373] transition-colors hover:bg-[#f2f2f2] hover:text-[#1c1c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
                <X className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
        </div>
        <div className="min-h-0 flex-1">
            <Suspense
                fallback={
                    <div className="flex h-full items-center justify-center bg-white">
                        <MessageCircle
                            className="h-6 w-6 animate-pulse text-[#d4d4d4]"
                            aria-hidden
                        />
                    </div>
                }
            >
                <PreHireChat
                    serviceId={conversation.searchServiceId ?? 0}
                    token={token}
                    userId={userId}
                    conversationId={
                        conversation.conversationId > 0 ? conversation.conversationId : undefined
                    }
                    peerName={conversation.expertName}
                    embedded
                    onConversationLoaded={({ id }) => onConversationLoaded?.(id)}
                />
            </Suspense>
        </div>
    </section>
);

interface HireConversationPanelProps {
    conversation: ClientConversationSummaryDto;
    amountLabel: string;
    onClose: () => void;
}

/**
 * Panel derecho en desktop para una CONTRATACIÓN activa: cabecera de bandeja
 * (avatar + experto + estado + cerrar) y, debajo, la EXPERIENCIA COMPLETA del hire
 * incrustada (SearchDetails con `embedded`): chat + columna de detalles con TODOS
 * los botones de acción (cita, aprobar, disputar, informe, reseña…) funcionando
 * in-place, sin salir de Mensajes ni "Ver detalle" a otra página.
 */
const HireConversationPanel: React.FC<HireConversationPanelProps> = ({
    conversation,
    amountLabel,
    onClose,
}) => {
    const statusLabel = conversation.hireStatusTranslated?.trim() || null;
    const chip =
        statusLabel && !NEUTRAL_HIRE_STATUSES.has(statusLabel.toLowerCase())
            ? { label: statusLabel, tone: tonFromHireStatus(statusLabel) }
            : { label: 'Contratación activa', tone: 'green' as StatusChipProps['tone'] };

    return (
        <section className="hidden min-h-0 min-w-0 flex-col bg-white md:flex">
            <div className="flex shrink-0 items-center gap-3 border-b border-[#f0f0f0] px-3 py-2.5 md:px-3.5">
                <Avatar className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#f0f0f0]">
                    <AvatarImage
                        src={conversation.expertProfilePictureUrl || undefined}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-brand to-brand-hover text-[15px] font-semibold text-white">
                        {(conversation.expertName || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#1c1c1c]">
                            {conversation.expertName}
                        </p>
                        <StatusChip label={chip.label} tone={chip.tone} icon="shield" />
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-[#737373]">
                        {conversation.searchTitle || conversation.serviceName || 'Contratación'}
                        {amountLabel ? ` · ${amountLabel}` : ''}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar conversación"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#737373] transition-colors hover:bg-[#f2f2f2] hover:text-[#1c1c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                    <X className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
            </div>
            <div className="min-h-0 flex-1">
                <Suspense
                    fallback={
                        <div className="flex h-full items-center justify-center bg-white">
                            <MessageCircle
                                className="h-6 w-6 animate-pulse text-[#d4d4d4]"
                                aria-hidden
                            />
                        </div>
                    }
                >
                    <SearchDetails
                        isAdmin={false}
                        searchHireId={conversation.searchHireId ?? undefined}
                        embedded
                        onBack={onClose}
                    />
                </Suspense>
            </div>
        </section>
    );
};

// -------------- Subcomponentes --------------

interface HeaderProps {
    onBack: () => void;
    title: string;
    counter: string | null;
}

const Header: React.FC<HeaderProps> = ({ onBack, title, counter }) => (
    <header className="hidden shrink-0 border-b border-[#f0f0f0] bg-white md:block">
        <div className="flex items-center gap-3 px-3.5 py-3">
            <button
                type="button"
                onClick={onBack}
                aria-label="Volver"
                className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1c1c1c] transition-colors hover:bg-[#f2f2f2] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
                <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
            <div className="min-w-0 flex-1">
                <h1 className="truncate text-[19px] font-bold tracking-[-0.02em] text-[#1c1c1c]">
                    {title}
                </h1>
                {counter && (
                    <p className="truncate text-[12.5px] leading-snug text-[#8a8a8a]">{counter}</p>
                )}
            </div>
        </div>
    </header>
);

interface SearchInputProps {
    value: string;
    onChange: (v: string) => void;
    onClear: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, onClear }) => (
    <div className="relative flex w-full items-center">
        <SearchIcon
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#737373]"
            strokeWidth={2}
            aria-hidden
        />
        <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Buscar conversaciones…"
            className="h-10 w-full rounded-full border border-[#e8e8e8] bg-white pl-10 pr-9 text-[14px] text-[#1c1c1c] placeholder:text-[#737373] transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
        />
        {value && (
            <button
                type="button"
                onClick={onClear}
                aria-label="Borrar búsqueda"
                className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full text-[#737373] hover:bg-[#fafafa] hover:text-[#1c1c1c]"
            >
                <X className="h-4 w-4" strokeWidth={2} />
            </button>
        )}
    </div>
);

interface FilterPillsProps {
    value: FilterTab;
    onChange: (v: FilterTab) => void;
    counts: Record<FilterTab, number>;
}

const FilterPills: React.FC<FilterPillsProps> = ({ value, onChange, counts }) => (
    <div
        role="radiogroup"
        aria-label="Filtrar conversaciones"
        className="flex flex-wrap items-center gap-1.5"
    >
        {(Object.keys(FILTER_LABELS) as FilterTab[]).map((tab) => {
            const active = value === tab;
            const count = counts[tab];
            return (
                <button
                    key={tab}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChange(tab)}
                    className={[
                        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                        active
                            ? 'border-brand bg-brand text-white'
                            : 'border-[#e8e8e8] bg-white text-[#1c1c1c] hover:bg-[#fafafa]',
                    ].join(' ')}
                >
                    {FILTER_LABELS[tab]}
                    {count > 0 && (
                        <span
                            className={[
                                'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] font-semibold leading-none tabular-nums',
                                active ? 'bg-white/25 text-white' : 'bg-[#e9e9e9] text-[#5a5a5a]',
                            ].join(' ')}
                            aria-hidden
                        >
                            {count}
                        </span>
                    )}
                </button>
            );
        })}
    </div>
);

// -------------- Skeleton --------------

const SkeletonRow: React.FC<{ index: number; isLast: boolean }> = ({ index, isLast }) => (
    <div
        className="relative flex w-full items-center gap-3 px-3 py-3 animate-fade-in motion-reduce:animate-none md:px-3.5"
        style={{ animationDelay: `${index * 55}ms` }}
    >
        <div className="h-[52px] w-[52px] shrink-0 animate-pulse rounded-full bg-[#f0f0f0]" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
                <div className="h-3.5 w-40 animate-pulse rounded-full bg-[#f0f0f0]" />
                <div className="h-3 w-10 animate-pulse rounded-full bg-[#f4f4f4]" />
            </div>
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-[#f4f4f4]" />
        </div>
        {!isLast && (
            <span className="pointer-events-none absolute bottom-0 left-[72px] right-0 h-px bg-[#f1f1f1]" />
        )}
    </div>
);

interface ConversationRowProps {
    conversation: ClientConversationSummaryDto;
    isOwnLastMessage: boolean;
    isActive?: boolean;
    formatAmount: (v: number | null | undefined, c: string | null | undefined) => string;
    onOpen: () => void;
    isLast: boolean;
}

/**
 * Lista de etiquetas de estado que NO consideramos "estado relevante" para
 * mostrar como chip. "Pre-contratación" se filtra porque ya lo dice el filtro
 * pill activo y duplica info; los estados activos genéricos también se omiten
 * porque no aportan más que el filtro "Contratadas".
 */
const NEUTRAL_HIRE_STATUSES = new Set([
    'activa',
    'activo',
    'en curso',
    'en proceso',
    'pre-contratación',
    'pre contratación',
    'precontratación',
]);

/**
 * ConversationRow — fila tipo WhatsApp / Telegram / iMessage.
 *
 * Lista continua (sin tarjetas, sin huecos): avatar 52px · nombre + último
 * mensaje apilados · hora arriba a la derecha · badge de no leídos abajo a la
 * derecha · separador fino metido tras el avatar (estilo iMessage). El estado
 * de contratación (Disputa/Completada…) aparece como chip pequeño inline al
 * inicio del snippet, no como bloque a la derecha.
 */
const ConversationRow: React.FC<ConversationRowProps> = ({
    conversation,
    isOwnLastMessage,
    isActive = false,
    formatAmount,
    onOpen,
    isLast,
}) => {
    const isPreHire = conversation.conversationType === 'pre-hire';
    const unread = conversation.unreadCount || 0;
    const isUnread = unread > 0;
    const title =
        (isPreHire
            ? conversation.serviceName || conversation.expertName
            : conversation.searchTitle || conversation.serviceName || conversation.expertName) ||
        'Conversación';
    // Avatar = la PERSONA con quien hablas (foto del experto), no la foto del
    // servicio. La imagen del servicio es de stock y se repite entre servicios
    // del mismo tipo → "siempre la misma foto". La del experto distingue cada chat.
    const image =
        conversation.expertProfilePictureUrl || conversation.serviceImageUrl || undefined;
    const expert = conversation.expertName;
    const stamp = conversation.lastMessage?.sentAt
        ? formatRelative(conversation.lastMessage.sentAt)
        : conversation.updatedAt
          ? formatRelative(conversation.updatedAt)
          : '';
    const snippet = conversation.lastMessage?.content?.trim() || 'Aún no hay mensajes.';
    const amount = isPreHire
        ? formatAmount(conversation.servicePrice, conversation.serviceCurrency)
        : formatAmount(conversation.hireAmount, conversation.hireCurrency);

    // Chip de estado en la fila:
    //  · Pre-contratación → sin chip (ya lo dice el filtro/insignia del avatar).
    //  · Contratación con estado especial (disputa, completada, cancelada…) → ese estado.
    //  · Contratación activa "normal" → chip permanente "Contratación activa" con escudo,
    //    para distinguirla de un vistazo de las consultas pre-contratación.
    const statusLabel = conversation.hireStatusTranslated?.trim() || null;
    const chip: { label: string; tone: StatusChipProps['tone']; icon?: 'shield' } | null = isPreHire
        ? null
        : statusLabel && !NEUTRAL_HIRE_STATUSES.has(statusLabel.toLowerCase())
          ? { label: statusLabel, tone: tonFromHireStatus(statusLabel), icon: 'shield' }
          : { label: 'Contratación activa', tone: 'green', icon: 'shield' };

    const ariaStamp = stamp ? ` Última actividad hace ${stamp}.` : '';

    return (
        <button
            type="button"
            onClick={onOpen}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`Abrir conversación con ${expert} sobre ${title}.${ariaStamp}${
                isUnread ? ` ${unread} sin leer.` : ''
            }${chip ? ` Estado: ${chip.label}.` : ''}`}
            className={[
                'group relative flex w-full items-center gap-3 px-3 py-3 text-left md:px-3.5',
                'transition-colors duration-150',
                isActive
                    ? 'md:bg-brand/[0.06] md:hover:bg-brand/[0.06]'
                    : 'hover:bg-[#f6f6f6] active:bg-[#efefef]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
            ].join(' ')}
        >
            {/* Avatar 52px con insignia de tipo (escudo = contratada · burbuja = pregunta) */}
            <div className="relative shrink-0">
                <Avatar className="h-[52px] w-[52px] overflow-hidden rounded-full bg-[#f0f0f0]">
                    <AvatarImage src={image} alt="" className="h-full w-full object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-brand to-brand-hover text-[18px] font-semibold text-white">
                        {(expert || title || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span
                    className={[
                        'absolute -bottom-0.5 -right-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full ring-2 ring-white',
                        isPreHire ? 'bg-[#eef4fb] text-brand' : 'bg-[#0F6A3E] text-white',
                    ].join(' ')}
                    aria-hidden
                >
                    {isPreHire ? (
                        <MessageCircle className="h-[11px] w-[11px]" strokeWidth={2.25} />
                    ) : (
                        <ShieldCheck className="h-[11px] w-[11px]" strokeWidth={2.25} />
                    )}
                </span>
            </div>

            {/* Cuerpo: nombre + snippet, dos líneas */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                {/* Línea 1: nombre · hora */}
                <div className="flex items-baseline justify-between gap-2">
                    <h3
                        className={[
                            'line-clamp-1 min-w-0 text-[15px] leading-tight tracking-[-0.01em] text-[#1c1c1c]',
                            isUnread ? 'font-bold' : 'font-semibold',
                        ].join(' ')}
                    >
                        {title}
                    </h3>
                    {stamp && (
                        <time
                            className={[
                                'shrink-0 text-[12px] leading-none tabular-nums',
                                isUnread ? 'font-semibold text-brand' : 'font-medium text-[#8a8a8a]',
                            ].join(' ')}
                            aria-hidden
                        >
                            {stamp}
                        </time>
                    )}
                </div>

                {/* Línea 2: [chip estado] snippet · badge no leídos */}
                <div className="flex items-center gap-2">
                    <p
                        className={[
                            'flex min-w-0 flex-1 items-center gap-1.5 text-[13.5px] leading-snug',
                            isUnread ? 'font-medium text-[#3a3a3a]' : 'text-[#737373]',
                        ].join(' ')}
                    >
                        {chip && <StatusChip label={chip.label} tone={chip.tone} icon={chip.icon} />}
                        <span className="truncate">
                            {isOwnLastMessage && <span className="text-[#a0a0a0]">Tú: </span>}
                            {snippet}
                        </span>
                    </p>
                    {isUnread ? (
                        <span
                            className="inline-flex h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold leading-none text-white"
                            aria-label={`${unread} mensajes sin leer`}
                        >
                            {unread > 99 ? '99+' : unread}
                        </span>
                    ) : (
                        amount && (
                            <span className="shrink-0 text-[12px] font-semibold tabular-nums text-[#9a9a9a]">
                                {amount}
                            </span>
                        )
                    )}
                </div>
            </div>

            {/* Separador inset (alineado con el texto), estilo iMessage */}
            {!isLast && (
                <span
                    className="pointer-events-none absolute bottom-0 left-[72px] right-0 h-px bg-[#f0f0f0]"
                    aria-hidden
                />
            )}
        </button>
    );
};

// -------------- Empty / NoResults --------------

const EmptyState: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center p-6 md:max-w-4xl">
        <div className="w-full rounded-2xl border border-[#e8e8e8] bg-white px-6 py-12 text-center md:py-16">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f5]">
                <MessageCircle className="h-6 w-6 text-[#737373]" strokeWidth={1.5} aria-hidden />
            </div>
            <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-[#1c1c1c]">
                Aún no tienes conversaciones
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-snug text-[#6a6a6a]">
                Cuando contrates o consultes a un experto, los mensajes aparecerán aquí con el
                último envío y el estado de la inspección.
            </p>
            <button
                type="button"
                onClick={onCreate}
                className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-colors hover:bg-brand-hover"
            >
                Pedir una revisión
            </button>
        </div>
    </div>
);

const NoResultsState: React.FC<{ query: string; onClearFilters: () => void }> = ({
    query,
    onClearFilters,
}) => (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center p-6 md:max-w-4xl">
        <div className="w-full rounded-2xl border border-dashed border-[#e8e8e8] bg-white px-6 py-12 text-center">
            <h2 className="text-[15px] font-semibold text-[#1c1c1c]">
                {query ? 'Sin coincidencias' : 'Sin conversaciones con ese filtro'}
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-snug text-[#6a6a6a]">
                {query
                    ? `No encontramos conversaciones que contengan "${query}".`
                    : 'Prueba con otro filtro o quita la búsqueda activa.'}
            </p>
            <button
                type="button"
                onClick={onClearFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#e8e8e8] bg-white px-4 py-2 text-[13px] font-semibold text-[#1c1c1c] transition-colors hover:bg-[#fafafa]"
            >
                Quitar filtros
            </button>
        </div>
    </div>
);
