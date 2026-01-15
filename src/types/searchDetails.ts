// ✅ NUEVOS TIPOS PARA OPTIMIZACIÓN DE SEARCHDETAILS

import { SearchItem } from '../hooks/useSearch.hooks';
import { Appointment } from './appointment';

// ✅ NUEVA INTERFAZ PARA INFORMACIÓN DE ESTADOS (ACTUALIZADA)
export interface SystemStatusDto {
  id: number;
  statusType: string;                  // "SearchHireStatus", "AppointmentStatus"
  statusName: string;                  // "Dispute Resolved Client"
  statusValue: string;                 // "dispute_resolved_client"
  displayName: string;                 // "Disputa Resuelta (Cliente)"
  description: string | null;          // "La disputa ha sido resuelta a favor del cliente"
  color: string | null;                // "#17A2B8"
  isActive: boolean;
  isFinalizationStatus: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

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
  // ✅ NUEVOS CAMPOS DE PAÍS Y TIMEZONE
  expertTimezone: string | null; // Timezone del experto al momento de contratar
  expertCountry: string | null; // ✅ NUEVO: País del experto al momento de contratar (ISO 3166-1 alpha-2)
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

// ✅ TIPO PARA DELIVERABLE TYPE (del backend)
export interface DeliverableTypeDto {
  id: number;                    // ID único del tipo de reporte
  name: string;                  // Nombre técnico (ej: "PDF", "Video")
  displayName: string;           // Nombre para mostrar (ej: "Informe PDF", "Video de Inspección")
  description?: string;          // Descripción opcional del tipo de reporte
  isRequired: boolean;          // Si este tipo de reporte es obligatorio
  isActive: boolean;             // Si el tipo está activo
  sortOrder: number;             // Orden de visualización (ya viene ordenado)
}

// ✅ DTO PRINCIPAL - Datos esenciales (ACTUALIZADO CON NUEVA ESTRUCTURA)
export interface SearchDetailsCompleteDto {
  search: SearchListDto | null; // ✅ Nullable: puede ser null si el cliente borró su cuenta
  moneyDistribution: MoneyDistributionConfigDto | null;
  category: CategoryDto | null;
  review: ReviewDto | null;
  appointment: AppointmentDto | null;
  deliverables: DeliverableDto[];
  disputes: DisputeDto[];
  requiredDeliverableTypes: DeliverableTypeDto[]; // ✅ NUEVO: Tipos de reportes requeridos para el servicio
  expertProfile: ExpertProfileDto | null; // ✅ NUEVO: Perfil completo del experto con disponibilidad
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
  statusInfo?: SystemStatusDto;  // ✅ ACTUALIZADO: Usar SystemStatusDto
  createdAt: string;
  expert: UserDto | null;
  client: UserDto | null;  // ✅ NUEVO: Cliente de la contratación
  service: ServiceInfo | null;
  // ✅ NUEVOS CAMPOS DE PAÍS Y TIMEZONE
  expertTimezone: string | null; // Timezone del experto al momento de contratar
  expertCountry: string | null; // ✅ NUEVO: País del experto al momento de contratar (ISO 3166-1 alpha-2)
  // ✅ NUEVOS CAMPOS DE STRIPE TAX
  /**
   * Monto total pagado (con IVA incluido).
   * Este es el precio final que pagó el cliente.
   * Ejemplo: €110 (incluye 21% IVA = €19.09)
   */
  amount?: number;
  /**
   * Base amount sin IVA/tax (pre-tax).
   * Se calcula desde Stripe Tax breakdown.
   * Si es null, significa que es un dato antiguo o no hay tax calculado.
   * En ese caso, usar Amount como fallback.
   * Ejemplo: €90.91 (base sin IVA)
   */
  baseAmount?: number;
  /**
   * Monto de IVA/tax calculado por Stripe Tax.
   * Si es null o 0, no hay tax aplicado.
   * Ejemplo: €19.09 (IVA del 21%)
   */
  taxAmount?: number;
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
  statusInfo?: SystemStatusDto;  // ✅ ACTUALIZADO: Usar SystemStatusDto
  
  // ═══════════════════════════════════════════════════════════════
  // ✅ CAMPOS DE FECHA (Internacionalización) - Pueden ser null si no se ha propuesto
  // ═══════════════════════════════════════════════════════════════
  // Fechas en UTC (para cálculos, comparaciones, ordenamiento)
  proposedDate: string | null;          // UTC (guardada en BD) - null si no se ha propuesto
  proposedTime: string | null;           // UTC (guardada en BD) - null si no se ha propuesto
  
  // ✅ NUEVOS: Fechas en hora local del experto
  proposedDateLocal?: string | null;    // Fecha propuesta en hora local
  proposedTimeLocal?: string | null;     // Hora propuesta en hora local
  
  // ✅ NUEVOS: Fechas UTC adicionales (si vienen del backend)
  proposedDateUtc?: string | null;      // Fecha UTC explícita
  proposedTimeUtc?: string | null;      // Hora UTC explícita
  
  // ✅ NUEVOS: Información de internacionalización
  timezone?: string;              // Timezone IANA (ej: "Europe/Madrid", "America/Mexico_City")
  country?: string;              // País ISO 3166-1 alpha-2 (ej: "ES", "MX")
  
  location: string | null;
  latitude: number | string | null;  // Puede venir como string del backend
  longitude: number | string | null; // Puede venir como string del backend
  doorNumber: string | null;
  ownerPhone: string | null;
  siteDetails: string | null;
  rejectionCount: number;
  cancellationCount: number;
  clientCancellationCount: number;
  expertCancellationCount: number;
  lastRejectionAt: string | null;
  lastProposalAt: string | null;
  lastResponseAt: string | null;
  lastClientCancellationAt: string | null;
  lastExpertCancellationAt: string | null;
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
  expertProfile: ExpertProfileDto | undefined; // ✅ NUEVO: Perfil del experto con disponibilidad
  
  // Datos adicionales
  conversations: ConversationDto[];
  appointment: AppointmentDto | undefined;
  deliverables: DeliverableDto[];
  requiredDeliverableTypes: DeliverableTypeDto[]; // ✅ NUEVO: Tipos de reportes requeridos
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

// ✅ NUEVOS TIPOS PARA DISPONIBILIDAD DEL EXPERTO
export interface CurrentExpertAvailabilityDto {
  id: number;
  daysOfWeek: string[]; // Ej: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  startTime: string; // Formato: "HH:mm:ss" (ej: "09:00:00")
  endTime: string; // Formato: "HH:mm:ss" (ej: "18:00:00")
  effectiveFrom: string; // ISO 8601 date (ej: "2025-01-15T00:00:00Z")
}

export interface ExpertProfileDto {
  city?: string | null; // ✅ NUEVO: Ciudad del experto
  id: number;
  profilePictureUrl: string;
  description: string;
  stripeAccountId: string | null;
  createdAt: string;
  user: UserDto | null;
  reviews: ReviewDto[];
  latitude: string;
  longitude: string;
  stripeStatus: number;
  stripeStatusDetails: string | null;
  onboardingCompleted: boolean;
  isOnVacation: boolean;
  currentAvailability: CurrentExpertAvailabilityDto | null; // ✅ NUEVO CAMPO
  timezone: string; // "Europe/Madrid", "America/Mexico_City", etc.
  country: string | null; // ✅ NUEVO: Código ISO 3166-1 alpha-2 (ej: "ES", "US", "MX")
}
