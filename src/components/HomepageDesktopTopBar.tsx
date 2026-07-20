import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Briefcase, HelpCircle, Settings, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAccountIdentity } from './accountMenuShared';
import { isAdmin } from '../utils/admin';
// ⚡ Lazy: LoginModal arrastra framer-motion (~16 kB gzip). Importado estático aquí cargaba
//    framer en el bundle inicial de TODAS las páginas (App.tsx importa este top-bar eager),
//    aunque el login casi nunca se abre. Ahora el chunk solo baja al abrir el modal.
const LoginModal = lazy(() => import('./LoginModal').then((m) => ({ default: m.LoginModal })));
import { AccountMenu } from './AccountMenu';
import { CurrencySelector } from './CurrencySelector';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import { HP_FONT, SD_PAGE_INNER_MAX_CLASS } from '../constants/homepageTypography';

/**
 * Barra superior desktop unificada de TODA la app.
 *
 * Chrome único en todas las páginas: 48px de alto (min-h-12), fondo #fafafa sin
 * borde, contenedor SD_PAGE_INNER_MAX_CLASS y el mismo wordmark Manrope 19px.
 * Lo único que cambia entre variantes es QUÉ acciones se muestran,
 * nunca las proporciones ni la piel.
 *
 * Variants:
 *   - plain: páginas de navegación (home, búsquedas, mapa, ficha, admin, faq,
 *     notificaciones…). Combinable con showLogo para que el logo actúe como
 *     home-link (patrón header marketplace estándar).
 *   - checkout: barra mínima (back + logo), sin distracciones de exploración.
 */
export type HomepageDesktopTopBarVariant = 'plain' | 'checkout';

export interface HomepageDesktopTopBarProps {
  /** Botón volver a la izquierda (checkout y páginas con retorno explícito) */
  onBack?: () => void;
  variant?: HomepageDesktopTopBarVariant;
  /** Título accesible de la página (h1 sr-only) */
  pageTitle?: string;
  /** Renderiza el logo "Inspecciono." a la izquierda como link a `/`. Cuando es true,
   *  el botón "Mi cuenta"/"Iniciar sesión" se mueve a la derecha junto al resto de
   *  acciones — patrón header marketplace estándar. */
  showLogo?: boolean;
}

/**
 * 🛡️ MUD-DG — Bell de notificaciones para el topbar global.
 * Reutiliza el contador (`useUnreadNotificationCount`) que ya polleea cada 30s.
 * Click → dispara el evento global `openNotificationCenter` que `App.tsx`
 * escucha para abrir el drawer compartido.
 */
