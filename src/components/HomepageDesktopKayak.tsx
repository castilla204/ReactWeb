import React, { useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  HP_DESKTOP_CATEGORY_TAB_ACTIVE_CLASS,
  HP_DESKTOP_CATEGORY_TAB_BASE_CLASS,
  HP_DESKTOP_CATEGORY_TAB_HIGHLIGHT_CLASS,
  HP_DESKTOP_CATEGORY_TAB_INACTIVE_CLASS,
  HP_SERVICE_CTA_CLASS,
} from '../constants/homepageTypography';
import {
  DESKTOP_HERO_MIN_HEIGHT_CLASS,
  DESKTOP_HERO_PHOTO_SEAM_FADE,
} from '../constants/homepageHeroMap';
import { HP_WALL_HORIZONTAL_CLASS } from '../constants/homepageMobileRhythm';
import { HeroBannerPhoto } from './HeroBannerPhoto';

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

export const HomepageDesktopKayak: React.FC<HomepageDesktopKayakProps> = ({
  categoryTabs,
  onSearchInMap,
}) => {
  // La foto arranca justo donde termina la columna de texto — medido en el DOM
  // (no calc() a mano) para heredar SIEMPRE el mismo margen izquierdo que el
  // topbar y el resto de secciones (`SD_PAGE_INNER_MAX_CLASS`). El cálculo manual
  // anterior reservaba un hueco extra pensado para el mapa/foto en espejo del
  // diseño viejo y empujaba el texto ~280px más a la derecha de lo necesario.
  const textColRef = useRef<HTMLDivElement>(null);
  const [photoLeft, setPhotoLeft] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = textColRef.current;
    if (!el) return;
    const update = () => setPhotoLeft(el.getBoundingClientRect().right);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section
      data-homepage-hero
      className={`relative hidden md:block ${DESKTOP_HERO_MIN_HEIGHT_CLASS} overflow-hidden bg-surface-tinted`}
    >
      {/* Foto — única protagonista visual del hero, a sangre completa a la derecha.
          El asset (imagenbanner.avif/webp) está recortado a la relación de aspecto
          del hero (~2.24:1) centrado en los peritos y el coche — el encuadre original
          traía medio fotograma de aparcamiento vacío pensado para superponer texto
          encima; aquí el texto va en su propia columna, así que ese vacío quedaba
          duplicado junto al fondo liso. object-cover ya no necesita zoom/transform:
          el recorte hace casi todo el trabajo, solo compensa pequeños desajustes de
          aspecto entre breakpoints. */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 z-0 overflow-hidden"
        style={{ left: photoLeft != null ? `${photoLeft + 32}px` : '55%' }}
      >
        <HeroBannerPhoto
          className="h-full w-full"
          imgClassName="h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-24"
          style={{ background: DESKTOP_HERO_PHOTO_SEAM_FADE }}
        />
      </div>

      {/* Texto — a ras con "Revisiones en España" y las cards de abajo
          (HP_WALL_HORIZONTAL_CLASS), no con el topbar: el topbar usa
          SD_PAGE_INNER_MAX_CLASS, que tiene otro max-width/padding en lg/xl y
          desalineaba el hero respecto al muro de servicios. */}
      <div
        className={`relative z-10 flex ${DESKTOP_HERO_MIN_HEIGHT_CLASS} items-center ${HP_WALL_HORIZONTAL_CLASS} py-8 lg:py-10`}
      >
        <div ref={textColRef} className="min-w-0 max-w-[34rem]">
          <p className="hp-eyebrow mb-2 inline-flex items-center">
            Inspección antes de comprar
          </p>

          <h1 className="hp-hero-title-lg">
            Que lo revise un experto.
            <span className="block text-brand">
              Pagas al recibir{' '}
              <span className="underline decoration-warning decoration-[3px] underline-offset-[6px]">
                su informe
              </span>
            </span>
          </h1>

          <p className="hp-hero-body mt-3 max-w-[26rem] lg:text-base">
            <strong className="font-semibold">Informe con fotos y vídeo.</strong> Peritos verificados y precio cerrado.
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
    </section>
  );
};
