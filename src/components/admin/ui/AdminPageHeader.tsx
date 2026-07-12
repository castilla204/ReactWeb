import * as React from 'react';

export const AdminPageHeader = ({
  title, subtitle, actions,
}: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 mb-5">
    <div>
      <h1 className="text-xl font-extrabold tracking-tight text-[hsl(var(--ap-ink))]">{title}</h1>
      {subtitle && <p className="text-meta text-[hsl(var(--ap-muted))] mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
