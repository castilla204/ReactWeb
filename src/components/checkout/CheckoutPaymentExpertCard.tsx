import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';

interface CheckoutPaymentExpertCardProps {
  expertName: string;
  expertPicture?: string;
  completedSearches?: number;
  rating?: number;
  reviewCount?: number;
  /** Sin caja tinted — fila plana dentro de la tarjeta de pago. */
  embedded?: boolean;
  className?: string;
}

/**
 * Ficha de confianza del experto en el paso de pago móvil: más presencia que
 * CheckoutExpertHero size="sm", sin eyebrow en mayúsculas ni bloque flotante.
 */
export function CheckoutPaymentExpertCard({
  expertName,
  expertPicture,
  completedSearches = 0,
  rating,
  reviewCount,
  embedded = false,
  className,
}: CheckoutPaymentExpertCardProps) {
  const ratingLabel = rating != null && rating > 0 ? rating.toFixed(1).replace('.', ',') : null;
  const showRating = ratingLabel != null && (reviewCount ?? 0) > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3.5',
        embedded
          ? 'py-0.5'
          : 'rounded-xl border border-line-soft bg-surface-tinted px-4 py-3.5',
        className,
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11 rounded-full">
          <AvatarImage src={expertPicture} alt={expertName} />
          <AvatarFallback className="rounded-full bg-ink-strong text-sm font-semibold text-white">
            {expertName.charAt(0) || 'E'}
          </AvatarFallback>
        </Avatar>
        <VerifiedBadge className="absolute -bottom-0.5 -right-0.5 h-[18px] w-[18px]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-normal tracking-[-0.01em] text-ink-strong">
          {expertName}
        </p>
        <p className="mt-0.5 text-meta leading-snug text-ink-muted">
          {completedSearches > 0 ? (
            <span>
              {completedSearches} {completedSearches === 1 ? 'trabajo' : 'trabajos'} completados
            </span>
          ) : (
            <span>Perito verificado por Inspecciono</span>
          )}
          {showRating ? (
            <>
              <span aria-hidden> · </span>
              <span
                className="inline-flex items-center gap-0.5 font-semibold tabular-nums text-ink-strong"
                aria-label={`Valoración ${ratingLabel} de 5, ${reviewCount} reseñas`}
              >
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden />
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
