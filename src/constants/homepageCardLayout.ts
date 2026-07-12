/** A/B layout variant for homepage service cards. Set VITE_HP_CARD_LAYOUT=price-first to test. */
export type HpCardLayoutVariant = 'default' | 'price-first';

const raw = import.meta.env.VITE_HP_CARD_LAYOUT as string | undefined;

export const HP_CARD_LAYOUT_VARIANT: HpCardLayoutVariant =
  raw === 'price-first' ? 'price-first' : 'default';
