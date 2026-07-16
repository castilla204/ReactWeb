import React from 'react';
import { Link } from 'react-router-dom';
import erizoImg from '../media/erizo.png';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORY_LANDINGS } from '../content/categoryLandingContent';

const linkClass =
  'text-meta text-ink-muted hover:text-ink transition-colors whitespace-nowrap';

const Sep = () => <span className="text-ink-soft select-none" aria-hidden>·</span>;

interface FooterProps {
  /** Renderiza también en móvil (por defecto solo ≥md, comportamiento histórico). */
  mobile?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ mobile = false }) => {
  const { user } = useAuth();
  const isExpert = ((user as any)?.Role || (user as any)?.role) === 'Expert';

  return (
    <footer
      className={`${mobile ? 'block' : 'hidden md:block'} border-t border-line/80 bg-surface-tinted font-display`}
    >
      {/* Enlazado interno a las landings de categoría (SEO): fila discreta propia. */}
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-3.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {CATEGORY_LANDINGS.map((c, i) => (
          <React.Fragment key={c.slug}>
            {i > 0 && <Sep />}
            <Link to={`/${c.slug}`} className={linkClass}>
              {c.footerLabel}
            </Link>
          </React.Fragment>
        ))}
      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <Link to="/" className="inline-flex items-center gap-1.5 shrink-0 mr-1">
          <img src={erizoImg} alt="" className="h-5 w-5 -scale-x-100 object-contain" />
          <span className="text-meta font-semibold text-ink">inspecciono.com</span>
        </Link>

        <Sep />

        <Link to="/help" className={linkClass}>
          Ayuda
        </Link>

        <Sep />

        <Link to="/inspeccion-segunda-mano-espana" className={linkClass}>
          Cobertura en España
        </Link>

        {!isExpert && (
          <>
            <Sep />
            <Link to="/expert/join" className={linkClass}>
              Hazte experto
            </Link>
          </>
        )}

        <Sep />

        <Link to="/legal/terms" className={linkClass}>
          Términos
        </Link>

        <Sep />

        <Link to="/legal/privacy" className={linkClass}>
          Privacidad
        </Link>

        <Sep />

        {/* La política de cookies vive dentro de la de privacidad (mismo destino
            que el "Más información" del CookieBanner). /cookies no está enrutado. */}
        <Link to="/legal/privacy" className={linkClass}>
          Cookies
        </Link>

        <Sep />

        <span className="text-caption text-ink-soft whitespace-nowrap">
          © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
};
