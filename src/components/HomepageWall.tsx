import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useHomepageWallQuery } from '../hooks/useHomepageWall';
import { SearchServiceDetailDto, SearchServiceHomepageDto, HomepageSection } from '../types/homepageWall';
import { Heart, Star, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from './Footer';
import { getCountryName } from '../utils/countries';

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

  // Debug: Log del servicio para verificar datos
  useEffect(() => {
    console.log('🎴 ServiceCard - Servicio renderizado:', {
      id: service.id,
      serviceTypeName: service.serviceTypeName,
      serviceTypeDescription: service.serviceTypeDescription,
      hasDescription: !!service.serviceTypeDescription,
      categoryName: service.categoryName,
      price: service.price,
      imageUrls: service.imageUrls,
      imageUrlsLength: service.imageUrls?.length || 0,
      expert: service.expert?.user?.name,
      averageRating: service.averageRating,
      isMobile,
    });
  }, [service, isMobile]);

  const handleCardClick = () => {
    // Navegar a la página de detalle del servicio primero
    navigate(`/service/${service.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleImageNavigation = (e: React.MouseEvent, direction: 'prev' | 'next') => {
    e.stopPropagation();
    const imageUrls = service.imageUrls || [];
    if (imageUrls.length <= 1) return;
    
    if (direction === 'next') {
      setImageIndex((prev) => (prev + 1) % imageUrls.length);
    } else {
      setImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    }
  };

  const imageUrls = service.imageUrls || [];
  const hasMultipleImages = imageUrls.length > 1;
  const isGuestFavorite = forceGuestFavorite || (service.completedSearches > 10 && service.averageRating >= 4.5);

  // ✅ Información real del servicio para la segunda línea: Precio · Horario
  // Precio del servicio
  const price = service.price ? `€${Math.round(service.price)}` : 'Consultar';
  
  // Horario de disponibilidad (formato compacto para que quepa)
  const formatAvailability = () => {
    const availability = service.expert?.currentAvailability;
    if (!availability) return 'Flexible';
    
    // Formatear días de la semana (solo inicial: L, M, X, J, V, S, D)
    const days = availability.daysOfWeek || [];
    if (days.length === 0) return 'Flexible';
    
    const dayMap: Record<string, string> = {
      'Monday': 'L',
      'Tuesday': 'M',
      'Wednesday': 'X',
      'Thursday': 'J',
      'Friday': 'V',
      'Saturday': 'S',
      'Sunday': 'D'
    };
    
    // Limitar a máximo 5 días para que quepa
    const dayAbbr = days
      .slice(0, 5)
      .map((day: string) => dayMap[day] || day.charAt(0))
      .join('');
    
    // Formatear horas (formato compacto: "9-18" en lugar de "09:00-18:00")
    const startTime = availability.startTime ? availability.startTime.substring(0, 5) : '';
    const endTime = availability.endTime ? availability.endTime.substring(0, 5) : '';
    
    if (startTime && endTime) {
      // Convertir "09:00" a "9" y "18:00" a "18"
      const startHour = parseInt(startTime.split(':')[0], 10).toString();
      const endHour = parseInt(endTime.split(':')[0], 10).toString();
      return `${dayAbbr} ${startHour}-${endHour}h`;
    }
    return dayAbbr || 'Flexible';
  };
  
  const availabilityInfo = formatAvailability();
  
  // Formatear la segunda línea: "Precio · Horario"
  const secondLineInfo = `${price} · ${availabilityInfo}`;
  
  // Calcular duración en días si está disponible
  const nights = service.durationInHours ? Math.ceil(service.durationInHours / 24) : null;

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
          {imageUrls.length > 0 ? (
            <>
              {/* Imagen principal */}
              <div className="relative w-full h-full">
                <img
                  src={imageUrls[imageIndex]}
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
                    {imageUrls.map((_, idx) => (
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

          {/* Descripción del servicio - Solo si existe */}
          {service.serviceTypeDescription && (
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
                display: 'block',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {service.serviceTypeDescription}
            </div>
          )}

          {/* Segunda fila: Precio · 📅 Horario */}
          <div
            className="flex items-center overflow-hidden"
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
            <div className="truncate flex items-center gap-1" style={{ textAlign: 'left' }}>
              <span>{price}</span>
              <span>·</span>
              <Calendar 
                className="flex-shrink-0" 
                style={{ 
                  width: '11px', 
                  height: '11px',
                  color: '#717171',
                  marginRight: '2px',
                }} 
              />
              <span className="truncate">{availabilityInfo}</span>
            </div>
          </div>

          {/* Tercera fila: Puntuación · Contrataciones · Experto · Ubicación */}
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
            <Star 
              className="flex-shrink-0" 
              style={{ 
                width: '10px', 
                height: '10px', 
                fill: '#222222', 
                color: '#222222',
                opacity: 0.7,
              }} 
            />
            <span style={{ marginLeft: '4px' }}>
              {service.averageRating ? service.averageRating.toFixed(1) : 'N/A'}
            </span>
            {service.completedSearches > 0 && (
              <>
                <span style={{ marginLeft: '4px', marginRight: '4px' }}>·</span>
                <span>{service.completedSearches} {service.completedSearches === 1 ? 'contratación' : 'contrataciones'}</span>
              </>
            )}
            {service.expert?.user?.name && (
              <>
                <span style={{ marginLeft: '4px', marginRight: '4px' }}>·</span>
                <span className="truncate">{service.expert.user.name}</span>
              </>
            )}
            {service.expert?.country && (
              <>
                <span style={{ marginLeft: '4px', marginRight: '4px' }}>·</span>
                <span className="truncate">{getCountryName(service.expert.country)}</span>
              </>
            )}
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
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-all z-10 items-center justify-center"
            style={{ 
              width: '28px', 
              height: '28px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.18)',
            }}
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
                color: '#222222',
              }}
            >
              <path fill="none" d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28"></path>
            </svg>
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-all z-10 items-center justify-center"
            style={{ 
              width: '28px', 
              height: '28px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.18)',
            }}
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
                color: '#222222',
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
  serviceTypeId?: number | null;
  categoryId: number; // ✅ OBLIGATORIO: ID de la categoría
}

export const HomepageWall: React.FC<HomepageWallProps> = ({ 
  countryCode = 'ES',
  serviceTypeId,
  categoryId,
}) => {
  const { latitude, longitude, error: geoError, loading: geoLoading } = useGeolocation();

  // Memoizar los parámetros de la query para evitar re-renderizados innecesarios
  const queryParams = useMemo(() => ({
    categoryId, // ✅ OBLIGATORIO
    latitude,
    longitude,
    countryCode,
    locationRange: 50,
    nearbyPage: 1,
    nearbyPageSize: 20,
    popularPage: 1,
    popularPageSize: 20,
  }), [categoryId, latitude, longitude, countryCode]);

  const { data: sections, isLoading, error } = useHomepageWallQuery(queryParams);

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

  if (!sections || sections.length === 0) {
    console.warn('⚠️ HomepageWall - No hay secciones');
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No hay datos disponibles</p>
      </div>
    );
  }

  console.log('📊 HomepageWall - Renderizando con secciones:', {
    sectionsCount: sections.length,
    sections: sections.map(s => ({ title: s.title, servicesCount: s.services.length }))
  });

  // ✅ Función para convertir SearchServiceHomepageDto (PascalCase) a SearchServiceDetailDto (camelCase)
  const mapServiceToDetail = (service: SearchServiceHomepageDto): SearchServiceDetailDto => {
    // Debug: Verificar si la descripción viene del backend
    if (service.ServiceTypeDescription) {
      console.log('📝 HomepageWall - Descripción encontrada:', {
        serviceId: service.Id,
        serviceTypeName: service.ServiceTypeName,
        description: service.ServiceTypeDescription
      });
    }
    
    return {
      id: service.Id,
      categoryId: service.CategoryId,
      serviceTypeId: service.ServiceTypeId,
      serviceTypeName: service.ServiceTypeName,
      serviceTypeDescription: service.ServiceTypeDescription, // ✅ NUEVO: Descripción del tipo de servicio
      price: service.Price,
      imageUrls: service.ImageUrls || [],
      categoryName: service.CategoryName,
      completedSearches: service.CompletedSearches,
      averageRating: service.AverageRating,
      expert: service.Expert ? {
        id: service.Expert.Id,
        profilePictureUrl: service.Expert.ProfilePictureUrl,
        description: '',
        latitude: '',
        longitude: '',
        user: {
          id: service.Expert.Id,
          name: service.Expert.Name,
          email: '',
        },
        reviews: [],
        country: service.Expert.Country,
        // ✅ NUEVO: Mapear Availability del backend a currentAvailability
        currentAvailability: service.Expert.Availability ? {
          id: 0, // No disponible en homepage DTO
          daysOfWeek: service.Expert.Availability.DaysOfWeek || [],
          startTime: service.Expert.Availability.StartTime || '',
          endTime: service.Expert.Availability.EndTime || '',
          effectiveFrom: undefined, // No disponible en homepage DTO
        } : undefined,
      } : undefined,
      requiresAppointment: false, // No disponible en homepage DTO
      conditions: '',
      durationInHours: 0,
      createdAt: '',
      isActive: true,
      selectedDeliverableTypes: [],
    };
  };

  // ✅ Filtrar servicios según serviceTypeId si está presente
  const filterServices = (services: SearchServiceHomepageDto[]): SearchServiceDetailDto[] => {
    let filtered = services;
    
    if (serviceTypeId) {
      filtered = services.filter(service => service.ServiceTypeId === serviceTypeId);
    }
    
    return filtered.map(mapServiceToDetail);
  };

  return (
    <>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[95%] md:max-w-[85%] lg:max-w-[80%]">
          {/* ✅ Iterar el array de secciones - no necesitas conocer las claves */}
          {sections.map((section: HomepageSection, index: number) => {
            const filteredServices = filterServices(section.services);
            
            // Solo renderizar si hay servicios después del filtrado
            if (filteredServices.length === 0) {
              return null;
            }
            
            return (
              <HorizontalScrollSection
                key={index}
                title={section.title} // ✅ Título ya viene formateado del backend
                subtitle={section.categoryName && section.country 
                  ? `${section.pagination.totalCount} servicios en ${section.country}` 
                  : undefined}
                services={filteredServices}
                showCount={true}
                forceGuestFavorite={index === 1} // Marcar la segunda sección como "Featured"
              />
            );
          })}
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-16 w-full">
        <Footer />
      </div>
    </>
  );
};
