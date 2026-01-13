import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { FavoritesModal } from './FavoritesModal';
import { MobileProfileMenu } from './MobileProfileMenu';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';

export const MobileBottomBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, updateUser } = useAuth();
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const googleLoginButtonRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Detectar cuando el botón de Google está listo usando MutationObserver
  useEffect(() => {
    if (isAuthenticated) return;

    const checkGoogleButton = () => {
      const button = googleLoginButtonRef.current?.querySelector('div[role="button"]');
      if (button) {
        setIsGoogleReady(true);
        return true;
      }
      return false;
    };

    // Verificar inmediatamente
    if (checkGoogleButton()) return;

    // Usar MutationObserver para detectar cuando el botón aparece
    const observer = new MutationObserver(() => {
      if (checkGoogleButton()) {
        observer.disconnect();
      }
    });

    if (googleLoginButtonRef.current) {
      observer.observe(googleLoginButtonRef.current, {
        childList: true,
        subtree: true,
      });
    }

    // También verificar periódicamente por si acaso
    const interval = setInterval(() => {
      if (checkGoogleButton()) {
        clearInterval(interval);
      }
    }, 500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isAuthenticated]);

  // ✅ Función para intentar hacer click en el botón de Google con reintentos
  const tryClickGoogleButton = useCallback((attempt: number = 1, maxAttempts: number = 10) => {
    const googleButton = googleLoginButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
    
    if (googleButton) {
      console.log(`✅ [MobileBottomBar] Botón de Google encontrado en intento ${attempt}`);
      setIsGoogleLoading(false);
      googleButton.click();
      return;
    }

    if (attempt >= maxAttempts) {
      console.error(`❌ [MobileBottomBar] No se encontró el botón de Google después de ${maxAttempts} intentos`);
      setIsGoogleLoading(false);
      toast.error('Error al cargar Google Sign-In. Intenta de nuevo.', { duration: 4000 });
      return;
    }

    // Incrementar el delay progresivamente: 200ms, 300ms, 400ms, 500ms...
    const delay = 200 + (attempt * 100);
    console.log(`⏳ [MobileBottomBar] Intento ${attempt}/${maxAttempts}, reintentando en ${delay}ms...`);
    
    retryTimeoutRef.current = setTimeout(() => {
      tryClickGoogleButton(attempt + 1, maxAttempts);
    }, delay);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/explorar';
    }
    return location.pathname === path;
  };

  const exploreActive = isActive('/');
  const wishlistsActive = showFavoritesModal;
  const searchesActive = isActive('/busquedas');
  // profileActive solo cuando está autenticado Y está en perfil
  const profileActive = isAuthenticated && showProfileMenu;

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

  const handleSearchesClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      navigate('/busquedas');
    } else {
      handleLoginClick(e);
    }
  };


  // ✅ Handler para cuando Google Login es exitoso (devuelve JWT credential)
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      console.log('🔐 [MobileBottomBar] Autenticación con Google exitosa');
      
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      // ✅ Enviar el JWT credential al backend (formato que el backend espera)
      const result = await authService.googleAuth(credentialResponse.credential);
      
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
  };

  const handleGoogleError = () => {
    console.error('❌ [MobileBottomBar] Error en Google Login');
    toast.error('Error al iniciar sesión con Google', { duration: 4000 });
  };

  const handleLoginClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAuthenticated) {
      // ✅ Si está autenticado, abrir el menú de perfil móvil
      setShowProfileMenu(true);
    } else {
      // ✅ Evitar múltiples clicks mientras se carga
      if (isGoogleLoading) {
        console.log('⏳ [MobileBottomBar] Ya se está cargando Google...');
        return;
      }

      console.log('🔘 [MobileBottomBar] Iniciando sesión con Google...');
      setIsGoogleLoading(true);

      // Si el botón ya está listo, hacer click inmediatamente
      if (isGoogleReady) {
        const googleButton = googleLoginButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
        if (googleButton) {
          setIsGoogleLoading(false);
          googleButton.click();
          return;
        }
      }

      // Si no está listo, usar el sistema de reintentos
      tryClickGoogleButton(1, 15); // Hasta 15 intentos (~4 segundos total)
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
            width: isAuthenticated ? '80px' : '99px',
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
            width: isAuthenticated ? '80px' : '99px',
            height: '44px',
            flexShrink: 0,
            marginLeft: isAuthenticated ? '-8px' : '-20px',
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

        {/* Mis mensajes - button (solo cuando está autenticado) */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleSearchesClick}
            onTouchEnd={handleSearchesClick}
            aria-current={searchesActive ? 'page' : undefined}
            disabled={searchesActive}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '44px',
              flexShrink: 0,
              marginLeft: '-8px',
              border: 'none',
              background: 'transparent',
              padding: 0,
              color: searchesActive ? '#ec4899' : '#717171',
              cursor: searchesActive ? 'default' : 'pointer',
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
                    color: searchesActive ? '#ec4899' : '#717171',
                  }}
                />
              </div>
            </div>
            <div style={{
              fontSize: '10px',
              lineHeight: '12px',
              fontWeight: 600,
              color: searchesActive ? '#ec4899' : '#717171',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              letterSpacing: '0',
            }}>
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
            width: isAuthenticated ? '80px' : '99px',
            height: '44px',
            flexShrink: 0,
            marginLeft: isAuthenticated ? '-8px' : '-20px',
            border: 'none',
            background: 'transparent',
            padding: 0,
            color: profileActive ? '#ec4899' : '#717171',
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
                    stroke: profileActive ? '#ec4899' : '#717171',
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
            color: profileActive ? '#ec4899' : '#717171',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '0',
          }}>
            {isAuthenticated ? 'Perfil' : (isGoogleLoading ? 'Cargando...' : 'Iniciar sesión')}
          </div>
        </button>
      </div>
      
      {/* Modal de Favoritos */}
      {showFavoritesModal && (
        <FavoritesModal onClose={() => setShowFavoritesModal(false)} />
      )}

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
      
      {/* ✅ Botón de Google Login oculto - Se triggea programáticamente desde el botón custom */}
      {!isAuthenticated && (
        <div 
          ref={googleLoginButtonRef}
          style={{ 
            position: 'absolute', 
            opacity: 0, 
            pointerEvents: 'none', 
            zIndex: -1,
            width: '1px',
            height: '1px',
            overflow: 'hidden'
          }}
        >
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            auto_select={false}
          />
        </div>
      )}
    </nav>
  );
};

