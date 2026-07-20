import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ChevronRight } from 'lucide-react';
import { useAccountIdentity } from '../accountMenuShared';
import { useExpertHires } from '../../hooks/useExpertHires';

/**
 * Franja de aviso para el experto en la home.
 *
 * El experto aterriza en la home de marketplace igual que un cliente (puede
 * seguir contratando a otros peritos): conserva el escaparate. Sus puentes
 * PERMANENTES al trabajo son el pill del topbar (desktop) y la pestaña "Panel"
 * (móvil). Esta franja NO los duplica: solo aparece cuando hay inspecciones
 * pendientes, y funciona como aviso accionable con el conteo. Sin pendientes
 * (o para quien no es experto) renderiza `null` — y la query queda deshabilitada
 * (`enabled: isExpert`) → cero red para clientes.
 */
export const ExpertHomeStrip: React.FC = () => {
  const navigate = useNavigate();
  const { isExpert } = useAccountIdentity();
  const { hires } = useExpertHires(1, 50, { enabled: isExpert });

  if (!isExpert) return null;

  const pending = Array.isArray(hires)
    ? hires.filter((h: { status?: string }) => h.status === 'pending').length
    : 0;

  // Solo aviso accionable: sin trabajo pendiente, el pill/pestaña ya dan acceso.
  if (pending === 0) return null;

  const headline = `Tienes ${pending} ${
    pending === 1 ? 'inspección pendiente' : 'inspecciones pendientes'
  }`;

  return (
    <button
      type="button"
      onClick={() => navigate('/expert')}
      className="group flex w-full items-center gap-3 border-b border-brand/15 bg-brand/5 px-4 py-2.5 text-left transition-colors hover:bg-brand/10 md:px-6"
      aria-label={`${headline}. Ir a tu panel de experto`}
    >
      <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Briefcase className="h-4 w-4" strokeWidth={2.1} aria-hidden />
        <span
          aria-hidden
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-badge font-bold leading-none text-white"
        >
          {pending > 9 ? '9+' : pending}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-meta font-semibold text-ink">{headline}</span>
        <span className="block truncate text-caption text-ink-muted">
          Revísalas y envía tu informe desde el panel
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-meta font-semibold text-brand">
        <span className="hidden sm:inline">Ir al panel</span>
        <ChevronRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      </span>
    </button>
  );
};

export default ExpertHomeStrip;
