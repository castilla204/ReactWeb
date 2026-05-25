import { SystemStatusDto } from '../types/searchDetails';

/** Valores de SearchHireStatus alineados con el backend (NewApi/DataLayer/Models/enums/SearchHireStatus.cs) */
export const SEARCH_HIRE_STATUS = {
  PENDING: 'pending',
  AWAITING_CLIENT_DECISION: 'awaiting_client_decision',
  DISPUTED: 'disputed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  TRANSFER_FAILED: 'transfer_failed',
  DISPUTE_RESOLVED_CLIENT: 'dispute_resolved_client',
  DISPUTE_RESOLVED_EXPERT: 'dispute_resolved_expert',
  CANCELLED_BY_CLIENT_ACCOUNT_DELETE: 'cancelled_by_client_account_delete',
  CANCELLED_BY_EXPERT_ACCOUNT_DELETE: 'cancelled_by_expert_account_delete',
} as const;

export type SearchHireStatusValue =
  (typeof SEARCH_HIRE_STATUS)[keyof typeof SEARCH_HIRE_STATUS];

export const TERMINAL_SEARCH_HIRE_STATUSES: readonly SearchHireStatusValue[] = [
  SEARCH_HIRE_STATUS.COMPLETED,
  SEARCH_HIRE_STATUS.CANCELLED,
  SEARCH_HIRE_STATUS.TRANSFER_FAILED,
  SEARCH_HIRE_STATUS.DISPUTE_RESOLVED_CLIENT,
  SEARCH_HIRE_STATUS.DISPUTE_RESOLVED_EXPERT,
  SEARCH_HIRE_STATUS.CANCELLED_BY_CLIENT_ACCOUNT_DELETE,
  SEARCH_HIRE_STATUS.CANCELLED_BY_EXPERT_ACCOUNT_DELETE,
];

export const DISPUTE_RESOLVED_STATUSES: readonly SearchHireStatusValue[] = [
  SEARCH_HIRE_STATUS.DISPUTE_RESOLVED_CLIENT,
  SEARCH_HIRE_STATUS.DISPUTE_RESOLVED_EXPERT,
];

export const REVIEWABLE_SEARCH_HIRE_STATUSES: readonly SearchHireStatusValue[] = [
  SEARCH_HIRE_STATUS.COMPLETED,
  ...DISPUTE_RESOLVED_STATUSES,
];

/** Estados SearchHire válidos para proponer cita cuando aún no hay appointment */
export const PROPOSE_APPOINTMENT_HIRE_STATUSES: readonly SearchHireStatusValue[] = [
  SEARCH_HIRE_STATUS.PENDING,
  SEARCH_HIRE_STATUS.AWAITING_CLIENT_DECISION,
];

export function getHireStatusValue(item?: {
  status?: string;
  statusInfo?: SystemStatusDto | null;
} | null): string {
  if (!item) return '';
  return item.statusInfo?.statusValue || item.status || '';
}

export function isDisputeResolvedStatus(status: string): boolean {
  return (DISPUTE_RESOLVED_STATUSES as readonly string[]).includes(status);
}

export function isTerminalSearchHireStatus(
  status: string,
  statusInfo?: SystemStatusDto | null
): boolean {
  if (statusInfo?.isFinalizationStatus === true) return true;
  return (TERMINAL_SEARCH_HIRE_STATUSES as readonly string[]).includes(status);
}

export function isActiveSearchHireStatus(
  status: string,
  statusInfo?: SystemStatusDto | null
): boolean {
  return !isTerminalSearchHireStatus(status, statusInfo);
}

export function canLeaveReview(status: string): boolean {
  return (REVIEWABLE_SEARCH_HIRE_STATUSES as readonly string[]).includes(status);
}

export function canProposeAppointment(status: string, isFinalized: boolean): boolean {
  if (isFinalized || !status) return !isFinalized;
  return (PROPOSE_APPOINTMENT_HIRE_STATUSES as readonly string[]).includes(status);
}
