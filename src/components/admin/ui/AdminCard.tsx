import * as React from 'react';
import { cn } from '../../../lib/utils';

export const AdminCard = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('admin-card', className)} {...p} />
);

export const AdminCardHeader = ({
  title, description, actions, className,
}: { title?: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string }) => (
  <div className={cn('admin-card-header flex items-start justify-between gap-3', className)}>
    <div>
      {title && <div className="admin-card-title">{title}</div>}
      {description && <div className="admin-card-desc">{description}</div>}
    </div>
    {actions}
  </div>
);

export const AdminCardBody = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('admin-card-body', className)} {...p} />
);
