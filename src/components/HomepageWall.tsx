import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useHomepageWallQuery } from '../hooks/useHomepageWall';
import { SearchServiceDetailDto, SearchServiceHomepageDto, HomepageSection } from '../types/homepageWall';
import { Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from './Footer';
import { useAuth } from '../contexts/AuthContext';
import { useServiceFavorites } from '../hooks/useServiceFavorites';
import { showToast } from '../lib/toast';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// ✅ OPTIMIZADO: Debounce para resize events y memoización
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const checkMobile = () => {
      // ✅ Debounce para evitar demasiadas actualizaciones
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 150); // 150ms debounce
    };
    
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
};

interface ServiceCardProps {
  service: SearchServiceDetailDto;
  forceGuestFavorite?: boolean;
  initialIsFavorite?: boolean; // Estado inicial desde el backend (IsFavorite)
}

// ✅ Memoizar ServiceCard para evitar re-renders innecesarios
const ServiceCard: React.FC<ServiceCardProps> = React.memo(({ service, forceGuestFavorite = false, initialIsFavorite = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toggleFavoriteAsync } = useServiceFavorites();
  // ✅ Usar isFavorite del servicio directamente (viene del backend) o el estado inicial como fallback
  const [isFavorite, setIsFavorite] = useState(service.isFavorite ?? initialIsFavorite);
  const [imageIndex, setImageIndex] = useState(0);
  const isMobile = useIsMobile();

  // Sincronizar con el estado del servicio cuando cambia (viene del backend)
  useEffect(() => {
    if (service.isFavorite !== undefined) {
      setIsFavorite(service.isFavorite);
    } else if (initialIsFavorite !== undefined) {
      setIsFavorite(initialIsFavorite);
    }
  }, [service.isFavorite, initialIsFavorite]);

  const handleCardClick = () => {
    // Navegar a la página de detalle del servicio primero
    navigate(`/service/${service.id}`);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isAuthenticated) {
      showToast('info', 'Inicia sesión para guardar favoritos', 3000);
      return;
    }

    try {
      const result = await toggleFavoriteAsync(service.id);
      setIsFavorite(result.isFavorite);
      showToast('success', result.message, 2000);
    } catch (error: any) {
      console.error('Error al actualizar favorito:', error);
      showToast('error', error.message || 'Error al actualizar favorito', 3000);
    }
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
      <div 
        className="relative cursor-pointer group w-full"
        style={{
          // ✅ Optimizaciones máximas para fluidez
          willChange: 'transform',
          contain: 'layout style paint',
          // ✅ GPU acceleration
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Contenedor de imagen con todos los subdivs */}
        <div 
          className="relative w-full overflow-hidden mb-2" 
          style={{ 
            aspectRatio: '1', 
            borderRadius: '20px', 
            width: '100%',
            // ✅ Optimizaciones máximas para fluidez
            willChange: 'transform',
            contain: 'layout style paint',
            // ✅ GPU acceleration
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        >
          {imageUrls.length > 0 ? (
            <>
              {/* Imagen principal - Optimizada para webview */}
              <div className="relative w-full h-full">
                <img
                  src={imageUrls[imageIndex]}
                  alt={service.serviceTypeName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ 
                    display: 'block',
                    willChange: 'transform', // ✅ Optimización para animaciones
                    contentVisibility: 'auto', // ✅ Lazy rendering del navegador
                  }}
                  loading="lazy" // ✅ Lazy loading nativo
                  decoding="async" // ✅ Decodificación asíncrona
                  fetchPriority="low" // ✅ Prioridad baja para imágenes no críticas
                />
              </div>
              
              {/* Badge "Recomendamos" - Estructura similar a Airbnb */}
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
                        fontWeight: 400,
                        color: '#222222',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                        letterSpacing: '0',
                      }}
                      aria-label="Recomendamos"
                    >
                      Recomendamos
                    </span>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          fontSize: '10px',
                          lineHeight: '12px',
                          fontWeight: 400,
                          color: '#222222',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Helvetica, Arial, sans-serif',
                          letterSpacing: '0',
                          position: 'absolute',
                          visibility: 'hidden',
                          pointerEvents: 'none',
                        }}
                      >
                        Recomendamos
                      </span>
                    </div>
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
                    fill: isFavorite ? '#FF385C' : 'rgba(0, 0, 0, 0.5)',
                    height: '24px',
                    width: '24px',
                    stroke: isFavorite ? '#FF385C' : 'rgba(255, 255, 255, 0.8)',
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
                                    className="absolute left-1/2 -translate-x-1/2 flex"
                                    style={{ 
                                      gap: '6px',
                                      bottom: isMobile ? '8px' : '12px',
                                    }}
                                  >
                                    {imageUrls.map((_, idx) => (
                                      <div
                                        key={idx}
                                        className="rounded-full transition-all bg-white"
                                        style={{
                                          height: isMobile ? '3px' : '4px',
                                          width: idx === imageIndex ? (isMobile ? '20px' : '24px') : (isMobile ? '3px' : '4px'),
                                          opacity: idx === imageIndex ? 1 : 0.6,
                                        }}
                                      />
                                    ))}
                                  </div>
                                </>
                              )}

                              {/* Avatar del experto - Esquina inferior izquierda */}
                              {service.expert && (
                                <div
                                  className="absolute left-3 z-10"
                                  style={{
                                    width: isMobile ? '28px' : '32px',
                                    height: isMobile ? '28px' : '32px',
                                    bottom: isMobile ? '8px' : '12px',
                                    borderRadius: '50%',
                                    border: '2px solid white',
                                    overflow: 'hidden',
                                    backgroundColor: '#f0f0f0',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                  }}
                                >
                                  {service.expert.profilePictureUrl ? (
                                    <img
                                      src={service.expert.profilePictureUrl}
                                      alt={service.expert.user?.name || 'Experto'}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div 
                                      className="w-full h-full flex items-center justify-center"
                                      style={{
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      {service.expert.user?.name?.charAt(0)?.toUpperCase() || 'E'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">Sin imagen</span>
                            </div>
                          )}
        </div>

        {/* Información del servicio - Estructura exacta como Airbnb */}
        <div style={{ marginTop: '6px' }}>
          {/* Primera fila: Título */}
          <div
            className="overflow-hidden"
            style={{
              marginBottom: '0px',
              fontSize: '14px',
              lineHeight: '20.02px',
              fontWeight: 500,
              color: 'rgb(34, 34, 34)',
              fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
              textAlign: 'left',
            }}
          >
            <div className="truncate" style={{ textAlign: 'left' }}>{service.serviceTypeName}</div>
          </div>

          {/* Segunda fila: Ciudad · Horario */}
          <div
            className="flex items-center overflow-hidden"
            style={{
              marginBottom: '0px',
              fontSize: '12px',
              lineHeight: '16px',
              fontWeight: 400,
              color: 'rgb(106, 106, 106)',
              fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
              textAlign: 'left',
            }}
          >
            <div className="flex items-center flex-wrap" style={{ textAlign: 'left' }}>
              {service.expert?.city && (
                <>
                  <span className="truncate">{service.expert.city}</span>
                  <span style={{ marginLeft: '4px', marginRight: '4px' }} aria-hidden="true">·</span>
                </>
              )}
              <span className="truncate">{availabilityInfo}</span>
            </div>
          </div>

          {/* Tercera fila: Valoración · Precio */}
          <div
            className="flex items-center overflow-hidden"
            style={{
              marginBottom: '0px',
              fontSize: '12px',
              lineHeight: '16px',
              fontWeight: 400,
              color: 'rgb(106, 106, 106)',
              fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
              textAlign: 'left',
            }}
          >
            <div className="flex items-center flex-wrap" style={{ textAlign: 'left' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Star 
                  className="flex-shrink-0" 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    fill: '#222222', 
                    color: '#222222',
                  }} 
                />
                <span>
                  {service.averageRating ? service.averageRating.toFixed(2).replace('.', ',') : 'N/A'}
                </span>
              </span>
              <span style={{ marginLeft: '4px', marginRight: '4px' }} aria-hidden="true">·</span>
              <span>{price}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}, (prevProps, nextProps) => {
  // ✅ Comparación personalizada: solo re-renderizar si cambian props relevantes
  return (
    prevProps.service.id === nextProps.service.id &&
    prevProps.service.isFavorite === nextProps.service.isFavorite &&
    prevProps.forceGuestFavorite === nextProps.forceGuestFavorite &&
    prevProps.initialIsFavorite === nextProps.initialIsFavorite
  );
});

interface HorizontalScrollSectionProps {
  title: string;
  subtitle?: string;
  services: SearchServiceDetailDto[];
  forceGuestFavorite?: boolean;
}

// ✅ Memoizar HorizontalScrollSection para evitar re-renders innecesarios
const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = React.memo(({
  title,
  subtitle,
  services,
  forceGuestFavorite = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // ✅ OPTIMIZADO: Debounce para scroll events
  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      // ✅ OPTIMIZADO: Usar requestAnimationFrame para máxima fluidez
      let rafId: number | null = null;
      const throttledCheckScroll = () => {
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            checkScroll();
            rafId = null;
          });
        }
      };
      
      scrollElement.addEventListener('scroll', throttledCheckScroll, { passive: true });
      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        scrollElement.removeEventListener('scroll', throttledCheckScroll);
      };
    }
  }, [services, checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      // ✅ OPTIMIZADO: Usar requestAnimationFrame para scroll más fluido
      requestAnimationFrame(() => {
        scrollRef.current?.scrollBy({
          left: direction === 'right' ? scrollAmount : -scrollAmount,
          behavior: 'smooth',
        });
      });
    }
  };

  if (services.length === 0) return null;

  return (
    <div 
      className="mb-12" 
      style={{ 
        marginBottom: '32px',
        // ✅ Optimizaciones para webview
        willChange: 'contents',
        contain: 'layout style paint',
      }}
    >
      {/* Header */}
      <div className="mb-4" style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '0', paddingBottom: '0' }}>
        <div className="flex items-center justify-between">
          <div>
            <a
              href="#"
              style={{ 
                textDecoration: 'none',
                color: '#222222',
              }}
            >
              <h2
                style={{ 
                  fontSize: '18px', 
                  lineHeight: '24px', 
                  fontWeight: 600,
                  fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                  color: 'rgb(34, 34, 34)',
                  margin: 0,
                  padding: 0,
                }}
              >
                <span>{title.replace(' >', '')}</span>
              </h2>
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
          <a
            href="#"
            style={{ 
              textDecoration: 'none',
              color: '#222222',
            }}
          >
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '1px solid #DDDDDD',
              backgroundColor: '#F7F7F7',
            }}>
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
                <g fill="none">
                  <path d="M28 16H2M17 4l11.3 11.3a1 1 0 0 1 0 1.4L17 28"></path>
                </g>
              </svg>
            </span>
          </a>
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
            // ✅ Optimizaciones para scroll en webview
            WebkitOverflowScrolling: 'touch',
            willChange: 'scroll-position',
            contain: 'layout style paint',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            gap: '12px',
          }}
          onScroll={checkScroll}
        >
          {services.map((service) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              forceGuestFavorite={forceGuestFavorite}
              initialIsFavorite={service.isFavorite ?? false}
            />
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
}, (prevProps, nextProps) => {
  // ✅ Comparación personalizada: solo re-renderizar si cambian props relevantes
  return (
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.services.length === nextProps.services.length &&
    prevProps.services.every((service, index) => 
      service.id === nextProps.services[index]?.id &&
      service.isFavorite === nextProps.services[index]?.isFavorite
    ) &&
    prevProps.forceGuestFavorite === nextProps.forceGuestFavorite
  );
});

