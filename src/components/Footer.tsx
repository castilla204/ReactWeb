import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../media/logoi.png';
import { useAuth } from '../contexts/AuthContext';

const FONT =
  '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif';

const linkClass =
  'text-[13px] text-[#737373] hover:text-[#222222] transition-colors whitespace-nowrap';

const Sep = () => <span className="text-[#d1d5db] select-none" aria-hidden>·</span>;

export const Footer = () => {
  const { user } = useAuth();
  const isExpert = ((user as any)?.Role || (user as any)?.role) === 'Expert';

  return (
    <footer
      className="hidden md:block border-t border-[#e8e8e8]/80 bg-[#fafafa]"
      style={{ fontFamily: FONT }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <Link to="/" className="inline-flex items-center gap-1.5 shrink-0 mr-1">
          <img src={logoImg} alt="" className="w-4 h-4 object-contain" />
          <span className="text-[13px] font-semibold text-[#222222]">inspecciono.com</span>
        </Link>

        <Sep />

        <Link to="/quienes-somos" className={linkClass}>
          Quiénes somos
        </Link>

        {!isExpert && (
          <>
            <Sep />
            <Link to="/become-expert" className={linkClass}>
              Hazte experto
            </Link>
          </>
        )}

        <Sep />

        <Link to="/como-funciona" className={linkClass}>
          Cómo funciona
        </Link>

        <Sep />

        <a href="/terms.html" className={linkClass}>
          Términos
        </a>

        <Sep />

        <a href="/privacy-policy.html" className={linkClass}>
          Privacidad
        </a>

        <Sep />

        <a href="/cookies" className={linkClass}>
          Cookies
        </a>

        <Sep />

        <span className="text-[12px] text-[#9ca3af] whitespace-nowrap">
          © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
};
