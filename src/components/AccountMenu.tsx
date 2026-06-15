import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  Heart,
  CreditCard,
  Briefcase,
  UserPlus,
  Shield,
  LogOut,
  ChevronDown,
  User,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { getAuthToken } from '../lib/auth';
import { RoleChecker } from '../utils/roleChecker';

/**
 * Menú de cuenta del topbar global (desktop).
 *
 * Antes el botón "Mi cuenta" era un enlace muerto a `/busquedas` y no había forma
 * de llegar a panel de experto, transacciones, ajustes ni cerrar sesión desde el
 * header. Este dropdown porta la misma fuente de verdad de roles que el menú móvil
 * ([MobileProfileMenu]) — rol Expert vía token (`RoleChecker`), admin por email/rol,
 * y el evento global `openAccountSettings` — para que ambos no diverjan.
 *
 * `isMap`: en las variantes de mapa el trigger es un icono compacto (`sd-icon-btn`)
 * en lugar del pill con etiqueta.
 */
export const AccountMenu: React.FC<{ isMap?: boolean }> = ({ isMap = false }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // El backend serializa PascalCase; el front puede tener ambos casings.
  const userName = ((user as { Name?: string } | null)?.Name ?? user?.name ?? '').trim();
  const userEmail = (user as { Email?: string } | null)?.Email ?? user?.email ?? '';
  const userAvatar =
    (user as { ProfilePictureUrl?: string } | null)?.ProfilePictureUrl ??
    user?.profilePictureUrl ??
    '';
  const userRole: string | number | undefined =
    (user as { Role?: string | number } | null)?.Role ??
    user?.role ??
    (user as { userRole?: string | number } | null)?.userRole;

  // Detección robusta de experto: rol del objeto user o, si falla, el token JWT.
  const isExpert = useMemo(() => {
    const roleFromUser =
      userRole === 'Expert' || userRole === 'expert' || userRole === 'EXPERT' || userRole === 1;
    if (roleFromUser) return true;
    try {
      const token = getAuthToken();
      if (token) return RoleChecker.getUserRole(token) === 1; // UserRole.Expert = 1
    } catch (error) {
      console.warn('[AccountMenu] Error checking role from token:', error);
    }
    return false;
  }, [userRole, user]);

  const userIsAdmin = isAdmin(userEmail) || userRole === 'Admin' || userRole === 'admin';

  const initials = useMemo(() => {
    const src = userName || userEmail;
    if (!src) return '';
    const parts = src.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }, [userName, userEmail]);

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const renderAvatar = (size: number) =>
    userAvatar ? (
      <img
        src={userAvatar}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    ) : (
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#2563EB] font-semibold text-white"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      >
        {initials || <User className="h-4 w-4" strokeWidth={2.1} />}
      </span>
    );

  const itemClass = 'gap-3 cursor-pointer px-2.5 py-2 text-[13.5px] text-[#222]';
  const iconClass = 'h-[18px] w-[18px] shrink-0 text-[#717171]';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Mi cuenta"
          className={
            isMap
              ? 'sd-icon-btn shrink-0'
              : 'inline-flex shrink-0 items-center gap-2 rounded-full border border-[#9ca3af] bg-white py-1 pl-1 pr-2.5 text-[13px] font-semibold text-[#222222] transition-colors hover:border-[#222222] hover:bg-[#f9fafb]'
          }
        >
          {isMap ? (
            renderAvatar(24)
          ) : (
            <>
              {renderAvatar(26)}
              <span className="hidden lg:inline">Mi cuenta</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" strokeWidth={2.4} aria-hidden />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        {/* Cabecera con identidad */}
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          {renderAvatar(40)}
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-tight text-[#222]">
              {userName || 'Mi cuenta'}
            </p>
            {userEmail ? (
              <p className="truncate text-[12px] leading-tight text-[#717171]">{userEmail}</p>
            ) : null}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem className={itemClass} onClick={() => navigate('/busquedas')}>
          <Search className={iconClass} strokeWidth={2.1} />
          Mis búsquedas
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onClick={() => navigate('/mis-mensajes')}>
          <MessageSquare className={iconClass} strokeWidth={2.1} />
          Mis mensajes
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onClick={() => navigate('/favoritos')}>
          <Heart className={iconClass} strokeWidth={2.1} />
          Favoritos
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onClick={() => navigate('/transacciones')}>
          <CreditCard className={iconClass} strokeWidth={2.1} />
          Transacciones
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isExpert ? (
          <DropdownMenuItem className={itemClass} onClick={() => navigate('/expert-panel')}>
            <Briefcase className={iconClass} strokeWidth={2.1} />
            Panel de experto
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem className={itemClass} onClick={() => navigate('/become-expert')}>
            <UserPlus className={iconClass} strokeWidth={2.1} />
            Hazte revisor
          </DropdownMenuItem>
        )}
        {userIsAdmin ? (
          <DropdownMenuItem className={itemClass} onClick={() => navigate('/admin')}>
            <Shield className={iconClass} strokeWidth={2.1} />
            Panel de administración
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-3 cursor-pointer px-2.5 py-2 text-[13.5px] text-red-600 focus:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-red-600" strokeWidth={2.1} />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
