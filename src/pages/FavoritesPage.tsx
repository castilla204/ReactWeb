import React, { useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { FavoriteHeart } from '../components/FavoriteHeart';
import { persistServiceReturnPath } from '../utils/servicePageNavigation';
import { useServiceFavorites } from '../hooks/useServiceFavorites';
import { useAuth } from '../contexts/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { homepageToast } from '../lib/toast';
import { Footer } from '../components/Footer';
import SEO from '../components/SEO';
// Reutilizamos la MISMA tarjeta de la homepage → favoritos y home se ven idénticos
// y cualquier mejora futura de la card se hereda sin duplicar estilos.
import { ServiceCard } from '../components/HomepageWall';
import { SearchServiceDetailDto } from '../types/homepageWall';
import {
  HP_FONT,
  HP_COLOR,
  SD_PAGE_INNER_MAX_CLASS,
  HP_CHECKOUT_TITLE_UNDERLINE_GRADIENT,
  hpIconButtonClass,
} from '../constants/homepageTypography';

const FAVORITES_PATH = '/favoritos';

// Barra inferior móvil — lazy para no cargarla en escritorio (mismo patrón que HomePage).
const MobileBottomBar = lazy(() =>
  import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

/**
 * Grid responsive de favoritos. Las cards de la homepage tienen ancho FIJO
 * (pensadas para el carrusel), así que el wrapper fuerza el `<a>` interno a
 * `w-full` → la misma card crece y llena cada columna, sin huecos raros.
 */
const FAVORITES_GRID_CLASS =
  'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-5 md:gap-y-9 lg:grid-cols-4 xl:grid-cols-5';

const FAVORITES_GRID_CARDS_CLASS = `${FAVORITES_GRID_CLASS} [&>a]:!w-full [&>a]:!max-w-none`;

/** Botón pill de marca — mismas reglas de color/animación que los CTA del sitio. */
const BRAND_CTA_CLASS =
  'inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

/** Convierte la fila de favorito al DTO que consume la tarjeta de la homepage. */
const toServiceDetail = (service: any): SearchServiceDetailDto => ({
  id: service.id,
  categoryId: service.categoryId,
  serviceTypeId: service.serviceTypeId,
  serviceTypeName: service.serviceTypeName,
  price: service.price,
  imageUrls: service.imageUrls || [],
  categoryName: service.categoryName,
  completedSearches: service.completedSearches || 0,
  averageRating: service.averageRating || 0,
  isFavorite: true, // En esta página todo está marcado como favorito.
  expert: service.expert
    ? {
        id: service.expert.id,
        profilePictureUrl: service.expert.profilePictureUrl,
        description: '',
        latitude: '',
        longitude: '',
        user: {
          id: service.expert.id,
          name: service.expert.name,
          email: '',
        },
        reviews: [],
        country: service.expert.country,
        city: service.expert.city || null,
        currentAvailability: undefined,
      }
    : undefined,
  requiresAppointment: false,
  conditions: '',
  durationInHours: 0,
  createdAt: '',
  isActive: true,
  selectedDeliverableTypes: [],
});

/** Placeholder con el footprint exacto de una tarjeta mientras carga. */
const FavoriteCardSkeleton: React.FC<{ isMobile: boolean }> = ({ isMobile }) => (
  <div className="w-full" aria-hidden="true">
    <div
      className="w-full animate-pulse rounded-[20px] bg-[#eeeeee] md:rounded-xl"
      style={{ aspectRatio: isMobile ? '1' : '4 / 3' }}
    />
    <div className="mt-2 h-[14px] w-3/4 animate-pulse rounded bg-[#eeeeee]" />
    <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-[#f1f1f1]" />
    <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-[#f1f1f1]" />
  </div>
);

interface FavoritesShellProps {
  count?: number;
  showBack?: boolean;
  children: React.ReactNode;
}

/** Marco común: cabecera editorial + contenido + footer pegado abajo. */
const FavoritesShell: React.FC<FavoritesShellProps> = ({ count, showBack = true, children }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const subtitle =
    count === undefined
      ? 'Tu colección de servicios guardados'
      : count === 0
      ? 'Aún no has guardado ningún servicio'
      : `${count} ${count === 1 ? 'servicio guardado' : 'servicios guardados'}`;

  return (
    <div className="flex min-h-screen flex-col bg-white pb-[calc(65px+env(safe-area-inset-bottom,0px))] md:pb-0">
      <SEO title="Tus favoritos | Inspecciono" description="Servicios de inspección que has guardado." noindex />
      {/* Cabecera editorial — sin barra sticky; respira y deja la marca clara. */}
      <header className="border-b border-[#ececec]">
        <div className={SD_PAGE_INNER_MAX_CLASS}>
          <div className="py-6 md:py-9">
            {showBack && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`${hpIconButtonClass} mb-4`}
                aria-label="Volver"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <FavoriteHeart filled size={24} variant="plain" className="flex-shrink-0" />
              <h1
                className="relative inline-block font-display text-[26px] font-bold leading-tight tracking-[-0.02em] md:text-[32px]"
                style={{ fontFamily: HP_FONT, color: HP_COLOR.primary }}
              >
                Favoritos
                {/* Acento de marca azul → ámbar (mismo flow que títulos de checkout/mapa) */}
                <span
                  aria-hidden="true"
                  className="absolute -bottom-2 left-0 h-[3px] w-full rounded-full"
                  style={{ background: HP_CHECKOUT_TITLE_UNDERLINE_GRADIENT }}
                />
              </h1>
            </div>
            <p
              className="mt-3.5 text-[14px] md:text-[15px]"
              style={{ fontFamily: HP_FONT, color: HP_COLOR.muted }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className={`${SD_PAGE_INNER_MAX_CLASS} py-7 md:py-9`}>{children}</div>
      </main>

      <Footer />

      {isMobile && (
        <Suspense fallback={null}>
          <MobileBottomBar />
        </Suspense>
      )}
    </div>
  );
};

/** Estado centrado reutilizable (sin sesión / vacío / error). */
const CenteredState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}> = ({ icon, title, description, ctaLabel, onCta }) => (
  <div className="mx-auto flex max-w-md flex-col items-center px-2 py-12 text-center md:py-20">
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f6f6]">
      {icon}
    </div>
    <h2
      className="text-[19px] font-semibold tracking-[-0.01em] md:text-[21px]"
      style={{ fontFamily: HP_FONT, color: HP_COLOR.primary }}
    >
      {title}
    </h2>
    <p className="mt-2 text-[14px] leading-relaxed" style={{ fontFamily: HP_FONT, color: HP_COLOR.muted }}>
      {description}
    </p>
    <button type="button" onClick={onCta} className={`${BRAND_CTA_CLASS} mt-6`}>
      {ctaLabel}
    </button>
  </div>
);

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuth();
  const { getUserFavorites, toggleFavoriteAsync } = useServiceFavorites();
  const { data: favoritesResponse, isLoading, error } = getUserFavorites(1, 50);
  const favorites = favoritesResponse?.data || [];

  // Mismas handlers que la homepage para que la card se comporte igual.
  const handleOpenService = useCallback(
    (serviceId: number) => {
      persistServiceReturnPath(FAVORITES_PATH);
      navigate(`/service/${serviceId}`, { state: { returnTo: FAVORITES_PATH } });
    },
    [navigate],
  );

  const handleToggleFavorite = useCallback(
    async (serviceId: number) => {
      if (!isAuthenticated) {
        homepageToast.loginRequired();
        return null;
      }
      try {
        const result = await toggleFavoriteAsync(serviceId);
        return { isFavorite: result.isFavorite, message: result.message };
      } catch (err: any) {
        homepageToast.error(err?.message || 'Error al actualizar favorito', 3000);
        return null;
      }
    },
    [isAuthenticated, toggleFavoriteAsync],
  );

  if (!isAuthenticated) {
    return (
      <FavoritesShell showBack={false}>
        <CenteredState
          icon={<Heart className="h-7 w-7" style={{ color: HP_COLOR.muted }} />}
          title="Inicia sesión para ver tus favoritos"
          description="Guarda los servicios que te interesan y vuelve a ellos cuando quieras, desde cualquier dispositivo."
          ctaLabel="Ir al inicio"
          onCta={() => navigate('/')}
        />
      </FavoritesShell>
    );
  }

  if (isLoading) {
    return (
      <FavoritesShell>
        <div className={FAVORITES_GRID_CLASS}>
          {Array.from({ length: 10 }).map((_, i) => (
            <FavoriteCardSkeleton key={i} isMobile={isMobile} />
          ))}
        </div>
      </FavoritesShell>
    );
  }

  if (error) {
    return (
      <FavoritesShell>
        <CenteredState
          icon={<Heart className="h-7 w-7" style={{ color: HP_COLOR.muted }} />}
          title="No pudimos cargar tus favoritos"
          description="Ha ocurrido un problema al recuperar tu lista. Inténtalo de nuevo en unos segundos."
          ctaLabel="Reintentar"
          onCta={() => window.location.reload()}
        />
      </FavoritesShell>
    );
  }

  if (favorites.length === 0) {
    return (
      <FavoritesShell count={0}>
        <CenteredState
          icon={<Heart className="h-7 w-7" style={{ color: HP_COLOR.muted }} />}
          title="Todavía no tienes favoritos"
          description="Explora los servicios disponibles y pulsa el corazón para guardarlos aquí."
          ctaLabel="Explorar servicios"
          onCta={() => navigate('/')}
        />
      </FavoritesShell>
    );
  }

  return (
    <FavoritesShell count={favorites.length}>
      <div className={FAVORITES_GRID_CARDS_CLASS}>
        {favorites.map((favorite: any, index: number) => {
          const service = favorite.service;
          if (!service) return null;

          return (
            <ServiceCard
              key={favorite.id}
              service={toServiceDetail(service)}
              initialIsFavorite
              isMobile={isMobile}
              isAuthenticated={isAuthenticated}
              priority={index < 4}
              onOpenService={handleOpenService}
              onToggleFavorite={handleToggleFavorite}
            />
          );
        })}
      </div>
    </FavoritesShell>
  );
};
