import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  AccountAvatar,
  AccountIdentityHeader,
  buildAccountMenuGroups,
  useAccountIdentity,
  type AccountMenuItem,
} from './accountMenuShared';
import { cn } from '../lib/utils';

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
 * Menú de cuenta del topbar global (desktop). Identidad, roles y entradas
 * viven en [accountMenuShared] (compartidos con el sheet móvil).
 *
 * ⚠️ Tamaños de fuente en arbitrarios (`text-[13px]`): `cn()` usa twMerge sin
 * extend y descarta los tokens fontSize (text-meta/body…) cuando conviven con
 * otro `text-*` de color en la misma lista — ver memoria del proyecto.
 */
export const AccountMenu: React.FC = () => {
  const navigate = useNavigate();
  const { userAvatar, initials, isExpert, userIsAdmin, signOut } = useAccountIdentity();

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const menuGroups = buildAccountMenuGroups({
    isExpert,
    userIsAdmin,
    go: navigate,
    openSettings: openAccountSettings,
  });

  const renderMenuItem = (item: AccountMenuItem) => {
    const Icon = item.icon;
    return (
      <DropdownMenuItem
        key={item.id}
        className={cn(
          'group mx-1 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5',
          'text-[13px] font-medium leading-[18px]',
          item.destructive
            ? 'text-destructive-text focus:bg-red-50 focus:text-destructive-text data-[highlighted]:bg-red-50'
            : 'text-ink focus:bg-line/40 data-[highlighted]:bg-line/40',
        )}
        onClick={item.onClick}
      >
        <Icon
          className={cn(
            'h-[17px] w-[17px] shrink-0',
            item.destructive ? 'text-destructive-text' : item.highlight ? 'text-brand' : 'text-ink-muted',
          )}
          strokeWidth={2.1}
        />
        <span className="min-w-0 flex-1 leading-none">{item.label}</span>
        {!item.destructive ? (
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-ink-soft opacity-0 transition-opacity group-focus:opacity-100 group-data-[highlighted]:opacity-100 motion-reduce:transition-none"
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
          className={cn(
            'group inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-2.5',
            'text-[13px] font-semibold leading-[18px] text-ink shadow-sm transition-colors',
            'hover:border-ink-soft hover:bg-surface-tinted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1',
          )}
        >
          <AccountAvatar src={userAvatar} initials={initials} size={26} />
          <span className="hidden lg:inline">Mi cuenta</span>
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            strokeWidth={2.4}
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="account-menu-pop w-[248px] overflow-hidden rounded-xl border border-line bg-white p-0 shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
      >
        <AccountIdentityHeader
          avatarSize={36}
          className="flex items-center gap-2.5 border-b border-line px-3 py-2.5"
          nameClass="truncate text-body font-semibold leading-tight text-ink"
          metaClass="truncate text-caption leading-tight text-ink-muted"
        />

        <div className="py-1">
          {menuGroups.map((group, index) => (
            <React.Fragment key={index}>
              {index > 0 ? <DropdownMenuSeparator className="my-1 bg-line" /> : null}
              {group.map(renderMenuItem)}
            </React.Fragment>
          ))}

          <DropdownMenuSeparator className="my-1 bg-line" />

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
