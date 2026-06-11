import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Heart, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isAdmin } from '../../utils/admin';
import { LoginModal } from '../LoginModal';
import { CurrencySelector } from '../CurrencySelector';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { SD_PAGE_INNER_MAX_CLASS } from '../../constants/homepageTypography';
import { cn } from '../../lib/utils';
import erizoImg from '../../media/erizo.png';

interface ServiceDetailDesktopHeaderProps {
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const ServiceDetailNotificationsBell: React.FC = () => {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const handleClick = () => {
    if (typeof window !== 'undefined' && typeof (window as Window & { openNotificationCenter?: () => void }).openNotificationCenter === 'function') {
      (window as Window & { openNotificationCenter?: () => void }).openNotificationCenter?.();
    }
  };

  return (
    <button
      type="button"
      aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} nuevas)` : 'Notificaciones'}
      onClick={handleClick}
      className="sd-icon-btn relative"
    >
      <Bell className="h-4 w-4" strokeWidth={2.1} />
      {unreadCount > 0 && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export const ServiceDetailDesktopHeader: React.FC<ServiceDetailDesktopHeaderProps> = ({
  onBack,
  isFavorite,
  onToggleFavorite,
}) => {
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

  return (
    <>
      <header className="sticky top-0 z-50 hidden border-b border-[#e8e8e8] bg-white/95 backdrop-blur-md lg:block">
        <div className={SD_PAGE_INNER_MAX_CLASS}>
          <div className="flex min-h-[56px] items-center justify-between gap-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" onClick={onBack} className="sd-icon-btn shrink-0" aria-label="Volver">
                <ArrowLeft className="h-4 w-4" strokeWidth={2.1} />
              </button>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                }}
                className="hidden h-9 shrink-0 items-center gap-2.5 rounded-md px-1 sm:inline-flex"
                aria-label="Inspecciono — inicio"
              >
                <img
                  src={erizoImg}
                  alt=""
                  className="h-9 w-9 -scale-x-100 object-contain"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
                <span className="text-[13px] font-semibold tracking-[-0.01em] text-[#222]">Inspecciono</span>
              </a>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    className="sd-icon-btn"
                    aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    aria-pressed={isFavorite}
                    onClick={onToggleFavorite}
                  >
                    <Heart className={cn('h-4 w-4', isFavorite && 'fill-brand text-brand')} />
                  </button>

                  <span className="mx-0.5 hidden h-5 w-px bg-[#e5e7eb] sm:block" aria-hidden />
                </>
              ) : null}

              {userIsAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Admin
                </button>
              )}
              <CurrencySelector variant="compact" />
              {user ? <ServiceDetailNotificationsBell /> : null}
              <button
                type="button"
                onClick={handleAccount}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 text-[13px] font-semibold text-[#222] transition-colors hover:bg-[#f9fafb]"
                aria-label={isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión'}
              >
                <User className="h-4 w-4 shrink-0" strokeWidth={2.1} />
                <span className="hidden xl:inline">{isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión'}</span>
              </button>
            </div>
          </div>
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
