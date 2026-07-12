import * as React from 'react';

export const AdminEmptyState = ({
  icon, title, description, action,
}: { icon?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 px-6">
    {icon && (
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(220_16%_95%)] text-[hsl(var(--ap-muted))]">
        {icon}
      </div>
    )}
    <h3 className="text-sm font-bold text-[hsl(var(--ap-ink))]">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-meta text-[hsl(var(--ap-muted))]">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
