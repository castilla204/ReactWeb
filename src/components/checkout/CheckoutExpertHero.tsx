import { BadgeCheck, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface CheckoutExpertHeroProps {
  expertName: string;
  expertPicture?: string;
  completedSearches?: number;
  rating?: number;
  reviewCount?: number;
  className?: string;
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
}: CheckoutExpertHeroProps) {
  const ratingLabel = rating != null && rating > 0 ? rating.toFixed(1).replace('.', ',') : null;
  const showRating = ratingLabel != null && (reviewCount ?? 0) > 0;

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 rounded-full">
          <AvatarImage src={expertPicture} alt={expertName} />
          <AvatarFallback className="rounded-full bg-[#1c1c1c] text-sm font-semibold text-white">
            {expertName.charAt(0) || 'E'}
          </AvatarFallback>
        </Avatar>
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white ring-2 ring-white"
          aria-hidden
        >
          <BadgeCheck className="h-3 w-3" strokeWidth={2.5} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-5 tracking-[-0.01em] text-[#222222]">
          {expertName}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-4 text-[#6a6a6a]">
          <span>Revisor verificado</span>
          {completedSearches > 0 ? (
            <>
              <span className="text-[#d4d4d4]" aria-hidden>
                ·
              </span>
              <span>
                {completedSearches} {completedSearches === 1 ? 'trabajo' : 'trabajos'}
              </span>
            </>
          ) : null}
          {showRating ? (
            <>
              <span className="text-[#d4d4d4]" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-0.5 font-semibold tabular-nums text-[#1c1c1c]">
                <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" aria-hidden />
                {ratingLabel}
                <span className="font-normal text-[#6a6a6a]">({reviewCount})</span>
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
