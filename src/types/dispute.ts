// Interfaces para el sistema de disputas

export interface CreateDisputeDto {
  searchHireId: number;
  reason: string;
  files?: File[];
}

export interface UserDto {
  id: number;
  email: string;
  name: string;
  profilePictureUrl?: string;
}

export interface SearchHireInfoDto {
  id: number;
  status: string;
  statusTranslated: string;
  /**
   * Monto total pagado (con IVA incluido).
   * Este es el precio final que pagó el cliente.
   */
  amount: number;
  /**
   * Base amount sin IVA/tax (pre-tax).
   * Si es null, usar Amount como fallback (datos antiguos).
   */
  baseAmount?: number;
  /**
   * Monto de IVA/tax calculado por Stripe Tax.
   * Si es null o 0, no hay tax aplicado.
   */
  taxAmount?: number;
  createdAt: string;
}

export interface SearchInfoDto {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

export interface DisputeDto {
  id: number;
  searchHireId: number;
  reporterId: number;
  reason: string;
  status: string;
  statusTranslated: string;  // ⭐ USAR ESTE en lugar de status
  resolutionComments: string | null;  // ⚠️ PUEDE SER NULL
  createdAt: string;
  searchHire: SearchHireInfoDto;
  reporter: UserDto;
  client: UserDto | null;  // ⚠️ PUEDE SER NULL (usuario eliminado)
  expert: UserDto | null;  // ⚠️ PUEDE SER NULL
  search: SearchInfoDto;
  
  // Nuevos campos del sistema bidireccional
  expertResponse: string | null;  // ⚠️ PUEDE SER NULL
  expertResponseDeadline: string | null;  // ⚠️ PUEDE SER NULL
  expertResponseAt: string | null;  // ⚠️ PUEDE SER NULL
  canExpertRespond: boolean;
  files: DisputeFileDto[];  // ⚠️ PUEDE ESTAR VACÍO []
  expertResponseFiles?: DisputeFileDto[];
}

export interface DisputeFileDto {
  id: number;
  fileName: string;
  fileType: string;  // Extensión (ej: "pdf", "jpg")
  fileSize: number;
  createdAt: string;  // ISO 8601 DateTime
  filePath: string;  // URL del archivo (signed URL)
  fileUrl: string;  // ⭐ Igual que filePath
  uploadedByUserId: number;
  uploadedByUserName: string;
  uploadedByUserEmail: string;
  fileCategory: string;  // "client" | "expert"
  fileCategoryLabel: string;  // ⭐ USAR ESTE: "Archivo del Cliente" | "Archivo del Experto"
  // Campos legacy para compatibilidad
  uploadedAt?: string;
  uploadedBy?: 'client' | 'expert';
}

export interface DisputeStats {
  pendingDisputes: number;
  resolvedDisputes: number;
  clientDisputes: number;
  expertDisputes: number;
  thisWeekDisputes: number;
  thisMonthDisputes: number;
}

export interface DisputeListResponseDto {
  disputes: DisputeDto[];
  pagination: PaginationMetadata;
  stats: DisputeStats;
}

export interface PaginationMetadata {
  currentPage: number;
  pageSize: number;
  totalCount: number;  // ⭐ Según la guía: totalCount (no totalItems)
  totalPages: number;
  hasNext: boolean;  // ⭐ Según la guía: hasNext (no hasNextPage)
  hasPrevious: boolean;  // ⭐ Según la guía: hasPrevious (no hasPreviousPage)
  // Campos legacy para compatibilidad
  totalItems?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ResolveDisputeDto {
  resolutionComments: string;
  action: 'refund_client' | 'pay_expert';
}

export interface DisputeFilters {
  searchHireId?: number;
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: 'Pending' | 'Resolved';
  reporterId?: number;
  clientId?: number;
  expertId?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// ⚠️ DUPLICADO ELIMINADO - Usar la definición anterior con pagination y stats

export interface CreateDisputeResponse {
  message: string;
  disputeId: number;
}

export interface ResolveDisputeResponse {
  message: string;
}

