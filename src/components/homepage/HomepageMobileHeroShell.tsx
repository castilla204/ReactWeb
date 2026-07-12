import React, { type ReactNode } from 'react';
import { MOBILE_HERO_PHOTO_SCRIM, MOBILE_HERO_SIDE_FADE } from '../../constants/homepageHeroMap';
import { HP_SK } from './homePageSkeletonTokens';

/** Altura compartida hero móvil — compacta para asomar la 1ª card al entrar. */
export const MOBILE_HERO_MIN_H_CLASS = 'min-h-[132px] min-[390px]:min-h-[144px]';

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
    className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-7 bg-gradient-to-t from-white via-white/70 to-transparent"
  />
);

/** Placeholder de copy — líneas alineadas al h1 real (Manrope, izquierda). */
export const HomepageMobileHeroCopyPlaceholder: React.FC = () => (
  <div className="absolute inset-x-0 bottom-3 top-0 flex items-center px-4 min-[390px]:bottom-4" aria-hidden>
    <div className="max-w-[14.25rem] min-[390px]:max-w-[15rem] space-y-2.5">
      <div className="h-3 w-24 rounded-full" style={{ background: HP_SK.line }} />
      <div className="space-y-1.5">
        <div className="h-4 w-full rounded-lg" style={{ background: HP_SK.inkGhost }} />
        <div className="h-4 w-[88%] rounded-lg" style={{ background: HP_SK.inkGhost }} />
      </div>
      <div className="space-y-1 pt-0.5">
        <div className="h-3 w-full rounded-sm" style={{ background: HP_SK.mutedLine }} />
        <div className="h-3 w-[72%] rounded-sm" style={{ background: HP_SK.fill }} />
      </div>
    </div>
  </div>
);

interface HomepageMobileHeroShellProps {
  photoLayer: ReactNode;
  children: ReactNode;
  /** true cuando hay foto real detrás (aplica scrim de legibilidad). */
  photoBacked?: boolean;
}

export const HomepageMobileHeroShell: React.FC<HomepageMobileHeroShellProps> = ({
  photoLayer,
  children,
  photoBacked = true,
}) => (
  <section
    data-homepage-hero
    className={`relative md:hidden overflow-hidden ${MOBILE_HERO_MIN_H_CLASS}`}
  >
    <div className="absolute inset-0 z-0">{photoLayer}</div>
    {photoBacked ? HERO_PHOTO_SCRIMS : null}
    {HERO_BOTTOM_FADE}
    <div className={`relative z-10 ${MOBILE_HERO_MIN_H_CLASS}`}>{children}</div>
  </section>
);

/** Fondo skeleton — gradiente de marca (sin foto blur). */
export const HomepageMobileHeroLqip: React.FC = () => (
  <div aria-hidden className="h-full w-full" style={{ background: HP_SK.heroGradient }} />
);
