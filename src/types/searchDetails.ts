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
  // ✅ NUEVOS CAMPOS DEL BACKEND
  expertLatitude: number | null;
  expertLongitude: number | null;
  locationRange: number | null;
}

export interface MoneyDistributionConfigDto {
  clientPercentage: number;
  expertPercentage: number;
  platformPercentage: number;
  source: string;
  status: string;
}

export interface DeliverableDto {
  id: number;
  type: string;                    // "pdf", "image", etc.
  url: string;                     // URL del archivo
  createdAt: string;
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
  searchHireId: number;
  reporterId: number;
  status: string;
  reason: string;
  expertResponse: string | null;
  createdAt: string;
}

// ✅ DTO PRINCIPAL - Datos esenciales (ACTUALIZADO CON NUEVA ESTRUCTURA)
export interface SearchDetailsCompleteDto {
  search: SearchListDto;
  moneyDistribution: MoneyDistributionConfigDto | null;
  category: CategoryDto | null;
  review: ReviewDto | null;
  appointment: AppointmentDto | null;
  deliverables: DeliverableDto[];
  disputes: DisputeDto[];
}

// ✅ NUEVOS DTOs SEGÚN BACKEND ACTUALIZADO
export interface SearchListDto {
  id: number;
  userId: number;
  title: string;
  description: string;
  frequency: string;
  isActive: boolean;
  isRevised: boolean;
  createdAt: string;
  user: UserDto;
  searchHire: SearchHireDto | null;
}

export interface SearchHireDto {
  id: number;
  status: string;
  createdAt: string;
  expert: UserDto | null;
  service: ServiceInfo | null;
}

export interface CategoryDto {
  id: number;
  name: string;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDto {
  id: number;
  score: number;
  description: string;
  createdAt: string;
  reviewer: UserDto;
  imageUrls: string[];
}

export interface AppointmentDto {
  id: number;
  searchHireId: number;
  status: string;
  proposedDate: string;
  proposedTime: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  doorNumber: string | null;
  ownerPhone: string | null;
  siteDetails: string | null;
  disputeReason: string | null;
  completedAt: string | null;
  completedBy: number | null;
  rejectionCount: number;
  cancellationCount: number;
  lastRejectionAt: string | null;
  lastProposalAt: string | null;
  lastResponseAt: string | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  clientName: string | null;
  expertName: string | null;
  amount: number;
  timers: AppointmentTimerDto[];
  // ✅ NUEVOS CAMPOS DEL BACKEND
  expertLatitude: number | null;
  expertLongitude: number | null;
  locationRange: number | null;
}

export interface AppointmentTimerDto {
  id: number;
  appointmentId: number;
  timerType: string;
  startTime: string;
  endTime: string | null;
  isExpired: boolean;
  expiredAt: string | null;
}

// ✅ DTO ADICIONAL - Datos opcionales (OBSOLETO - TODO INCLUIDO EN details-complete)
// export interface SearchDetailsAdditionalDto {
//   conversations: ConversationDto[];
//   appointment?: Appointment;
//   deliverables: DeliverableDto[];
//   disputes: DisputeDto[];
// }

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

// ✅ TIPO OBSOLETO - UseSearchDetailsAdditionalReturn eliminado
// export interface UseSearchDetailsAdditionalReturn {
//   data: SearchDetailsAdditionalDto | undefined;
//   isLoading: boolean;
//   isError: boolean;
//   error: Error | null;
//   refetch: () => void;
// }

export interface UseSearchDetailsOptimizedReturn {
  // Datos principales
  search: SearchListDto | undefined;
  moneyDistribution: MoneyDistributionConfigDto | undefined;
  category: CategoryDto | undefined; // ✅ NUEVO: Categoría incluida
  review: ReviewDto | undefined; // ✅ NUEVO: Review incluida
  
  // Datos adicionales
  conversations: ConversationDto[];
  appointment: AppointmentDto | undefined;
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