interface HomepageWallProps {
  countryCode?: string;
  serviceTypeId?: number | null;
  categoryId: number; // ✅ OBLIGATORIO: ID de la categoría
}

export const HomepageWall: React.FC<HomepageWallProps> = React.memo(({ 
  countryCode = 'ES',
  serviceTypeId,
  categoryId,
}) => {
  // ✅ OPTIMIZADO: El backend ahora devuelve la ubicación por IP
  // No necesitamos solicitar permisos de geolocalización del navegador
  // Pasamos null para lat/long y el backend detecta automáticamente la ubicación por IP
  
  // Memoizar los parámetros de la query para evitar re-renderizados innecesarios
  const queryParams = useMemo(() => ({
    categoryId,
    latitude: null, // ✅ Backend detecta ubicación por IP automáticamente
    longitude: null, // ✅ Backend detecta ubicación por IP automáticamente
    countryCode,
    locationRange: 50,
    nearbyPage: 1,
    nearbyPageSize: 20,
    popularPage: 1,
    popularPageSize: 20,
    _enabled: true, // ✅ Siempre habilitado, no hay que esperar geolocalización
  }), [categoryId, countryCode]);

  const { data: sections, isLoading, error } = useHomepageWallQuery(queryParams);

  // ✅ CRÍTICO: Todos los hooks deben estar ANTES de los early returns
  // ✅ Memoizar función de mapeo para evitar recrearla en cada render
  const mapServiceToDetail = useMemo(() => {
    return (service: SearchServiceHomepageDto): SearchServiceDetailDto => {
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
      isFavorite: service.IsFavorite ?? false, // ✅ NUEVO: Mapear IsFavorite del backend
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
        city: service.Expert.City || null, // ✅ NUEVO: Mapear City del backend
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
  }, []);

  // ✅ Memoizar función de filtrado para evitar recrearla en cada render
  const filterServices = useMemo(() => {
    return (services: SearchServiceHomepageDto[]): SearchServiceDetailDto[] => {
      let filtered = services;
      
      if (serviceTypeId) {
        filtered = services.filter(service => service.ServiceTypeId === serviceTypeId);
      }
      
      return filtered.map(mapServiceToDetail);
    };
  }, [serviceTypeId, mapServiceToDetail]);

  // ✅ OPTIMIZADO PARA MÁXIMA FLUIDEZ: Animaciones más rápidas y suaves
  const sectionVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 10 }, // ✅ Reducido de y: 20 a y: 10
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25, // ✅ Reducido de 0.5 a 0.25 para máxima fluidez
        ease: [0.4, 0.0, 0.2, 1], // ✅ easeInOut más suave
      },
    },
  }), []);

  // ✅ Ahora sí, los early returns después de todos los hooks
  if (isLoading) {
    return (
      <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[95%] md:max-w-[85%] lg:max-w-[80%]">
            {/* ✅ Skeleton para secciones */}
            <div className="space-y-8 md:space-y-12">
              {/* Primera sección skeleton */}
              <div>
                <div className="mb-4 px-6 md:px-0">
                  <Skeleton height={24} width={192} borderRadius={4} className="mb-2" />
                  <Skeleton height={16} width={128} borderRadius={4} />
                </div>
                <div 
                  className="flex overflow-x-auto scrollbar-hide gap-3 px-6 md:px-0" 
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    contain: 'layout style paint',
                  }}
                >
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="flex-shrink-0" style={{ width: '160px' }}>
                      <Skeleton height={160} width={160} borderRadius={20} className="mb-2" />
                      <Skeleton height={16} width="100%" borderRadius={4} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Segunda sección skeleton */}
              <div>
                <div className="mb-4 px-6 md:px-0">
                  <Skeleton height={24} width={192} borderRadius={4} className="mb-2" />
                  <Skeleton height={16} width={128} borderRadius={4} />
                </div>
                <div 
                  className="flex overflow-x-auto scrollbar-hide gap-3 px-6 md:px-0" 
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    willChange: 'scroll-position',
                    contain: 'layout style paint',
                  }}
                >
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="flex-shrink-0" style={{ width: '160px' }}>
                      <Skeleton height={160} width={160} borderRadius={20} className="mb-2" />
                      <Skeleton height={16} width="100%" borderRadius={4} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SkeletonTheme>
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.03,
            delayChildren: 0,
            // ✅ Transición más suave para evitar tirones
            duration: 0.2,
            ease: [0.4, 0.0, 0.2, 1],
          },
        },
      }}
      style={{
        // ✅ Evitar layout shifts - Altura mínima estable
        minHeight: '400px',
        // ✅ Estructura estable para transición suave
        position: 'relative',
        willChange: 'contents',
        contain: 'layout style paint',
      }}
    >
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[95%] md:max-w-[85%] lg:max-w-[80%]">
          {/* ✅ Iterar el array de secciones - no necesitas conocer las claves */}
          {sections.map((section: HomepageSection, index: number) => {
            // ✅ NO usar useMemo dentro de map - usar función normal (ya está memoizada en filterServices)
            const filteredServices = filterServices(section.services);
            
            // Solo renderizar si hay servicios después del filtrado
            if (filteredServices.length === 0) {
              return null;
            }
            
            return (
              <motion.div
                key={`section-${index}-${section.title}`} // ✅ Key más estable
                variants={sectionVariants}
              >
                <HorizontalScrollSection
                  title={section.title} // ✅ Título ya viene formateado del backend
                  subtitle={section.categoryName && section.country 
                    ? `${section.pagination.totalCount} servicios en ${section.country}` 
                    : undefined}
                  services={filteredServices}
                  forceGuestFavorite={index === 1} // Marcar la segunda sección como "Featured"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Footer */}
      <motion.div className="mt-16 w-full" variants={sectionVariants}>
        <Footer />
      </motion.div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // ✅ Comparación personalizada: solo re-renderizar si cambian los props relevantes
  return (
    prevProps.countryCode === nextProps.countryCode &&
    prevProps.serviceTypeId === nextProps.serviceTypeId &&
    prevProps.categoryId === nextProps.categoryId
  );
});
