import React from 'react';
import { HP_LOADING_DIMS, HP_LOADING_LAYOUT } from './homeLoadingLayout';

const LoadingCard: React.FC = () => (
  <div className={`shrink-0 ${HP_LOADING_LAYOUT.cardWidth}`}>
    <div className={`relative ${HP_LOADING_LAYOUT.cardImageMb} w-full`}>
      <div
        className="aspect-square md:aspect-[4/3] w-full rounded-[20px] bg-surface-tinted md:rounded-xl motion-safe:animate-pulse"
        aria-hidden
      />
      <div
        className="absolute z-[1] h-7 w-7 md:h-8 md:w-8 rounded-full border-2 border-white bg-line left-3 bottom-2 md:bottom-3"
        aria-hidden
      />
    </div>
    <div className="mt-0.5 space-y-0" aria-hidden>
      <div
        className="rounded-sm bg-line-soft"
        style={{ minHeight: HP_LOADING_DIMS.cardTitleH, marginBottom: 0 }}
      />
      <div
        className="rounded-sm bg-surface-tinted w-[88%]"
        style={{ height: HP_LOADING_DIMS.cardMetaH, marginTop: 0 }}
      />
      <div
        className="rounded-sm bg-surface-tinted w-[74%]"
        style={{ height: HP_LOADING_DIMS.cardMetaH, marginTop: 0 }}
      />
    </div>
  </div>
);

const LoadingSection: React.FC<{ cardCount?: number }> = ({ cardCount = 6 }) => (
  <div className={HP_LOADING_LAYOUT.sectionBleed}>
    <div className={HP_LOADING_LAYOUT.sectionHeader}>
      <div
        className="max-w-[58%] rounded-md bg-line"
        style={{ height: HP_LOADING_DIMS.sectionTitleH }}
        aria-hidden
      />
      <div
        className="mt-1 max-w-[52%] rounded-sm bg-line-soft"
        style={{ height: HP_LOADING_DIMS.sectionSubtitleH }}
        aria-hidden
      />
    </div>
    <div className={HP_LOADING_LAYOUT.cardsRow}>
      {Array.from({ length: cardCount }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  </div>
);

/** Contenido del muro sin wrapper outer — para uso dentro de HomepageWall (evita doble px-4). */
export const WallSkeletonInner: React.FC = () => (
  <>
    <div className={HP_LOADING_LAYOUT.sectionFirst}>
      <LoadingSection cardCount={6} />
    </div>
    <div className={HP_LOADING_LAYOUT.sectionNext}>
      <LoadingSection cardCount={6} />
    </div>
  </>
);

/**
 * Muro — misma caja que HomepageWall (2 secciones, cards 148px, header 1.125rem + subtitle).
 * Incluye `wallOuter` para el fallback de Suspense en HomePage.
 */
export const HomeServicesLoading: React.FC = () => (
  <div className={HP_LOADING_LAYOUT.wallOuter} role="status" aria-busy="true">
    <span className="sr-only">Cargando servicios…</span>
    <WallSkeletonInner />
  </div>
);

/** Skeleton interno del muro (sin padding outer duplicado). */
export const WallSkeletonContent = WallSkeletonInner;

export const HomePageWallSkeleton = HomeServicesLoading;
