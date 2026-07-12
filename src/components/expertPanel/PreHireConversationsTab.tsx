import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { PreHireConversationSummaryDto } from '../../types/chat.types';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { formatCurrency } from '../../utils/priceUtils';

interface PreHireConversationsTabProps {
    token: string;
    userId: number;
}

function clientInitials(name?: string | null): string {
    const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function normalizeConversations(data: unknown[]): PreHireConversationSummaryDto[] {
    return (data || []).map((conv: Record<string, unknown>) => ({
        ConversationId: (conv.ConversationId ?? conv.conversationId) as number,
        SearchServiceId: (conv.SearchServiceId ?? conv.searchServiceId) as number,
        ServiceName: (conv.ServiceName ?? conv.serviceName ?? 'Servicio') as string,
        ServicePrice: Number(conv.ServicePrice ?? conv.servicePrice ?? 0),
        ServiceImageUrl: (conv.ServiceImageUrl ?? conv.serviceImageUrl) as string | undefined,
        ClientId: (conv.ClientId ?? conv.clientId) as number,
        ClientName: (conv.ClientName ?? conv.clientName ?? 'Cliente') as string,
        ClientProfilePictureUrl: (conv.ClientProfilePictureUrl ?? conv.clientProfilePictureUrl) as string | undefined,
        LastMessage: conv.LastMessage || conv.lastMessage
            ? (() => {
                const msg = (conv.LastMessage ?? conv.lastMessage) as Record<string, unknown>;
                return {
                    Id: (msg.Id ?? msg.id) as number,
                    Content: String(msg.Content ?? msg.content ?? ''),
                    SentAt: String(msg.SentAt ?? msg.sentAt ?? ''),
                    SenderId: (msg.SenderId ?? msg.senderId ?? null) as number | null,
                    SenderName: String(msg.SenderName ?? msg.senderName ?? ''),
                    IsRead: Boolean(msg.IsRead ?? msg.isRead ?? false),
                };
            })()
            : undefined,
        UnreadCount: Number(conv.UnreadCount ?? conv.unreadCount ?? 0),
        CreatedAt: String(conv.CreatedAt ?? conv.createdAt ?? ''),
        UpdatedAt: String(conv.UpdatedAt ?? conv.updatedAt ?? ''),
        ServiceCurrency: (conv.ServiceCurrency ?? conv.serviceCurrency ?? conv.PriceCurrency ?? conv.priceCurrency) as string | undefined,
    }));
}

function renderServicePrice(
    price: number,
    conv: PreHireConversationSummaryDto & { ServiceCurrency?: string },
) {
    const code = String(conv.ServiceCurrency || 'EUR').trim().toUpperCase();
    return formatCurrency(price, code);
}

function ConversationRowSkeleton() {
    return (
        <li className="expert-message-row expert-message-row--skeleton" aria-hidden>
            <Skeleton className="expert-message-avatar" />
            <div className="expert-message-main">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-3 w-52 rounded mt-2" />
                <Skeleton className="h-3 w-full max-w-md rounded mt-2" />
            </div>
        </li>
    );
}

export function PreHireConversationsTab({ token, userId }: PreHireConversationsTabProps) {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: conversations = [], isLoading, isError, error, refetch, isFetched } = useQuery({
        queryKey: ['expert-pre-hire-conversations', userId],
        queryFn: async () => {
            const response = await fetch(
                `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.chat.preHireConversations}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (!response.ok) {
                if (response.status === 404) return [];
                const errorText = await response.text();
                throw new Error(`Error al obtener conversaciones: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return normalizeConversations(Array.isArray(data) ? data : []);
        },
        enabled: Boolean(token && userId),
        refetchInterval: 60_000,
        refetchIntervalInBackground: false,
        retry: 2,
    });

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter((conv) => {
            const client = conv.ClientName.toLowerCase();
            const service = conv.ServiceName.toLowerCase();
            const preview = conv.LastMessage?.Content?.toLowerCase() || '';
            return client.includes(q) || service.includes(q) || preview.includes(q);
        });
    }, [conversations, searchQuery]);

    const totalUnread = useMemo(
        () => conversations.reduce((n, c) => n + (c.UnreadCount || 0), 0),
        [conversations],
    );

    const unreadThreads = useMemo(
        () => conversations.filter((c) => (c.UnreadCount || 0) > 0).length,
        [conversations],
    );

    const handleOpenChat = (conversationId: number, searchServiceId: number) => {
        navigate(`/inquiry/${searchServiceId}?conversationId=${conversationId}`);
    };

    if (!token || !userId) {
        return (
            <div className="expert-messages-state" role="status">
                <p className="expert-messages-state-title">Sesión no disponible</p>
                <p className="expert-messages-state-text">
                    Inicia sesión para ver las conversaciones con clientes antes de contratar.
                </p>
            </div>
        );
    }

    return (
        <div className="expert-messages">
            <header className="expert-messages-toolbar">
                <div className="expert-messages-toolbar-text">
                    <p className="expert-messages-toolbar-title">
                        {conversations.length === 0
                            ? 'Consultas de clientes antes de contratar'
                            : `${conversations.length} conversación${conversations.length === 1 ? '' : 'es'}`}
                    </p>
                    {totalUnread > 0 && (
                        <p className="expert-messages-toolbar-note">
                            {totalUnread} mensaje{totalUnread === 1 ? '' : 's'} sin leer
                            {unreadThreads > 1 ? ` en ${unreadThreads} hilos` : ''}
                        </p>
                    )}
                </div>
            </header>

            {!isLoading && !isError && conversations.length > 0 && (
                <div className="expert-messages-stats expert-hires-stats--inline">
                    <div className="expert-hires-stat">
                        <span className="expert-hires-stat-value">{conversations.length}</span>
                        <span className="expert-hires-stat-label">Total</span>
                    </div>
                    <div className="expert-hires-stat">
                        <span className="expert-hires-stat-value expert-hires-stat-value--active">{unreadThreads}</span>
                        <span className="expert-hires-stat-label">Con novedades</span>
                    </div>
                    <div className="expert-hires-stat">
                        <span className="expert-hires-stat-value expert-hires-stat-value--done">
                            {conversations.length - unreadThreads}
                        </span>
                        <span className="expert-hires-stat-label">Al día</span>
                    </div>
                </div>
            )}

            {!isLoading && !isError && conversations.length > 0 && (
                <div className="expert-messages-filters">
                    <Input
                        type="search"
                        placeholder="Buscar por cliente, servicio o mensaje"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="expert-messages-search"
                    />
                </div>
            )}

            {isLoading ? (
                <ul className="expert-messages-list" aria-busy="true" aria-label="Cargando conversaciones">
                    {[0, 1, 2].map((i) => (
                        <ConversationRowSkeleton key={i} />
                    ))}
                </ul>
            ) : isError && conversations.length === 0 ? (
                <div className="expert-messages-state expert-messages-state--error" role="alert">
                    <p className="expert-messages-state-title">No se pudieron cargar las conversaciones</p>
                    <p className="expert-messages-state-text">
                        {error instanceof Error ? error.message : 'Error desconocido'}
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                        Reintentar
                    </Button>
                </div>
            ) : isFetched && conversations.length === 0 ? (
                <div className="expert-messages-state" role="status">
                    <p className="expert-messages-state-title">Sin conversaciones por ahora</p>
                    <p className="expert-messages-state-text">
                        Los clientes pueden escribirte desde la ficha de tu servicio antes de contratar.
                        Cuando lo hagan, verás el hilo aquí.
                    </p>
                </div>
            ) : filteredConversations.length === 0 ? (
                <div className="expert-messages-state" role="status">
                    <p className="expert-messages-state-title">Sin resultados</p>
                    <p className="expert-messages-state-text">
                        No hay conversaciones que coincidan con &ldquo;{searchQuery}&rdquo;.
                    </p>
                    <button
                        type="button"
                        className="expert-messages-clear-search"
                        onClick={() => setSearchQuery('')}
                    >
                        Limpiar búsqueda
                    </button>
                </div>
            ) : (
                <ul className="expert-messages-list" aria-label="Conversaciones pre-contratación">
                    {filteredConversations.map((conv) => {
                        const unread = conv.UnreadCount || 0;
                        const lastAt = conv.LastMessage?.SentAt || conv.UpdatedAt || conv.CreatedAt;

                        return (
                            <li key={conv.ConversationId}>
                                <button
                                    type="button"
                                    className={`expert-message-row${unread > 0 ? ' expert-message-row--unread' : ''}`}
                                    onClick={() => handleOpenChat(conv.ConversationId, conv.SearchServiceId)}
                                >
                                    {conv.ClientProfilePictureUrl ? (
                                        <img
                                            src={conv.ClientProfilePictureUrl}
                                            alt=""
                                            className="expert-message-avatar expert-message-avatar--img"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <span className="expert-message-avatar" aria-hidden>
                                            {clientInitials(conv.ClientName)}
                                        </span>
                                    )}

                                    <div className="expert-message-main">
                                        <div className="expert-message-head">
                                            <h3 className="expert-message-client">{conv.ClientName}</h3>
                                            {lastAt && (
                                                <time className="expert-message-date" dateTime={lastAt}>
                                                    {formatRelativeDate(lastAt)}
                                                </time>
                                            )}
                                        </div>
                                        <p className="expert-message-service">{conv.ServiceName}</p>
                                        {conv.LastMessage?.Content ? (
                                            <p className="expert-message-preview">
                                                {conv.LastMessage.Content}
                                            </p>
                                        ) : (
                                            <p className="expert-message-preview expert-message-preview--empty">
                                                Sin mensajes todavía
                                            </p>
                                        )}
                                        {unread > 0 && (
                                            <p className="expert-message-unread">
                                                {unread} sin leer
                                            </p>
                                        )}
                                    </div>

                                    <div className="expert-message-side">
                                        <span className="expert-message-price">
                                            {renderServicePrice(conv.ServicePrice, conv)}
                                        </span>
                                        <span className="expert-message-open">Abrir chat</span>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
