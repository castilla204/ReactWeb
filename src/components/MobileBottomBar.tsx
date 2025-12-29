import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const MobileBottomBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/explorar';
    }
    return location.pathname === path;
  };

  const exploreActive = isActive('/');
  const wishlistsActive = isActive('/wishlists');
  const loginActive = isActive('/login') || isActive('/profile');

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      aria-hidden="false"
      data-shared-element-id="tab-bar"
      data-xray-jira-component="Guest: Navigation: Header"
      style={{
        height: '65px',
        paddingTop: '11px',
        paddingBottom: '11px',
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
        {/* Explore - a._c1l7p5r */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          type="button"
          aria-current={exploreActive ? 'page' : undefined}
          aria-disabled={exploreActive}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '99px',
            height: '44px',
            flexShrink: 0,
            textDecoration: 'none',
            color: exploreActive ? '#222222' : '#717171',
            cursor: exploreActive ? 'default' : 'pointer',
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
                  stroke: exploreActive ? '#222222' : '#717171',
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
            color: exploreActive ? '#222222' : '#717171',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '0',
          }}>
            Explorar
          </div>
        </a>

        {/* Wishlists - a._5iid4lr */}
        <a
          href="/wishlists"
          onClick={(e) => {
            e.preventDefault();
            navigate('/wishlists');
          }}
          type="button"
          aria-current={wishlistsActive ? 'page' : undefined}
          aria-disabled={wishlistsActive}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '99px',
            height: '44px',
            flexShrink: 0,
            marginLeft: '-20px',
            textDecoration: 'none',
            color: wishlistsActive ? '#222222' : '#717171',
            cursor: wishlistsActive ? 'default' : 'pointer',
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
                  stroke: wishlistsActive ? '#222222' : '#717171',
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
            color: wishlistsActive ? '#222222' : '#717171',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '0',
          }}>
            Favoritos
          </div>
        </a>

        {/* Log in - a._hbhnx1i */}
        <a
          href={isAuthenticated ? "/profile" : "/login"}
          onClick={(e) => {
            e.preventDefault();
            navigate(isAuthenticated ? '/profile' : '/login');
          }}
          type="button"
          aria-current={loginActive ? 'page' : undefined}
          aria-disabled={loginActive}
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
            textDecoration: 'none',
            color: loginActive ? '#222222' : '#717171',
            cursor: loginActive ? 'default' : 'pointer',
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
                    stroke: loginActive ? '#222222' : '#717171',
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
            color: loginActive ? '#222222' : '#717171',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '0',
          }}>
            Iniciar sesión
          </div>
        </a>
      </div>
    </nav>
  );
};

