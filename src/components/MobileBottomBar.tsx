import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MobileProfileMenu } from './MobileProfileMenu';
import { Search, HelpCircle, Bell, MessageSquare, CircleUserRound } from 'lucide-react';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import {
  ensureGoogleIdentityReady,
  logGoogleOriginHintOnce,
  renderGoogleButton,
} from '../lib/googleIdentity';
import { HP_COLOR, hpType } from '../constants/homepageTypography';

// ID único para este componente para evitar conflictos
const MOBILE_GOOGLE_BUTTON_ID = 'mobile-bottom-bar-google-btn';

const ICON_SIZE = 22;
const ICON_STROKE = 2;
const LoginModalLazy = lazy(() =>
  import('./LoginModal').then((m) => ({ default: m.LoginModal })),
);

/**
 * Tab individual de la barra inferior. Ancho fijo 56px + gap 4px, centrados en
 * contenedor flex. El estado activo se comunica sin fondos ni contornos (patrón
 * iOS/Airbnb): color de marca, trazo del icono más grueso y etiqueta semibold.
 * Nota: en pantallas >380px los tabs dejan hueco; para distribución full-width
 * cambiar a `flex: 1 min-w-0 max-w-[5rem]` en contenedor y `flex:1 justify-evenly` en div.
 */
type TabButtonProps = {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  badgeCount?: number;
  ariaLabel?: string;
  dataVeloute?: string;
};

