import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';

interface CheckoutExpertHeroProps {
  expertName: string;
  expertPicture?: string;
  completedSearches?: number;
  rating?: number;
  reviewCount?: number;
  className?: string;
  /** 'md' (por defecto) = cabecera principal; 'sm' = firma discreta (p.ej. tras el detalle del servicio). */
  size?: 'md' | 'sm';
}

/**
 * Cabecera de confianza del checkout: el experto como héroe en el momento de pagar.
 * Reutiliza el vocabulario de ServiceDetailExpertHostRow (avatar + sello verificado +
 * estrella ámbar de valoración), pero es informativo: sin botón de chat ni navegación,
 * para no sacar al usuario del flujo de pago.
 */
export function CheckoutExpertHero({
  expertName,
  expertPicture,
  completedSearches = 0,
  rating,
  reviewCount,
  className = '',
  size = 'md',
}: CheckoutExpertHeroProps) {
  const ratingLabel = rating != null && rating > 0 ? rating.toFixed(1).replace('.', ',') : null;
  const showRating = ratingLabel != null && (reviewCount ?? 0) > 0;
  const isSmall = size === 'sm';

  return (
    <div className={cn('flex items-center', isSmall ? 'gap-2' : 'gap-3', className)}>
      <div className="relative shrink-0">
        <Avatar className={isSmall ? 'h-9 w-9 rounded-full' : 'h-12 w-12 rounded-full'}>
          <AvatarImage src={expertPicture} alt={expertName} />
          <AvatarFallback
            className={cn(
              'rounded-full bg-ink-strong font-semibold text-white',
              isSmall ? 'text-xs' : 'text-sm',
            )}
          >
            {expertName.charAt(0) || 'E'}
          </AvatarFallback>
        </Avatar>
        <VerifiedBadge
          className={cn('absolute', isSmall ? '-bottom-0.5 -right-0.5 h-[16px] w-[16px]' : '-bottom-1 -right-1 h-[22px] w-[22px]')}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate font-semibold tracking-[-0.01em] text-ink',
            isSmall ? 'text-meta leading-[18px]' : 'text-sm leading-5',
          )}
        >
          {expertName}
        </p>
        <p
          className={cn(
            'mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-ink-muted',
            isSmall ? 'text-kicker leading-[15px]' : 'text-xs leading-4',
          )}
        >
          <span>Experto verificado</span>
          {completedSearches > 0 ? (
            <>
              <span className="text-line" aria-hidden>
                ·
              </span>
              <span>
                {completedSearches} {completedSearches === 1 ? 'trabajo' : 'trabajos'}
              </span>
            </>
          ) : null}
          {showRating ? (
            <>
              <span className="text-line" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-0.5 font-semibold tabular-nums text-ink-strong">
                <Star className={cn(isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5', 'fill-amber-500 text-amber-500')} aria-hidden />
                {ratingLabel}
                <span className="font-normal text-ink-muted">({reviewCount})</span>
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
