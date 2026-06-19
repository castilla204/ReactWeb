// ─────────────────────────────────────────────────────────────────────────────
// Estados LEGACY del sistema de citas (panel admin).
//
// El flujo vigente es Calendly (hueco→pago→appointment_confirmed; cancelación
// escalonada Fase D). El sistema antiguo de "proponer/aceptar/rechazar" está
// retirado (#if false en NewApi). El catálogo de SystemStatuses conserva todos
// los estados históricos (necesarios para mostrar citas antiguas), pero estos
// concretos NO los produce NINGÚN código vivo, así que ensucian el panel.
//
// ⚠️ Lista CONSERVADORA a propósito: SOLO estados verificados como
// "nunca producidos por código vivo" (revisado en NewApi: #if false + enum
// [DEPRECATED] + AccountDeletionService usa otros estados). NO incluir aquí
// estados que el flujo actual sí genera (p.ej. *_second, *_no_proposal,
// *_no_report, *_gt24h/6to24h/lt6h, *_strike, appointment_completed, etc.):
// ocultarlos escondería datos reales del admin.
//
// Esto es SOLO un filtro de visualización (con toggle para mostrarlos). No
// cambia BD, lógica de estados ni reparto de dinero.
// ─────────────────────────────────────────────────────────────────────────────

/** Estados de cita (AppointmentStatus) que el código vivo nunca asigna. */
export const LEGACY_APPOINTMENT_STATUSES: ReadonlySet<string> = new Set([
  'awaiting_appointment',                          // flujo de propuesta antiguo (#if false)
  'appointment_proposed',                          // flujo de propuesta antiguo (#if false)
  'appointment_rejected',                          // flujo de propuesta antiguo (#if false)
  'appointment_cancelled_by_expert_rejection',     // solo se asignaba en RejectAppointmentAsync (#if false)
  'appointment_cancelled_by_no_response',          // [DEPRECATED] en el enum; nunca asignado
  'appointment_completed_auto',                    // cosmético; nunca asignado
  'appointment_cancelled_by_client_account_delete',// AccountDeletionService usa completed_without_client_approval
  'appointment_cancelled_by_expert_account_delete',// AccountDeletionService usa cancelled_by_expert_second
]);

/** Estados de hire (SearchHireStatus) que existen en el seed pero no en el enum vivo. */
export const LEGACY_HIRE_STATUSES: ReadonlySet<string> = new Set([
  'cancelled_by_client_no_proposal',   // no está en el enum SearchHireStatus; llega mapeado desde cita
  'cancelled_by_expert_no_response',   // idem
  'cancelled_by_expert_no_report',     // idem
]);

/** Lee statusValue tolerando camelCase (statusValue) o PascalCase (StatusValue). */
export const statusValueOf = (s: any): string =>
  (s?.statusValue ?? s?.StatusValue ?? '') as string;

/** ¿Es un estado legacy (cita o hire)? */
export const isLegacyStatus = (s: any): boolean => {
  const v = statusValueOf(s);
  return LEGACY_APPOINTMENT_STATUSES.has(v) || LEGACY_HIRE_STATUSES.has(v);
};
