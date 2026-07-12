import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  LogOut,
  CreditCard,
  UserPlus,
  Briefcase,
  Shield,
  Search,
  MessageSquare,
  Heart,
  User,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { getAuthToken } from '../lib/auth';
import { RoleChecker } from '../utils/roleChecker';
import { Sheet, SheetContent, SheetTitle } from './ui/sheet';
import { cn } from '../lib/utils';

interface MobileProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: () => void;
  destructive?: boolean;
  highlight?: boolean;
};

export const MobileProfileMenu: React.FC<MobileProfileMenuProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
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
      console.warn('[MobileProfileMenu] Error checking role from token:', error);
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
    onClose();
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const menuGroups: MenuItem[][] = [
    [
      // Ambas entradas van a la bandeja unificada, cada una con su filtro (/busquedas redirige salvo admin)
      { id: 'searches', label: 'Mis contrataciones', icon: Search, onClick: () => handleNavigate('/hires') },
      { id: 'messages', label: 'Mis mensajes', icon: MessageSquare, onClick: () => handleNavigate('/messages?filter=inquiries') },
      { id: 'favorites', label: 'Favoritos', icon: Heart, onClick: () => handleNavigate('/favorites') },
      { id: 'transactions', label: 'Transacciones', icon: CreditCard, onClick: () => handleNavigate('/account/transactions') },
    ],
    [
      {
        id: 'become-expert',
        label: isExpert ? 'Panel de experto' : 'Hazte revisor',
        icon: isExpert ? Briefcase : UserPlus,
        onClick: () => handleNavigate(isExpert ? '/expert' : '/expert/join'),
        highlight: !isExpert,
      },
      ...(userIsAdmin
        ? [{ id: 'admin', label: 'Administración', icon: Shield, onClick: () => handleNavigate('/admin') }]
        : []),
      {
        id: 'settings',
        label: 'Configuración',
        icon: Settings,
        onClick: () => {
          onOpenSettings();
          onClose();
        },
      },
    ],
  ];

  const renderAvatar = () =>
    userAvatar ? (
      <img src={userAvatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
    ) : (
      <span
        aria-hidden
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-meta font-semibold text-white"
      >
        {initials || <User className="h-4 w-4" strokeWidth={2.1} />}
      </span>
    );

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={item.onClick}
        className={cn(
          'group flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors',
          item.destructive ? 'hover:bg-red-50 active:bg-red-100' : 'hover:bg-surface-tinted active:bg-line/40',
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0',
            item.destructive ? 'text-red-600' : item.highlight ? 'text-brand' : 'text-ink-muted',
          )}
          strokeWidth={2.1}
        />
        <span
          className={cn(
            'min-w-0 flex-1 text-body font-medium leading-none',
            item.destructive ? 'text-red-600' : 'text-ink',
          )}
        >
          {item.label}
        </span>
        {!item.destructive ? (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-soft" strokeWidth={2.2} aria-hidden />
        ) : null}
      </button>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="md:hidden max-h-[75vh] gap-0 rounded-t-2xl border-0 p-0 pb-[max(12px,env(safe-area-inset-bottom))] [&>button]:hidden"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">Menú de cuenta</SheetTitle>

        <div className="flex justify-center pt-2 pb-0.5" aria-hidden>
          <div className="h-1 w-9 rounded-full bg-line" />
        </div>

        <div className="flex items-center gap-2.5 border-b border-line px-4 py-2.5">
          {renderAvatar()}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lead font-semibold leading-tight text-ink">
              {userName || 'Mi cuenta'}
            </p>
            {userEmail ? (
              <p className="truncate text-caption leading-tight text-ink-muted">
                {userEmail}
                {roleHint ? <span className="text-brand">{roleHint}</span> : null}
              </p>
            ) : roleHint ? (
              <p className="text-caption leading-tight text-brand">{roleHint.replace(/^ · /, '')}</p>
            ) : null}
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain py-1">
          {menuGroups.map((group, index) => (
            <React.Fragment key={index}>
              {index > 0 ? <div className="mx-4 my-0.5 h-px bg-line" /> : null}
              <div>{group.map(renderMenuItem)}</div>
            </React.Fragment>
          ))}

          <div className="mx-4 my-0.5 h-px bg-line" />

          {renderMenuItem({
            id: 'logout',
            label: 'Cerrar sesión',
            icon: LogOut,
            onClick: handleLogout,
            destructive: true,
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
