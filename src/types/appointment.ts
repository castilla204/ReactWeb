// Tipos para el sistema de citas

export type AppointmentStatus = 
  | "awaiting_appointment"                    // Esperando propuesta del cliente
  | "appointment_proposed"                    // Cliente propuso cita
  | "appointment_confirmed"                   // Experto confirmó
  | "appointment_rejected"                    // Experto rechazó
  | "appointment_cancelled_by_client"         // Primera cancelación del cliente
  | "appointment_cancelled_by_client_second"  // Segunda cancelación del cliente
  | "appointment_cancelled_by_expert"         // Experto cancela voluntariamente
  | "appointment_cancelled_by_no_response"    // Cliente no propuso en tiempo
  | "appointment_completed";                  // Cita realizada exitosamente

export type TimerType = 
  | "proposal"                           // 48h para proponer cita
  | "response"                           // 48h para responder
  | "auto_awaiting_client_decision"      // 3h después de la cita
  | "reprogram";                         // 24h para reprogramar

export interface AppointmentTimer {
  id: number;
  appointmentId: number;
  timerType: TimerType;
  startTime: string;           // Cuándo empezó
  endTime: string;             // Cuándo expira
  isExpired: boolean;          // Si ya expiró
  expiredAt?: string;          // Cuándo expiró
  notes?: string;              // Notas adicionales
  createdAt: string;
}

export interface Appointment {
  // Identificadores
  id: number;
  searchHireId: number;
  
  // Estado de la cita
  status: AppointmentStatus;
  
  // Información de la cita
  proposedDate: string;        // ISO 8601: "2024-01-15"
  proposedTime: string;        // TimeSpan: "14:30:00"
  location: string;            // "Calle Mayor 123, Madrid"
  latitude?: number;           // 40.4168
  longitude?: number;          // -3.7038
  
  // Información de disputas
  disputeReason?: string;      // Razón de la disputa
  
  // Información de finalización
  completedAt?: string;        // Cuándo se completó
  completedBy?: number;        // Quién la completó
  
  // Contadores y control
  rejectionCount: number;      // Veces que el experto rechazó
  cancellationCount: number;   // Veces que se canceló
  
  // Timestamps de actividad
  lastRejectionAt?: string;    // Última vez que se rechazó
  lastProposalAt?: string;     // Última vez que se propuso
  lastResponseAt?: string;     // Última vez que se respondió
  
  // Control de bloqueo
  isLocked: boolean;           // Bloqueado 12h antes de la cita
  
  // Timestamps del sistema
  createdAt: string;
  updatedAt: string;
  
  // Información adicional (viene del SearchHire)
  clientName?: string;         // Nombre del cliente
  expertName?: string;         // Nombre del experto
  amount: number;              // Monto del servicio
  
  // Timers activos
  timers: AppointmentTimer[];
}

// DTOs para las operaciones
export interface ProposeAppointmentDto {
  proposedDate: string;    // "2024-01-15" (YYYY-MM-DD)
  proposedTime: string;    // "14:30:00" (HH:mm:ss)
  location: string;        // "Calle Mayor 123, Madrid"
  latitude?: number;       // 40.4168
  longitude?: number;      // -3.7038
}

export interface ConfirmAppointmentDto {
  appointmentId: number;
  notes?: string;          // Notas opcionales del experto
}

export interface RejectAppointmentDto {
  appointmentId: number;
  reason: string;          // Razón obligatoria del rechazo
}

export interface CancelAppointmentDto {
  appointmentId: number;
  reason: string;          // Razón obligatoria de la cancelación
}

export interface MarkCompletedDto {
  appointmentId: number;
  notes?: string;          // Notas opcionales sobre la cita
}

// Respuestas de la API
export interface AppointmentResponse {
  success: boolean;
  data: Appointment;
  message: string;
}

export interface AppointmentsResponse {
  success: boolean;
  data: Appointment[];
  message: string;
}

// Utilidades para el frontend
export interface AppointmentActions {
  canPropose: boolean;
  canConfirm: boolean;
  canReject: boolean;
  canCancel: boolean;
  canMarkCompleted: boolean;
}

export interface MoneyDistribution {
  client: number;
  expert: number;
  platform: number;
}
