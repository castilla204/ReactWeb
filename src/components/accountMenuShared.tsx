import React, { useMemo } from 'react';
import {
  ClipboardList,
  MessageSquare,
  Heart,
  CreditCard,
  Briefcase,
  UserPlus,
  Shield,
  Settings,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import { getAuthToken } from '../lib/auth';
import { RoleChecker } from '../utils/roleChecker';

/**
 * Fuente de verdad ÚNICA del menú de cuenta (desktop [AccountMenu] y móvil
 * [MobileProfileMenu]): identidad del usuario, roles y entradas de navegación.
 * Antes cada componente llevaba su copia y ya habían divergido (iconos,
 * tamaños, orden); cualquier entrada nueva se añade aquí y aparece en ambos.
 */

export type AccountMenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: () => void;
  destructive?: boolean;
  highlight?: boolean;
};

export function useAccountIdentity() {
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
      console.warn('[accountMenu] Error checking role from token:', error);
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return { userName, userEmail, userAvatar, initials, roleHint, isExpert, userIsAdmin, signOut };
}

export function buildAccountMenuGroups(opts: {
  isExpert: boolean;
  userIsAdmin: boolean;
  /** Navega y (en móvil) cierra el menú. */
  go: (path: string) => void;
  openSettings: () => void;
}): AccountMenuItem[][] {
  const { isExpert, userIsAdmin, go, openSettings } = opts;
  return [
    [
      // Ambas entradas van a la bandeja unificada, cada una con su filtro
      // (/busquedas redirige salvo admin)
      { id: 'searches', label: 'Mis contrataciones', icon: ClipboardList, onClick: () => go('/hires') },
      { id: 'messages', label: 'Mis mensajes', icon: MessageSquare, onClick: () => go('/messages?filter=inquiries') },
      { id: 'favorites', label: 'Favoritos', icon: Heart, onClick: () => go('/favorites') },
      { id: 'transactions', label: 'Transacciones', icon: CreditCard, onClick: () => go('/account/transactions') },
    ],
    [
      {
        id: 'become-expert',
        label: isExpert ? 'Panel de experto' : 'Hazte revisor',
        icon: isExpert ? Briefcase : UserPlus,
        onClick: () => go(isExpert ? '/expert' : '/expert/join'),
        highlight: !isExpert,
      },
      ...(userIsAdmin
        ? [{ id: 'admin', label: 'Administración', icon: Shield, onClick: () => go('/admin') }]
        : []),
      { id: 'settings', label: 'Configuración', icon: Settings, onClick: openSettings },
    ],
  ];
}

/** Avatar de cuenta: foto si existe, iniciales sobre azul de marca si no. */
export const AccountAvatar: React.FC<{ src: string; initials: string; size: number }> = ({
  src,
  initials,
  size,
}) =>
  src ? (
    <img
      src={src}
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

/**
 * Cabecera de identidad compartida (avatar + nombre + email · rol).
 * `nameClass`/`metaClass` dejan al contenedor decidir la escala (el sheet
 * móvil usa un paso más grande que el dropdown desktop).
 */
export const AccountIdentityHeader: React.FC<{
  avatarSize: number;
  className?: string;
  nameClass: string;
  metaClass: string;
}> = ({ avatarSize, className, nameClass, metaClass }) => {
  const { userName, userEmail, userAvatar, initials, roleHint } = useAccountIdentity();
  return (
    <div className={className}>
      <AccountAvatar src={userAvatar} initials={initials} size={avatarSize} />
      <div className="min-w-0 flex-1">
        <p className={nameClass}>{userName || 'Mi cuenta'}</p>
        {userEmail ? (
          <p className={metaClass}>
            {userEmail}
            {roleHint ? <span className="text-brand">{roleHint}</span> : null}
          </p>
        ) : roleHint ? (
          <p className={metaClass.replace('text-ink-muted', 'text-brand')}>
            {roleHint.replace(/^ · /, '')}
          </p>
        ) : null}
      </div>
    </div>
  );
};
