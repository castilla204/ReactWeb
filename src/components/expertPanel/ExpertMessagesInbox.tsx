import { Suspense, lazy, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, MessageCircle, Search as SearchIcon, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { API_CONFIG } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { isAdmin as isAdminUser } from '../../utils/admin';
import { useApi } from '../../hooks/useApi';
import { useIsMobile } from '../../hooks/useIsMobile';
import { isActiveSearchHireStatus } from '../../constants/hireStatuses';
import { ClientConversationSummaryDto, MessageSummaryDto } from '../../types/chat.types';
import {
    FILTER_LABELS,
    FilterTab,
    NEUTRAL_HIRE_STATUSES,
    StatusChip,
    StatusChipProps,
    formatRelative,
    tonFromHireStatus,
} from '../chat/conversationInboxUi';

const SearchDetails = lazy(() => import('../SearchDetails'));
const PreHireChat = lazy(() =>
    import('../PreHireChat').then((m) => ({ default: m.PreHireChat })),
);

interface ExpertMessagesInboxProps {
    token: string;
    userId: number;
}

/**
 * Bandeja unificada del EXPERTO (pre + post contratación) en dos columnas, espejo
 * de la del cliente (MessagesPage) pero con el CLIENTE como interlocutor. La lista
 * a la izquierda; a la derecha, incrustado en la misma pantalla:
 *  · post-hire → <SearchDetails embedded> COMPLETO (chat + columna de detalles con
 *    todos los botones de acción del hire funcionando in-place, sin salir a /searchhire).
 *  · pre-hire  → <PreHireChat embedded> (consulta antes de contratar).
 * Vive dentro de la pestaña "Mensajes" del panel del experto (sin chrome propio).
 */
export function ExpertMessagesInbox({ token, userId }: ExpertMessagesInboxProps) {
    const { user } = useAuth();
    const isUserAdmin =
        isAdminUser(user?.email) || user?.role === 'Admin' || user?.role === 'admin';
    const { fetchApi } = useApi();
    const isMobile = useIsMobile();

    const [searchInput, setSearchInput] = useState('');
    const [filter, setFilter] = useState<FilterTab>('all');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const { data: conversations, isLoading, error, refetch } = useQuery<
        ClientConversationSummaryDto[]
    >({
        queryKey: ['expert-conversations'],
        queryFn: async () => {
            try {
                const response = await fetchApi<unknown>(API_CONFIG.endpoints.chat.expertConversations);
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
                              senderName: (lastMessage.senderName ?? lastMessage.SenderName ?? '[Usuario]') as string,
                              isRead: (lastMessage.isRead ?? lastMessage.IsRead ?? false) as boolean,
                              Id: (lastMessage.id ?? lastMessage.Id) as number,
                              Content: (lastMessage.content ?? lastMessage.Content ?? '') as string,
                              SentAt: (lastMessage.sentAt ?? lastMessage.SentAt) as string,
                              SenderId: (lastMessage.senderId ?? lastMessage.SenderId ?? null) as number | null,
                              SenderName: (lastMessage.senderName ?? lastMessage.SenderName ?? '[Usuario]') as string,
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
                        expertName: get<string>('expertName', 'ExpertName') ?? '',
                        expertProfilePictureUrl:
                            get<string>('expertProfilePictureUrl', 'ExpertProfilePictureUrl') ?? null,
                        clientId: get<number>('clientId', 'ClientId') ?? null,
                        clientName: get<string>('clientName', 'ClientName') ?? 'Cliente',
                        clientProfilePictureUrl:
                            get<string>('clientProfilePictureUrl', 'ClientProfilePictureUrl') ?? null,
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
                            get<string>('hireCurrency', 'HireCurrency', 'chargeCurrency', 'ChargeCurrency') ?? 'EUR',
                        searchTitle: get<string>('searchTitle', 'SearchTitle') ?? null,
                        searchDescription: get<string>('searchDescription', 'SearchDescription') ?? null,
                    } as ClientConversationSummaryDto;
                });
            } catch (err: unknown) {
                if ((err as { status?: number })?.status === 404) return [];
                throw err;
            }
        },
        enabled: !!token,
        staleTime: 30_000,
        refetchInterval: 60_000,
        retry: 2,
    });

    const sorted = useMemo(() => {
        if (!conversations) return [];
        return [...conversations].sort((a, b) => {
            const dA = new Date(a.updatedAt || a.createdAt).getTime();
            const dB = new Date(b.updatedAt || b.createdAt).getTime();
            return dB - dA;
        });
    }, [conversations]);

    const visible = useMemo(() => {
        const q = searchInput.trim().toLowerCase();
        return sorted.filter((c) => {
            if (filter === 'pre-hire' && c.conversationType !== 'pre-hire') return false;
            if (filter === 'post-hire' && c.conversationType !== 'post-hire') return false;
            if (!q) return true;
            const fields = [c.clientName, c.serviceName, c.searchTitle, c.lastMessage?.content]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return fields.includes(q);
        });
    }, [sorted, filter, searchInput]);

    const counts = useMemo<Record<FilterTab, number>>(
        () => ({
            all: sorted.length,
            'pre-hire': sorted.filter((c) => c.conversationType === 'pre-hire').length,
            'post-hire': sorted.filter((c) => c.conversationType === 'post-hire').length,
        }),
        [sorted],
    );

    const selected = useMemo(
        () => (selectedId == null ? null : sorted.find((c) => c.conversationId === selectedId) ?? null),
        [selectedId, sorted],
    );

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

    // En móvil, al seleccionar se muestra solo el chat (con botón de volver).
    const showListColumn = !isMobile || selected == null;
    const showChatColumn = !isMobile || selected != null;

    if (isLoading) {
        return (
            <div className="flex h-full min-h-[24rem] items-center justify-center">
                <MessageCircle className="h-6 w-6 animate-pulse text-line" aria-hidden />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-body text-destructive">No pudimos cargar tus conversaciones.</p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="rounded-full bg-brand px-5 py-2.5 text-meta font-semibold text-white transition-colors hover:bg-brand-hover"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (sorted.length === 0) {
        return (
            <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-2 p-6 text-center">
                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-surface-tinted">
                    <MessageCircle className="h-6 w-6 text-ink-muted" strokeWidth={1.5} aria-hidden />
                </div>
                <h2 className="text-subtitle font-semibold text-ink-strong">Aún no tienes conversaciones</h2>
                <p className="max-w-sm text-meta leading-snug text-ink-muted">
                    Cuando un cliente te escriba o contrate, los mensajes aparecerán aquí.
                </p>
            </div>
        );
    }

    return (
        <div className="expert-messages-inbox grid h-full min-h-0 flex-1 grid-cols-1 overflow-hidden bg-white md:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
            {/* ----- Lista ----- */}
            {showListColumn && (
                <section className="flex min-h-0 min-w-0 flex-col md:bg-surface-tinted">
                    <div className="shrink-0 space-y-3 border-b border-line-soft bg-white px-3 pb-3 pt-3 md:px-3.5 md:pt-3">
                        <div className="relative flex w-full items-center">
                            <SearchIcon
                                className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-muted"
                                strokeWidth={2}
                                aria-hidden
                            />
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Buscar conversaciones…"
                                className="h-10 w-full rounded-full border border-line bg-white pl-10 pr-9 text-body text-ink-strong placeholder:text-ink-muted transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => setSearchInput('')}
                                    aria-label="Borrar búsqueda"
                                    className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-tinted hover:text-ink-strong"
                                >
                                    <X className="h-4 w-4" strokeWidth={2} />
                                </button>
                            )}
                        </div>
                        <div role="radiogroup" aria-label="Filtrar conversaciones" className="flex flex-wrap items-center gap-1.5">
                            {(Object.keys(FILTER_LABELS) as FilterTab[]).map((tab) => {
                                const active = filter === tab;
                                const count = counts[tab];
                                return (
                                    <button
                                        key={tab}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => setFilter(tab)}
                                        className={[
                                            'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-caption font-medium transition-colors',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                                            active
                                                ? 'border-brand bg-brand text-white'
                                                : 'border-line bg-white text-ink-strong hover:bg-surface-tinted',
                                        ].join(' ')}
                                    >
                                        {FILTER_LABELS[tab]}
                                        {count > 0 && (
                                            <span
                                                className={[
                                                    'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] font-semibold leading-none tabular-nums',
                                                    active ? 'bg-white/25 text-white' : 'bg-line text-ink-muted',
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
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                        {visible.length === 0 ? (
                            <div className="p-6 text-center text-meta text-ink-muted">
                                Sin conversaciones con ese filtro.
                            </div>
                        ) : (
                            <ul className="flex flex-col">
                                {visible.map((c, index) => (
                                    <li key={c.conversationId}>
                                        <ExpertConversationRow
                                            conversation={c}
                                            isOwnLastMessage={c.lastMessage?.senderId === userId}
                                            isActive={selectedId === c.conversationId}
                                            formatAmount={formatAmount}
                                            onOpen={() => setSelectedId(c.conversationId)}
                                            isLast={index === visible.length - 1}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}

            {/* ----- Chat ----- */}
            {showChatColumn &&
                (selected ? (
                    <ExpertChatPanel
                        key={`${selected.conversationType}-${selected.conversationId}`}
                        conversation={selected}
                        token={token}
                        userId={userId}
                        amountLabel={
                            selected.conversationType === 'pre-hire'
                                ? formatAmount(selected.servicePrice, selected.serviceCurrency)
                                : formatAmount(selected.hireAmount, selected.hireCurrency)
                        }
                        onClose={() => setSelectedId(null)}
                        onReload={() => void refetch()}
                    />
                ) : (
                    <section className="hidden items-center justify-center bg-surface-tinted px-8 md:flex">
                        <div className="max-w-xs text-center">
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand/[0.08]">
                                <MessageCircle className="h-7 w-7 text-brand" strokeWidth={1.5} aria-hidden />
                            </div>
                            <h2 className="text-subtitle font-semibold text-ink-strong">
                                Selecciona una conversación
                            </h2>
                            <p className="mx-auto mt-1.5 text-meta leading-relaxed text-ink-muted">
                                Elige una conversación de la lista para ver los mensajes con tu cliente.
                            </p>
                        </div>
                    </section>
                ))}
        </div>
    );
}

interface ExpertConversationRowProps {
    conversation: ClientConversationSummaryDto;
    isOwnLastMessage: boolean;
    isActive: boolean;
    formatAmount: (v: number | null | undefined, c: string | null | undefined) => string;
    onOpen: () => void;
    isLast: boolean;
}

const ExpertConversationRow: React.FC<ExpertConversationRowProps> = ({
    conversation,
    isOwnLastMessage,
    isActive,
    formatAmount,
    onOpen,
    isLast,
}) => {
    const isPreHire = conversation.conversationType === 'pre-hire';
    const unread = conversation.unreadCount || 0;
    const isUnread = unread > 0;
    const client = conversation.clientName || 'Cliente';
    const title =
        (isPreHire
            ? conversation.serviceName || client
            : conversation.searchTitle || conversation.serviceName || client) || 'Conversación';
    const image = conversation.clientProfilePictureUrl || undefined;
    const stamp = conversation.lastMessage?.sentAt
        ? formatRelative(conversation.lastMessage.sentAt)
        : conversation.updatedAt
          ? formatRelative(conversation.updatedAt)
          : '';
    const snippet = conversation.lastMessage?.content?.trim() || 'Aún no hay mensajes.';
    const amount = isPreHire
        ? formatAmount(conversation.servicePrice, conversation.serviceCurrency)
        : formatAmount(conversation.hireAmount, conversation.hireCurrency);

    const statusLabel = conversation.hireStatusTranslated?.trim() || null;
    const chip: { label: string; tone: StatusChipProps['tone']; icon?: 'shield' } | null = isPreHire
        ? { label: 'Consulta', tone: 'brand' }
        : statusLabel && !NEUTRAL_HIRE_STATUSES.has(statusLabel.toLowerCase())
          ? { label: statusLabel, tone: tonFromHireStatus(statusLabel), icon: 'shield' }
          : { label: 'Contratación activa', tone: 'green', icon: 'shield' };

    return (
        <button
            type="button"
            onClick={onOpen}
            aria-current={isActive ? 'true' : undefined}
            className={[
                'group relative flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-150 md:px-3.5',
                isActive ? 'bg-brand/[0.06] hover:bg-brand/[0.06]' : 'hover:bg-surface-tinted active:bg-line-soft',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
            ].join(' ')}
        >
            <div className="relative shrink-0">
                <Avatar className="h-[52px] w-[52px] overflow-hidden rounded-full bg-line-soft">
                    <AvatarImage src={image} alt="" className="h-full w-full object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-brand to-brand-hover text-title font-semibold text-white">
                        {(client || title || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span
                    className={[
                        'absolute -bottom-0.5 -right-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full ring-2 ring-white',
                        isPreHire ? 'bg-brand/10 text-brand' : 'bg-success text-white',
                    ].join(' ')}
                    aria-hidden
                >
                    {isPreHire ? (
                        <MessageCircle className="h-[11px] w-[11px]" strokeWidth={2.25} />
                    ) : (
                        <svg viewBox="0 0 24 24" className="h-[11px] w-[11px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    )}
                </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                <div className="flex items-baseline justify-between gap-2">
                    <h3
                        className={[
                            'line-clamp-1 min-w-0 text-lead leading-tight tracking-[-0.01em] text-ink-strong',
                            isUnread ? 'font-bold' : 'font-semibold',
                        ].join(' ')}
                    >
                        {title}
                    </h3>
                    {stamp && (
                        <time
                            className={[
                                'shrink-0 text-caption leading-none tabular-nums',
                                isUnread ? 'font-semibold text-brand' : 'font-medium text-ink-muted',
                            ].join(' ')}
                            aria-hidden
                        >
                            {stamp}
                        </time>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <p
                        className={[
                            'flex min-w-0 flex-1 items-center gap-1.5 text-meta leading-snug',
                            isUnread ? 'font-medium text-ink' : 'text-ink-muted',
                        ].join(' ')}
                    >
                        {chip && <StatusChip label={chip.label} tone={chip.tone} icon={chip.icon} />}
                        <span className="truncate">
                            {isOwnLastMessage && <span className="text-ink-soft">Tú: </span>}
                            {snippet}
                        </span>
                    </p>
                    {isUnread ? (
                        <span
                            className="inline-flex h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-kicker font-bold leading-none text-white"
                            aria-label={`${unread} mensajes sin leer`}
                        >
                            {unread > 99 ? '99+' : unread}
                        </span>
                    ) : (
                        amount && (
                            <span className="shrink-0 text-caption font-semibold tabular-nums text-ink-soft">
                                {amount}
                            </span>
                        )
                    )}
                </div>
            </div>

            {!isLast && (
                <span
                    className="pointer-events-none absolute bottom-0 left-[72px] right-0 h-px bg-line-soft"
                    aria-hidden
                />
            )}
        </button>
    );
};

interface ExpertChatPanelProps {
    conversation: ClientConversationSummaryDto;
    token: string;
    userId: number;
    amountLabel: string;
    onClose: () => void;
    onReload: () => void;
}

const ExpertChatPanel: React.FC<ExpertChatPanelProps> = ({
    conversation,
    token,
    userId,
    amountLabel,
    onClose,
    onReload,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isUserAdmin =
        isAdminUser(user?.email) || user?.role === 'Admin' || user?.role === 'admin';
    const isPreHire = conversation.conversationType === 'pre-hire';
    const client = conversation.clientName || 'Cliente';
    // 📋 "Rellenar inspección" — única acción que tenía la antigua pestaña Contrataciones y
    // que el detalle incrustado no ofrece. Solo en contrataciones activas (no finalizadas).
    const canFillInspection =
        !isPreHire
        && conversation.searchHireId != null
        && isActiveSearchHireStatus(conversation.hireStatus ?? '');
    const statusLabel = conversation.hireStatusTranslated?.trim() || null;
    const chip: { label: string; tone: StatusChipProps['tone']; icon?: 'shield' } = isPreHire
        ? { label: 'Consulta', tone: 'brand' }
        : statusLabel && !NEUTRAL_HIRE_STATUSES.has(statusLabel.toLowerCase())
          ? { label: statusLabel, tone: tonFromHireStatus(statusLabel), icon: 'shield' }
          : { label: 'Contratación activa', tone: 'green', icon: 'shield' };
    const subtitle =
        (isPreHire
            ? conversation.serviceName || 'Pregunta antes de contratar'
            : conversation.searchTitle || conversation.serviceName || 'Contratación') +
        (amountLabel ? ` · ${amountLabel}` : '');

    return (
        <section className="flex min-h-0 min-w-0 flex-col bg-white">
            <div className="flex shrink-0 items-center gap-3 border-b border-line-soft px-3 py-2.5 md:px-3.5">
                <Avatar className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-line-soft">
                    <AvatarImage
                        src={conversation.clientProfilePictureUrl || undefined}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-brand to-brand-hover text-lead font-semibold text-white">
                        {client.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-lead font-semibold tracking-[-0.01em] text-ink-strong">
                            {client}
                        </p>
                        <StatusChip label={chip.label} tone={chip.tone} icon={chip.icon} />
                    </div>
                    <p className="mt-0.5 truncate text-caption text-ink-muted">{subtitle}</p>
                </div>
                {canFillInspection && (
                    <button
                        type="button"
                        onClick={() => navigate(`/expert/inspection/${conversation.searchHireId}`)}
                        aria-label="Rellenar inspección"
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-2.5 text-meta font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:px-3.5"
                    >
                        <ClipboardList className="h-4 w-4" strokeWidth={2} aria-hidden />
                        <span className="hidden sm:inline">Rellenar inspección</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar conversación"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-tinted hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                    <X className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
            </div>
            <div className="min-h-0 flex-1">
                <Suspense
                    fallback={
                        <div className="flex h-full items-center justify-center bg-white">
                            <MessageCircle className="h-6 w-6 animate-pulse text-line" aria-hidden />
                        </div>
                    }
                >
                    {isPreHire ? (
                        <PreHireChat
                            serviceId={conversation.searchServiceId ?? 0}
                            token={token}
                            userId={userId}
                            conversationId={
                                conversation.conversationId > 0 ? conversation.conversationId : undefined
                            }
                            peerName={client}
                            embedded
                            onConversationLoaded={() => onReload()}
                        />
                    ) : (
                        <SearchDetails
                            isAdmin={isUserAdmin}
                            searchHireId={conversation.searchHireId ?? undefined}
                            embedded
                            onBack={onClose}
                        />
                    )}
                </Suspense>
            </div>
        </section>
    );
};