const TopBarNotificationsBell: React.FC = () => {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const handleClick = () => {
    if (typeof window !== 'undefined' && typeof (window as any).openNotificationCenter === 'function') {
      (window as any).openNotificationCenter();
    }
  };
  return (
    <button
      type="button"
      aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} nuevas)` : 'Notificaciones'}
      onClick={handleClick}
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-ink-strong transition-colors hover:bg-surface-tinted"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-600 text-badge font-semibold leading-none text-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export const HomepageDesktopTopBar: React.FC<HomepageDesktopTopBarProps> = ({
  onBack,
  variant = 'plain',
  pageTitle,
  showLogo = false,
}) => {
  const isCheckout = variant === 'checkout';
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  // Detección de rol experto (rol o JWT) — misma fuente que el menú de cuenta.
  const { isExpert } = useAccountIdentity();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const userEmail = (user as { Email?: string; email?: string } | null)?.Email ?? user?.email;
  const userRole = (user as { Role?: string; role?: string } | null)?.Role ?? user?.role;
  const userIsAdmin = useMemo(() => {
    if (!isAuthenticated) return false;
    const byEmail = userEmail ? isAdmin(userEmail) : false;
    const byRole = userRole === 'Admin' || userRole === 'admin';
    return byEmail || byRole;
  }, [isAuthenticated, userEmail, userRole]);

  // Con sesión: dropdown de cuenta (búsquedas, mensajes, transacciones, panel de
  // experto, ajustes, logout). Sin sesión: botón que abre el login. Se renderiza a la
  // izquierda en el modo legado (sin logo) o a la derecha cuando showLogo está activo
  // (patrón header marketplace).
  const accountBtn = isAuthenticated ? (
    <AccountMenu />
  ) : (
    <button
      type="button"
      onClick={() => setIsLoginModalOpen(true)}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-meta font-semibold text-ink transition-colors hover:border-ink-strong hover:bg-surface-tinted"
      aria-label="Iniciar sesión"
    >
      <User className="h-4 w-4 shrink-0" strokeWidth={2.1} />
      Iniciar sesión
    </button>
  );

  const rightActions = (
    <div className="flex shrink-0 items-center gap-2">
      {/* Acceso de primer nivel al panel de experto: antes solo estaba enterrado en
          el dropdown de cuenta. El experto aterriza en la home de marketplace (puede
          seguir contratando), pero ahora salta a su trabajo de un clic. Pill con
          tinte de marca para que resalte sobre las acciones neutras del chrome. */}
      {!isCheckout && isExpert ? (
        <button
          type="button"
          onClick={() => navigate('/expert')}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-meta font-semibold text-brand transition-colors hover:bg-brand/10"
          aria-label="Ir a tu panel de experto"
        >
          <Briefcase className="h-4 w-4 shrink-0" strokeWidth={2.1} aria-hidden />
          <span className="hidden lg:inline">Panel de experto</span>
        </button>
      ) : null}
      {!isCheckout ? (
        <button
          type="button"
          onClick={() => navigate('/help')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-ink-strong transition-colors hover:bg-surface-tinted"
          aria-label="Cómo funciona Inspecciono"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={2.1} aria-hidden />
        </button>
      ) : null}
      {userIsAdmin && !isCheckout ? (
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          Admin
        </button>
      ) : null}
      {!isCheckout ? <CurrencySelector variant="icon" /> : null}
      {/* 🛡️ MUD-DG — Bell global. Antes solo existía dentro del expert-panel
          → cliente normal NO podía ver su inbox de notificaciones. Auditoría
          de 5 agentes lo marcó como gap CRÍTICO P0. */}
      {!isCheckout && user ? <TopBarNotificationsBell /> : null}
      {!isCheckout && isAuthenticated ? (
        <button
          type="button"
          aria-label="Configuración"
          onClick={() => {
            if (
              typeof window !== 'undefined' &&
              typeof (window as { openAccountSettings?: () => void }).openAccountSettings === 'function'
            ) {
              (window as { openAccountSettings?: () => void }).openAccountSettings!();
            }
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-ink-strong transition-colors hover:bg-surface-tinted"
        >
          <Settings className="h-4 w-4" />
        </button>
      ) : null}
      {/* Cuando hay logo a la izquierda, el botón de cuenta se mueve aquí. */}
      {showLogo ? accountBtn : null}
    </div>
  );

  // Logo ÚNICO para todas las variantes: wordmark Manrope 19px.
  // (Antes checkout tenía su propia versión a 15px y la ficha de servicio otra gris
  // a 13px → tres wordmarks distintos según la página.)
  const logoLink = (
    <a
      href="/"
      onClick={(e) => {
        e.preventDefault();
        navigate('/');
      }}
      className="inline-flex h-9 min-w-0 shrink items-center rounded-md px-1"
      aria-label="Inspecciono — inicio"
    >
      {/* Fuente fijada a Manrope (HP_FONT, la fuente de marca): la home heredaba el
          stack de sistema (SF Pro/Segoe) y se veía MÁS gruesa que la ficha de servicio,
          que sí usa Manrope. Pinnamos Manrope aquí para que el wordmark se vea igual de
          fino en TODAS las páginas. Decisión usuario 2026-06-16. */}
      <span
        className="truncate text-title font-extrabold tracking-[-0.02em] text-brand"
        style={{ fontFamily: HP_FONT }}
      >
        Inspecciono<span className="text-amber-500">.</span>
      </span>
    </a>
  );

  const backIconBtn = (
    <button
      type="button"
      onClick={onBack}
      className="sd-icon-btn shrink-0"
      aria-label="Volver"
    >
      <ArrowLeft className="h-5 w-5" strokeWidth={2.1} aria-hidden />
    </button>
  );

  const leftControl = isCheckout ? (
    onBack ? (
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {backIconBtn}
        {logoLink}
      </div>
    ) : (
      logoLink
    )
  ) : onBack ? (
    showLogo ? (
      <div className="flex min-w-0 items-center gap-2">
        {backIconBtn}
        {logoLink}
      </div>
    ) : (
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-meta font-semibold text-ink transition-colors hover:border-ink-strong hover:bg-surface-tinted"
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
      {/* Piel única (48px, #fafafa, sin borde) y contenedor único para TODAS las
          variantes — que el chrome no salte al navegar entre páginas. */}
      <header className="sticky top-0 z-50 hidden border-b-0 bg-surface-tinted md:block">
        <div className={`${SD_PAGE_INNER_MAX_CLASS} flex min-h-12 items-center justify-between gap-4`}>
          {pageTitle ? <h1 className="sr-only">{pageTitle}</h1> : null}
          {leftControl}
          {rightActions}
        </div>
      </header>

      {isLoginModalOpen && (
        <Suspense fallback={null}>
          <LoginModal
            open={isLoginModalOpen}
            onOpenChange={setIsLoginModalOpen}
            onSuccess={() => setIsLoginModalOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
};
