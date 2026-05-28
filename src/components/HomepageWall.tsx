import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useHomepageWallQuery } from '../hooks/useHomepageWall';
import { SearchServiceDetailDto, SearchServiceHomepageDto, HomepageSection } from '../types/homepageWall';
import { mapHomepageServiceToDetail } from '../utils/mapHomepageService';
import { dispatchHomepagePickCategory } from '../utils/homepageCategoryPick';
import { Star, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useServiceFavorites } from '../hooks/useServiceFavorites';
import { showToast } from '../lib/toast';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { hpCardText, hpType } from '../constants/homepageTypography';

const COCHES_CATEGORY_ID = 5;
const INMOBILIARIA_CATEGORY_ID = 3;

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
export const ServiceCard: React.FC<ServiceCardProps> = React.memo(({ service, forceGuestFavorite = false, initialIsFavorite = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toggleFavoriteAsync } = useServiceFavorites();
  // ✅ Usar isFavorite del servicio directamente (viene del backend) o el estado inicial como fallback
  const [isFavorite, setIsFavorite] = useState(service.isFavorite ?? initialIsFavorite);
  const [imageIndex, setImageIndex] = useState(0);
  const [isExpertPhotoOpen, setIsExpertPhotoOpen] = useState(false);
  const isMobile = useIsMobile();

  // ✅ OPTIMIZADO: Memoizar cálculos costosos PRIMERO
  const imageUrls = useMemo(() => service.imageUrls || [], [service.imageUrls]);
  const hasMultipleImages = useMemo(() => imageUrls.length > 1, [imageUrls.length]);
  
  // Sincronizar con el estado del servicio cuando cambia (viene del backend)
  useEffect(() => {
    if (service.isFavorite !== undefined) {
      setIsFavorite(service.isFavorite);
    } else if (initialIsFavorite !== undefined) {
      setIsFavorite(initialIsFavorite);
    }
  }, [service.isFavorite, initialIsFavorite]);

  const handleCardClick = useCallback(() => {
    // Navegar a la página de detalle del servicio primero
    navigate(`/service/${service.id}`);
  }, [navigate, service.id]);

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
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
  }, [isAuthenticated, toggleFavoriteAsync, service.id]);

  const handleImageNavigation = useCallback((e: React.MouseEvent, direction: 'prev' | 'next') => {
    e.stopPropagation();
    if (imageUrls.length <= 1) return;
    
    if (direction === 'next') {
      setImageIndex((prev) => (prev + 1) % imageUrls.length);
    } else {
      setImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    }
  }, [imageUrls.length]);
  const isGuestFavorite = useMemo(() => 
    forceGuestFavorite || (service.completedSearches > 10 && service.averageRating >= 4.5),
    [forceGuestFavorite, service.completedSearches, service.averageRating]
  );

  // ✅ Información real del servicio para la segunda línea: Precio · Horario
  // Precio del servicio
  const price = useMemo(() => 
    service.price ? `€${Math.round(service.price)}` : 'Consultar',
    [service.price]
  );
  
  // Horario de disponibilidad (formato compacto para que quepa)
  const formatAvailability = useCallback(() => {
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
  }, [service.expert?.currentAvailability]);
  
  const availabilityInfo = useMemo(() => formatAvailability(), [formatAvailability]);

  return (
    <a
      href={`/service/${service.id}`}
      onClick={(e) => {
        e.preventDefault();
        handleCardClick();
      }}
      className="block flex-shrink-0 w-[160px] md:w-[184px]"
    >
      {/* Contenedor principal - Estructura exacta de Airbnb */}
      <motion.div 
        className="relative cursor-pointer group w-full"
        style={{
          // ✅ Optimizaciones máximas para fluidez
          willChange: 'transform',
          contain: 'layout style paint',
          // ✅ GPU acceleration
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
        whileHover={isMobile ? { scale: 1.05, y: -4 } : { y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Contenedor de imagen con todos los subdivs */}
        <div 
          className="relative w-full overflow-hidden mb-1.5 md:mb-1 rounded-[20px] md:rounded-xl md:shadow-[0_2px_14px_rgba(15,23,42,0.07)] md:group-hover:shadow-[0_10px_28px_rgba(15,23,42,0.13)] md:transition-shadow md:duration-300 md:ring-1 md:ring-black/[0.04]"
          style={{ 
            aspectRatio: isMobile ? '1' : '4 / 3',
            borderRadius: isMobile ? '20px' : '12px',
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
              
              {/* Badge "Mejor valorado" - Para servicios con rating > 4.5 */}
              {service.averageRating && service.averageRating > 4.5 && (
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
                      gap: '4px',
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
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        flexShrink: 0,
                      }}
                      role="presentation"
                      aria-hidden="true"
                    >
                      <img
                        src="https://a0.muscache.com/pictures/airbnb-platform-assets/AirbnbPlatformAssets-email-dls-icons/original/c3c390ab-d1ab-4627-9cd7-608ac53b171e.png"
                        alt=""
                        style={{
                          width: '16px',
                          height: '16px',
                          display: 'block',
                          objectFit: 'contain',
                        }}
                        aria-hidden="true"
                      />
                    </div>
                    <span
                      style={hpType.badge}
                      aria-label="Mejor valorado"
                    >
                      Mejor valorado
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
                          ...hpType.badge,
                          position: 'absolute',
                          visibility: 'hidden',
                          pointerEvents: 'none',
                        }}
                      >
                        Mejor valorado
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
                                  className="absolute left-3 z-10 cursor-pointer"
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (service.expert?.profilePictureUrl) {
                                      setIsExpertPhotoOpen(true);
                                    }
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
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
        <div style={{ marginTop: isMobile ? '6px' : '4px' }}>
          {/* Primera fila: Título */}
          <div
            className="overflow-hidden"
            style={{
              marginBottom: '0px',
              ...hpCardText.title,
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
              ...hpCardText.meta,
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
              ...hpCardText.meta,
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
      </motion.div>
      
      {/* Modal para ampliar foto del experto */}
      {service.expert?.profilePictureUrl && (
        <Dialog open={isExpertPhotoOpen} onOpenChange={setIsExpertPhotoOpen}>
          <DialogContent className="max-w-2xl w-full p-0 bg-transparent border-none">
            <DialogTitle className="sr-only">Foto de perfil de {service.expert.user?.name || 'Experto'}</DialogTitle>
            <DialogDescription className="sr-only">Imagen ampliada del perfil del experto</DialogDescription>
            <div 
              className="relative w-full h-full flex items-center justify-center p-8 cursor-pointer"
              onClick={() => setIsExpertPhotoOpen(false)}
            >
              <div 
                className="w-[400px] h-[400px] min-w-[250px] min-h-[250px] max-w-[80vw] max-h-[80vw] aspect-square rounded-full overflow-hidden flex items-center justify-center bg-gray-100 border-4 border-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={service.expert.profilePictureUrl}
                  alt={service.expert.user?.name || 'Experto'}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '50%' }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
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
  isLastSection?: boolean;
}

// ✅ Memoizar HorizontalScrollSection para evitar re-renders innecesarios
const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = React.memo(({
  title,
  subtitle,
  services,
  forceGuestFavorite = false,
  isLastSection = false, // ✅ Solo la última sección tendrá margen inferior
}) => {
  const isMobile = useIsMobile();
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
      // ✅ OPTIMIZADO: Throttling mejorado con performance.now para ~60fps
      let rafId: number | null = null;
      let lastScrollTime = 0;
      const THROTTLE_MS = 16; // ~60fps
      
      const throttledCheckScroll = () => {
        const now = performance.now();
        if (now - lastScrollTime >= THROTTLE_MS) {
          lastScrollTime = now;
          if (rafId === null) {
            rafId = requestAnimationFrame(() => {
              checkScroll();
              rafId = null;
            });
          }
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
  }, [checkScroll]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth >= 1024 ? 392 : window.innerWidth >= 768 ? 392 : 300;
      // ✅ OPTIMIZADO: Usar requestAnimationFrame para scroll más fluido
      requestAnimationFrame(() => {
        scrollRef.current?.scrollBy({
          left: direction === 'right' ? scrollAmount : -scrollAmount,
          behavior: 'smooth',
        });
      });
    }
  }, []);

  if (services.length === 0) return null;

  return (
    <div 
      className={isLastSection ? "" : ""} // ✅ Sin margen inferior adicional
      style={{ 
        marginBottom: isLastSection ? '0px' : '0px', // ✅ Sin margen inferior - el footer ya tiene su margen
        // ✅ Optimizaciones para webview
        willChange: 'contents',
        contain: 'layout style paint',
      }}
    >
      {/* Header sección */}
      <div className="mb-3 md:mb-5 md:px-0">
        <div className="flex items-start gap-3">
          <span
            className="hidden md:block mt-1.5 h-7 w-[3px] shrink-0 rounded-full bg-gradient-to-b from-[#0066CC] to-[#0066CC]/25"
            aria-hidden
          />
          <div className="min-w-0">
            <h2 className="hp-section-title">
              {title.replace(' >', '')}
            </h2>
            {subtitle && (
              <p className="hp-section-subtitle">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tablón horizontal */}
      <div className="relative group/scroll md:w-[min(100%,calc(6*184px+60px))] md:overflow-hidden">
        {canScrollLeft && (
          <div
            className="hidden md:block absolute left-0 top-0 bottom-3 w-10 z-[5] pointer-events-none bg-gradient-to-r from-white via-white/80 to-transparent"
            aria-hidden
          />
        )}
        {canScrollRight && (
          <div
            className="hidden md:block absolute right-0 top-0 bottom-3 w-10 z-[5] pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent"
            aria-hidden
          />
        )}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide pb-3 md:pb-0 md:px-0 md:pr-0 gap-4 md:gap-3"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: '0px',
            scrollPaddingRight: '0px',
            overscrollBehaviorX: 'contain',
            willChange: 'scroll-position',
            contain: 'layout style paint',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onScroll={checkScroll}
        >
          {services.map((service) => (
            <div key={service.id} className="flex-shrink-0 scroll-smooth" style={{ scrollSnapAlign: 'start' }}>
              <ServiceCard
                service={service}
                forceGuestFavorite={forceGuestFavorite}
                initialIsFavorite={service.isFavorite ?? false}
              />
            </div>
          ))}
        </div>

        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-2 lg:left-6 top-[42%] -translate-y-1/2 rounded-full bg-white shadow-md border border-gray-200 hover:shadow-lg transition-all z-10 items-center justify-center opacity-0 group-hover/scroll:opacity-100"
            style={{ 
              width: '36px', 
              height: '36px',
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
                height: '14px',
                width: '14px',
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
            type="button"
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-2 lg:right-6 top-[42%] -translate-y-1/2 rounded-full bg-white shadow-md border border-gray-200 hover:shadow-lg transition-all z-10 items-center justify-center opacity-0 group-hover/scroll:opacity-100"
            style={{ 
              width: '36px', 
              height: '36px',
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
                height: '14px',
                width: '14px',
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
  categoryId: number;
  latitude?: string | null;
  longitude?: string | null;
  /** false = sin fade-in al montar (homepage desktop sincronizada) */
  animateOnMount?: boolean;
}

export const HomepageWall: React.FC<HomepageWallProps> = React.memo(({
  countryCode = 'ES',
  serviceTypeId,
  categoryId,
  latitude: latitudeProp = null,
  longitude: longitudeProp = null,
  animateOnMount = true,
}) => {
  // ✅ OPTIMIZADO: El backend ahora devuelve la ubicación por IP
  // No necesitamos solicitar permisos de geolocalización del navegador
  // Pasamos null para lat/long y el backend detecta automáticamente la ubicación por IP.
  // EXCEPCIÓN: si el padre nos pasa latitude/longitude (p.ej. al clicar una ciudad en
  // el mapa de España del hero), priorizamos esas coords sobre la IP del backend.

  // ✅ CRÍTICO: Todos los hooks deben estar ANTES de cualquier return condicional
  // Memoizar los parámetros de la query para evitar re-renderizados innecesarios
  const queryParams = useMemo(() => ({
    categoryId,
    latitude: latitudeProp,
    longitude: longitudeProp,
    countryCode,
    locationRange: 50,
    nearbyPage: 1,
    nearbyPageSize: 20,
    popularPage: 1,
    popularPageSize: 20,
    _enabled: true, // ✅ Siempre habilitado, no hay que esperar geolocalización
  }), [categoryId, countryCode, latitudeProp, longitudeProp]);

  const { data: sections, isLoading, error, isFetching } = useHomepageWallQuery(queryParams);

  const filterServices = useMemo(() => {
    return (services: SearchServiceHomepageDto[]): SearchServiceDetailDto[] => {
      let filtered = services;

      if (serviceTypeId) {
        filtered = services.filter((service) => {
          const raw = service as SearchServiceHomepageDto & Record<string, unknown>;
          const id = raw.ServiceTypeId ?? (raw as Record<string, unknown>).serviceTypeId;
          return Number(id) === serviceTypeId;
        });
      }

      return filtered.map(mapHomepageServiceToDetail);
    };
  }, [serviceTypeId]);

  // ✅ OPTIMIZADO PARA MÁXIMA FLUIDEZ: Animaciones ultra-rápidas y coordinadas
  const sectionVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 5 }, // ✅ Reducido para transición más rápida
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15, // ✅ Ultra-rápido para cambio de categoría fluido
        ease: [0.4, 0.0, 0.2, 1], // ✅ easeInOut más suave
      },
    },
  }), []);

  const buildRenderedSections = useCallback(
    (data: HomepageSection[] | undefined, keyPrefix: string) => {
      if (!data?.length) return [];
      return data
        .map((section: HomepageSection, index: number) => {
          const filteredServices = filterServices(section.services);
          if (filteredServices.length === 0) return null;
          const isLastSection = index === data.length - 1;
          const subtitle =
            section.categoryName && section.country
              ? `${section.pagination.totalCount} servicios en ${section.country}`
              : undefined;
          return (
            <motion.div
              key={`${keyPrefix}-section-${index}-${section.title}`}
              variants={sectionVariants}
              className={index > 0 ? 'mt-8 md:mt-10' : ''}
            >
              <HorizontalScrollSection
                title={section.title}
                subtitle={subtitle}
                services={filteredServices}
                forceGuestFavorite={index === 1}
                isLastSection={isLastSection}
              />
            </motion.div>
          );
        })
        .filter(Boolean);
    },
    [filterServices, sectionVariants]
  );

  const renderedSections = useMemo(
    () => buildRenderedSections(sections, 'main'),
    [sections, buildRenderedSections]
  );

  const hasVisibleServices = renderedSections.length > 0;

  const fallbackCategoryId = categoryId === COCHES_CATEGORY_ID ? INMOBILIARIA_CATEGORY_ID : COCHES_CATEGORY_ID;
  const fallbackParams = useMemo(
    () => ({
      categoryId: fallbackCategoryId,
      latitude: null as string | null,
      longitude: null as string | null,
      countryCode,
      locationRange: 50,
      nearbyPage: 1,
      nearbyPageSize: 20,
      popularPage: 1,
      popularPageSize: 20,
      _enabled: !isLoading && !!sections && !hasVisibleServices && categoryId !== fallbackCategoryId,
    }),
    [fallbackCategoryId, countryCode, isLoading, sections, hasVisibleServices, categoryId]
  );

  const { data: fallbackSections, isLoading: fallbackLoading } = useHomepageWallQuery(fallbackParams);

  const fallbackRendered = useMemo(
    () => buildRenderedSections(fallbackSections, 'fallback'),
    [fallbackSections, buildRenderedSections]
  );

  const showFullSkeleton = isLoading && !sections;

  if (showFullSkeleton) {
    return (
      <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10">
            <div className="hidden md:block mb-8">
              <Skeleton height={12} width={80} borderRadius={4} className="mb-2" />
              <Skeleton height={32} width={280} borderRadius={8} />
            </div>
            <div className="space-y-8 md:space-y-12 lg:space-y-14">
              <div className="flex overflow-x-auto gap-4 pb-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-[160px] md:w-[184px]">
                    <Skeleton height={138} className="w-full mb-2" borderRadius={12} />
                    <Skeleton height={16} width="100%" borderRadius={4} />
                  </div>
                ))}
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

  if (!hasVisibleServices) {
    if (fallbackLoading) {
      return (
        <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
          <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-6">
            <div className="flex overflow-x-auto gap-4 pb-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shrink-0 w-[160px] md:w-[184px]">
                  <Skeleton height={138} className="w-full mb-2" borderRadius={12} />
                  <Skeleton height={14} width="90%" borderRadius={4} />
                </div>
              ))}
            </div>
          </div>
        </SkeletonTheme>
      );
    }

    if (fallbackRendered.length > 0) {
      return (
        <motion.div
          key={`homepage-wall-fallback-${categoryId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-4 md:pt-8">
            <div className="rounded-2xl border border-[#ebebeb] bg-white px-5 py-4 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-[#717171]">
                No hay expertos en esta categoría todavía. Mira estos de{' '}
                <span className="text-[#222222] font-medium">
                  {fallbackCategoryId === COCHES_CATEGORY_ID ? 'Coches' : 'Inmobiliaria'}
                </span>
                :
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => dispatchHomepagePickCategory(COCHES_CATEGORY_ID, 'Coches')}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-[#ebebeb] bg-[#fafafa] hover:bg-white transition-colors"
                >
                  Coches
                </button>
                <button
                  type="button"
                  onClick={() => dispatchHomepagePickCategory(INMOBILIARIA_CATEGORY_ID, 'Inmobiliaria')}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-[#ebebeb] bg-[#fafafa] hover:bg-white transition-colors"
                >
                  Inmobiliaria
                </button>
              </div>
            </div>
            {fallbackRendered}
          </div>
        </motion.div>
      );
    }

    return (
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-16 md:py-20 text-center">
        <h3 className="text-lg font-medium text-[#222222]">Aún no hay expertos aquí</h3>
        <p className="mt-2 text-[#717171] text-sm max-w-md mx-auto">
          Prueba Coches o Inmobiliaria, donde suele haber más revisores activos.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => dispatchHomepagePickCategory(COCHES_CATEGORY_ID, 'Coches')}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#FF385C] hover:bg-[#E31C5F]"
          >
            Ver coches
          </button>
          <button
            type="button"
            onClick={() => dispatchHomepagePickCategory(INMOBILIARIA_CATEGORY_ID, 'Inmobiliaria')}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#222222] border border-[#dddddd] bg-white hover:shadow-sm"
          >
            Ver inmobiliaria
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={animateOnMount ? 'hidden' : false}
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: animateOnMount ? 0.01 : 0,
            delayChildren: 0,
            duration: animateOnMount ? 0.1 : 0,
            ease: [0.4, 0.0, 0.2, 1],
          },
        },
      }}
      key={`homepage-wall-${categoryId}`}
      className="relative"
    >
        {isFetching && sections && (
          <div className="hidden md:block absolute top-0 right-6 lg:right-8 z-10">
            <span className="text-xs text-[#6a6a6a]">Actualizando…</span>
          </div>
        )}
        <div
          className={`w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-4 md:pt-8 transition-opacity duration-200 ${
            isFetching && sections ? 'opacity-70' : 'opacity-100'
          }`}
        >
          {renderedSections}
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // ✅ Comparación ultra-optimizada: forzar re-render cuando cambia categoryId para transición limpia
  if (prevProps.categoryId !== nextProps.categoryId) {
    return false; // ✅ Re-renderizar inmediatamente para cambio fluido
  }

  // ✅ Comparación normal para otros cambios
  return (
    prevProps.countryCode === nextProps.countryCode &&
    prevProps.serviceTypeId === nextProps.serviceTypeId &&
    prevProps.latitude === nextProps.latitude &&
    prevProps.longitude === nextProps.longitude
  );
});
