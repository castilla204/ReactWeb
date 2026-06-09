import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { useDetectedCountryFromIp } from '../hooks/useDetectedCountryFromIp';
import { HeroExpertCutout } from './HeroExpertCutout';
import { HP_SERVICE_CTA_CLASS } from '../constants/homepageTypography';
import {
  DESKTOP_HERO_MAP_OVERLAY_PADDING,
  DESKTOP_HERO_SOFT_OVAL,
} from '../constants/homepageHeroMap';
import { HomepageHeroTrustLines } from './HomepageHeroTrustLines';

const ExpertsAreaMap = lazy(() =>
  import('./ExpertsAreaMap').then((m) => ({ default: m.default ?? m.ExpertsAreaMap })),
);

export interface KayakCategoryTab {
  key: string;
  label: string;
  icon: string | null;
  onClick: () => void;
  isActive: boolean;
}

interface HomepageDesktopKayakProps {
  categoryTabs: readonly KayakCategoryTab[];
  categoryId: number;
  countryCode?: string;
}

const HeroMapLoadingPlaceholder: React.FC = () => (
  <div className="absolute inset-0 bg-[#fafafa] overflow-hidden" aria-hidden>
    <div className="absolute inset-0 animate-pulse bg-[#f0f4f7]/80" />
  </div>
);

export const HomepageDesktopKayak: React.FC<HomepageDesktopKayakProps> = ({
  categoryTabs,
  categoryId,
}) => {
  const navigate = useNavigate();
  const { landingTarget: ipLanding, isResolved: ipLandingResolved } = useDetectedCountryFromIp();

  const goToMap = () => {
    navigate(`/crear-busqueda?categoryId=${categoryId}&serviceTypeId=2&step=map`);
  };

  const expertLeft = 'max(0.25rem, calc((100vw - 1280px) / 2 - 0.25rem))';
  const textBlockLeft = `calc(${expertLeft} + clamp(13.5rem, 21vw, 17rem))`;

  return (
    <section
      data-homepage-hero
      className="relative hidden md:block h-[400px] lg:h-[500px] xl:h-[520px] overflow-hidden border-b border-[#e8e8e8] bg-[#fafafa]"
    >
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
            sparkleRegion="hero-world"
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
          className="pointer-events-none absolute bottom-0 z-[6]"
          style={{ left: expertLeft }}
        >
          <HeroExpertCutout
            preset="desktop-hero"
            className="!h-[400px] md:!h-[460px] lg:!h-[500px] xl:!h-[520px]"
          />
        </div>

        <div
          className="pointer-events-none flex h-full items-center"
          style={{ paddingLeft: textBlockLeft, paddingRight: '1.25rem' }}
        >
          <div className="pointer-events-auto relative z-10 min-w-0 max-w-[34rem]">
            <p className="hp-eyebrow mb-2">Inspección antes de comprar</p>

            <h1 className="hp-hero-title-lg">
              Antes de comprar,
              <span className="block text-brand">que lo revise un experto</span>
            </h1>

            <p className="hp-hero-body mt-3 max-w-[26rem] lg:text-base">
              Informe con fotos y vídeo. Precio cerrado y pago retenido hasta recibirlo.
            </p>

            <div
              className="mt-5 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Categorías principales"
            >
              {categoryTabs.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  role="tab"
                  aria-selected={cat.isActive}
                  onClick={cat.onClick}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors ${
                    cat.isActive
                      ? 'bg-[#1c1c1c] font-medium text-white shadow-sm'
                      : 'border border-[#e8e8e8] bg-white font-normal text-[#6a6a6a] hover:border-[#d4d4d4] hover:text-[#222222]'
                  }`}
                >
                  {cat.icon && (
                    <img
                      src={cat.icon}
                      alt=""
                      className={`h-4 w-4 object-contain ${cat.isActive ? 'brightness-0 invert' : 'opacity-80'}`}
                    />
                  )}
                  {cat.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={goToMap}
              className={`group mt-5 gap-2 ${HP_SERVICE_CTA_CLASS}`}
            >
              <MapPin className="h-4 w-4 shrink-0" strokeWidth={2.25} />
              Buscar en el mapa
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>

            <HomepageHeroTrustLines />
          </div>
        </div>
      </div>
    </section>
  );
};
