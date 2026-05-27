import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useHomepageWallQuery } from '../hooks/useHomepageWall';

const HERO_IMAGE = {
  src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&h=900&q=85&crop=center',
  alt: 'Vivienda moderna',
};

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

export const HomepageDesktopKayak: React.FC<HomepageDesktopKayakProps> = ({
  categoryTabs,
  categoryId,
  countryCode = 'ES',
}) => {
  const navigate = useNavigate();

  const wallParams = useMemo(
    () => ({
      categoryId,
      latitude: null as string | null,
      longitude: null as string | null,
      countryCode,
      locationRange: 50,
      nearbyPage: 1,
      nearbyPageSize: 20,
      popularPage: 1,
      popularPageSize: 20,
      _enabled: true,
    }),
    [categoryId, countryCode],
  );

  const { data: wallSections, isLoading: wallLoading } = useHomepageWallQuery(wallParams);

  const nearbyServiceCount = useMemo(() => {
    const first = wallSections?.[0];
    if (first?.pagination?.totalCount != null) return first.pagination.totalCount;
    return first?.services?.length ?? null;
  }, [wallSections]);

  const mapButtonLabel = useMemo(() => {
    if (wallLoading || nearbyServiceCount == null) {
      return 'Ver servicios cercanos en el mapa';
    }
    if (nearbyServiceCount === 0) {
      return 'Ver servicios cercanos en el mapa';
    }
    return `Ver ${nearbyServiceCount} servicio${nearbyServiceCount === 1 ? '' : 's'} cercanos en el mapa`;
  }, [wallLoading, nearbyServiceCount]);

  const goToMap = () => {
    // Forzamos revisión presencial para que el mapa cargue resultados desde el primer momento.
    navigate(`/crear-busqueda?categoryId=${categoryId}&serviceTypeId=1&step=map`);
  };

  return (
    <section className="hidden md:block border-b border-[#e7e7e7] bg-gradient-to-b from-[#f8f8f8] to-[#f4f4f4]">
      <div className="flex min-h-[260px] lg:min-h-[300px]">
        <div
          className="relative z-10 flex flex-col justify-center py-9 lg:py-10 pl-4 md:pl-6 lg:pl-10 pr-6 md:pr-8 lg:pr-12 shrink-0 bg-transparent"
          style={{
            width: 'min(540px, 42vw)',
            marginLeft: 'max(0px, calc((100vw - 1280px) / 2))',
          }}
        >
          <h1 className="text-[1.82rem] lg:text-[2.2rem] font-semibold text-[#1f1f1f] leading-[1.08] tracking-[-0.025em]">
            Compra con seguridad desde el primer minuto
          </h1>
          <p className="mt-2.5 text-[#5f5f5f] text-[15px] leading-snug max-w-md">
            Expertos verificados en coches, motos e inmuebles. Reserva en minutos, con precio claro y sin sorpresas.
          </p>

          <div className="mt-6 flex items-center gap-3.5" role="tablist" aria-label="Categorías principales">
            {categoryTabs.map((cat) => (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={cat.isActive}
                onClick={cat.onClick}
                className={`inline-flex items-center gap-2 px-2.5 py-2 border-b-2 text-[15px] leading-none transition-all duration-200 ${
                  cat.isActive
                    ? 'border-[#1f1f1f] text-[#1f1f1f] font-semibold'
                    : 'border-transparent text-[#6d6d6d] hover:text-[#2f2f2f]'
                }`}
              >
                {cat.icon && (
                  <img
                    src={cat.icon}
                    alt=""
                    className={`w-[18px] h-[18px] object-contain ${cat.isActive ? 'opacity-95' : 'opacity-75'}`}
                  />
                )}
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative z-20 mt-6 flex w-[calc(100%+180px)] max-w-[820px] items-stretch bg-white/97 backdrop-blur-[1.5px] border border-[#e3e3e3] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.09)]">
            <div className="min-w-[350px] px-5 py-2 border-r border-[#efefef]">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#8a8a8a] leading-none">
                Tipo de servicio
              </p>
              <p className="mt-1 text-[14px] font-semibold text-[#222] leading-tight">
                Revisión presencial
              </p>
              <p className="mt-0.5 text-[11px] text-[#6b6b6b] leading-snug">
                Un experto revisa el vehículo o inmueble in situ antes de comprar.
              </p>
            </div>
            <button
              type="button"
              onClick={goToMap}
              className="flex-1 min-w-[280px] px-4 py-2 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#1f1f1f] hover:bg-[#fafafa] transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              {mapButtonLabel}
            </button>
          </div>
        </div>

        <div className="relative flex-1 min-h-[260px] lg:min-h-[300px] bg-[#d4d4d4]">
          <img
            src={HERO_IMAGE.src}
            alt={HERO_IMAGE.alt}
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
};
