import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, ArrowLeft, Loader2, ShoppingBag, CheckCircle2, Clock, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';
import { ClientConversationSummaryDto, MessageSummaryDto } from '../types/chat.types';
import { useApi } from '../hooks/useApi';

export function MessagesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { fetchApi } = useApi();
    const token = authService.getAccessToken() || '';

    // Obtener todas las conversaciones del cliente
    const { data: conversations, isLoading, error, refetch } = useQuery<ClientConversationSummaryDto[]>({
        queryKey: ['my-conversations'],
        queryFn: async () => {
            try {
                const response = await fetchApi<any>(API_CONFIG.endpoints.chat.myConversations);
                
                // Si el endpoint no existe aún, retornar array vacío
                if (!response || (Array.isArray(response) && response.length === 0)) {
                    return [];
                }

                // El backend devuelve camelCase según la documentación
                return (response || []).map((conv: any) => {
                    // Normalizar lastMessage (soporta tanto camelCase como PascalCase)
                    const lastMessage = conv.lastMessage || conv.LastMessage;
                    const normalizedLastMessage: MessageSummaryDto | null = lastMessage ? {
                        id: lastMessage.id || lastMessage.Id,
                        content: lastMessage.content || lastMessage.Content || '',
                        sentAt: lastMessage.sentAt || lastMessage.SentAt,
                        senderId: lastMessage.senderId ?? lastMessage.SenderId ?? null,
                        senderName: lastMessage.senderName || lastMessage.SenderName || '[Usuario]',
                        isRead: lastMessage.isRead ?? lastMessage.IsRead ?? false,
                        // Compatibilidad legacy
                        Id: lastMessage.id || lastMessage.Id,
                        Content: lastMessage.content || lastMessage.Content || '',
                        SentAt: lastMessage.sentAt || lastMessage.SentAt,
                        SenderId: lastMessage.senderId ?? lastMessage.SenderId ?? null,
                        SenderName: lastMessage.senderName || lastMessage.SenderName || '[Usuario]',
                        IsRead: lastMessage.isRead ?? lastMessage.IsRead ?? false,
                    } : null;

                    return {
                        conversationId: conv.conversationId || conv.ConversationId,
                        conversationType: conv.conversationType || conv.ConversationType || (conv.searchServiceId || conv.SearchServiceId ? 'pre-hire' : 'post-hire'),
                        createdAt: conv.createdAt || conv.CreatedAt,
                        updatedAt: conv.updatedAt || conv.UpdatedAt,
                        unreadCount: conv.unreadCount ?? conv.UnreadCount ?? 0,
                        lastMessage: normalizedLastMessage,
                        expertId: conv.expertId ?? conv.ExpertId ?? null,
                        expertName: conv.expertName || conv.ExpertName || '[Experto]',
                        expertProfilePictureUrl: conv.expertProfilePictureUrl || conv.ExpertProfilePictureUrl || null,
                        // Pre-hire fields
                        searchServiceId: conv.searchServiceId ?? conv.SearchServiceId ?? null,
                        serviceName: conv.serviceName || conv.ServiceName || null,
                        servicePrice: conv.servicePrice ?? conv.ServicePrice ?? null,
                        serviceImageUrl: conv.serviceImageUrl || conv.ServiceImageUrl || null,
                        // Post-hire fields
                        searchHireId: conv.searchHireId ?? conv.SearchHireId ?? null,
                        hireStatus: conv.hireStatus || conv.HireStatus || null,
                        hireStatusTranslated: conv.hireStatusTranslated || conv.HireStatusTranslated || null,
                        hireCreatedAt: conv.hireCreatedAt || conv.HireCreatedAt || null,
                        hireAmount: conv.hireAmount ?? conv.HireAmount ?? null,
                        hireBaseAmount: conv.hireBaseAmount ?? conv.HireBaseAmount ?? null,
                        hireTaxAmount: conv.hireTaxAmount ?? conv.HireTaxAmount ?? null,
                        // 🛡️ Round 28: divisas (ISO 4217) para que la lista muestre £/CHF/kr correcto.
                        serviceCurrency: conv.serviceCurrency || conv.ServiceCurrency || 'EUR',
                        hireCurrency: conv.hireCurrency || conv.HireCurrency || conv.chargeCurrency || conv.ChargeCurrency || 'EUR',
                        searchTitle: conv.searchTitle || conv.SearchTitle || null,
                        searchDescription: conv.searchDescription || conv.SearchDescription || null,
                    };
                });
            } catch (error: any) {
                // Si el endpoint no existe, retornar array vacío
                if (error?.status === 404 || error?.message?.includes('404')) {
                    return [];
                }
                throw error;
            }
        },
        enabled: !!token && !!user,
        staleTime: 30000, // 30 segundos
        refetchInterval: 60000, // Refrescar cada minuto
        retry: 2
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        if (diffDays < 7) return `Hace ${diffDays} d`;
        
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    };

    const handleOpenChat = (conversation: ClientConversationSummaryDto) => {
        if (conversation.conversationType === 'pre-hire' && conversation.searchServiceId) {
            // ✅ Chat Pre-Contratación
            // Ruta: /chat-pre-contratacion/{searchServiceId}
            // Endpoint: GET /api/Chat/conversation-by-service?searchServiceId={id}
            // Componente: PreHireChat (solo chat, sin tabs)
            navigate(`/chat-pre-contratacion/${conversation.searchServiceId}?conversationId=${conversation.conversationId || conversation.ConversationId}`);
        } else if (conversation.conversationType === 'post-hire' && conversation.searchHireId) {
            // ✅ Chat Post-Contratación
            // Ruta: /searchhire/{searchHireId} (usa searchHireId directamente, no searchId)
            // Endpoints:
            //   - GET /api/Chat/by-searchhire/{searchHireId} (para el chat)
            //   - GET /api/searchhire/{searchHireId}/details-complete (para los detalles)
            // Componente: SearchDetails (con tabs: Chat | Detalles)
            navigate(`/searchhire/${conversation.searchHireId}`);
        }
    };

    // Obtener el título y la imagen para mostrar
    const getConversationDisplayInfo = (conversation: ClientConversationSummaryDto) => {
        if (conversation.conversationType === 'pre-hire') {
            return {
                title: conversation.serviceName || conversation.expertName,
                image: conversation.serviceImageUrl || conversation.expertProfilePictureUrl,
            };
        } else {
            // Post-hire
            return {
                title: conversation.searchTitle || conversation.serviceName || conversation.expertName,
                image: conversation.serviceImageUrl || conversation.expertProfilePictureUrl,
            };
        }
    };

    // Ordenar conversaciones por última actualización (más recientes primero)
    const sortedConversations = conversations?.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
    }) || [];

    if (isLoading) {
        return (
            <div className="flex flex-col h-screen bg-white">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-8 w-8"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-semibold text-gray-900">Mensajes</h1>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-screen bg-white">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-8 w-8"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-semibold text-gray-900">Mensajes</h1>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">Error al cargar las conversaciones</p>
                        <Button onClick={() => refetch()} variant="outline">
                            Reintentar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 
                        className="text-xl font-semibold text-gray-900"
                        style={{
                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                        }}
                    >
                        Mensajes
                    </h1>
                </div>
            </div>

            {/* Lista de conversaciones */}
            {!sortedConversations || sortedConversations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 
                            className="text-lg font-semibold text-gray-900 mb-2"
                            style={{
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                            }}
                        >
                            No tienes mensajes
                        </h3>
                        <p 
                            className="text-gray-600"
                            style={{
                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                            }}
                        >
                            Tus conversaciones aparecerán aquí
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {sortedConversations.map((conversation) => {
                        const displayInfo = getConversationDisplayInfo(conversation);
                        const isUnread = conversation.unreadCount > 0;
                        const lastMessage = conversation.lastMessage;
                        const isLastMessageFromMe = lastMessage?.senderId === user?.id;
                        const isPreHire = conversation.conversationType === 'pre-hire';

                        return (
                            <div
                                key={conversation.conversationId}
                                onClick={() => handleOpenChat(conversation)}
                                className={`flex items-center gap-3 px-4 py-3 border-b cursor-pointer transition-colors relative ${
                                    isPreHire 
                                        ? 'border-l-4 border-l-blue-500 hover:bg-blue-50/30' 
                                        : 'border-l-4 border-l-green-500 hover:bg-green-50/30'
                                }`}
                            >
                                {/* Avatar/Imagen del servicio */}
                                <Avatar className={`w-12 h-12 flex-shrink-0 ${isPreHire ? 'ring-2 ring-blue-200' : 'ring-2 ring-green-200'}`}>
                                    <AvatarImage src={displayInfo.image || undefined} alt={displayInfo.title || ''} />
                                    <AvatarFallback className={isPreHire ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                                        {displayInfo.title?.charAt(0).toUpperCase() || conversation.expertName?.charAt(0).toUpperCase() || '?'}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Contenido */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <h3 
                                                className={`font-semibold truncate ${
                                                    isUnread ? 'text-gray-900' : 'text-gray-700'
                                                }`}
                                                style={{
                                                    fontSize: '16px',
                                                    lineHeight: '24px',
                                                    fontWeight: 600,
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                {displayInfo.title || conversation.expertName}
                                            </h3>
                                            {/* Badge de tipo de conversación */}
                                            <Badge 
                                                variant="outline"
                                                className={`flex-shrink-0 text-xs px-2 py-0.5 ${
                                                    isPreHire 
                                                        ? 'border-blue-500 text-blue-700 bg-blue-50' 
                                                        : 'border-green-500 text-green-700 bg-green-50'
                                                }`}
                                                style={{
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                {isPreHire ? (
                                                    <span className="flex items-center gap-1">
                                                        <ShoppingBag className="w-3 h-3" />
                                                        Sin contratar
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Contratado
                                                    </span>
                                                )}
                                            </Badge>
                                        </div>
                                        {lastMessage && (
                                            <span 
                                                className={`text-xs flex-shrink-0 ${
                                                    isUnread ? 'text-gray-900' : 'text-gray-500'
                                                }`}
                                                style={{
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                {formatDate(lastMessage.sentAt)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Nombre del experto */}
                                    <p 
                                        className="text-xs text-gray-500 mb-1"
                                        style={{
                                            fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                        }}
                                    >
                                        {conversation.expertName}
                                    </p>

                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {isLastMessageFromMe && (
                                                <span 
                                                    className="text-sm text-gray-500 flex-shrink-0"
                                                    style={{
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    }}
                                                >
                                                    Tú:
                                                </span>
                                            )}
                                            <p 
                                                className={`text-sm truncate flex-1 ${
                                                    isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
                                                }`}
                                                style={{
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                {lastMessage?.content || 'Sin mensajes'}
                                            </p>
                                        </div>
                                        {isUnread && (
                                            <Badge 
                                                variant="default" 
                                                className="bg-[#E61E4D] text-white flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full"
                                                style={{
                                                    fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                }}
                                            >
                                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Información adicional según el tipo */}
                                    <div className="flex items-center gap-3 mt-1.5">
                                        {isPreHire ? (
                                            <>
                                                {/* Precio para pre-contratación */}
                                                {conversation.servicePrice && (
                                                    <div className="flex items-center gap-1">
                                                        <Package className="w-3.5 h-3.5 text-blue-600" />
                                                        <span 
                                                            className="text-xs font-semibold text-blue-700"
                                                            style={{
                                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                            }}
                                                        >
                                                            {/* 🛡️ Round 28: usar divisa real del servicio en vez de EUR hardcoded */}
                                                            {new Intl.NumberFormat('es-ES', {
                                                                style: 'currency',
                                                                currency: (conversation.serviceCurrency || 'EUR').toUpperCase(),
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 2,
                                                            }).format(conversation.servicePrice)}
                                                        </span>
                                                    </div>
                                                )}
                                                <span 
                                                    className="text-xs text-blue-600 font-medium"
                                                    style={{
                                                        fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                    }}
                                                >
                                                    Pre-contratación
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                {/* Estado de contratación para post-contratación */}
                                                {conversation.hireStatusTranslated && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5 text-green-600" />
                                                        <span 
                                                            className="text-xs font-semibold text-green-700"
                                                            style={{
                                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                            }}
                                                        >
                                                            {conversation.hireStatusTranslated}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Monto de contratación */}
                                                {conversation.hireAmount && (
                                                    <div className="flex items-center gap-1">
                                                        <span 
                                                            className="text-xs font-semibold text-green-700"
                                                            style={{
                                                                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                                                            }}
                                                        >
                                                            {/* 🛡️ Round 28: usar divisa real del hire en vez de EUR hardcoded */}
                                                            {new Intl.NumberFormat('es-ES', {
                                                                style: 'currency',
                                                                currency: (conversation.hireCurrency || 'EUR').toUpperCase(),
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 2,
                                                            }).format(conversation.hireAmount)}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
