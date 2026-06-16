import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowLeft,
    MessageCircle,
    Search as SearchIcon,
    ShieldCheck,
    X,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';
import { ClientConversationSummaryDto, MessageSummaryDto } from '../types/chat.types';
import { useApi } from '../hooks/useApi';
import { HP_FONT } from '../constants/homepageTypography';

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
}

const StatusChip: React.FC<StatusChipProps> = ({ label, tone }) => {
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
            className={`inline-flex h-[22px] shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold leading-none tracking-tight ring-1 ${palette}`}
        >
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
    const { user } = useAuth();
    const { fetchApi } = useApi();
    const token = authService.getAccessToken() || '';

    const [searchInput, setSearchInput] = useState('');
    const [filter, setFilter] = useState<FilterTab>('all');

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
            navigate(
                `/chat-pre-contratacion/${conversation.searchServiceId}?conversationId=${conversation.conversationId}`,
            );
        } else if (conversation.conversationType === 'post-hire' && conversation.searchHireId) {
            navigate(`/searchhire/${conversation.searchHireId}`);
        }
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
                    searchSlot={null}
                    filterSlot={null}
                />
                <main className="mx-auto w-full max-w-3xl flex-1 px-3 pb-6 pt-1 md:max-w-4xl md:px-5">
                    <ul className="flex flex-col gap-1.5" aria-hidden>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <li key={i}>
                                <SkeletonCard index={i} />
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
                <Header
                    onBack={() => navigate(-1)}
                    title="Mis mensajes"
                    counter={null}
                    searchSlot={null}
                    filterSlot={null}
                />
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

    return (
        <div className="flex min-h-screen flex-col bg-white" style={{ fontFamily: HP_FONT }}>
            <Header
                onBack={() => navigate(-1)}
                title="Mis mensajes"
                counter={
                    totalCount > 0
                        ? `${totalCount} ${totalCount === 1 ? 'conversación' : 'conversaciones'}${
                              totalUnread > 0 ? ` · ${totalUnread} sin leer` : ''
                          }`
                        : null
                }
                searchSlot={
                    totalCount > 3 ? (
                        <SearchInput
                            value={searchInput}
                            onChange={setSearchInput}
                            onClear={() => setSearchInput('')}
                        />
                    ) : null
                }
                filterSlot={
                    totalCount > 0 ? (
                        <FilterPills value={filter} onChange={setFilter} counts={filterCounts} />
                    ) : null
                }
            />

            {/* Lista */}
            {sortedConversations.length === 0 ? (
                <EmptyState onCreate={() => navigate('/crear-busqueda')} />
            ) : visibleConversations.length === 0 ? (
                <NoResultsState
                    query={searchInput}
                    onClearFilters={() => {
                        setSearchInput('');
                        setFilter('all');
                    }}
                />
            ) : (
                <main className="mx-auto w-full max-w-3xl flex-1 px-3 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-1 md:max-w-4xl md:px-5">
                    <ul className="flex flex-col gap-1.5">
                        {visibleConversations.map((conversation, index) => (
                            <li
                                key={conversation.conversationId}
                                className="animate-fade-in motion-reduce:animate-none"
                                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                            >
                                <ConversationCard
                                    conversation={conversation}
                                    isOwnLastMessage={
                                        conversation.lastMessage?.senderId === user?.id
                                    }
                                    formatAmount={formatAmount}
                                    onOpen={() => handleOpenChat(conversation)}
                                />
                            </li>
                        ))}
                    </ul>

                    {/* Hint al pie si pocas conversaciones */}
                    {visibleConversations.length > 0 && visibleConversations.length < 3 && (
                        <div className="mt-6 rounded-2xl border border-dashed border-[#e8e8e8] bg-white px-5 py-5 text-center">
                            <p className="text-[13px] text-[#6a6a6a]">
                                ¿Necesitas otra inspección?
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/crear-busqueda')}
                                className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand transition-colors hover:text-brand-hover"
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
                </main>
            )}
        </div>
    );
}

// -------------- Subcomponentes --------------

interface HeaderProps {
    onBack: () => void;
    title: string;
    counter: string | null;
    searchSlot: React.ReactNode;
    filterSlot: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ onBack, title, counter, searchSlot, filterSlot }) => (
    <header className="sticky top-0 z-30 border-b border-[#e8e8e8] bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto w-full max-w-3xl px-3 md:max-w-4xl md:px-5">
            <div className="flex items-center gap-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-3 sm:gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Volver"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1c1c1c] transition-colors hover:bg-[#f2f2f2] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                    <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-[17px] font-semibold tracking-[-0.015em] text-[#1c1c1c] md:text-[18px]">
                        {title}
                    </h1>
                    {counter && (
                        <p className="truncate text-[12px] leading-snug text-[#737373]">
                            {counter}
                        </p>
                    )}
                </div>
                <div className="hidden min-w-[180px] max-w-[260px] flex-1 md:block">{searchSlot}</div>
            </div>
            {/* Mobile search bajo el título */}
            <div className="md:hidden">{searchSlot && <div className="pb-3">{searchSlot}</div>}</div>
            {/* Filter pills */}
            {filterSlot && <div className="pb-3">{filterSlot}</div>}
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
        className="-mx-3 flex items-center gap-1.5 overflow-x-auto px-3 pb-0.5 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                                'inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none tabular-nums',
                                active ? 'bg-white/25 text-white' : 'bg-[#f0f0f0] text-[#6a6a6a]',
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

const SkeletonCard: React.FC<{ index: number }> = ({ index }) => (
    <div
        className="flex w-full items-start gap-3 rounded-2xl border border-[#f0f0f0] bg-white p-4 animate-fade-in motion-reduce:animate-none"
        style={{ animationDelay: `${index * 60}ms` }}
    >
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#f0f0f0]" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
            <div className="flex items-center justify-between gap-2">
                <div className="h-3.5 w-40 animate-pulse rounded-full bg-[#f0f0f0]" />
                <div className="h-3 w-10 animate-pulse rounded-full bg-[#f3f3f3]" />
            </div>
            <div className="h-2.5 w-28 animate-pulse rounded-full bg-[#f3f3f3]" />
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-[#f3f3f3]" />
        </div>
    </div>
);

interface ConversationCardProps {
    conversation: ClientConversationSummaryDto;
    isOwnLastMessage: boolean;
    formatAmount: (v: number | null | undefined, c: string | null | undefined) => string;
    onOpen: () => void;
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

const ConversationCard: React.FC<ConversationCardProps> = ({
    conversation,
    isOwnLastMessage,
    formatAmount,
    onOpen,
}) => {
    const isPreHire = conversation.conversationType === 'pre-hire';
    const isUnread = (conversation.unreadCount || 0) > 0;
    const title =
        (isPreHire
            ? conversation.serviceName || conversation.expertName
            : conversation.searchTitle || conversation.serviceName || conversation.expertName) ||
        'Conversación';
    const image = conversation.serviceImageUrl || conversation.expertProfilePictureUrl || undefined;
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

    /**
     * Chip de estado: SOLO aparece si hay un estado relevante (Disputa,
     * Cancelada, Completada, Esperando…). En pre-contratación normal no
     * aparece porque duplica la info del filter pill activo. El timestamp
     * pasa a ocupar su sitio arriba a la derecha (estilo iMessage).
     */
    const statusLabel = conversation.hireStatusTranslated?.trim() || null;
    const chip =
        !isPreHire && statusLabel && !NEUTRAL_HIRE_STATUSES.has(statusLabel.toLowerCase())
            ? { label: statusLabel, tone: tonFromHireStatus(statusLabel) }
            : null;

    const ariaStamp = stamp ? ` Última actividad hace ${stamp}.` : '';

    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={`Abrir conversación con ${expert} sobre ${title}.${ariaStamp}${
                isUnread ? ` ${conversation.unreadCount} sin leer.` : ''
            }${chip ? ` Estado: ${chip.label}.` : ''}`}
            className={[
                'group relative flex w-full items-start gap-3 rounded-2xl border border-[#e8e8e8] bg-white p-4 text-left',
                'transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                'hover:-translate-y-0.5 hover:border-[#d4d4d4] hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.16)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
            ].join(' ')}
        >
            {/* Punto de no leído (estilo Mail) — reserva espacio para alinear avatares */}
            <span className="mt-4 flex h-2 w-2 shrink-0 items-center justify-center" aria-hidden>
                {isUnread && (
                    <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_0_3px_hsl(var(--brand)/0.14)]" />
                )}
            </span>

            {/* Avatar 44px sin ring, con badge de tipo de conversación */}
            <div className="relative shrink-0">
                <Avatar className="h-11 w-11 overflow-hidden rounded-full">
                    <AvatarImage src={image} alt="" />
                    <AvatarFallback className="bg-brand text-[15px] font-bold text-white">
                        {(expert || title || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span
                    className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-brand ring-1 ring-[#e8e8e8]"
                    aria-hidden
                >
                    {isPreHire ? (
                        <MessageCircle className="h-2.5 w-2.5" strokeWidth={2.5} />
                    ) : (
                        <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2.5} />
                    )}
                </span>
            </div>

            {/* Cuerpo */}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                {/* Header: título + chip de estado (si lo hay) + timestamp arriba derecha */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 min-w-0 text-[14px] font-semibold leading-tight tracking-[-0.01em] text-[#1c1c1c]">
                        {title}
                    </h3>
                    <div className="flex shrink-0 items-center gap-2">
                        {chip && <StatusChip label={chip.label} tone={chip.tone} />}
                        {stamp && (
                            <time
                                className={[
                                    'text-[11px] font-medium leading-none',
                                    isUnread ? 'text-brand' : 'text-[#a0a0a0]',
                                ].join(' ')}
                                aria-hidden
                            >
                                {stamp}
                            </time>
                        )}
                    </div>
                </div>

                {/* Meta: experto · precio (sin fecha, ya está arriba) */}
                <p className="truncate text-[12px] leading-tight text-[#737373]">
                    {expert}
                    {amount ? ` · ${amount}` : ''}
                </p>

                {/* Snippet del último mensaje */}
                <div className="flex items-center gap-2">
                    <p
                        className={[
                            'line-clamp-1 flex-1 text-[13px] leading-snug',
                            isUnread ? 'font-semibold text-[#1c1c1c]' : 'text-[#6a6a6a]',
                        ].join(' ')}
                    >
                        {isOwnLastMessage && (
                            <span className="text-[#a0a0a0]">Tú: </span>
                        )}
                        {snippet}
                    </p>
                    {isUnread && (
                        <span
                            className="inline-flex h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold leading-none text-white"
                            aria-label={`${conversation.unreadCount} mensajes sin leer`}
                        >
                            {(conversation.unreadCount || 0) > 99 ? '99+' : conversation.unreadCount}
                        </span>
                    )}
                </div>
            </div>
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
