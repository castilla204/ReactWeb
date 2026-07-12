import { Navigate, useLocation, useParams } from 'react-router-dom';

/** Redirect legacy → canónico preservando query string. */
export function LegacyRedirect({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

/** /searchhire/:id → /hires/:id */
export function LegacyHireDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  const { search } = useLocation();
  return <Navigate to={`/hires/${id}${search}`} replace />;
}

/** /busquedas/:id → /searches/:id (detalle admin por searchId) */
export function LegacySearchDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  const { search } = useLocation();
  return <Navigate to={`/searches/${id}${search}`} replace />;
}

/** /detalles/:id → /searches/:id/report (informe por searchId) */
export function LegacyHireReportRedirect() {
  const { id } = useParams<{ id: string }>();
  const { search } = useLocation();
  return <Navigate to={`/searches/${id}/report${search}`} replace />;
}

/** /chat-pre-contratacion/:serviceId → /inquiry/:serviceId */
export function LegacyInquiryRedirect() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { search } = useLocation();
  return <Navigate to={`/inquiry/${serviceId}${search}`} replace />;
}

/** /coordinar-cita/:token → /appointment/schedule/:token */
export function LegacyAppointmentScheduleRedirect() {
  const { token } = useParams<{ token: string }>();
  const { search } = useLocation();
  return <Navigate to={`/appointment/schedule/${token}${search}`} replace />;
}

/** /confirmar-cita/:token → /appointment/confirm/:token */
export function LegacyAppointmentConfirmRedirect() {
  const { token } = useParams<{ token: string }>();
  const { search } = useLocation();
  return <Navigate to={`/appointment/confirm/${token}${search}`} replace />;
}

/** /expert-panel/inspeccion/:hireId → /expert/inspection/:hireId */
export function LegacyExpertInspectionRedirect() {
  const { hireId } = useParams<{ hireId: string }>();
  const { search } = useLocation();
  return <Navigate to={`/expert/inspection/${hireId}${search}`} replace />;
}
