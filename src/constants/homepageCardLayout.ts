/** A/B layout variant for homepage service cards. Set VITE_HP_CARD_LAYOUT=price-first to test. */
export type HpCardLayoutVariant = 'default' | 'price-first';

const raw = import.meta.env.VITE_HP_CARD_LAYOUT as string | undefined;

export const HP_CARD_LAYOUT_VARIANT: HpCardLayoutVariant =
  raw === 'price-first' ? 'price-first' : 'default';

/** Barra superior de la foto en ServiceCard — badge izquierda, favorito derecha. */
export const HP_CARD_IMAGE_OVERLAY_CLASS =
  'pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-1.5 p-3';

/** Altura compartida del badge «Top» y del botón de favorito (paridad con top-3 + 24px del layout anterior). */
export const HP_CARD_OVERLAY_CONTROL_H_CLASS = 'h-6';

/** Pill «Mejor valorado» / «Top» sobre la imagen. */
export const HP_CARD_TOP_BADGE_CLASS =
  'inline-flex h-6 w-max max-w-full items-center gap-1 overflow-hidden rounded-full bg-surface px-2 shadow-[0_2px_6px_rgba(0,0,0,0.14)] md:gap-1.5 md:px-2.5';

/** Botón de favorito sobre la imagen — hit area 44px, icono 24px centrado. */
export const HP_CARD_FAVORITE_BTN_CLASS =
  'pointer-events-auto flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';
