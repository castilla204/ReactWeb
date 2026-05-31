/** Helpers para respuestas API en PascalCase (.NET PropertyNamingPolicy = null). */

export function pick<T>(obj: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  const v = obj[camel] ?? obj[pascal];
  return v as T | undefined;
}

export function normalizeIdNameItem(item: Record<string, unknown>): { id: number; name: string } {
  return {
    id: Number(pick(item, 'id', 'Id') ?? 0),
    name: String(pick(item, 'name', 'Name') ?? ''),
  };
}

export function normalizeIdNameList(raw: unknown): { id: number; name: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizeIdNameItem(item as Record<string, unknown>));
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  phoneVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  searchCount: number;
  subscriptionPlan: string;
}

export function normalizeUser(u: Record<string, unknown>): AdminUser {
  return {
    id: Number(pick(u, 'id', 'Id') ?? 0),
    name: String(pick(u, 'name', 'Name') ?? ''),
    email: String(pick(u, 'email', 'Email') ?? ''),
    phoneNumber: (pick<string | null>(u, 'phoneNumber', 'PhoneNumber') ?? null) as string | null,
    phoneVerified: Boolean(pick(u, 'phoneVerified', 'PhoneVerified') ?? false),
    isBlocked: Boolean(pick(u, 'isBlocked', 'IsBlocked') ?? false),
    createdAt: String(pick(u, 'createdAt', 'CreatedAt') ?? ''),
    searchCount: Number(pick(u, 'searchCount', 'SearchCount') ?? 0),
    subscriptionPlan: String(pick(u, 'subscriptionPlan', 'SubscriptionPlan') ?? '—'),
  };
}

export interface NormalizedPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function normalizePagination(
  p: Record<string, unknown> | null | undefined,
  fallbackPageSize: number
): NormalizedPagination {
  if (!p) {
    return {
      page: 1,
      pageSize: fallbackPageSize,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }
  return {
    page: Number(pick(p, 'page', 'Page') ?? 1),
    pageSize: Number(pick(p, 'pageSize', 'PageSize') ?? fallbackPageSize),
    totalCount: Number(pick(p, 'totalCount', 'TotalCount') ?? 0),
    totalPages: Number(pick(p, 'totalPages', 'TotalPages') ?? 0),
    hasNextPage: Boolean(pick(p, 'hasNextPage', 'HasNextPage') ?? false),
    hasPreviousPage: Boolean(pick(p, 'hasPreviousPage', 'HasPreviousPage') ?? false),
  };
}

export function normalizePaginatedUsersResponse(
  response: Record<string, unknown>,
  fallbackPageSize: number
): { users: AdminUser[]; pagination: NormalizedPagination } {
  const usersRaw = (response.users ?? response.Users ?? []) as unknown[];
  const paginationRaw = (response.pagination ?? response.Pagination) as Record<string, unknown> | undefined;
  return {
    users: Array.isArray(usersRaw)
      ? usersRaw.map((u) => normalizeUser(u as Record<string, unknown>))
      : [],
    pagination: normalizePagination(paginationRaw, fallbackPageSize),
  };
}
