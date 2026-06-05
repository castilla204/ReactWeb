import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Heart, HelpCircle, MapPin, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { LoginModal } from './LoginModal';
import { CurrencySelector } from './CurrencySelector';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import {
  SD_PAGE_INNER_MAX_CLASS,
  MAP_STEP_TOPBAR_SHELL_CLASS,
  MAP_STEP_TOPBAR_INNER_CLASS,
  MAP_STEP_TOPBAR_PILL_ACTIVE,
  MAP_STEP_TOPBAR_PILL_DONE,
  MAP_STEP_TOPBAR_PILL_IDLE,
  MAP_STEP_TOPBAR_LABEL_ACTIVE,
  MAP_STEP_TOPBAR_LABEL_IDLE,
  MAP_STEP_TOPBAR_DIVIDER,
  MAP_STEP_TOPBAR_META_CHIP,
  MAP_STEP_TOPBAR_META_CHIP_BRAND,
} from '../constants/homepageTypography';

/**
 * Barra superior desktop de la homepage (cuenta, moneda, favoritos).
 * Reutilizable en ficha de servicio sin el hero Kayak.
 *
 * Variants:
 *   - default: blanco con borde (legado; en home usar plain + showLogo).
 *   - checkout: barra mínima (back + admin), sin distracciones de exploración.
 *   - map: pantalla completa mapa+búsqueda, blanco, botones en extremos.
 *   - plain: blanco con borde sutil, pensada para páginas internas (busquedas, admin,
 *     transacciones, faq, etc.) que no quieren chocar con el gradiente del default.
 *     Combinable con showLogo para que el chip "INSPECCIONO" actúe como home-link.
 */
export type HomepageDesktopTopBarVariant = 'default' | 'checkout' | 'map' | 'mapStep' | 'plain';

export interface HomepageDesktopTopBarProps {
  /** En ficha de servicio: sustituye "Mi cuenta" por volver */
  onBack?: () => void;
  /** checkout: barra mínima (volver + admin), sin distracciones de exploración */
  /** map: pantalla completa mapa+búsqueda — blanco, botones en extremos, iconos compactos */
  /** mapStep: igual que map, pero embebe stepper + chips meta del flow en el centro
   *  para matar el aire muerto. Requiere prop `mapStep`. */
  variant?: HomepageDesktopTopBarVariant;
  /** Título en línea junto al back (solo checkout desktop) */
  pageTitle?: string;
  /** Renderiza el chip "INSPECCIONO" a la izquierda como link a `/`. Cuando es true,
   *  el botón "Mi cuenta"/"Iniciar sesión" se mueve a la derecha junto al resto de
   *  acciones — patrón header marketplace estándar. */
  showLogo?: boolean;
  /** Solo `variant="mapStep"`: contexto del paso del flow embebido en la topbar. */
  mapStep?: {
    currentStep: 1 | 2 | 3;
    expertCount?: number;
    locationLabel?: string;
    rangeKm?: number;
    loading?: boolean;
  };
}

/**
 * 🛡️ MUD-DG — Bell de notificaciones para el topbar global.
 * Reutiliza el contador (`useUnreadNotificationCount`) que ya polleea cada 30s.
 * Click → dispara el evento global `openNotificationCenter` que `App.tsx`
 * escucha para abrir el drawer compartido.
 */
