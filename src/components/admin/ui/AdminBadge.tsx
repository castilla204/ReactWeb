import * as React from 'react';
import { cn } from '../../../lib/utils';

export type AdminTone = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'brand';

export const AdminBadge = ({
  tone = 'neutral', icon, className, children,
}: { tone?: AdminTone; icon?: React.ReactNode; className?: string; children: React.ReactNode }) => (
  <span className={cn('admin-badge', `admin-badge--${tone}`, className)}>
    {icon}
    {children}
  </span>
);

/** Pill con punto de color, para estados de fila (activo/bloqueado/etc.) */
export const AdminStatusPill = ({
  tone = 'neutral', children,
}: { tone?: AdminTone; children: React.ReactNode }) => {
  const dot: Record<AdminTone, string> = {
    neutral: 'hsl(var(--ap-muted))', success: 'hsl(var(--ap-success))',
    warning: 'hsl(var(--ap-warning))', error: 'hsl(var(--ap-error))',
    info: 'hsl(var(--ap-info))', brand: 'hsl(var(--ap-brand))',
  };
  return (
    <span className={`admin-badge admin-badge--${tone}`}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: dot[tone], display: 'inline-block' }} />
      {children}
    </span>
  );
};
