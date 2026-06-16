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
  ChevronRight,
  User,
  Settings,
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
import { cn } from '../lib/utils';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: () => void;
  destructive?: boolean;
  highlight?: boolean;
};

function openAccountSettings() {
  if (typeof (window as { openAccountSettings?: () => void }).openAccountSettings === 'function') {
    (window as { openAccountSettings?: () => void }).openAccountSettings!();
    return;
  }
  window.dispatchEvent(
    new CustomEvent('openAccountSettings', {
      bubbles: true,
      cancelable: true,
      detail: { source: 'AccountMenu' },
    }),
  );
}

/**
 * Menú de cuenta del topbar global (desktop).
 * Misma fuente de verdad de roles y rutas que [MobileProfileMenu].
 */
export const AccountMenu: React.FC<{ isMap?: boolean }> = ({ isMap = false }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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

  const isExpert = useMemo(() => {
    const roleFromUser =
      userRole === 'Expert' || userRole === 'expert' || userRole === 'EXPERT' || userRole === 1;
    if (roleFromUser) return true;
    try {
      const token = getAuthToken();
      if (token) return RoleChecker.getUserRole(token) === 1;
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

  const roleHint = useMemo(() => {
    const parts: string[] = [];
    if (isExpert) parts.push('Revisor');
    if (userIsAdmin) parts.push('Admin');
    return parts.length ? ` · ${parts.join(' · ')}` : '';
  }, [isExpert, userIsAdmin]);

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const menuGroups: MenuItem[][] = [
    [
      { id: 'searches', label: 'Mis búsquedas', icon: Search, onClick: () => navigate('/busquedas') },
      { id: 'messages', label: 'Mis mensajes', icon: MessageSquare, onClick: () => navigate('/mis-mensajes') },
      { id: 'favorites', label: 'Favoritos', icon: Heart, onClick: () => navigate('/favoritos') },
      { id: 'transactions', label: 'Transacciones', icon: CreditCard, onClick: () => navigate('/transacciones') },
    ],
    [
      {
        id: 'become-expert',
        label: isExpert ? 'Panel de experto' : 'Hazte revisor',
        icon: isExpert ? Briefcase : UserPlus,
        onClick: () => navigate(isExpert ? '/expert-panel' : '/become-expert'),
        highlight: !isExpert,
      },
      ...(userIsAdmin
        ? [{ id: 'admin', label: 'Administración', icon: Shield, onClick: () => navigate('/admin') }]
        : []),
      { id: 'settings', label: 'Configuración', icon: Settings, onClick: openAccountSettings },
    ],
  ];

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
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-white"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      >
        {initials || <User className="h-4 w-4" strokeWidth={2.1} />}
      </span>
    );

  const itemClass = cn(
    'group mx-1 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5',
    'text-[13.5px] font-medium text-[#222222]',
    'focus:bg-[#f5f5f5] data-[highlighted]:bg-[#f5f5f5]',
  );

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    return (
      <DropdownMenuItem
        key={item.id}
        className={cn(
          itemClass,
          item.destructive && 'text-red-600 focus:text-red-600 data-[highlighted]:bg-red-50',
        )}
        onClick={item.onClick}
      >
        <Icon
          className={cn(
            'h-[17px] w-[17px] shrink-0',
            item.destructive ? 'text-red-600' : item.highlight ? 'text-brand' : 'text-[#717171]',
          )}
          strokeWidth={2.1}
        />
        <span className="min-w-0 flex-1 leading-none">{item.label}</span>
        {!item.destructive ? (
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-[#d1d5db] opacity-0 transition-opacity group-focus:opacity-100 group-data-[highlighted]:opacity-100"
            strokeWidth={2.2}
            aria-hidden
          />
        ) : null}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Mi cuenta"
          className={
            isMap
              ? 'sd-icon-btn shrink-0'
              : 'inline-flex shrink-0 items-center gap-2 rounded-full border border-[#dddddd] bg-white py-1 pl-1 pr-2.5 text-[13px] font-semibold text-[#222222] shadow-sm transition-colors hover:border-[#b0b0b0] hover:bg-[#fafafa]'
          }
        >
          {isMap ? (
            renderAvatar(24)
          ) : (
            <>
              {renderAvatar(26)}
              <span className="hidden lg:inline">Mi cuenta</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#717171]" strokeWidth={2.4} aria-hidden />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[248px] overflow-hidden rounded-xl border border-[#ebebeb] bg-white p-0 shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
      >
        <div className="flex items-center gap-2.5 border-b border-[#ebebeb] px-3 py-2.5">
          {renderAvatar(36)}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold leading-tight text-[#222222]">
              {userName || 'Mi cuenta'}
            </p>
            {userEmail ? (
              <p className="truncate text-[11.5px] leading-tight text-[#717171]">
                {userEmail}
                {roleHint ? <span className="text-brand">{roleHint}</span> : null}
              </p>
            ) : roleHint ? (
              <p className="text-[11.5px] leading-tight text-brand">{roleHint.replace(/^ · /, '')}</p>
            ) : null}
          </div>
        </div>

        <div className="py-1">
          {menuGroups.map((group, index) => (
            <React.Fragment key={index}>
              {index > 0 ? <DropdownMenuSeparator className="my-1 bg-[#ebebeb]" /> : null}
              {group.map(renderMenuItem)}
            </React.Fragment>
          ))}

          <DropdownMenuSeparator className="my-1 bg-[#ebebeb]" />

          {renderMenuItem({
            id: 'logout',
            label: 'Cerrar sesión',
            icon: LogOut,
            onClick: handleLogout,
            destructive: true,
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
