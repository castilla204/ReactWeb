import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { LoginModal } from './LoginModal';
import { CurrencySelector } from './CurrencySelector';
import { SD_PAGE_INNER_MAX_CLASS } from '../constants/homepageTypography';

/**
 * Barra superior desktop de la homepage (cuenta, moneda, favoritos).
 * Reutilizable en ficha de servicio sin el hero Kayak.
 */
export interface HomepageDesktopTopBarProps {
  /** En ficha de servicio: sustituye "Mi cuenta" por volver */
  onBack?: () => void;
}

export const HomepageDesktopTopBar: React.FC<HomepageDesktopTopBarProps> = ({ onBack }) => {
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

  return (
    <>
      <header
        className="sticky top-0 z-50 hidden md:block border-b border-[#dbe8f5]/80"
        style={{
          background: 'linear-gradient(128deg, #dceaf8 0%, #eaf2fb 34%, #fafafa 100%)',
        }}
      >
        <div className={`${SD_PAGE_INNER_MAX_CLASS} flex h-12 items-center justify-between`}>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-[#d1d5db] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#222222] transition-colors hover:border-[#222222] hover:bg-[#f9fafb]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.1} />
              Volver
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/busquedas');
                } else {
                  setIsLoginModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#d1d5db] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#222222] transition-colors hover:border-[#222222] hover:bg-[#f9fafb]"
            >
              <User className="h-4 w-4 shrink-0" strokeWidth={2.1} />
              {isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión'}
            </button>
          )}

          <div className="flex items-center gap-2">
            {userIsAdmin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Admin
              </button>
            )}
            <CurrencySelector variant="compact" />
            <button
              type="button"
              aria-label="Favoritos"
              onClick={() => navigate('/favoritos')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#222] transition-colors hover:bg-[#f9fafb]"
            >
              <Heart className="h-4 w-4" />
            </button>
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
