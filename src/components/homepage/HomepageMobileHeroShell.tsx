import React, { type ReactNode } from 'react';
import { MOBILE_HERO_PHOTO_SCRIM, MOBILE_HERO_SIDE_FADE } from '../../constants/homepageHeroMap';
import { HP_SK } from './homePageSkeletonTokens';

/** Altura compartida hero móvil — compacta para asomar la 1ª card al entrar. */
export const MOBILE_HERO_MIN_H_CLASS = 'min-h-[112px] min-[390px]:min-h-[120px]';

/** Proporción del banner SVG móvil (viewBox 1150×470). */
export const MOBILE_HERO_SVG_ASPECT_CLASS = 'aspect-[1150/470] w-full';

const HERO_PHOTO_SCRIMS = (
  <>
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{ background: MOBILE_HERO_PHOTO_SCRIM }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{ background: MOBILE_HERO_SIDE_FADE }}
    />
  </>
);

const HERO_BOTTOM_FADE = (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-6 bg-gradient-to-t from-white via-white/70 to-transparent"
  />
);

/** Placeholder de copy — líneas alineadas al h1 real (Manrope, izquierda). */
export const HomepageMobileHeroCopyPlaceholder: React.FC = () => (
  <div className="absolute inset-0 flex flex-col justify-center px-4" aria-hidden>
    <div className="max-w-[13.5rem] min-[390px]:max-w-[14rem] space-y-2">
      <div className="h-3 w-24 rounded-full" style={{ background: HP_SK.line }} />
      <div className="space-y-1.5">
        <div className="h-4 w-full rounded-lg" style={{ background: HP_SK.inkGhost }} />
        <div className="h-4 w-[88%] rounded-lg" style={{ background: HP_SK.inkGhost }} />
      </div>
    </div>
    <div className="mt-2 max-w-[17rem] min-[390px]:max-w-[18rem]">
      <div className="h-2.5 w-[72%] rounded-sm" style={{ background: HP_SK.mutedLine }} />
    </div>
  </div>
);

interface HomepageMobileHeroShellProps {
  photoLayer: ReactNode;
  children: ReactNode;
  /** true cuando hay foto real detrás (aplica scrim de legibilidad). */
  photoBacked?: boolean;
  /** 'svg' usa la proporción del banner vectorial; 'photo' mantiene el hero compacto con foto. */
  variant?: 'photo' | 'svg';
}

export const HomepageMobileHeroShell: React.FC<HomepageMobileHeroShellProps> = ({
  photoLayer,
  children,
  photoBacked = true,
  variant = 'photo',
}) => {
  const sectionSizeClass =
    variant === 'svg' ? MOBILE_HERO_SVG_ASPECT_CLASS : MOBILE_HERO_MIN_H_CLASS;

  return (
    <section
      data-homepage-hero
      className={`relative md:hidden overflow-hidden ${sectionSizeClass}`}
    >
      <div className="absolute inset-0 z-0">{photoLayer}</div>
      {photoBacked ? HERO_PHOTO_SCRIMS : null}
      {HERO_BOTTOM_FADE}
      <div className={`relative z-10 ${sectionSizeClass}`}>{children}</div>
    </section>
  );
};

/** Fondo skeleton — gradiente de marca (sin foto blur). */
export const HomepageMobileHeroLqip: React.FC = () => (
  <div aria-hidden className="h-full w-full" style={{ background: HP_SK.heroGradient }} />
);
