// DTOs de Entrada (Para crear/actualizar)
export interface CreateAppointmentStatusConfigDto {
  statusId: number;                  // ID del estado (1, 2, 3, etc.)
  categoryId?: number | null;        // ID de categoría (null = todas)
  serviceTypeCategoryId?: number | null; // ID de tipo de servicio (null = todos)
  clientPercentage: number;          // 0-100
  expertPercentage: number;          // 0-100
  platformPercentage: number;        // 0-100
  isActive: boolean;                 // true/false
}

export interface CreateServiceTypeCategoryConfigDto {
  serviceTypeCategoryId: number;     // ID de la categoría (1, 2, 3, etc.)
  status: string;                    // "appointment_completed", "appointment_cancelled_by_client_second", etc.
  clientPercentage: number;          // 0-100
  expertPercentage: number;          // 0-100
  platformPercentage: number;        // 0-100
  isActive: boolean;                 // true/false
}

// NUEVA ESTRUCTURA GRANULAR - Category + ServiceTypeCategory
export interface CreateCategoryServiceTypeConfigDto {
  categoryId: number;                // ID de la categoría (1, 2, 3, etc.)
  serviceTypeCategoryId: number;     // ID del tipo de servicio (1, 2, 3, etc.)
  status: string;                    // "appointment_completed", "appointment_cancelled_by_client_second", etc.
  clientPercentage: number;          // 0-100
  expertPercentage: number;          // 0-100
  platformPercentage: number;        // 0-100
  isActive: boolean;                 // true/false
}

// DTOs de Respuesta (Lo que devuelve el backend)
export interface AppointmentStatusConfigDto {
  id: number;
  estado: string;                    // Nombre legible del estado
  statusId: number;                  // ID del estado
  statusValue: string;               // Valor del estado (appointment_completed, etc.)
  statusName: string;                // Nombre del estado (AppointmentCompleted, etc.)
  cliente: number;                   // Porcentaje del cliente
  experto: number;                   // Porcentaje del experto
  plataforma: number;                // Porcentaje de la plataforma
  prioridad: string;                 // Prioridad de la configuración
  activo: string;                    // Estado activo/inactivo
  categoryName: string;              // Nombre de la categoría
  serviceTypeCategoryName: string;   // Nombre del tipo de servicio
  createdAt?: string;                // ISO date string
  updatedAt?: string;                // ISO date string
}

export interface ServiceTypeCategoryConfigDto {
  id: number;
  serviceTypeCategoryId: number;
  serviceTypeCategoryName: string;   // Nombre de la categoría
  status: string;
  clientPercentage: number;
  expertPercentage: number;
  platformPercentage: number;
  isActive: boolean;
  createdAt: string;                 // ISO date string
  updatedAt: string;                 // ISO date string
}

export interface CategoryServiceTypeConfigDto {
  id: number;
  categoryId: number;
  categoryName: string;              // "Electrodomésticos"
  serviceTypeCategoryId: number;
  serviceTypeCategoryName: string;   // "Búsqueda + Revisión"
  status: string;
  clientPercentage: number;
  expertPercentage: number;
  platformPercentage: number;
  isActive: boolean;
  createdAt: string;                 // ISO date string
  updatedAt: string;                 // ISO date string
}

// Configuración aplicada (para consulta)
export interface MoneyDistributionConfigDto {
  clientPercentage: number;
  expertPercentage: number;
  platformPercentage: number;
  source: string;                    // "category_service_type", "service_type_category", "appointment_status", "default"
  categoryName?: string;             // Nombre de la categoría (si aplica)
  serviceTypeCategoryName?: string;  // Nombre del tipo de servicio (si aplica)
  status: string;
}

// Tipos para el formulario
export interface ConfigFormData {
  categoryId?: number;               // Solo para configuraciones granulares
  serviceTypeCategoryId?: number;    // Solo para configuraciones por categoría
  statusId: number;                  // ID del estado de cita
  clientPercentage: number;
  expertPercentage: number;
  platformPercentage: number;
  isActive: boolean;
}

// Tipos para las categorías de servicio
export interface ServiceTypeCategory {
  id: number;
  name: string;
}

// Estados de cita disponibles
export const APPOINTMENT_STATUSES = [
  { value: 'appointment_completed', label: 'Servicio Completado' },
  { value: 'appointment_cancelled_by_client', label: 'Cliente Cancela (1ª vez)' },
  { value: 'appointment_cancelled_by_client_second', label: 'Cliente Cancela (2ª vez)' },
  { value: 'appointment_cancelled_by_expert', label: 'Experto Cancela' },
  { value: 'appointment_cancelled_by_expert_rejection', label: 'Experto Rechaza 2 veces' },
  { value: 'appointment_cancelled_by_no_response', label: 'Cancelado por falta de respuesta' },
  { value: 'appointment_rejected', label: 'Cita Rechazada' }
] as const;

// Categorías de servicio disponibles
export const SERVICE_TYPE_CATEGORIES = [
  { id: 1, name: 'Vehículos' },
  { id: 2, name: 'Motocicletas' },
  { id: 3, name: 'Inmuebles' }
] as const;

// Categorías principales disponibles (para el nuevo sistema granular)
export const CATEGORIES = [
  { id: 1, name: 'Electrodomésticos' },
  { id: 2, name: 'Vehículos' },
  { id: 3, name: 'Inmuebles' },
  { id: 4, name: 'Servicios' }
] as const;