const TabButton: React.FC<TabButtonProps> = ({
  label,
  icon,
  active = false,
  onClick,
  onTouchEnd,
  badgeCount = 0,
  ariaLabel,
  dataVeloute,
}) => (
  <button
    type="button"
    onClick={onClick}
    onTouchEnd={onTouchEnd ?? onClick}
    aria-current={active ? 'page' : undefined}
    aria-label={ariaLabel}
    data-veloute={dataVeloute}
    className={[
      'group relative flex shrink-0 flex-col items-center justify-center',
      'rounded-xl border-0 bg-transparent p-0 outline-none',
      'focus-visible:ring-2 focus-visible:ring-brand/45',
      active ? 'cursor-default' : 'cursor-pointer',
    ].join(' ')}
    style={{ width: '56px', height: '44px', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
  >
    <span
      className={[
        'relative flex h-7 items-center justify-center px-3 transform-gpu',
        'transition-[color,transform] duration-200 ease-out',
        'group-active:scale-90 motion-reduce:transition-none motion-reduce:group-active:scale-100',
        active ? '[&_svg]:[stroke-width:2.5]' : '',
      ].join(' ')}
      style={{ color: active ? 'hsl(var(--brand))' : HP_COLOR.muted }}
    >
      <span className="relative inline-flex items-center justify-center">
        {icon}
        {badgeCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-badge font-bold leading-4 text-white shadow-[0_0_0_2px_hsl(var(--surface))]"
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </span>
    </span>
    <span
      className="mt-0.5 max-w-full overflow-hidden transition-colors duration-200"
      style={{
        ...hpType.tabBarLabel,
        fontSize: '11px',
        lineHeight: '13px',
        fontWeight: active ? 600 : 500,
        letterSpacing: '-0.01em',
        color: active ? 'hsl(var(--brand))' : HP_COLOR.muted,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </span>
  </button>
);

export const MobileBottomBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // 🛡️ MUD-DH — contador no leídas para badge en Bell mobile.
  const { data: unreadNotifsCount = 0 } = useUnreadNotificationCount();
  const handleNotificationsClick = useCallback(() => {
    if (typeof window !== 'undefined' && typeof (window as any).openNotificationCenter === 'function') {
      (window as any).openNotificationCenter();
    } else {
      navigate('/notifications');
    }
  }, [navigate]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [, setIsGoogleReady] = useState(false);
  const googleLoginButtonRef = useRef<HTMLDivElement>(null);
  const isInitializingRef = useRef(false);

  const mountGoogleButton = useCallback(async () => {
    if (isAuthenticated || isInitializingRef.current) return false;

    const buttonContainer = googleLoginButtonRef.current;
    if (!buttonContainer) return false;

    isInitializingRef.current = true;

    const ready = await ensureGoogleIdentityReady();
    if (!ready) {
      logGoogleOriginHintOnce();
      isInitializingRef.current = false;
      return false;
    }

    renderGoogleButton(buttonContainer, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
    });

    window.setTimeout(() => {
      const renderedButton = buttonContainer.querySelector('div[role="button"]');
      setIsGoogleReady(!!renderedButton);
      isInitializingRef.current = false;
    }, 200);

    return true;
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsGoogleReady(false);
      return;
    }

    void mountGoogleButton();
  }, [isAuthenticated, mountGoogleButton]);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path;
  };

  const exploreActive = isActive('/');
  const messagesActive = isActive('/messages');
  const howItWorksActive = isActive('/help');
  // profileActive solo cuando está autenticado Y está en perfil
  const profileActive = isAuthenticated && showProfileMenu;

  const handleHowItWorksClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/help');
  };

  const handleExploreClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/');
  };

  const handleMessagesClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      // Bandeja unificada: la entrada "Mensajes" abre con el filtro de consultas
      // precontratación; "Mis contrataciones" (menú) entra con el filtro contrataciones.
      navigate('/messages?filter=inquiries');
    }
  };

  const handleLoginClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAuthenticated) {
      // ✅ Si está autenticado, abrir el menú de perfil móvil
      setShowProfileMenu(true);
    } else {
      // ✅ Abrir el modal de login unificado
      setIsLoginModalOpen(true);
    }
  };

  // Handler separado para touch para evitar conflictos
  const handleLoginTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleLoginClick(e);
  };

  // Avatar del usuario autenticado (o icono de invitado) para el tab de Perfil.
  const profileIcon =
    isAuthenticated && user ? (
      <span
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          backgroundColor: HP_COLOR.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: profileActive ? '0 0 0 2px hsl(var(--brand))' : 'none',
        }}
      >
        {user.profilePictureUrl ? (
          <img
            src={user.profilePictureUrl}
            alt={user.name || 'User'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span className="text-caption font-semibold text-white">
            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
          </span>
        )}
      </span>
    ) : (
      <CircleUserRound size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
    );

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      aria-hidden="false"
      data-shared-element-id="tab-bar"
      data-xray-jira-component="Guest: Navigation: Header"
      style={{
        height: 'calc(65px + env(safe-area-inset-bottom, 0px))',
        paddingTop: '11px',
        paddingBottom: 'max(11px, env(safe-area-inset-bottom))',
        background: 'hsl(var(--surface))',
        borderTop: `1px solid ${HP_COLOR.border}`,
        boxShadow: '0 -1px 2px rgba(15,23,42,0.04), 0 -10px 28px -16px rgba(15,23,42,0.18)',
      }}
    >
      {/* Contenedor de los tabs — reparto equitativo del ancho, sin overflow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '44px',
          width: '100%',
          paddingLeft: '8px',
          paddingRight: '8px',
          gap: '4px',
        }}
      >
        {/* Explorar — siempre visible */}
        <TabButton
          label="Explorar"
          icon={<Search size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />}
          active={exploreActive}
          onClick={handleExploreClick}
        />

        {/* Ayuda — invitados y registrados */}
        <TabButton
          label="Ayuda"
          icon={<HelpCircle size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />}
          active={howItWorksActive}
          onClick={handleHowItWorksClick}
          ariaLabel="Ayuda"
        />

        {/* 🛡️ MUD-DH — Bell de notificaciones mobile.
            Antes el cliente NO tenía forma de abrir el inbox en mobile (sólo el
            experto, dentro de /expert-panel). Auditoría de 5 agentes lo marcó
            como gap P0. Click → abre el drawer global compartido. */}
        {isAuthenticated && (
          <TabButton
            label="Alertas"
            icon={<Bell size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />}
            onClick={handleNotificationsClick}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleNotificationsClick();
            }}
            badgeCount={unreadNotifsCount}
            ariaLabel={
              unreadNotifsCount > 0
                ? `Notificaciones (${unreadNotifsCount} nuevas)`
                : 'Notificaciones'
            }
            dataVeloute="pwa-tab-bar-item-notifications"
          />
        )}

        {/* Mensajes — solo cuando está autenticado */}
        {isAuthenticated && (
          <TabButton
            label="Mensajes"
            icon={<MessageSquare size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />}
            active={messagesActive}
            onClick={handleMessagesClick}
          />
        )}

        {/* Iniciar sesión / Perfil — siempre visible */}
        <TabButton
          label={isAuthenticated ? 'Perfil' : 'Entrar'}
          icon={profileIcon}
          active={profileActive}
          onClick={handleLoginClick}
          onTouchEnd={handleLoginTouch}
          dataVeloute="pwa-tab-bar-item-login"
        />
      </div>

      {/* ✅ Menú de Perfil Móvil */}
      <MobileProfileMenu
        isOpen={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        onOpenSettings={() => {
          if (typeof (window as any).openAccountSettings === 'function') {
            (window as any).openAccountSettings();
          } else {
            try {
              const event = new CustomEvent('openAccountSettings', {
                bubbles: true,
                cancelable: true,
                detail: { source: 'MobileBottomBar' },
              });
              window.dispatchEvent(event);
            } catch (error) {
              console.error('❌ MobileBottomBar - Error al disparar evento:', error);
            }
          }
        }}
      />

      {/* ✅ Contenedor para el botón de Google - Renderizado por window.google.accounts.id */}
      {!isAuthenticated && (
        <div
          ref={googleLoginButtonRef}
          id={MOBILE_GOOGLE_BUTTON_ID}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -1,
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        />
      )}

      {/* ✅ Modal de login unificado */}
      <Suspense fallback={null}>
        <LoginModalLazy
          open={isLoginModalOpen}
          onOpenChange={setIsLoginModalOpen}
          initialTab="login"
          onSuccess={() => setIsLoginModalOpen(false)}
        />
      </Suspense>
    </nav>
  );
};
