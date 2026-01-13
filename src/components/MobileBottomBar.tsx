import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { FavoritesModal } from './FavoritesModal';
import { authService } from '../services/authService';
import { toast } from 'sonner';

export const MobileBottomBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, updateUser } = useAuth();
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/explorar';
    }
    return location.pathname === path;
  };

  const exploreActive = isActive('/');
  const wishlistsActive = showFavoritesModal;
  // loginActive solo cuando está autenticado Y está en busquedas
  const loginActive = isAuthenticated && (location.pathname === '/busquedas' || location.pathname.startsWith('/busquedas'));

  const handleExploreClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/');
  };

  const handleFavoritesClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      setShowFavoritesModal(true);
    } else {
      // Si no está autenticado, redirigir a la página principal donde puede iniciar sesión
      navigate('/');
    }
  };

  // ✅ Hook oficial de Google OAuth - Maneja automáticamente la inicialización y estado
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log('🔐 [MobileBottomBar] Autenticación con Google exitosa');
        
        // Enviar el access token directamente al backend
        // El backend se encargará de validar el token con Google
        const result = await authService.googleAuth(tokenResponse.access_token);
        
        if (!result.success) {
          throw new Error('Authentication failed');
        }

        const token = authService.getAccessToken();
        if (result.user && token) {
          // Verificar MFA si es necesario
          const { RoleChecker } = await import('../utils/roleChecker');
          const userRole = RoleChecker.getUserRole(token);
          const requiresMfa = RoleChecker.requiresMfa(userRole);
          
          let shouldNavigate = true;
          
          if (requiresMfa) {
            const { mfaService } = await import('../services/mfaService');
            try {
              const mfaStatus = await mfaService.getMFAStatus();
              if (mfaStatus.isEnabled) {
                shouldNavigate = false;
                updateUser(result.user, token, () => {
                  navigate('/mfa/verify', { state: { returnTo: null } });
                });
                return;
              }
            } catch (error) {
              console.error('Error checking MFA status:', error);
            }
          }
          
          if (shouldNavigate) {
            updateUser(result.user, token, () => {
              console.log('✅ [MobileBottomBar] Autenticación exitosa');
              toast.success('¡Bienvenido!', { duration: 2000 });
            });
          }
        }
      } catch (error: any) {
        console.error('❌ [MobileBottomBar] Error durante autenticación:', error);
        const errorMessage = error?.message || 'Error al iniciar sesión. Inténtalo de nuevo.';
        toast.error(errorMessage, { duration: 5000 });
      }
    },
    onError: (error) => {
      console.error('❌ [MobileBottomBar] Error en Google Login:', error);
      toast.error('Error al iniciar sesión con Google', { duration: 4000 });
    },
    flow: 'implicit', // Usa el flujo implícito para obtener el token directamente
  });

  const handleLoginClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAuthenticated) {
      // Si está autenticado, abrir AccountSettingsModal
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
    } else {
      // ✅ Triggear el login de Google con el hook oficial
      console.log('🔘 [MobileBottomBar] Iniciando sesión con Google...');
      googleLogin();
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
            width: '99px',
            height: '44px',
            flexShrink: 0,
            border: 'none',
            background: 'transparent',
            padding: 0,
            margin: 0,
            color: exploreActive ? '#ec4899' : '#717171',
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
                stroke: exploreActive ? '#ec4899' : '#717171',
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
          <div style={{
            fontSize: '10px',
            lineHeight: '12px',
            fontWeight: 600,
            color: exploreActive ? '#ec4899' : '#717171',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '0',
          }}>
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
            width: '99px',
            height: '44px',
            flexShrink: 0,
            marginLeft: '-20px',
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: wishlistsActive ? '#ec4899' : '#717171',
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
                  stroke: wishlistsActive ? '#ec4899' : '#717171',
                  strokeWidth: '2',
                  overflow: 'visible',
                }}
              >
                <path d="m15.9998 28.6668c7.1667-4.8847 14.3334-10.8844 14.3334-18.1088 0-1.84951-.6993-3.69794-2.0988-5.10877-1.3996-1.4098-3.2332-2.11573-5.0679-2.11573-1.8336 0-3.6683.70593-5.0668 2.11573l-2.0999 2.11677-2.0988-2.11677c-1.3995-1.4098-3.2332-2.11573-5.06783-2.11573-1.83364 0-3.66831.70593-5.06683 2.11573-1.39955 1.41083-2.09984 3.25926-2.09984 5.10877 0 7.2244 7.16667 13.2241 14.3333 18.1088z"></path>
              </svg>
            </div>
          </div>
          {/* div._1xhupxb - Texto */}
          <div style={{
            fontSize: '10px',
            lineHeight: '12px',
            fontWeight: 600,
            color: wishlistsActive ? '#ec4899' : '#717171',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '0',
          }}>
            Favoritos
          </div>
        </button>

        {/* Log in - button */}
        <button
          type="button"
          onClick={handleLoginClick}
          onTouchEnd={handleLoginTouch}
          aria-current={loginActive ? 'page' : undefined}
          disabled={false}
          data-veloute="pwa-tab-bar-item-login"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '99px',
            height: '44px',
            flexShrink: 0,
            marginLeft: '-20px',
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: loginActive ? '#ec4899' : '#717171',
            cursor: loginActive ? 'default' : 'pointer',
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
                    stroke: loginActive ? '#ec4899' : '#717171',
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
          <div style={{
            fontSize: '10px',
            lineHeight: '12px',
            fontWeight: 600,
            color: loginActive ? '#ec4899' : '#717171',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '0',
          }}>
            {isAuthenticated ? 'Perfil' : 'Iniciar sesión'}
          </div>
        </button>
      </div>
      
      {/* Modal de Favoritos */}
      {showFavoritesModal && (
        <FavoritesModal onClose={() => setShowFavoritesModal(false)} />
      )}
    </nav>
  );
};

