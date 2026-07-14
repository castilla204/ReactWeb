import React, { Suspense, lazy } from 'react';
import { ArrowRight } from 'lucide-react';
import { useDetectedCountryFromIp } from '../hooks/useDetectedCountryFromIp';
import {
  HP_DESKTOP_CATEGORY_TAB_ACTIVE_CLASS,
  HP_DESKTOP_CATEGORY_TAB_BASE_CLASS,
  HP_DESKTOP_CATEGORY_TAB_HIGHLIGHT_CLASS,
  HP_DESKTOP_CATEGORY_TAB_INACTIVE_CLASS,
  HP_SERVICE_CTA_CLASS,
} from '../constants/homepageTypography';
import {
  DESKTOP_HERO_BANNER_MASK,
  DESKTOP_HERO_MAP_OVERLAY_PADDING,
  DESKTOP_HERO_MAP_POSTER,
  DESKTOP_HERO_MIN_HEIGHT_CLASS,
  DESKTOP_HERO_SOFT_OVAL,
} from '../constants/homepageHeroMap';
import { HeroBannerPhoto } from './HeroBannerPhoto';

const ExpertsAreaMap = lazy(() =>
  import('./ExpertsAreaMap').then((m) => ({ default: m.default ?? m.ExpertsAreaMap })),
);

export interface KayakCategoryTab {
  key: string;
  label: string;
  icon: string | null;
  onClick: () => void;
  isActive: boolean;
  /** Borde discontinuo (p. ej. pill "Más" que abre el drawer). */
  highlight?: boolean;
}

interface HomepageDesktopKayakProps {
  categoryTabs: readonly KayakCategoryTab[];
  /** Abre el drawer de categorías en "modo mapa" (lo provee AirbnbSearchBar). */
  onSearchInMap: () => void;
  countryCode?: string;
}

const HeroMapLoadingPlaceholder: React.FC = () => (
  <div
    className="absolute inset-0 overflow-hidden bg-surface-tinted"
    aria-hidden
    style={{ background: DESKTOP_HERO_MAP_POSTER }}
  />
);

export const HomepageDesktopKayak: React.FC<HomepageDesktopKayakProps> = ({
  categoryTabs,
  onSearchInMap,
}) => {
  const { landingTarget: ipLanding, isResolved: ipLandingResolved } = useDetectedCountryFromIp();

  const expertLeft = 'max(0.25rem, calc((100vw - 1280px) / 2 - 0.25rem))';
  const textBlockLeft = `calc(${expertLeft} + clamp(13.5rem, 21vw, 17rem))`;

  return (
    <section
      data-homepage-hero
      className={`relative hidden md:block ${DESKTOP_HERO_MIN_HEIGHT_CLASS} bg-surface-tinted`}
    >
      {/* ── Contenido del hero clipeado a los bordes de la sección ── */}
      <div className={`absolute inset-0 overflow-hidden ${DESKTOP_HERO_MIN_HEIGHT_CLASS}`}>
        <div className="absolute inset-0 z-[1]">
          <Suspense fallback={<HeroMapLoadingPlaceholder />}>
            <ExpertsAreaMap
              className="h-full w-full"
              overlayPaddingRatio={DESKTOP_HERO_MAP_OVERLAY_PADDING}
              ipLanding={ipLanding}
              ipLandingResolved={ipLandingResolved}
              hideCornerStats
              showCityMarkers={false}
              showExpertSparkles
              sparkleRegion="global"
              sparkleDensity="spread"
            />
          </Suspense>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{ background: DESKTOP_HERO_SOFT_OVAL }}
        />

        <div className="pointer-events-none relative z-10 h-full w-full overflow-visible">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-[6] overflow-hidden"
            style={{
              width: textBlockLeft,
              WebkitMaskImage: DESKTOP_HERO_BANNER_MASK,
              maskImage: DESKTOP_HERO_BANNER_MASK,
            }}
          >
            <HeroBannerPhoto
              className="h-full w-full -scale-x-100"
              imgClassName="h-full w-full min-w-[520px] object-cover object-right"
            />
          </div>

          <div
            className={`pointer-events-none flex ${DESKTOP_HERO_MIN_HEIGHT_CLASS} items-center py-8 lg:py-10`}
            style={{ paddingLeft: textBlockLeft, paddingRight: '1.25rem' }}
          >
            <div className="pointer-events-auto relative z-10 min-w-0 max-w-[34rem]">
              <p className="hp-eyebrow mb-2 inline-flex items-center">
                Inspección antes de comprar
              </p>

              <h1 className="hp-hero-title-lg">
                Antes de comprar,
                <span className="block text-brand">
                  que lo revise{' '}
                  <span className="underline decoration-warning decoration-[3px] underline-offset-[6px]">
                    un experto
                  </span>
                </span>
              </h1>

              <p className="hp-hero-body mt-3 max-w-[26rem] lg:text-base">
                <strong className="font-semibold">Informe con fotos y vídeo.</strong> Precio cerrado y pago retenido hasta recibirlo.
              </p>

              <div
                className="mt-5 flex flex-wrap gap-2"
                role="group"
                aria-label="Categorías principales"
              >
                {categoryTabs.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    aria-pressed={cat.isActive}
                    onClick={cat.onClick}
                    className={`${HP_DESKTOP_CATEGORY_TAB_BASE_CLASS} ${
                      cat.isActive
                        ? HP_DESKTOP_CATEGORY_TAB_ACTIVE_CLASS
                        : cat.highlight
                          ? HP_DESKTOP_CATEGORY_TAB_HIGHLIGHT_CLASS
                          : HP_DESKTOP_CATEGORY_TAB_INACTIVE_CLASS
                    }`}
                  >
                    {cat.icon && (
                      <img
                        src={cat.icon}
                        alt=""
                        className={`h-4 w-4 object-contain ${cat.isActive ? 'brightness-0 invert' : 'opacity-100'}`}
                      />
                    )}
                    {cat.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onSearchInMap}
                className={`group mt-5 gap-2 ${HP_SERVICE_CTA_CLASS}`}
              >
                Buscar en el mapa
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-white transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
