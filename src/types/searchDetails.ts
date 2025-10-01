// ✅ NUEVOS TIPOS PARA OPTIMIZACIÓN DE SEARCHDETAILS

import { SearchItem } from '../hooks/useSearch.hooks';
import { Appointment } from './appointment';

// DTOs existentes que se reutilizan
export interface UserDto {
  id: number;
  name: string;
  email: string;
  profilePictureUrl?: string;
}

export interface ServiceInfo {
  id: number;
  serviceTypeId: number;
  serviceTypeName: string;
  serviceTypeCategoryId: number;
  serviceTypeCategoryName: string;
  requiresAppointment: boolean;
  price: number;
}

export interface MoneyDistributionConfigDto {
  clientPercentage: number;
  expertPercentage: number;
  platformPercentage: number;
  searchHireId?: number;
  categoryId?: number;
  serviceTypeCategoryId?: number;
}

export interface DeliverableDto {
  id: number;
  url: string;
  type: string;
  fileName: string;
  uploadedAt: string;
  searchHireId: number;
}

export interface MessageDto {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  isRead: boolean;
}

export interface ConversationDto {
  id: number;
  searchId: number;
  searchHireId: number;
  messages: MessageDto[];
  unreadCount: number;
  lastMessageAt: string;
}

export interface DisputeDto {
  id: number;
  status: string;
  reason: string;
  searchHireId: number;
  createdAt: string;
  resolvedAt?: string;
  expertResponse?: string;
  resolutionComments?: string;
  files?: string[];
  expertResponseFiles?: string[];
  expertResponseAt?: string;
  client?: UserDto;
  expert?: UserDto;
  searchHire?: any; // Added for compatibility
}

// ✅ DTO PRINCIPAL - Datos esenciales
export interface SearchDetailsCompleteDto {
  search: SearchItem;
  moneyDistribution?: MoneyDistributionConfigDto;
}

// ✅ DTO ADICIONAL - Datos opcionales
export interface SearchDetailsAdditionalDto {
  conversations: ConversationDto[];
  appointment?: Appointment;
  deliverables: DeliverableDto[];
  disputes: DisputeDto[];
}

// ✅ DTO UNIFICADO - Todo junto
export interface SearchDetailsOptimizedDto {
  // Datos principales
  search: SearchItem;
  moneyDistribution?: MoneyDistributionConfigDto;
  
  // Datos adicionales
  conversations: ConversationDto[];
  appointment?: Appointment;
  deliverables: DeliverableDto[];
  disputes: DisputeDto[];
}

// ✅ TIPOS PARA HOOKS
export interface UseSearchDetailsCompleteReturn {
  data: SearchDetailsCompleteDto | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseSearchDetailsAdditionalReturn {
  data: SearchDetailsAdditionalDto | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseSearchDetailsOptimizedReturn {
  // Datos principales
  search: SearchItem | undefined;
  moneyDistribution: MoneyDistributionConfigDto | undefined;
  
  // Datos adicionales
  conversations: ConversationDto[];
  appointment: Appointment | undefined;
  deliverables: DeliverableDto[];
  disputes: DisputeDto[];
  
  // Estados de carga
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Funciones de invalidación
  invalidateAll: () => void;
  refetch: () => void;
}

// ✅ OPCIONES PARA HOOKS
export interface UseSearchDetailsOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number; // Antes cacheTime
  refetchOnWindowFocus?: boolean;
}
