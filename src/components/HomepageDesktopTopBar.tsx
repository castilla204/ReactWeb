import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, HelpCircle, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { LoginModal } from './LoginModal';
import { CurrencySelector } from './CurrencySelector';
import { SD_PAGE_INNER_MAX_CLASS } from '../constants/homepageTypography';

/**
 * Barra superior desktop de la homepage (cuenta, moneda, favoritos).
 * Reutilizable en ficha de servicio sin el hero Kayak.
 *
 * Variants:
 *   - default: gradiente azul cielo (alineado con el hero de la home).
 *   - checkout: barra mínima (back + admin), sin distracciones de exploración.
 *   - map: pantalla completa mapa+búsqueda, blanco, botones en extremos.
 *   - plain: blanco con borde sutil, pensada para páginas internas (busquedas, admin,
 *     transacciones, faq, etc.) que no quieren chocar con el gradiente del default.
 *     Combinable con showLogo para que el chip "INSPECCIONO" actúe como home-link.
 */
export type HomepageDesktopTopBarVariant = 'default' | 'checkout' | 'map' | 'plain';

export interface HomepageDesktopTopBarProps {
  /** En ficha de servicio: sustituye "Mi cuenta" por volver */
  onBack?: () => void;
  /** checkout: barra mínima (volver + admin), sin distracciones de exploración */
  /** map: pantalla completa mapa+búsqueda — blanco, botones en extremos, iconos compactos */
  variant?: HomepageDesktopTopBarVariant;
  /** Título en línea junto al back (solo checkout desktop) */
  pageTitle?: string;
  /** Renderiza el chip "INSPECCIONO" a la izquierda como link a `/`. Cuando es true,
   *  el botón "Mi cuenta"/"Iniciar sesión" se mueve a la derecha junto al resto de
   *  acciones — patrón header marketplace estándar. */
  showLogo?: boolean;
}

export const HomepageDesktopTopBar: React.FC<HomepageDesktopTopBarProps> = ({
  onBack,
  variant = 'default',
  pageTitle,
  showLogo = false,
}) => {
  const isCheckout = variant === 'checkout';
  const isMap = variant === 'map';
  const isPlain = variant === 'plain';
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const userEmail = (user as { Email?: string; email?: string } | null)?.Email ?? user?.email;
  const userRole = (user as { Role?: string; role?: string } | null)?.Role ?? user?.role;
  const userIsAdmin = useMemo(() => {
    if (!isAuthenticated) return false;
    const byEmail = userEmail ? isAdmin(userEmail) : false;
    const byRole = userRole === 'Admin' || userRole === 'admin';
    return byEmail || byRole;
  }, [isAuthenticated, userEmail, userRole]);

  const handleAccount = () => {
    if (isAuthenticated) {
      navigate('/busquedas');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Botón de cuenta/login extraído: se renderiza a la izquierda en el modo legado
  // (sin logo) o a la derecha cuando showLogo está activo (patrón header marketplace).
  const accountBtn = (
    <button
      type="button"
      onClick={handleAccount}
      className={
        isMap
          ? 'sd-icon-btn shrink-0'
          : 'inline-flex items-center gap-2 rounded-full border border-[#9ca3af] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#222222] transition-colors hover:border-[#222222] hover:bg-[#f9fafb]'
      }
      aria-label={isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión'}
    >
      <User className={isMap ? 'h-4 w-4' : 'h-4 w-4 shrink-0'} strokeWidth={2.1} />
      {!isMap && (isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión')}
    </button>
  );

  const rightActions = (
    <div className="flex shrink-0 items-center gap-2">
      {!isCheckout ? (
        isMap ? (
          <button
            type="button"
            onClick={() => navigate('/como-funciona')}
            className="sd-icon-btn"
            aria-label="Cómo funciona Inspecciono"
          >
            <HelpCircle className="h-4 w-4" strokeWidth={2.1} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/como-funciona')}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#9ca3af] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#222222] transition-colors hover:border-[#222222] hover:bg-[#f9fafb]"
            aria-label="Cómo funciona Inspecciono"
          >
            <HelpCircle className="h-4 w-4 shrink-0" strokeWidth={2.1} />
            <span className="hidden lg:inline">Cómo funciona</span>
          </button>
        )
      ) : null}
      {userIsAdmin && (
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          Admin
        </button>
      )}
      {!isCheckout ? <CurrencySelector variant="compact" /> : null}
      {!isCheckout ? (
        <button
          type="button"
          aria-label="Favoritos"
          onClick={() => navigate('/favoritos')}
          className={
            isMap
              ? 'sd-icon-btn'
              : 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#9ca3af] bg-white text-[#222] transition-colors hover:bg-[#f9fafb]'
          }
        >
          <Heart className="h-4 w-4" />
        </button>
      ) : null}
      {/* Cuando hay logo a la izquierda, el botón de cuenta se mueve aquí. */}
      {showLogo && !onBack ? accountBtn : null}
    </div>
  );

  // Logo "INSPECCIONO" como home-link — solo en variant con showLogo. Usa el mismo
  // estilo de chip que el header legado de App.tsx para mantener reconocimiento de marca.
  const logoLink = (
    <a
      href="/"
      onClick={(e) => {
        e.preventDefault();
        navigate('/');
      }}
      className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-brand/10 px-3 text-[11px] font-semibold tracking-[0.18em] text-[#222]"
      aria-label="Inspecciono — inicio"
    >
      INSPECCIONO
    </a>
  );

  const leftControl = onBack ? (
    isCheckout && pageTitle ? (
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="sd-icon-btn shrink-0"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.1} aria-hidden />
        </button>
        <h1 className="truncate font-display text-lg font-semibold leading-tight tracking-[-0.02em] text-[#1c1c1c]">
          {pageTitle}
        </h1>
      </div>
    ) : isMap ? (
      <button
        type="button"
        onClick={onBack}
        className="sd-icon-btn shrink-0"
        aria-label="Volver"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2.1} aria-hidden />
      </button>
    ) : (
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full border border-[#9ca3af] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#222222] transition-colors hover:border-[#222222] hover:bg-[#f9fafb]"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.1} />
        Volver
      </button>
    )
  ) : showLogo ? (
    logoLink
  ) : (
    accountBtn
  );

  return (
    <>
      <header
        className={`sticky top-0 z-50 hidden md:block ${
          isCheckout
            ? 'border-b border-[#e8e8e8] bg-white'
            : isMap
              ? 'bg-white'
              : isPlain
                ? 'border-b border-[#e8e8e8] bg-white'
                : 'border-b border-[#dbe8f5]/80'
        }`}
        style={
          isCheckout || isMap || isPlain
            ? undefined
            : {
                background:
                  'linear-gradient(128deg, #dceaf8 0%, #eaf2fb 34%, #fafafa 100%)',
              }
        }
      >
        <div
          className={
            isMap
              ? 'flex min-h-12 w-full items-center justify-between gap-3 px-4 md:px-5 lg:px-6'
              : `${isCheckout ? 'max-w-[min(90rem,calc(100vw-2.5rem))] px-4 md:px-6 lg:px-8' : SD_PAGE_INNER_MAX_CLASS} flex min-h-12 items-center justify-between gap-4`
          }
        >
          {leftControl}
          {rightActions}
        </div>
      </header>

      <LoginModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onSuccess={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};
