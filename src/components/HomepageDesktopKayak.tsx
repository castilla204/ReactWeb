import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { useDetectedCountryFromIp } from '../hooks/useDetectedCountryFromIp';
import { HeroExpertCutout } from './HeroExpertCutout';

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

/** ~52% panel — deja más mapa visible hacia la izquierda */
const PANEL_SHARE = '52%';

/** Ancho del fade en píxeles (zona de transición panel → mapa) */
const FADE_WIDTH_PX = 132;

/** Padding izquierdo del mapa — menor = marcador más hacia la izquierda de la zona visible */
const MAP_OVERLAY_PADDING = 0.26;

/**
 * Líneas de fondo editoriales — meridianos/latitudes sutiles en la zona del mapa.
 */
const HeroDecorativeLines: React.FC = () => (
  <svg
    className="absolute inset-0 h-full w-full pointer-events-none select-none"
    viewBox="0 0 1440 480"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden
  >
    <defs>
      <linearGradient id="hero-line-h" x1="0.28" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0" />
        <stop offset="18%" stopColor="hsl(var(--brand))" stopOpacity="0.05" />
        <stop offset="55%" stopColor="hsl(var(--brand))" stopOpacity="0.11" />
        <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0.04" />
      </linearGradient>
      <linearGradient id="hero-arc-stroke" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0" />
        <stop offset="30%" stopColor="hsl(var(--brand))" stopOpacity="0.14" />
        <stop offset="70%" stopColor="hsl(var(--brand))" stopOpacity="0.14" />
        <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="hero-map-glow" cx="78%" cy="42%" r="42%">
        <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0.07" />
        <stop offset="55%" stopColor="hsl(var(--brand))" stopOpacity="0.02" />
        <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0" />
      </radialGradient>
    </defs>

    <rect width="1440" height="480" fill="url(#hero-map-glow)" />

    {/* Latitudes */}
    {[118, 168, 218, 268, 318, 368].map((y) => (
      <line
        key={`lat-${y}`}
        x1="320"
        y1={y}
        x2="1440"
        y2={y}
        stroke="url(#hero-line-h)"
        strokeWidth="0.75"
        vectorEffect="non-scaling-stroke"
      />
    ))}

    {/* Meridianos curvos (sensación globo) */}
    <path
      d="M 920 0 C 1080 120, 1080 360, 920 480"
      fill="none"
      stroke="url(#hero-arc-stroke)"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M 1020 0 C 1220 140, 1220 340, 1020 480"
      fill="none"
      stroke="url(#hero-arc-stroke)"
      strokeWidth="0.85"
      strokeOpacity="0.65"
      vectorEffect="non-scaling-stroke"
    />
    <path
      d="M 1120 0 C 1340 160, 1340 320, 1120 480"
      fill="none"
      stroke="url(#hero-arc-stroke)"
      strokeWidth="0.65"
      strokeOpacity="0.4"
      vectorEffect="non-scaling-stroke"
    />

    {/* Arco superior — une panel y mapa */}
    <path
      d="M 0 420 Q 520 380, 900 400 T 1440 360"
      fill="none"
      stroke="hsl(var(--brand))"
      strokeOpacity="0.06"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    />

    {/* Puntos de referencia discretos */}
    {[
      [980, 140],
      [1080, 240],
      [1180, 320],
      [1280, 180],
    ].map(([cx, cy]) => (
      <circle
        key={`dot-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r="2"
        fill="hsl(var(--brand))"
        opacity="0.12"
      />
    ))}
  </svg>
);

/**
 * Máscara: panel opaco + fade largo y progresivo hacia el mapa.
 * black = panel visible, transparent = mapa visible a través.
 */
const PANEL_EDGE_MASK = `linear-gradient(to right, #000 0%, #000 calc(100% - ${FADE_WIDTH_PX}px), rgba(0,0,0,0.96) calc(100% - ${Math.round(FADE_WIDTH_PX * 0.88)}px), rgba(0,0,0,0.82) calc(100% - ${Math.round(FADE_WIDTH_PX * 0.72)}px), rgba(0,0,0,0.62) calc(100% - ${Math.round(FADE_WIDTH_PX * 0.55)}px), rgba(0,0,0,0.40) calc(100% - ${Math.round(FADE_WIDTH_PX * 0.38)}px), rgba(0,0,0,0.22) calc(100% - ${Math.round(FADE_WIDTH_PX * 0.22)}px), rgba(0,0,0,0.08) calc(100% - ${Math.round(FADE_WIDTH_PX * 0.08)}px), transparent 100%)`;

/** Degradado panel — azul suave con toque cálido al fondo */
const PANEL_GRADIENT =
  'linear-gradient(132deg, #dceaf8 0%, #e5f0fa 22%, #f5f9fd 48%, #fff9f2 78%, #fafafa 100%)';

const PANEL_TOP_GLOW =
  'radial-gradient(ellipse 95% 85% at 0% 0%, hsl(var(--brand)/0.22) 0%, rgba(255,184,77,0.12) 28%, rgba(79,70,229,0.06) 48%, transparent 72%)';

const PANEL_WARM_GLOW =
  'radial-gradient(ellipse 70% 60% at 18% 88%, rgba(255,56,92,0.08) 0%, rgba(255,184,77,0.10) 35%, transparent 68%)';

const PANEL_SIDE_LINES =
  'repeating-linear-gradient(128deg, transparent 0px, transparent 11px, hsl(var(--brand)/0.035) 11px, hsl(var(--brand)/0.035) 12px)';

/** Acentos alegres en el panel izquierdo — blobs cálidos + destellos sutiles */
const HeroPanelJoy: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
    {/* Orbes difuminados — sensación luminosa y acogedora */}
    <div className="absolute -top-20 -left-16 h-[220px] w-[220px] rounded-full bg-[#FFD166]/30 blur-3xl" />
    <div className="absolute top-[28%] left-[6%] h-[130px] w-[130px] rounded-full bg-brand/18 blur-2xl" />
    <div className="absolute bottom-[-2rem] left-[14%] h-[160px] w-[160px] rounded-full bg-[#FF385C]/14 blur-3xl" />
    <div className="absolute bottom-[18%] left-[38%] h-[90px] w-[90px] rounded-full bg-[#2DD4BF]/16 blur-2xl" />

    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 760 480"
      preserveAspectRatio="xMinYMid slice"
    >
      <defs>
        <radialGradient id="panel-sun" cx="0.12" cy="0.15" r="0.45">
          <stop offset="0%" stopColor="#FFD166" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#FFB84D" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#FFD166" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="panel-wave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#FF385C" stopOpacity="0.08" />
          <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="90" cy="72" r="110" fill="url(#panel-sun)" />

      {/* Onda decorativa inferior — dinamismo suave */}
      <path
        d="M 0 400 C 120 360, 220 430, 340 395 S 560 360, 760 410 L 760 480 L 0 480 Z"
        fill="url(#panel-wave)"
        opacity="0.55"
      />

      {/* Destellos / confeti minimalista */}
      {[
        { cx: 48, cy: 120, r: 3.5, fill: '#FFB84D', op: 0.55 },
        { cx: 128, cy: 88, r: 2.5, fill: 'hsl(var(--brand))', op: 0.45 },
        { cx: 198, cy: 156, r: 2, fill: '#FF385C', op: 0.5 },
        { cx: 72, cy: 248, r: 2.5, fill: '#2DD4BF', op: 0.45 },
        { cx: 260, cy: 72, r: 2, fill: '#FFB84D', op: 0.4 },
        { cx: 310, cy: 200, r: 3, fill: 'hsl(var(--brand))', op: 0.35 },
        { cx: 165, cy: 320, r: 2, fill: '#FF385C', op: 0.38 },
        { cx: 340, cy: 340, r: 2.5, fill: '#FFD166', op: 0.42 },
      ].map(({ cx, cy, r, fill, op }) => (
        <circle key={`joy-${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={fill} opacity={op} />
      ))}

      {/* Pequeñas estrellas de 4 puntas */}
      {[
        [220, 110],
        [380, 145],
        [95, 310],
      ].map(([x, y]) => (
        <g key={`star-${x}-${y}`} transform={`translate(${x} ${y})`} opacity="0.35">
          <path
            d="M 0 -5 L 1.2 0 L 0 5 L -1.2 0 Z M -5 0 L 0 -1.2 L 5 0 L 0 1.2 Z"
            fill="hsl(var(--brand))"
          />
        </g>
      ))}
    </svg>
  </div>
);

/** Placeholder mientras carga el chunk MapLibre (evita hueco gris vacío). */
const HeroMapLoadingPlaceholder: React.FC = () => (
  <div
    className="absolute inset-0 bg-[#e8f0f7] overflow-hidden"
    aria-hidden
  >
    <div
      className="absolute inset-0 opacity-60 animate-pulse"
      style={{
        background:
          'radial-gradient(ellipse 80% 70% at 72% 45%, hsl(var(--brand)/0.12) 0%, transparent 55%), linear-gradient(135deg, #dceaf8 0%, #f5f9fd 45%, #fafafa 100%)',
      }}
    />
    <div className="absolute inset-0 pointer-events-none opacity-40">
      <HeroDecorativeLines />
    </div>
  </div>
);

const panelShellStyle: React.CSSProperties = {
  width: `calc(${PANEL_SHARE} + ${FADE_WIDTH_PX}px)`,
  background: PANEL_GRADIENT,
  WebkitMaskImage: PANEL_EDGE_MASK,
  WebkitMaskSize: '100% 100%',
  maskImage: PANEL_EDGE_MASK,
  maskSize: '100% 100%',
};

export const HomepageDesktopKayak: React.FC<HomepageDesktopKayakProps> = ({
  categoryTabs,
  categoryId,
}) => {
  const navigate = useNavigate();
  const { landingTarget: ipLanding, isResolved: ipLandingResolved } = useDetectedCountryFromIp();

  const goToMap = () => {
    navigate(`/crear-busqueda?categoryId=${categoryId}&serviceTypeId=2&step=map`);
  };

  /** Personaje más pegado al borde; texto alineado con grid 1280px */
  const expertLeft = 'max(0.25rem, calc((100vw - 1280px) / 2 - 0.25rem))';
  const textBlockLeft = `calc(${expertLeft} + clamp(13.5rem, 21vw, 17rem))`;

  return (
    <section
      data-homepage-hero
      className="relative hidden md:block h-[400px] lg:h-[500px] xl:h-[520px] overflow-hidden border-b border-[#e8e8e8]/80 bg-[#dce9f2]"
    >
      <div className="absolute inset-0 z-[1]">
        <Suspense fallback={<HeroMapLoadingPlaceholder />}>
          <ExpertsAreaMap
            className="h-full w-full"
            overlayPaddingRatio={MAP_OVERLAY_PADDING}
            ipLanding={ipLanding}
            ipLandingResolved={ipLandingResolved}
          />
        </Suspense>
      </div>

      <div className="absolute inset-0 z-[4] pointer-events-none">
        <HeroDecorativeLines />
      </div>

      <aside
        className="absolute inset-y-0 left-0 z-10 pointer-events-none overflow-x-visible overflow-y-hidden"
        style={panelShellStyle}
      >
        <HeroPanelJoy />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: `${PANEL_SIDE_LINES}, ${PANEL_WARM_GLOW}, ${PANEL_TOP_GLOW}` }}
        />
        <div className="relative z-10 h-full w-full overflow-visible">
          <div
            className="pointer-events-none absolute bottom-0 z-[6]"
            style={{ left: expertLeft }}
          >
            <HeroExpertCutout preset="desktop-hero" />
          </div>

          <div
            className="flex h-full items-center"
            style={{ paddingLeft: textBlockLeft, paddingRight: '1.25rem' }}
          >
            <div className="pointer-events-auto relative z-10 min-w-0 max-w-[34rem]">
              <h1 className="hp-hero-title-lg">
                Antes de comprar,
                <span className="block text-brand">que lo revise un experto</span>
              </h1>

              <p className="hp-hero-body mt-3 max-w-[26rem] lg:text-base">
                Informe con fotos y vídeo. Precio cerrado y pago retenido hasta recibirlo.
              </p>

              <div
                className="mt-6 flex flex-wrap gap-2"
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
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-all ${
                      cat.isActive
                        ? 'bg-[#222222] font-medium text-white shadow-sm'
                        : 'border border-[#e5e5e5] bg-white font-normal text-[#555555] hover:border-[#cccccc] hover:text-[#333333]'
                    }`}
                  >
                    {cat.icon && (
                      <img
                        src={cat.icon}
                        alt=""
                        className={`h-4 w-4 object-contain ${cat.isActive ? 'brightness-0 invert' : 'opacity-70'}`}
                      />
                    )}
                    {cat.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={goToMap}
                className="group mt-5 inline-flex w-fit self-start items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-all hover:bg-brand-hover hover:shadow-[0_6px_20px_hsl(var(--brand)/0.28)] active:scale-[0.99]"
              >
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                Buscar en el mapa
                <ArrowRight className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
};
