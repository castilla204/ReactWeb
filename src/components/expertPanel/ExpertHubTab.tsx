import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Package,
  CalendarClock,
  MessageCircle,
  ClipboardList,
  Inbox,
  Plus,
  AlertCircle,
} from 'lucide-react';

/**
 * Hub de experto ("Inicio") — dirección A (bandeja de trabajo) con el resumen de
 * B injertado, validada en el shape 2026-07-19.
 *
 * El experto aterriza aquí: lo primero y protagonista son los encargos que
 * REQUIEREN SU ACCIÓN; debajo, tres accesos rápidos (contrataciones, servicios,
 * disponibilidad) como segundo nivel. Una decisión por pliegue (PRODUCT.md):
 * el trabajo urgente manda, la administración queda a un toque.
 */

type Hire = {
  id: number;
  status?: string;
  searchTitle?: string | null;
  client?: { name?: string | null } | null;
  service?: { imageUrls?: string[] | null } | null;
  serviceType?: { name?: string | null } | null;
  statusInfo?: { displayName?: string | null } | null;
  unreadMessagesCount?: number;
};

export interface ExpertHubTabProps {
  expertName?: string;
  hires: Hire[];
  servicesCount: number;
  /** Perfil visible/contratable (veredicto del backend). */
  isVisible: boolean;
  isOnVacation?: boolean;
  unreadHires?: number;
  onGoServices: () => void;
  onGoAvailability: () => void;
  onGoMessages: () => void;
  onGoSetup: () => void;
}

/** Encargos que esperan la acción del experto (ir, inspeccionar, informar). */
const needsAction = (h: Hire) => h.status === 'pending';

const firstName = (name?: string) => (name?.trim().split(/\s+/)[0] ?? '').trim();

const hireTitle = (h: Hire) =>
  (h.searchTitle?.trim() || h.serviceType?.name?.trim() || 'Encargo') as string;

const statusLabel = (h: Hire) =>
  h.statusInfo?.displayName?.trim() || 'Pendiente de tu visita';

