// ==========================================
// TIPOS DE LA BASE DE DATOS (Supabase)
// ==========================================

/** Mensaje tal como viene de la base de datos */
export interface DBMessage {
  Id: number
  ConversationId: number
  SenderId: number | null
  Content: string | null
  SentAt: string
  IsRead: boolean
  LocationLatitude: string | null
  LocationLongitude: string | null
}

/** Conversación tal como viene de la base de datos */
export interface DBConversation {
  Id: number
  SearchHireId: number | null  // ✅ Ahora nullable (pre-contratación)
  SearchServiceId: number | null  // ✅ NUEVO: Para chat pre-contratación
  ClientId: number | null
  ExpertId: number | null
  IsActive: boolean
  CreatedAt: string
  UpdatedAt: string
}

// ==========================================
// TIPOS DE LA API REST (Backend)
// ==========================================

/** Mensaje tal como viene de la API REST */
export interface MessageDto {
  Id: number
  ConversationId: number
  SenderId: number | null
  Content: string | null
  SentAt: string
  IsRead: boolean
  SenderName: string | null
  LocationLatitude: string | null
  LocationLongitude: string | null
  AttachmentUrls: string[]
}

/** Conversación tal como viene de la API REST */
export interface ConversationDto {
  Id: number
  SearchHireId: number | null  // ✅ Ahora nullable (pre-contratación)
  SearchServiceId: number | null  // ✅ NUEVO: Para chat pre-contratación
  ClientId: number | null
  ExpertId: number | null
  IsActive: boolean
  CreatedAt: string
  UpdatedAt: string
  Messages: MessageDto[]
}

// ==========================================
// TIPOS PARA ENVIAR MENSAJES
// ==========================================

/** DTO para enviar un nuevo mensaje */
export interface SendMessageDto {
  ConversationId: number
  Content?: string
  LocationLatitude?: string
  LocationLongitude?: string
  Attachments?: File[]
}

/** DTO para notificar typing */
export interface TypingNotificationDto {
  ConversationId: number
  IsTyping: boolean
}

// ==========================================
// TIPOS DE EVENTOS REALTIME
// ==========================================

/** Payload del evento typing */
export interface TypingPayload {
  userId: number
  conversationId: number
  isTyping: boolean
  timestamp: string
}

/** Payload del evento de presencia */
export interface PresencePayload {
  userId: number
  conversationId: number
  isOnline: boolean
  timestamp: string
}

/** Payload del evento message_read */
export interface MessageReadPayload {
  messageId: number
  conversationId: number
}

/** Estado de presencia de un usuario */
export interface PresenceState {
  user_id: number
  online_at: string
}

// ==========================================
// TIPOS DE ESTADO DEL COMPONENTE
// ==========================================

/** Estado del chat */
export interface ChatState {
  conversation: ConversationDto | null
  messages: MessageDto[]
  isLoading: boolean
  error: string | null
  typingUsers: number[]
  onlineUsers: number[]
  isConnected: boolean
}

/** Acciones del chat */
export type ChatAction =
  | { type: 'SET_CONVERSATION'; payload: ConversationDto }
  | { type: 'ADD_MESSAGE'; payload: MessageDto }
  | { type: 'UPDATE_MESSAGE'; payload: MessageDto }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TYPING_USERS'; payload: number[] }
  | { type: 'SET_ONLINE_USERS'; payload: number[] }
  | { type: 'SET_CONNECTED'; payload: boolean }

// ==========================================
// TIPOS LEGACY PARA COMPATIBILIDAD
// ==========================================

/** Mensaje en formato legacy (compatible con el Chat.tsx actual) */
export interface LegacyMessage {
  id: number
  conversationId: number
  senderId: number | null
  content: string
  sentAt: string
  isRead: boolean
  sender?: { name: string; $id?: string; $ref?: string }
  senderName: string
  locationLatitude?: string | null
  locationLongitude?: string | null
  attachmentUrls?: string[]
}

/** Conversación en formato legacy (compatible con el Chat.tsx actual) */
export interface LegacyConversation {
  id: number
  searchHireId: number | null  // ✅ Ahora nullable
  searchServiceId: number | null  // ✅ NUEVO
  clientId: number | null
  expertId: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  messages: LegacyMessage[]
  $id?: string
  $ref?: string
}

/** Deliverable type */
export interface Deliverable {
  searchHireId: number
  deliverableUrls: string[]
  createdAt: string
}

// ==========================================
// TIPOS PARA CHAT PRE-CONTRATACIÓN
// ==========================================

/** Resumen de mensaje para listas */
export interface MessageSummaryDto {
  Id: number
  Content: string
  SentAt: string
  SenderId?: number | null
  SenderName: string
  IsRead: boolean
}

/** Resumen de conversación pre-contratación para el experto */
export interface PreHireConversationSummaryDto {
  ConversationId: number
  SearchServiceId: number
  ServiceName: string
  ServicePrice: number
  ServiceImageUrl?: string
  ClientId?: number
  ClientName: string
  ClientProfilePictureUrl?: string
  LastMessage?: MessageSummaryDto
  UnreadCount: number
  CreatedAt: string
  UpdatedAt: string
}

// ==========================================
// HELPERS DE CONVERSIÓN
// ==========================================

/** Convierte un MessageDto a LegacyMessage */
export function toLegacyMessage(dto: MessageDto): LegacyMessage {
  return {
    id: dto.Id,
    conversationId: dto.ConversationId,
    senderId: dto.SenderId,
    content: dto.Content || '',
    sentAt: dto.SentAt,
    isRead: dto.IsRead,
    senderName: dto.SenderName || '[Usuario eliminado]',
    locationLatitude: dto.LocationLatitude,
    locationLongitude: dto.LocationLongitude,
    attachmentUrls: dto.AttachmentUrls || []
  }
}

/** Convierte un ConversationDto a LegacyConversation */
export function toLegacyConversation(dto: ConversationDto): LegacyConversation {
  return {
    id: dto.Id,
    searchHireId: dto.SearchHireId ?? null,
    searchServiceId: dto.SearchServiceId ?? null,  // ✅ NUEVO
    clientId: dto.ClientId,
    expertId: dto.ExpertId,
    isActive: dto.IsActive,
    createdAt: dto.CreatedAt,
    updatedAt: dto.UpdatedAt,
    messages: dto.Messages.map(toLegacyMessage)
  }
}

/** Convierte un LegacyMessage a MessageDto */
export function toMessageDto(legacy: LegacyMessage): MessageDto {
  return {
    Id: legacy.id,
    ConversationId: legacy.conversationId,
    SenderId: legacy.senderId,
    Content: legacy.content,
    SentAt: legacy.sentAt,
    IsRead: legacy.isRead,
    SenderName: legacy.senderName,
    LocationLatitude: legacy.locationLatitude || null,
    LocationLongitude: legacy.locationLongitude || null,
    AttachmentUrls: legacy.attachmentUrls || []
  }
}
