export interface AccountDeletionStatus {
  canDeleteImmediately: boolean;
  hasActiveContracts: boolean;
  activeContractsCount: number;
  activeContracts: ActiveContract[];
  message: string;
}

export interface ActiveContract {
  searchHireId: number;
  status: string;
  serviceName: string;
  amount: number;
  createdAt: string;
  otherPartyName: string;
  otherPartyEmail: string;
  hasAppointment: boolean;
  appointmentDate?: string;
}

export interface AccountDeletionRequest {
  reason?: string; // Opcional: razón para eliminar la cuenta
}

export interface AccountDeletionResponse {
  success: boolean;
  message: string;
  activeContracts: ActiveContract[];
  disputesCreated: DisputeCreated[];
  requiresManualReview: boolean;
}

export interface DisputeCreated {
  disputeId: number;
  searchHireId: number;
  reason: string;
  affectedPartyName: string;
  affectedPartyEmail: string;
}
