// ==========================================
// HELPERS PARA DISTINGUIR TIPOS DE CHAT
// ==========================================

import { ConversationDto } from '../types/chat.types';

/**
 * Verifica si es chat pre-contratación
 * Pre-contratación: searchHireId === null && searchServiceId !== null
 */
export function isPreHireChat(conversation: ConversationDto): boolean {
  return conversation.SearchHireId === null && 
         conversation.SearchServiceId !== null;
}

/**
 * Verifica si es chat post-contratación
 * Post-contratación: searchHireId !== null && searchServiceId === null
 */
export function isPostHireChat(conversation: ConversationDto): boolean {
  return conversation.SearchHireId !== null && 
         conversation.SearchServiceId === null;
}

/**
 * Obtiene el tipo de chat
 */
export function getChatType(conversation: ConversationDto): 'pre-hire' | 'post-hire' | 'unknown' {
  if (isPreHireChat(conversation)) return 'pre-hire';
  if (isPostHireChat(conversation)) return 'post-hire';
  return 'unknown';
}

/**
 * Obtiene el ID para identificar el chat
 * - Pre-contratación: retorna searchServiceId
 * - Post-contratación: retorna searchHireId
 */
export function getChatIdentifier(conversation: ConversationDto): number | null {
  if (isPreHireChat(conversation)) {
    return conversation.SearchServiceId;
  }
  if (isPostHireChat(conversation)) {
    return conversation.SearchHireId;
  }
  return null;
}

/**
 * Objeto con todos los helpers (para uso como namespace)
 */
export const ChatUtils = {
  isPreHireChat,
  isPostHireChat,
  getChatType,
  getChatIdentifier
};
