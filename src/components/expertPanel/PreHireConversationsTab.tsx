import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Clock, User, Package, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { API_CONFIG } from '../../config/api';
import { getAuthToken } from '../../lib/auth';
import { PreHireConversationSummaryDto } from '../../types/chat.types';
import { Loader2 } from 'lucide-react';
import { formatPriceNumber, formatCurrency } from '../../utils/priceUtils';

interface PreHireConversationsTabProps {
  token: string;
  userId: number;
}

export function PreHireConversationsTab({ token, userId }: PreHireConversationsTabProps) {
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

  // Obtener conversaciones pre-contratación
  const { data: conversations, isLoading, isError, error, refetch, isFetched } = useQuery<PreHireConversationSummaryDto[]>({
    queryKey: ['expert-pre-hire-conversations', userId],
    queryFn: async () => {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.chat.preHireConversations}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No hay conversaciones, retornar array vacío
          return [];
        }
        const errorText = await response.text();
        throw new Error(`Error al obtener conversaciones: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Convertir de PascalCase a camelCase si es necesario
      return (data || []).map((conv: any) => ({
        ConversationId: conv.ConversationId || conv.conversationId,
        SearchServiceId: conv.SearchServiceId || conv.searchServiceId,
        ServiceName: conv.ServiceName || conv.serviceName,
        ServicePrice: conv.ServicePrice ?? conv.servicePrice ?? 0,
        ServiceImageUrl: conv.ServiceImageUrl || conv.serviceImageUrl,
        ClientId: conv.ClientId ?? conv.clientId,
        ClientName: conv.ClientName || conv.clientName || '[Cliente]',
        ClientProfilePictureUrl: conv.ClientProfilePictureUrl || conv.clientProfilePictureUrl,
        LastMessage: conv.LastMessage || conv.lastMessage ? {
          Id: (conv.LastMessage || conv.lastMessage).Id || (conv.LastMessage || conv.lastMessage).id,
          Content: (conv.LastMessage || conv.lastMessage).Content || (conv.LastMessage || conv.lastMessage).content || '',
          SentAt: (conv.LastMessage || conv.lastMessage).SentAt || (conv.LastMessage || conv.lastMessage).sentAt,
          SenderId: (conv.LastMessage || conv.lastMessage).SenderId ?? (conv.LastMessage || conv.lastMessage).senderId ?? null,
          SenderName: (conv.LastMessage || conv.lastMessage).SenderName || (conv.LastMessage || conv.lastMessage).senderName || '[Usuario]',
          IsRead: (conv.LastMessage || conv.lastMessage).IsRead ?? (conv.LastMessage || conv.lastMessage).isRead ?? false,
        } : undefined,
        UnreadCount: conv.UnreadCount ?? conv.unreadCount ?? 0,
        CreatedAt: conv.CreatedAt || conv.createdAt,
        UpdatedAt: conv.UpdatedAt || conv.updatedAt,
      }));
    },
    enabled: !!token && !!userId,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    retry: 2
  });

  // 🛡️ Round 10 — P-B FIX: delegado a helper central NaN-safe (formatPriceNumber).
  // Antes: inline con minFractionDigits=0 inconsistente con resto de la app (siempre usa 2).
  const formatPrice = (price: number) => formatPriceNumber(price);

  // 🛡️ Round 28 CUR-9: este componente vive en el PANEL DEL EXPERTO. Antes asumía
  // EUR hardcoded como source y convertía a preferredCurrency del usuario → doblemente
  // roto para un experto US (servicio USD interpretado como EUR y convertido a USD del
  // experto). Regla nueva: en panel experto NUNCA convertimos — mostramos divisa real
  // del servicio. Si el DTO de la conversación no trae la divisa, fallback a EUR.
  const renderServicePrice = (price: number, conv?: any) => {
    const code = (conv?.ServiceCurrency || conv?.serviceCurrency
      || conv?.PriceCurrency || conv?.priceCurrency || 'EUR')
      .toString().trim().toUpperCase();
    return formatCurrency(price, code);
  };

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

  const handleOpenChat = (conversationId: number, searchServiceId: number) => {
    navigate(`/chat-pre-contratacion/${searchServiceId}?conversationId=${conversationId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Cargando conversaciones...</span>
      </div>
    );
  }

  if (isError && !conversations?.length) {
    return (
      <Card className="m-4">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error al cargar las conversaciones</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!token || !userId) {
    return (
      <Card className="m-4">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>Inicia sesión para ver tus conversaciones previas a la contratación.</p>
        </CardContent>
      </Card>
    );
  }

  if (isFetched && (!conversations || conversations.length === 0)) {
    return (
      <Card className="m-4">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes conversaciones previas
            </h3>
            <p className="text-gray-600">
              Los clientes pueden iniciar conversaciones contigo antes de contratar tu servicio.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Mensajes sin contratación
        </h2>
        <p className="text-gray-600">
          Conversaciones iniciadas por clientes antes de contratar tu servicio
        </p>
      </div>

      <div className="space-y-3">
        {conversations.map((conv) => (
          <Card
            key={conv.ConversationId}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedConversation === conv.ConversationId ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleOpenChat(conv.ConversationId, conv.SearchServiceId)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Avatar del cliente */}
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={conv.ClientProfilePictureUrl} alt={conv.ClientName} />
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    {conv.ClientName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Información principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conv.ClientName}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {conv.ServiceName}
                      </p>
                    </div>
                    
                    {/* Badge de no leídos */}
                    {conv.UnreadCount > 0 && (
                      <Badge variant="destructive" className="flex-shrink-0">
                        {conv.UnreadCount}
                      </Badge>
                    )}
                  </div>

                  {/* Último mensaje */}
                  {conv.LastMessage && (
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-gray-700 truncate flex-1">
                        {conv.LastMessage.Content}
                      </p>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDate(conv.LastMessage.SentAt)}
                      </span>
                    </div>
                  )}

                  {/* Precio del servicio */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {renderServicePrice(conv.ServicePrice, conv)}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenChat(conv.ConversationId, conv.SearchServiceId);
                      }}
                    >
                      Abrir chat
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
