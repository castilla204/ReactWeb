import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from './ui/sheet';
import {
  AccountIdentityHeader,
  buildAccountMenuGroups,
  useAccountIdentity,
  type AccountMenuItem,
} from './accountMenuShared';
import { cn } from '../lib/utils';

interface MobileProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

/**
 * Sheet inferior de cuenta (móvil). Identidad, roles y entradas viven en
 * [accountMenuShared] (compartidos con el dropdown desktop [AccountMenu]).
 *
 * ⚠️ Tamaño de fuente en arbitrario (`text-[14px]`): `cn()` usa twMerge sin
 * extend y descarta los tokens fontSize (text-body…) cuando conviven con otro
 * `text-*` de color en la misma lista — ver memoria del proyecto.
 */
export const MobileProfileMenu: React.FC<MobileProfileMenuProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const navigate = useNavigate();
  const { isExpert, userIsAdmin, signOut } = useAccountIdentity();

  const handleLogout = () => {
    signOut();
    onClose();
    navigate('/');
  };

  const menuGroups = buildAccountMenuGroups({
    isExpert,
    userIsAdmin,
    go: (path) => {
      navigate(path);
      onClose();
    },
    openSettings: () => {
      onOpenSettings();
      onClose();
    },
  });

  const renderMenuItem = (item: AccountMenuItem) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={item.onClick}
        className={cn(
          'group flex min-h-[44px] w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors',
          item.destructive ? 'hover:bg-red-50 active:bg-red-100' : 'hover:bg-surface-tinted active:bg-line/40',
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0',
            item.destructive ? 'text-destructive-text' : item.highlight ? 'text-brand' : 'text-ink-muted',
          )}
          strokeWidth={2.1}
        />
        <span
          className={cn(
            'min-w-0 flex-1 text-[14px] font-medium leading-none',
            item.destructive ? 'text-destructive-text' : 'text-ink',
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
        className="account-sheet-up md:hidden max-h-[75dvh] gap-0 rounded-t-2xl border-0 p-0 pb-[max(12px,env(safe-area-inset-bottom))] [&>button]:hidden"
        overlayClassName="account-sheet-overlay"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">Menú de cuenta</SheetTitle>

        <div className="flex justify-center pt-2 pb-0.5" aria-hidden>
          <div className="h-1 w-9 rounded-full bg-line" />
        </div>

        <AccountIdentityHeader
          avatarSize={36}
          className="flex items-center gap-2.5 border-b border-line px-4 py-2.5"
          nameClass="truncate text-lead font-semibold leading-tight text-ink"
          metaClass="truncate text-caption leading-tight text-ink-muted"
        />

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
