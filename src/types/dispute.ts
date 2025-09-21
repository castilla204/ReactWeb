// Interfaces para el sistema de disputas

export interface CreateDisputeDto {
  searchHireId: number;
  reason: string;
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
  amount: number;
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
  statusTranslated: string;
  resolutionComments?: string;
  createdAt: string;
  searchHire: SearchHireInfoDto;
  reporter: UserDto;
  client: UserDto;
  expert?: UserDto;
  search: SearchInfoDto;
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
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ResolveDisputeDto {
  resolutionComments: string;
  action: 'refund_client' | 'pay_expert' | 'no_action';
}

export interface DisputeFilters {
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

export interface CreateDisputeResponse {
  message: string;
  disputeId: number;
}

export interface ResolveDisputeResponse {
  message: string;
}