const TopBarNotificationsBell: React.FC<{ isMap: boolean }> = ({ isMap }) => {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const handleClick = () => {
    if (typeof window !== 'undefined' && typeof (window as any).openNotificationCenter === 'function') {
      (window as any).openNotificationCenter();
    }
  };
  const baseClass = isMap
    ? 'sd-icon-btn relative'
    : 'relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#9ca3af] bg-white text-[#222] transition-colors hover:bg-[#f9fafb]';
  return (
    <button
      type="button"
      aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} nuevas)` : 'Notificaciones'}
      onClick={handleClick}
      className={baseClass}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold leading-none text-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export const HomepageDesktopTopBar: React.FC<HomepageDesktopTopBarProps> = ({
  onBack,
  variant = 'default',
  pageTitle,
  showLogo = false,
  mapStep,
}) => {
  const isCheckout = variant === 'checkout';
  const isMapStep = variant === 'mapStep';
  // mapStep hereda el chrome de map (back compacto, iconos sin label, etc.)
  const isMap = variant === 'map' || isMapStep;
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
      {/* 🛡️ MUD-DG — Bell global. Antes solo existía dentro del expert-panel
          → cliente normal NO podía ver su inbox de notificaciones. Auditoría
          de 5 agentes lo marcó como gap CRÍTICO P0. */}
      {!isCheckout && user ? <TopBarNotificationsBell isMap={isMap} /> : null}
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

  // Centro de la topbar SOLO en variant="mapStep" — stepper + chips meta del flow.
  // Mata el aire muerto entre back y acciones (~1500px en 1920w) y elimina la
  // duplicación de stepper/chips con la microcabecera del panel de cards.
  const mapStepCenter = isMapStep && mapStep ? (
    <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
      <ol className="flex shrink-0 items-center gap-2 font-display" aria-label="Pasos del proceso">
        {[
          { n: 1 as const, label: 'Elige experto' },
          { n: 2 as const, label: 'Revisa servicio' },
          { n: 3 as const, label: 'Reserva' },
        ].map((s, idx, arr) => {
          const isActive = s.n === mapStep.currentStep;
          const isDone = s.n < mapStep.currentStep;
          return (
            <li key={s.n} className="flex items-center gap-2">
              <span
                className={
                  isActive
                    ? MAP_STEP_TOPBAR_PILL_ACTIVE
                    : isDone
                      ? MAP_STEP_TOPBAR_PILL_DONE
                      : MAP_STEP_TOPBAR_PILL_IDLE
                }
                aria-current={isActive ? 'step' : undefined}
              >
                {s.n}
              </span>
              <span
                className={`hidden xl:inline ${isActive ? MAP_STEP_TOPBAR_LABEL_ACTIVE : MAP_STEP_TOPBAR_LABEL_IDLE}`}
              >
                {s.label}
              </span>
              {idx < arr.length - 1 && (
                <span className="h-px w-4 bg-[#e0e0e0] xl:w-5" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      <span className={MAP_STEP_TOPBAR_DIVIDER} aria-hidden />

      <div className="hidden min-w-0 shrink items-center gap-1.5 lg:flex">
        {mapStep.loading ? (
          <span className={MAP_STEP_TOPBAR_META_CHIP}>
            <span className="mr-0.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#9aa0a6]" />
            Actualizando…
          </span>
        ) : typeof mapStep.expertCount === 'number' ? (
          <span className={MAP_STEP_TOPBAR_META_CHIP_BRAND}>
            <span className="tabular-nums">{mapStep.expertCount}</span>
            <span className="font-medium opacity-80">
              {mapStep.expertCount === 1 ? 'experto' : 'expertos'}
            </span>
          </span>
        ) : null}
        {mapStep.locationLabel ? (
          <span className={`${MAP_STEP_TOPBAR_META_CHIP} hidden xl:inline-flex max-w-[220px]`}>
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{mapStep.locationLabel}</span>
          </span>
        ) : null}
        {mapStep.rangeKm ? (
          <span className={`${MAP_STEP_TOPBAR_META_CHIP} hidden 2xl:inline-flex`}>
            ~{mapStep.rangeKm} km
          </span>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <>
      <header
        className={
          isMapStep
            ? MAP_STEP_TOPBAR_SHELL_CLASS
            : `sticky top-0 z-50 hidden md:block ${
          isCheckout
            ? 'border-b border-[#e8e8e8] bg-white'
            : isMap
              ? 'bg-white'
              : isPlain && showLogo
                ? 'border-b-0 bg-[#fafafa]'
                : isPlain
                  ? 'border-b border-[#e8e8e8] bg-white'
                  : 'border-b border-[#e8e8e8] bg-white'
        }`
        }
      >
        <div
          className={
            isMapStep
              ? MAP_STEP_TOPBAR_INNER_CLASS
              : isMap
                ? 'flex min-h-12 w-full items-center justify-between gap-3 px-4 md:px-5 lg:px-6'
                : `${isCheckout ? 'max-w-[min(90rem,calc(100vw-2.5rem))] px-4 md:px-6 lg:px-8' : SD_PAGE_INNER_MAX_CLASS} flex min-h-12 items-center justify-between gap-4`
          }
        >
          {leftControl}
          {mapStepCenter}
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
