import React, { useState, useRef, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useHomepageWallQuery } from '../hooks/useHomepageWall';
import { SearchServiceDetailDto } from '../types/homepageWall';
import { Heart, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

interface ServiceCardProps {
  service: SearchServiceDetailDto;
  forceGuestFavorite?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, forceGuestFavorite = false }) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const isMobile = useIsMobile();

  const handleCardClick = () => {
    navigate(`/service/${service.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleImageNavigation = (e: React.MouseEvent, direction: 'prev' | 'next') => {
    e.stopPropagation();
    if (service.imageUrls.length <= 1) return;
    
    if (direction === 'next') {
      setImageIndex((prev) => (prev + 1) % service.imageUrls.length);
    } else {
      setImageIndex((prev) => (prev - 1 + service.imageUrls.length) % service.imageUrls.length);
    }
  };

  const hasMultipleImages = service.imageUrls.length > 1;
  const isGuestFavorite = forceGuestFavorite || (service.completedSearches > 10 && service.averageRating >= 4.5);

  // Formatear fecha (simulado - deberías obtener fechas reales del servicio)
  const formatDate = () => {
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + 2);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + 2);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[checkIn.getMonth()]} ${checkIn.getDate()} – ${checkOut.getDate()}`;
  };

  const hostType = service.expert?.user?.name ? 'Individual host' : 'Individual host';
  const nights = service.durationInHours ? Math.ceil(service.durationInHours / 24) : 2;
  const location = service.expert?.country || 'Madrid';

  return (
    <a
      href={`/service/${service.id}`}
      onClick={(e) => {
        e.preventDefault();
        handleCardClick();
      }}
      className="block flex-shrink-0"
      style={{ width: isMobile ? '160px' : '169px' }}
    >
      {/* Contenedor principal - Estructura exacta de Airbnb */}
      <div className="relative cursor-pointer group w-full">
        {/* Contenedor de imagen con todos los subdivs */}
        <div className="relative w-full overflow-hidden mb-2" style={{ aspectRatio: '1', borderRadius: '20px', width: '100%' }}>
          {service.imageUrls.length > 0 ? (
            <>
              {/* Imagen principal */}
              <div className="relative w-full h-full">
                <img
                  src={service.imageUrls[imageIndex]}
                  alt={service.serviceTypeName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ display: 'block' }}
                />
              </div>
              
              {/* Badge "Guest favorite" - Estructura exacta */}
              {isGuestFavorite && (
                <div
                  className="absolute top-3 left-3 z-10"
                  style={{
                    padding: '0',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        lineHeight: '12px',
                        fontWeight: 600,
                        color: '#222222',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                        letterSpacing: '0.01em',
                      }}
                    >
                      Guest favorite
                    </span>
                  </div>
                </div>
              )}

              {/* Botón de favorito - Solo el corazón sin círculo */}
              <button
                onClick={handleFavoriteClick}
                className="absolute top-3 right-3 z-10"
                style={{
                  padding: '0',
                  margin: '0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                }}
              >
                <svg
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  role="presentation"
                  focusable="false"
                  style={{
                    display: 'block',
                    fill: isFavorite ? '#FF385C' : 'rgba(255, 255, 255, 0.7)',
                    height: '24px',
                    width: '24px',
                    stroke: isFavorite ? '#FF385C' : '#FFFFFF',
                    strokeWidth: '2',
                    overflow: 'visible',
                    margin: '0',
                    padding: '0',
                  }}
                >
                  <path d="m15.9998 28.6668c7.1667-4.8847 14.3334-10.8844 14.3334-18.1088 0-1.84951-.6993-3.69794-2.0988-5.10877-1.3996-1.4098-3.2332-2.11573-5.0679-2.11573-1.8336 0-3.6683.70593-5.0668 2.11573l-2.0999 2.11677-2.0999-2.11677c-1.3985-1.4098-3.2332-2.11573-5.0668-2.11573-1.8347 0-3.6683.70593-5.0679 2.11573-1.3996 1.41083-2.0988 3.25926-2.0988 5.10877 0 7.2244 7.1667 13.2241 14.3334 18.1088z"></path>
                </svg>
              </button>

              {/* Navegación de imágenes - Solo en desktop */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => handleImageNavigation(e, 'prev')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                    style={{
                      padding: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700 rotate-180" />
                  </button>
                  <button
                    onClick={(e) => handleImageNavigation(e, 'next')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                    style={{
                      padding: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                  
                  {/* Indicadores de imágenes */}
                  <div
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 flex"
                    style={{ gap: '6px' }}
                  >
                    {service.imageUrls.map((_, idx) => (
                      <div
                        key={idx}
                        className="rounded-full transition-all bg-white"
                        style={{
                          height: '4px',
                          width: idx === imageIndex ? '24px' : '4px',
                          opacity: idx === imageIndex ? 1 : 0.6,
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Sin imagen</span>
            </div>
          )}
        </div>

        {/* Información del servicio - Estructura exacta con todos los subdivs */}
        <div style={{ marginTop: '8px' }}>
          {/* Primera fila: Nombre del servicio (Título) */}
          <div
            className="overflow-hidden"
            style={{
              marginBottom: '4px',
              fontSize: '14px',
              lineHeight: '18px',
              fontWeight: 600,
              color: '#222222',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
              textAlign: 'left',
            }}
          >
            <div className="truncate" style={{ textAlign: 'left' }}>{service.serviceTypeName}</div>
          </div>

          {/* Segunda fila: Fechas y tipo de host */}
          <div
            className="overflow-hidden"
            style={{
              marginBottom: '4px',
              fontSize: '14px',
              lineHeight: '18px',
              fontWeight: 400,
              color: '#717171',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
              textAlign: 'left',
            }}
          >
            <div className="truncate" style={{ textAlign: 'left' }}>
              {formatDate()} · {hostType}
            </div>
          </div>

          {/* Tercera fila: Precio y calificación con estrella */}
          <div
            className="flex items-center overflow-hidden"
            style={{
              fontSize: '14px',
              lineHeight: '18px',
              fontWeight: 400,
              color: '#717171',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
              textAlign: 'left',
              justifyContent: 'flex-start',
            }}
          >
            <span>€ {service.price}</span>
            <span>{` for ${nights} ${nights === 1 ? 'night' : 'nights'}`}</span>
            <span> · </span>
            <Star 
              className="flex-shrink-0" 
              style={{ 
                width: '12px', 
                height: '12px', 
                fill: '#222222', 
                color: '#222222',
              }} 
            />
            <span style={{ marginLeft: '4px' }}>
              {service.averageRating?.toFixed(2) || '4.95'}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};

interface HorizontalScrollSectionProps {
  title: string;
  subtitle?: string;
  services: SearchServiceDetailDto[];
  showCount?: boolean;
  forceGuestFavorite?: boolean;
}

const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({
  title,
  subtitle,
  services,
  showCount = false,
  forceGuestFavorite = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll);
      return () => scrollElement.removeEventListener('scroll', checkScroll);
    }
  }, [services]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (services.length === 0) return null;

  return (
    <div className="mb-12" style={{ marginBottom: '32px' }}>
      {/* Header */}
      <div className="mb-4" style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '0', paddingBottom: '0' }}>
        <div className="flex items-center justify-between">
          <div>
            <a
              href="#"
              className="font-semibold text-gray-900 mb-1 block inline-flex items-center"
              style={{ 
                fontSize: '20px', 
                lineHeight: '24px', 
                fontWeight: 600,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                textDecoration: 'none',
                color: '#222222',
                gap: '4px',
              }}
            >
              <span>{title.replace(' >', '')}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                  role="presentation"
                  focusable="false"
                  style={{
                    display: 'block',
                    fill: 'none',
                    height: '12px',
                    width: '12px',
                    stroke: 'currentColor',
                    strokeWidth: '5.33333',
                    overflow: 'visible',
                  }}
                >
                  <path fill="none" d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28"></path>
                </svg>
              </span>
            </a>
            {subtitle && (
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '16px',
                  fontWeight: 400,
                  color: '#717171',
                  marginTop: '4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {showCount && (
            <a
              href="#"
              className="hidden sm:flex items-center font-semibold text-gray-900 hover:underline"
              style={{ 
                fontSize: '14px', 
                lineHeight: '18px', 
                fontWeight: 600, 
                gap: '4px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              <span>Show all</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                aria-hidden="true"
                role="presentation"
                focusable="false"
                style={{
                  display: 'block',
                  fill: 'none',
                  height: '12px',
                  width: '12px',
                  stroke: 'currentColor',
                  strokeWidth: '5.33333',
                  overflow: 'visible',
                }}
              >
                <path fill="none" d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28"></path>
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Scroll area */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide pb-4"
          style={{
            paddingLeft: '24px',
            paddingRight: '24px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            gap: '12px',
          }}
          onScroll={checkScroll}
        >
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} forceGuestFavorite={forceGuestFavorite} />
          ))}
        </div>

        {/* Scroll buttons - Solo en desktop */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-shadow z-10 items-center justify-center"
            style={{ width: '28px', height: '28px' }}
            aria-label="Scroll left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              aria-hidden="true"
              role="presentation"
              focusable="false"
              style={{
                display: 'block',
                fill: 'none',
                height: '12px',
                width: '12px',
                stroke: 'currentColor',
                strokeWidth: '4',
                overflow: 'visible',
                transform: 'rotate(180deg)',
              }}
            >
              <path fill="none" d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28"></path>
            </svg>
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-shadow z-10 items-center justify-center"
            style={{ width: '28px', height: '28px' }}
            aria-label="Scroll right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              aria-hidden="true"
              role="presentation"
              focusable="false"
              style={{
                display: 'block',
                fill: 'none',
                height: '12px',
                width: '12px',
                stroke: 'currentColor',
                strokeWidth: '4',
                overflow: 'visible',
              }}
            >
              <path fill="none" d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28"></path>
            </svg>
          </button>
        )}
      </div>

    </div>
  );
};

interface HomepageWallProps {
  countryCode?: string;
}

export const HomepageWall: React.FC<HomepageWallProps> = ({ 
  countryCode = 'ES' 
}) => {
  const { latitude, longitude, error: geoError, loading: geoLoading } = useGeolocation();

  const { data, isLoading, error } = useHomepageWallQuery({
    latitude,
    longitude,
    countryCode,
    locationRange: 50,
    nearbyPage: 1,
    nearbyPageSize: 20,
    popularPage: 1,
    popularPageSize: 20,
  });

  if (isLoading || geoLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ HomepageWall - Error:', error);
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error al cargar servicios: {error.message}</p>
        <p className="text-gray-500 text-sm mt-2">Revisa la consola para más detalles</p>
      </div>
    );
  }

  if (!data) {
    console.warn('⚠️ HomepageWall - No hay datos');
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No hay datos disponibles</p>
      </div>
    );
  }

  console.log('📊 HomepageWall - Renderizando con datos:', {
    nearbyCount: data.nearbyServices?.services?.length || 0,
    popularCount: data.popularServices?.services?.length || 0,
  });

  const cityName = countryCode === 'ES' ? 'Madrid' : 'tu ciudad';

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[95%] md:max-w-[85%] lg:max-w-[80%]">
        {/* Sección: Servicios Cercanos / Popular homes */}
        {data.nearbyServices.services.length > 0 && (
          <HorizontalScrollSection
            title={`Popular homes in ${cityName} >`}
            services={data.nearbyServices.services}
            showCount={true}
          />
        )}

        {/* Sección: Servicios Populares / Featured hotels */}
        {data.popularServices.services.length > 0 && (
          <HorizontalScrollSection
            title={`Featured hotels in ${cityName} >`}
            subtitle="A collection of independent and handpicked hotels"
            services={data.popularServices.services}
            showCount={true}
            forceGuestFavorite={true}
          />
        )}
      </div>
    </div>
  );
};
