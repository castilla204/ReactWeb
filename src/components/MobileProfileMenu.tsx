import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, DollarSign, UserPlus, Briefcase, Shield, X, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { toast } from 'sonner';
import { getAuthToken } from '../lib/auth';
import { RoleChecker } from '../utils/roleChecker';

interface MobileProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const MobileProfileMenu: React.FC<MobileProfileMenuProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Obtener información del usuario - verificar múltiples formatos posibles
  const userEmail = user?.Email || user?.email;
  const userRole = user?.Role || user?.role || user?.userRole;
  
  // ✅ Detección más robusta de experto - verificar tanto el objeto user como el token
  const isExpert = useMemo(() => {
    // Primero verificar el rol del objeto user
    const roleFromUser = userRole === 'Expert' || userRole === 'expert' || userRole === 'EXPERT' || userRole === 1;
    if (roleFromUser) return true;
    
    // Si no se detecta por el rol del objeto user, verificar el token
    try {
      const token = getAuthToken();
      if (token) {
        const roleFromToken = RoleChecker.getUserRole(token);
        return roleFromToken === 1; // UserRole.Expert = 1
      }
    } catch (error) {
      console.warn('[MobileProfileMenu] Error checking role from token:', error);
    }
    
    return false;
  }, [userRole, user]);
  
  const userIsAdmin = isAdmin(userEmail) || userRole === 'Admin' || userRole === 'admin';
  
  // Debug log (solo si se activa explícitamente)
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_PROFILE === 'true') {
    console.debug('[MobileProfileMenu] User role check:', { userRole, isExpert, user });
  }

  if (!isOpen) return null;

  const handleLogout = () => {
    signOut();
    // No mostrar notificación de adiós
    onClose();
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleBecomeExpert = () => {
    if (isExpert) {
      // Si ya es experto, ir al panel de experto
      handleNavigate('/expert-panel');
    } else {
      // Si no es experto, ir a la página de registro
      handleNavigate('/become-expert');
    }
  };

  const menuItems = [
    {
      id: 'searches',
      label: 'Mis búsquedas',
      icon: Search,
      onClick: () => handleNavigate('/busquedas'),
      show: true,
    },
    {
      id: 'transactions',
      label: 'Transacciones',
      icon: DollarSign,
      onClick: () => handleNavigate('/transacciones'),
      show: true,
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      onClick: () => {
        onOpenSettings();
        onClose();
      },
      show: true,
    },
    {
      id: 'become-expert',
      label: isExpert ? 'Acceder como Revisor' : 'Hazte Revisor',
      icon: isExpert ? Briefcase : UserPlus,
      onClick: handleBecomeExpert,
      show: true,
    },
    {
      id: 'admin',
      label: 'Panel de Administración',
      icon: Shield,
      onClick: () => handleNavigate('/admin'),
      show: userIsAdmin,
    },
    {
      id: 'logout',
      label: 'Cerrar sesión',
      icon: LogOut,
      onClick: handleLogout,
      show: true,
      destructive: true,
    },
  ].filter(item => item.show);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 md:hidden shadow-2xl"
        style={{
          maxHeight: '80vh',
          animation: 'slideUp 0.3s ease-out',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2
            style={{
              fontSize: '18px',
              lineHeight: '24px',
              fontWeight: 600,
              fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
              color: 'rgb(34, 34, 34)',
              margin: 0,
              padding: 0,
            }}
          >
            Menú
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          <div className="py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  style={{
                    color: item.destructive ? 'rgb(220, 38, 38)' : 'rgb(34, 34, 34)',
                  }}
                >
                  <Icon
                    className="w-5 h-5 flex-shrink-0"
                    style={{
                      color: item.destructive ? 'rgb(220, 38, 38)' : 'rgb(113, 113, 113)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '16px',
                      lineHeight: '20px',
                      fontWeight: 400,
                      fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                      color: item.destructive ? 'rgb(220, 38, 38)' : 'rgb(34, 34, 34)',
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
