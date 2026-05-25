import type {
  ConversationDto,
  MessageDto,
  SendMessageDto,
  TypingNotificationDto,
  LegacyConversation,
  LegacyMessage,
  toLegacyConversation,
  toLegacyMessage
} from '../types/chat.types'
import { API_CONFIG } from '../config/api'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

const API_URL = API_CONFIG.baseUrl
const CHAT_REQUEST_TIMEOUT_MS = 30000

const chatFetch = (url: string, options: RequestInit = {}) =>
  fetchWithTimeout(url, options, CHAT_REQUEST_TIMEOUT_MS)

/** Headers con autenticación */
const getAuthHeaders = (token: string): HeadersInit => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
})

/** Manejo de errores de la API */
const handleApiError = async (response: Response): Promise<never> => {
  let errorMessage = `Error ${response.status}: ${response.statusText}`
  
  try {
    const errorData = await response.json()
    errorMessage = errorData.message || errorMessage
  } catch {
    // Si no puede parsear JSON, usar mensaje por defecto
  }
  
  throw new Error(errorMessage)
}

// ==========================================
// CONVERSACIONES
// ==========================================

/**
 * Obtener o crear una conversación por SearchId
 */
export const getConversation = async (
  searchId: number,
  token: string
): Promise<ConversationDto> => {
  const response = await chatFetch(
    `${API_URL}${API_CONFIG.endpoints.chat.conversation}?searchId=${searchId}`,
    {
      method: 'GET',
      headers: getAuthHeaders(token)
    }
  )

  if (!response.ok) {
    await handleApiError(response)
  }

  return response.json()
}

/**
 * Obtener conversación por SearchHireId
 * Útil cuando el Search fue eliminado pero el SearchHire existe
 */
export const getConversationBySearchHireId = async (
  searchHireId: number,
  token: string
): Promise<ConversationDto> => {
  const response = await chatFetch(
    `${API_URL}${API_CONFIG.endpoints.chat.conversationBySearchHire(searchHireId)}`,
    {
      method: 'GET',
      headers: getAuthHeaders(token)
    }
  )

  if (!response.ok) {
    await handleApiError(response)
  }

  return response.json()
}

/**
 * Obtener conversación en formato legacy (compatible con el código actual)
 */
export const getConversationLegacy = async (
  searchId: number,
  token: string
): Promise<LegacyConversation> => {
  const dto = await getConversation(searchId, token)
  return toLegacyConversation(dto)
}

/**
 * Obtener conversación por SearchHireId en formato legacy
 */
export const getConversationBySearchHireIdLegacy = async (
  searchHireId: number,
  token: string
): Promise<LegacyConversation> => {
  const dto = await getConversationBySearchHireId(searchHireId, token)
  return toLegacyConversation(dto)
}

// ==========================================
// MENSAJES
// ==========================================

/**
 * Enviar un mensaje de texto
 */
export const sendMessage = async (
  dto: SendMessageDto,
  token: string
): Promise<MessageDto> => {
  const formData = new FormData()
  formData.append('ConversationId', dto.ConversationId.toString())
  
  if (dto.Content) {
    formData.append('Content', dto.Content)
  }
  
  if (dto.LocationLatitude) {
    formData.append('LocationLatitude', dto.LocationLatitude)
  }
  
  if (dto.LocationLongitude) {
    formData.append('LocationLongitude', dto.LocationLongitude)
  }
  
  if (dto.Attachments) {
    dto.Attachments.forEach((file) => {
      formData.append('Attachments', file)
    })
  }

  const response = await chatFetch(`${API_URL}${API_CONFIG.endpoints.chat.message}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // NO incluir Content-Type para FormData, el browser lo añade automáticamente
    },
    body: formData
  })

  if (!response.ok) {
    await handleApiError(response)
  }

  return response.json()
}

/**
 * Enviar mensaje y devolver en formato legacy
 */
export const sendMessageLegacy = async (
  dto: SendMessageDto,
  token: string
): Promise<LegacyMessage> => {
  const messageDto = await sendMessage(dto, token)
  return toLegacyMessage(messageDto)
}

/**
 * Marcar un mensaje como leído
 */
export const markMessageAsRead = async (
  messageId: number,
  token: string
): Promise<void> => {
  const response = await chatFetch(
    `${API_URL}${API_CONFIG.endpoints.chat.markAsRead(messageId)}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(token)
    }
  )

  if (!response.ok) {
    await handleApiError(response)
  }
}

// ==========================================
// TYPING INDICATOR
// ==========================================

/**
 * Notificar que el usuario está escribiendo
 */
export const notifyTyping = async (
  dto: TypingNotificationDto,
  token: string
): Promise<void> => {
  try {
    const response = await chatFetch(`${API_URL}/api/Chat/typing`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(dto)
    })

    if (!response.ok) {
      // No lanzar error para typing, solo loggear
      console.warn('Failed to send typing notification')
    }
  } catch (error) {
    console.warn('Failed to send typing notification:', error)
  }
}

// ==========================================
// ENTREGABLES
// ==========================================

/**
 * Subir un entregable (solo expertos)
 */
export const uploadDeliverable = async (
  searchHireId: number,
  files: File[],
  token: string
): Promise<{ message: string; deliverable: any }> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('Files', file)
  })

  const response = await chatFetch(
    `${API_URL}${API_CONFIG.endpoints.chat.deliverable(searchHireId)}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  )

  if (!response.ok) {
    await handleApiError(response)
  }

  return response.json()
}

/**
 * Obtener entregables de un SearchHire
 */
export const getDeliverables = async (
  searchHireId: number,
  token: string
): Promise<{ message: string; deliverable: any }> => {
  const response = await chatFetch(
    `${API_URL}${API_CONFIG.endpoints.chat.deliverable(searchHireId)}`,
    {
      method: 'GET',
      headers: getAuthHeaders(token)
    }
  )

  if (!response.ok) {
    await handleApiError(response)
  }

  return response.json()
}
