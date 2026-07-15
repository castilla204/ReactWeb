import React from 'react';
import { ChevronRight, Check } from 'lucide-react';

import type { CategoryOfficeMeta } from '../../data/categoryMeta';

interface CategoryPickerRowProps {
  name: string;
  image: string | null;
  fallbackIcon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  meta: CategoryOfficeMeta | null;
  selected: boolean;
  onClick: () => void;
  /** Posición en la lista — anima la entrada escalonada al abrir el picker. */
  index?: number;
}

/**
 * Fila de categoría del picker "elige qué quieres revisar" — compartida entre
 * el modal móvil de pantalla completa y el drawer/side-panel desktop, para que
 * copy, estado seleccionado y feedback de interacción no diverjan entre los dos.
 *
 * El precio es el dato que decide la compra, así que es el único punto donde
 * el azul de marca "paga" dentro de la fila (DESIGN.md: el brand aparece donde
 * algo se firma, no donde se decora).
 */
export const CategoryPickerRow: React.FC<CategoryPickerRowProps> = ({
  name,
  image,
  fallbackIcon: FallbackIcon,
  meta,
  selected,
  onClick,
  index = 0,
}) => {
  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={onClick}
      style={{ '--i': index } as React.CSSProperties}
      className={`category-picker-row-enter group relative flex w-full items-center gap-4 border-b border-line px-4 py-3 text-left transition-colors duration-200 last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.99] ${
        selected ? 'bg-brand/[0.05]' : 'hover:bg-surface-tinted active:bg-surface-tinted'
      }`}
    >
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 ${
          selected ? 'bg-brand/[0.08]' : 'bg-surface-tinted group-hover:scale-105 motion-reduce:group-hover:scale-100'
        }`}
      >
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-11 w-11 select-none object-contain"
          />
        ) : (
          <FallbackIcon className="h-6 w-6 text-ink-soft" strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-subtitle font-semibold leading-tight tracking-[-0.01em] text-ink-strong">
          {name}
        </h3>
        {meta ? (
          <>
            <p className="mt-0.5 truncate text-caption leading-snug text-ink-muted">
              {meta.delivery}
            </p>
            <p className="mt-1 text-meta leading-none">
              <span className="font-semibold text-brand">desde {meta.priceFromEur}€</span>
              <span className="text-ink-muted">{' · '}{meta.expertCount} expertos</span>
            </p>
          </>
        ) : (
          <p className="mt-0.5 text-caption leading-snug text-ink-muted">Toca para ver expertos</p>
        )}
      </div>
      {selected ? (
        <span
          aria-hidden
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand"
        >
          <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
        </span>
      ) : (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-line transition-colors group-hover:text-ink-soft"
          strokeWidth={2}
          aria-hidden
        />
      )}
    </button>
  );
};