const ExpertHubTab: React.FC<ExpertHubTabProps> = ({
  expertName,
  hires,
  servicesCount,
  isVisible,
  isOnVacation,
  unreadHires = 0,
  onGoServices,
  onGoAvailability,
  onGoMessages,
  onGoSetup,
}) => {
  const navigate = useNavigate();

  const pending = useMemo(() => hires.filter(needsAction), [hires]);
  const greeting = firstName(expertName);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-7 px-4 py-5 sm:px-6 sm:py-7">
      {greeting ? (
        <p className="text-body text-ink-muted">
          Hola, <span className="font-semibold text-ink">{greeting}</span>.
        </p>
      ) : null}

      {/* ── Protagonista: trabajo que requiere acción ── */}
      <section aria-labelledby="hub-action-title">
        <div className="mb-3 flex items-center gap-2">
          <h2 id="hub-action-title" className="text-title font-semibold text-ink">
            Requieren tu acción
          </h2>
          {pending.length > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-badge font-bold leading-none text-white">
              {pending.length > 9 ? '9+' : pending.length}
            </span>
          ) : null}
        </div>

        {pending.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {pending.map((h) => {
              const img = h.service?.imageUrls?.[0];
              return (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/expert/inspection/${h.id}`)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-ink-soft hover:bg-surface-tinted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    aria-label={`Ver encargo: ${hireTitle(h)}`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-tinted">
                      {img ? (
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ClipboardList className="h-5 w-5 text-ink-soft" strokeWidth={1.9} aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold text-ink">
                        {hireTitle(h)}
                      </span>
                      {h.client?.name ? (
                        <span className="block truncate text-caption text-ink-muted">
                          {h.client.name}
                        </span>
                      ) : null}
                      <span className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-brand/[0.07] px-2 py-0.5 text-caption font-semibold text-brand">
                        {statusLabel(h)}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-meta font-semibold text-brand">
                      <span className="hidden sm:inline">Ver encargo</span>
                      <ChevronRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <HubEmptyState
            servicesCount={servicesCount}
            isVisible={isVisible}
            onGoServices={onGoServices}
            onGoSetup={onGoSetup}
            onGoMessages={onGoMessages}
          />
        )}
      </section>

      {/* ── Segundo nivel: accesos rápidos (resumen de B) ── */}
      <section aria-labelledby="hub-access-title">
        <h2 id="hub-access-title" className="mb-3 text-title font-semibold text-ink">
          Gestiona tu panel
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AccessTile
            icon={MessageCircle}
            label="Contrataciones"
            value={unreadHires > 0 ? `${unreadHires > 9 ? '9+' : unreadHires} sin leer` : 'Ver mensajes'}
            highlight={unreadHires > 0}
            onClick={onGoMessages}
          />
          <AccessTile
            icon={Package}
            label="Mis servicios"
            value={servicesCount === 1 ? '1 activo' : `${servicesCount} activos`}
            onClick={onGoServices}
          />
          <AccessTile
            icon={CalendarClock}
            label="Disponibilidad"
            value={isOnVacation ? 'En vacaciones' : 'Activa'}
            onClick={onGoAvailability}
          />
        </div>
      </section>
    </div>
  );
};

/** Estado vacío contextual: primera vez, perfil oculto o al día. */
const HubEmptyState: React.FC<{
  servicesCount: number;
  isVisible: boolean;
  onGoServices: () => void;
  onGoSetup: () => void;
  onGoMessages: () => void;
}> = ({ servicesCount, isVisible, onGoServices, onGoSetup, onGoMessages }) => {
  if (servicesCount === 0) {
    return (
      <HubNotice
        icon={Plus}
        title="Crea tu primer servicio"
        body="Aún no ofreces ningún servicio. Publica el primero para empezar a recibir encargos."
        ctaLabel="Crear un servicio"
        onCta={onGoServices}
        accent
      />
    );
  }
  if (!isVisible) {
    return (
      <HubNotice
        icon={AlertCircle}
        title="Tu perfil está oculto"
        body="Los clientes aún no pueden contratarte. Completa lo que falta para volverte visible."
        ctaLabel="Completar perfil"
        onCta={onGoSetup}
        accent
      />
    );
  }
  return (
    <HubNotice
      icon={Inbox}
      title="Sin encargos pendientes"
      body="Estás al día. Te avisaremos en cuanto un cliente te contrate."
      ctaLabel="Ver contrataciones anteriores"
      onCta={onGoMessages}
    />
  );
};

const HubNotice: React.FC<{
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  ctaLabel: string;
  onCta: () => void;
  accent?: boolean;
}> = ({ icon: Icon, title, body, ctaLabel, onCta, accent }) => (
  <div className="flex flex-col items-center rounded-xl border border-line bg-surface-tinted px-6 py-8 text-center">
    <span
      className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full ${
        accent ? 'bg-brand/10 text-brand' : 'bg-line/60 text-ink-muted'
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
    </span>
    <p className="text-body font-semibold text-ink">{title}</p>
    <p className="mt-1 max-w-sm text-meta text-ink-muted">{body}</p>
    <button
      type="button"
      onClick={onCta}
      className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-meta font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
        accent
          ? 'bg-brand text-white hover:bg-brand-hover'
          : 'border border-line bg-surface text-ink hover:border-ink-soft hover:bg-surface-tinted'
      }`}
    >
      {ctaLabel}
      {accent ? <ChevronRight className="h-4 w-4" strokeWidth={2.2} aria-hidden /> : null}
    </button>
  </div>
);

const AccessTile: React.FC<{
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  highlight?: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, value, highlight, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex flex-col gap-2.5 rounded-xl border border-line bg-surface-tinted p-3.5 text-left transition-colors hover:border-ink-soft hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
  >
    <Icon
      className={`h-5 w-5 shrink-0 transition-colors ${
        highlight ? 'text-brand' : 'text-ink-muted group-hover:text-brand'
      }`}
      strokeWidth={2}
      aria-hidden
    />
    <span className="min-w-0">
      <span className="block truncate text-body font-semibold text-ink">{label}</span>
      <span className={`block truncate text-caption ${highlight ? 'font-semibold text-brand' : 'text-ink-muted'}`}>
        {value}
      </span>
    </span>
  </button>
);

export default ExpertHubTab;
