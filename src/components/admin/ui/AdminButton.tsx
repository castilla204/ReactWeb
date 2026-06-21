import * as React from 'react';
import { cn } from '../../../lib/utils';
import { SileoLoader } from '../../ui/sileo-loader';

type Variant = 'brand' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-[hsl(var(--ap-brand))] disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  brand: 'bg-[hsl(var(--ap-brand))] text-[hsl(var(--ap-on-brand))] hover:bg-[hsl(var(--ap-brand-strong))]',
  outline: 'border border-[hsl(var(--ap-border-strong))] bg-[hsl(var(--ap-surface))] text-[hsl(var(--ap-ink))] hover:bg-[hsl(220_16%_97%)]',
  ghost: 'text-[hsl(var(--ap-ink))] hover:bg-[hsl(220_16%_95%)]',
  danger: 'bg-[hsl(var(--ap-error))] text-white hover:bg-[hsl(0_72%_34%)]',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12.5px]',
  md: 'h-9 px-4 text-[13px]',
  lg: 'h-11 px-6 text-sm',
};

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ variant = 'brand', size = 'md', loading = false, icon, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? <SileoLoader size="sm" color="current" /> : icon}
      {children}
    </button>
  ),
);
AdminButton.displayName = 'AdminButton';
