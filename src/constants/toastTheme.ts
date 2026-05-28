import { HP_COLOR, HP_FONT } from './homepageTypography';

/** Tokens compartidos toasts ↔ homepage */
export const TOAST_THEME = {
  font: HP_FONT,
  width: 360,
  radius: 16,
  colors: {
    bg: '#ffffff',
    title: HP_COLOR.secondary,
    description: HP_COLOR.muted,
    border: HP_COLOR.borderSoft,
    brand: HP_COLOR.brand,
    brandDark: HP_COLOR.brandDark,
    brandDeep: HP_COLOR.brandDarker,
  },
  shadow: {
    rest: '0 2px 14px rgba(15, 23, 42, 0.07)',
    hover: '0 10px 28px rgba(15, 23, 42, 0.13)',
  },
  accent: {
    default: `linear-gradient(180deg, ${HP_COLOR.brand} 0%, rgba(0, 102, 204, 0.22) 100%)`,
    success: `linear-gradient(180deg, ${HP_COLOR.brand} 0%, rgba(0, 102, 204, 0.22) 100%)`,
    info: `linear-gradient(180deg, ${HP_COLOR.brand} 0%, rgba(0, 102, 204, 0.22) 100%)`,
    error: 'linear-gradient(180deg, #DC2626 0%, rgba(220, 38, 38, 0.22) 100%)',
    warning: 'linear-gradient(180deg, #D97706 0%, rgba(217, 119, 6, 0.22) 100%)',
  },
  iconBg: {
    default: '#E8F2FC',
    success: '#E8F2FC',
    info: '#E8F2FC',
    error: '#FEF2F2',
    warning: '#FFFBEB',
  },
  iconColor: {
    default: HP_COLOR.brand,
    success: HP_COLOR.brand,
    info: HP_COLOR.brand,
    error: '#DC2626',
    warning: '#D97706',
  },
} as const;
