// Tipos para el sistema de citas

// ✅ ESTADO DINÁMICO: Los estados vienen del backend
export type AppointmentStatus = string;

export type TimerType = 
  | "proposal"                           // 48h para proponer cita
  | "response"                           // 48h para responder
  | "auto_awaiting_client_decision"      // 3h después de la cita
  | "reprogram"                          // 24h para reprogramar
  | "expert_report";                     // 24h para enviar reporte del experto

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
  latitude?: number | null;           // 40.4168
  longitude?: number | null;          // -3.7038
  doorNumber?: string | null;         // "Portal A, 2ºB"
  ownerPhone?: string | null;         // "+34 666 123 456"
  siteDetails?: string | null;        // "Entrada por el garaje, timbre roto"
  
  // Contadores y control
  rejectionCount: number;      // Veces que el experto rechazó
  cancellationCount: number;   // Veces que se canceló
  
  // 🆕 CAMPOS DE RECHAZOS SEPARADOS:
  clientCancellationCount: number;        // Número de cancelaciones del cliente
  expertCancellationCount: number;        // Número de cancelaciones del experto
  lastClientCancellationAt: string | null;      // Última cancelación del cliente
  lastExpertCancellationAt: string | null;      // Última cancelación del experto
  
  // Timestamps de actividad
  lastRejectionAt: string | null;    // Última vez que se rechazó
  lastProposalAt: string | null;     // Última vez que se propuso
  lastResponseAt: string | null;     // Última vez que se respondió
  
  // Timestamps del sistema
  createdAt: string;
  updatedAt: string;
  
  // Información adicional (viene del SearchHire)
  clientName?: string | null;         // Nombre del cliente
  expertName?: string | null;         // Nombre del experto
  amount: number;              // Monto del servicio
  
  // Información de ubicación del experto (opcional, viene del endpoint details-complete)
  expertLatitude?: number | null;
  expertLongitude?: number | null;
  locationRange?: number | null;
  
  // Información de estado (opcional, viene del endpoint details-complete)
  statusInfo?: any; // SystemStatusDto - definido en searchDetails.ts
  
  // Timers activos
  timers: AppointmentTimer[];
}

// DTOs para las operaciones
export interface ProposeAppointmentDto {
  proposedDate: string;    // "2024-01-15" (YYYY-MM-DD)
  proposedTime: string;    // "14:30:00" (HH:mm:ss)
  location: string;        // "Calle Mayor 123, Madrid" - CAMBIADO de 'address' a 'location'
  latitude?: number | null;       // 40.4168
  longitude?: number | null;      // -3.7038
  doorNumber?: string | null;     // "Portal A, 2ºB"
  ownerPhone?: string | null;     // "+34 666 123 456"
  siteDetails?: string | null;    // "Entrada por el garaje, timbre roto"
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

export interface SubmitExpertReportDto {
  notes: string;           // Notas del reporte del experto
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

