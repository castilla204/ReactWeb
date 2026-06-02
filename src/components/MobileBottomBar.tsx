import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MobileProfileMenu } from './MobileProfileMenu';
import { LoginModal } from './LoginModal';
import { authService } from '../services/authService';
import { HelpCircle, MessageSquare } from 'lucide-react';
import { UserRole, RoleChecker } from '../utils/roleChecker';
import {
  ensureGoogleIdentityReady,
  logGoogleOriginHintOnce,
  renderGoogleButton,
} from '../lib/googleIdentity';
import { HP_COLOR, hpType } from '../constants/homepageTypography';

const tabLabelStyle = (active: boolean): React.CSSProperties => ({
  ...hpType.tabBarLabel,
  color: active ? HP_COLOR.brand : HP_COLOR.muted,
});

// ID único para este componente para evitar conflictos
const MOBILE_GOOGLE_BUTTON_ID = 'mobile-bottom-bar-google-btn';

export const MobileBottomBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
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
      return location.pathname === '/' || location.pathname === '/explorar';
    }
    return location.pathname === path;
  };

  const exploreActive = isActive('/');
  const wishlistsActive = isActive('/favoritos');
  const searchesActive = isActive('/busquedas');
  const messagesActive = isActive('/mis-mensajes');
  const howItWorksActive = isActive('/como-funciona');
  // profileActive solo cuando está autenticado Y está en perfil
  const profileActive = isAuthenticated && showProfileMenu;

  const tabWidth = isAuthenticated ? '64px' : '72px';
  const tabMargin = isAuthenticated ? '-4px' : '-6px';

  const handleHowItWorksClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/como-funciona');
  };

  const handleExploreClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/');
  };

  const handleFavoritesClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      navigate('/favoritos');
    } else {
      // Si no está autenticado, redirigir a la página principal donde puede iniciar sesión
      navigate('/');
    }
  };

  const handleMessagesClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      navigate('/mis-mensajes');
    }
  };

  const handleSearchesClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      // Verificar si el usuario es experto
      const userRole = user?.role;
      let isExpert = false;
      
      // Verificar por rol del objeto user
      if (userRole === 'Expert' || userRole === 'expert' || userRole === 'EXPERT' || userRole === UserRole.Expert) {
        isExpert = true;
      }
      
      // Si no se detecta por el rol del objeto user, verificar el token
      if (!isExpert) {
        try {
          const token = authService.getAccessToken();
          if (token) {
            const roleFromToken = RoleChecker.getUserRole(token);
            isExpert = roleFromToken === UserRole.Expert;
          }
        } catch (error) {
          console.warn('[MobileBottomBar] Error checking role from token:', error);
        }
      }
      
      // Si es experto, ir al panel de experto en el tab de contratación
      if (isExpert) {
        navigate('/expert-panel?tab=hires');
      } else {
        navigate('/busquedas');
      }
    } else {
      handleLoginClick(e);
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

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      aria-hidden="false"
      data-shared-element-id="tab-bar"
      data-xray-jira-component="Guest: Navigation: Header"
      style={{
        height: '65px',
        paddingTop: '11px',
        paddingBottom: 'max(11px, env(safe-area-inset-bottom))',
      }}
    >
      {/* div._18ybk0k - Contenedor de los enlaces */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '44px',
        paddingLeft: '4px',
        paddingRight: '4px',
        maxWidth: '100%',
        width: '100%',
        gap: '0px',
      }}>
        {/* Explore - button */}
        <button
          type="button"
          onClick={handleExploreClick}
          onTouchEnd={handleExploreClick}
          aria-current={exploreActive ? 'page' : undefined}
          disabled={exploreActive}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: tabWidth,
            height: '44px',
            flexShrink: 0,
            border: 'none',
            background: 'transparent',
            padding: 0,
            margin: 0,
            color: exploreActive ? '#0066CC' : '#717171',
            cursor: exploreActive ? 'default' : 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* div._rz58lf5 - Contenedor del icono */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
          }}>
            {/* div._1kbkc83g - Contenedor del SVG */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                role="presentation"
                focusable="false"
              style={{
                display: 'block',
                fill: 'none',
                height: '24px',
                width: '24px',
                stroke: exploreActive ? '#0066CC' : '#717171',
                strokeWidth: '2.66667',
                overflow: 'visible',
              }}
              >
                <path d="m20.666 20.666 10 10"></path>
                <path d="m24.0002 12.6668c0 6.2593-5.0741 11.3334-11.3334 11.3334-6.2592 0-11.3333-5.0741-11.3333-11.3334 0-6.2592 5.0741-11.3333 11.3333-11.3333 6.2593 0 11.3334 5.0741 11.3334 11.3333z" fill="none"></path>
              </svg>
            </div>
          </div>
          {/* div._1sg9eagp - Texto */}
          <div style={tabLabelStyle(exploreActive)}>
            Explorar
          </div>
        </button>

        {/* Wishlists - button */}
        <button
          type="button"
          onClick={handleFavoritesClick}
          onTouchEnd={handleFavoritesClick}
          aria-current={wishlistsActive ? 'page' : undefined}
          disabled={wishlistsActive}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: tabWidth,
            height: '44px',
            flexShrink: 0,
            marginLeft: tabMargin,
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: wishlistsActive ? '#0066CC' : '#717171',
            cursor: wishlistsActive ? 'default' : 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* div._rz58lf5 - Contenedor del icono */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
          }}>
            {/* div._1xcgt9rg - Contenedor del SVG */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                role="presentation"
                focusable="false"
                style={{
                  display: 'block',
                  fill: 'none',
                  height: '24px',
                  width: '24px',
                  stroke: wishlistsActive ? '#0066CC' : '#717171',
                  strokeWidth: '2',
                  overflow: 'visible',
                }}
              >
                <path d="m15.9998 28.6668c7.1667-4.8847 14.3334-10.8844 14.3334-18.1088 0-1.84951-.6993-3.69794-2.0988-5.10877-1.3996-1.4098-3.2332-2.11573-5.0679-2.11573-1.8336 0-3.6683.70593-5.0668 2.11573l-2.0999 2.11677-2.0988-2.11677c-1.3995-1.4098-3.2332-2.11573-5.06783-2.11573-1.83364 0-3.66831.70593-5.06683 2.11573-1.39955 1.41083-2.09984 3.25926-2.09984 5.10877 0 7.2244 7.16667 13.2241 14.3333 18.1088z"></path>
              </svg>
            </div>
          </div>
          {/* div._1xhupxb - Texto */}
          <div style={tabLabelStyle(wishlistsActive)}>
            Favoritos
          </div>
        </button>

        {/* Ayuda — invitados y registrados */}
        <button
          type="button"
          onClick={handleHowItWorksClick}
          onTouchEnd={handleHowItWorksClick}
          aria-current={howItWorksActive ? 'page' : undefined}
          aria-label="Cómo funciona"
          disabled={howItWorksActive}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: tabWidth,
            height: '44px',
            flexShrink: 0,
            marginLeft: tabMargin,
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: howItWorksActive ? '#0066CC' : '#717171',
            cursor: howItWorksActive ? 'default' : 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px',
            }}
          >
            <HelpCircle
              size={24}
              strokeWidth={2}
              style={{ color: howItWorksActive ? '#0066CC' : '#717171' }}
              aria-hidden
            />
          </div>
          <div style={tabLabelStyle(howItWorksActive)}>Ayuda</div>
        </button>

        {/* Mis mensajes - button (solo cuando está autenticado) */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleMessagesClick}
            onTouchEnd={handleMessagesClick}
            aria-current={messagesActive ? 'page' : undefined}
            disabled={messagesActive}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: tabWidth,
              height: '44px',
              flexShrink: 0,
              marginLeft: tabMargin,
              border: 'none',
              background: 'transparent',
              padding: 0,
              color: messagesActive ? '#0066CC' : '#717171',
              cursor: messagesActive ? 'default' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MessageSquare
                  size={24}
                  strokeWidth={2}
                  style={{
                    color: messagesActive ? '#0066CC' : '#717171',
                  }}
                />
              </div>
            </div>
            <div style={tabLabelStyle(messagesActive)}>
              Mis mensajes
            </div>
          </button>
        )}

        {/* Log in / Perfil - button */}
        <button
          type="button"
          onClick={handleLoginClick}
          onTouchEnd={handleLoginTouch}
          aria-current={profileActive ? 'page' : undefined}
          disabled={false}
          data-veloute="pwa-tab-bar-item-login"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: tabWidth,
            height: '44px',
            flexShrink: 0,
            marginLeft: tabMargin,
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: profileActive ? '#0066CC' : '#717171',
            cursor: profileActive ? 'default' : 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* div._jro6t0 - Contenedor del icono */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
          }}>
            {/* div._39ksk0 - Contenedor del SVG/Avatar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
            }}>
              {isAuthenticated && user ? (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: '#717171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {user.profilePictureUrl ? (
                    <img
                      src={user.profilePictureUrl}
                      alt={user.name || 'User'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <span style={{
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              ) : (
                <svg
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  role="presentation"
                  focusable="false"
                  style={{
                    display: 'block',
                    fill: 'none',
                    height: '24px',
                    width: '24px',
                    stroke: profileActive ? '#0066CC' : '#717171',
                    strokeWidth: '2',
                    overflow: 'visible',
                  }}
                >
                  <g fill="none">
                    <circle cx="16" cy="16" r="14"></circle>
                    <path d="m26.46 25.62c-1.58-2.81-4.26-4.9-7.46-5.73v-.72c1.79-1.04 3-2.96 3-5.17 0-3.31-2.69-6-6-6s-6 2.69-6 6c0 2.22 1.21 4.14 3 5.17v.72c-3.16.82-5.83 2.87-7.42 5.64"></path>
                  </g>
                </svg>
              )}
            </div>
          </div>
          {/* div._1xhupxb - Texto */}
          <div style={tabLabelStyle(profileActive)}>
            {isAuthenticated ? 'Perfil' : 'Iniciar sesión'}
          </div>
        </button>
      </div>
      
      {/* Modal de Favoritos */}

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
                detail: { source: 'MobileBottomBar' }
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
            overflow: 'hidden'
          }}
        />
      )}

      {/* ✅ Modal de login unificado */}
      <LoginModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        initialTab="login"
        onSuccess={() => setIsLoginModalOpen(false)}
      />
    </nav>
  );
};

