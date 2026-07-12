import React from 'react';
import { Link } from 'react-router-dom';
import erizoImg from '../media/erizo.png';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORY_LANDINGS } from '../content/categoryLandingContent';

const FONT =
  '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif';

const linkClass =
  'text-meta text-ink-muted hover:text-ink transition-colors whitespace-nowrap';

const Sep = () => <span className="text-ink-soft select-none" aria-hidden>·</span>;

export const Footer = () => {
  const { user } = useAuth();
  const isExpert = ((user as any)?.Role || (user as any)?.role) === 'Expert';

  return (
    <footer
      className="hidden md:block border-t border-line/80 bg-surface-tinted"
      style={{ fontFamily: FONT }}
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

        <a href="/legal/terms" className={linkClass}>
          Términos
        </a>

        <Sep />

        <a href="/legal/privacy" className={linkClass}>
          Privacidad
        </a>

        <Sep />

        <a href="/cookies" className={linkClass}>
          Cookies
        </a>

        <Sep />

        <span className="text-caption text-ink-soft whitespace-nowrap">
          © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
};
