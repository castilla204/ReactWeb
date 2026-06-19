import * as React from 'react';
import { cn } from '../../../lib/utils';

export const AdminTable = ({
  zebra = false, className, children,
}: { zebra?: boolean; className?: string; children: React.ReactNode }) => (
  <div className="admin-table-wrap">
    <table className={cn('admin-table', zebra && 'admin-table--zebra', className)}>{children}</table>
  </div>
);

export const AdminTHead = ({ children }: { children: React.ReactNode }) => (
  <thead><tr>{children}</tr></thead>
);

export const AdminTH = ({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={className} {...p} />
);

export const AdminTBody = ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>;

export const AdminTR = ({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={className} {...p} />
);

export const AdminTD = ({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={className} {...p} />
);
