import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getThumbUrl } from '../utils/imageCdn';
// 🛡️ Round 28: símbolos de divisa derivados del helper unificado (cubre SEK/DKK/NOK/PLN/HUF/CZK/BGN/RON).
import { getCurrencySymbol } from '../utils/priceUtils';
import { useHomepageWallQuery } from '../hooks/useHomepageWall';
import { SearchServiceDetailDto, SearchServiceHomepageDto, HomepageSection } from '../types/homepageWall';
import { mapHomepageServiceToDetail } from '../utils/mapHomepageService';
import { dispatchHomepagePickCategory } from '../utils/homepageCategoryPick';
import { Star, ChevronLeft, ChevronRight, X, AlertCircle, RefreshCw } from 'lucide-react';
import { readWorkRadiusKm, formatWorkRadius } from '../utils/workRadius';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useServiceFavorites } from '../hooks/useServiceFavorites';
import { homepageToast } from '../lib/toast';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { hpCardText, hpType, HP_WALL_CARD_WIDTH_CLASS } from '../constants/homepageTypography';
import { useIsMobile } from '../hooks/useIsMobile';
import { useCurrency } from '../contexts/CurrencyContext';

const COCHES_CATEGORY_ID = 5;
const INMOBILIARIA_CATEGORY_ID = 3;

interface ServiceCardProps {
  service: SearchServiceDetailDto;
  forceGuestFavorite?: boolean;
  initialIsFavorite?: boolean;
  isMobile: boolean;
  isAuthenticated: boolean;
  /** ⚡ true para las primeras tarjetas above-the-fold: su foto es el candidato a LCP
      y debe cargar eager con prioridad alta, no lazy/low como el resto. */
  priority?: boolean;
  onOpenService: (serviceId: number) => void;
  onToggleFavorite: (serviceId: number) => Promise<{ isFavorite: boolean; message: string } | null>;
}

// ✅ Memoizar ServiceCard para evitar re-renders innecesarios
export const ServiceCard: React.FC<ServiceCardProps> = React.memo(({ service, forceGuestFavorite = false, initialIsFavorite = false, isMobile, isAuthenticated, priority = false, onOpenService, onToggleFavorite }) => {
  const [isFavorite, setIsFavorite] = useState(service.isFavorite ?? initialIsFavorite);
  const [imageIndex, setImageIndex] = useState(0);
  const [isExpertPhotoOpen, setIsExpertPhotoOpen] = useState(false);
  // ⚡ Si el redimensionador de Cloudflare falla (no habilitado aún / cuota), volver
  // a las URLs originales de Supabase para esta tarjeta.
  const [cdnFailed, setCdnFailed] = useState(false);
  const { formatPriceWithSource, preferredCurrency } = useCurrency();

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
    onOpenService(service.id);
  }, [onOpenService, service.id]);

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const result = await onToggleFavorite(service.id);
      if (result) {
        setIsFavorite(result.isFavorite);
        homepageToast.favoriteUpdated(result.message);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar favorito';
      console.error('Error al actualizar favorito:', error);
      homepageToast.error(message, 3000);
    }
  }, [onToggleFavorite, service.id]);

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
  // Precio del servicio. Round 24: usa CurrencyContext para conversión.
  // 🛡️ Round 28: símbolos derivados del helper unificado (cubre SEK/DKK/NOK/PLN/HUF/CZK/BGN/RON).
  const priceData = useMemo(() => {
    if (!service.price) return { display: 'Consultar', wasConverted: false, sourceFormatted: '' };
    const source = service.priceCurrency || service.currency || 'EUR';
    const info = formatPriceWithSource(service.price, source, preferredCurrency);
    if (!info.wasConverted) {
      // Mismo currency: redondear como antes para mantener el estilo compacto
      const symbol = getCurrencySymbol(source);
      return { display: `${symbol}${Math.round(service.price)}`, wasConverted: false, sourceFormatted: '' };
    }
    // Convertido: mostrar el converted redondeado y el source en paréntesis
    const targetSymbol = getCurrencySymbol(preferredCurrency);
    const sourceSymbol = getCurrencySymbol(source);
    return {
      display: `≈ ${targetSymbol}${Math.round(info.convertedAmount)} ${preferredCurrency}`,
      wasConverted: true,
      sourceFormatted: `(${sourceSymbol}${Math.round(service.price)} ${source})`,
    };
  }, [service.price, service.priceCurrency, service.currency, formatPriceWithSource, preferredCurrency]);
  const price = priceData.display;
  
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
      className={`block flex-shrink-0 ${HP_WALL_CARD_WIDTH_CLASS}`}
    >
      {/* Contenedor principal - Estructura exacta de Airbnb */}
      <motion.div
        className={`relative cursor-pointer group w-full${isMobile ? ' active:scale-[0.98]' : ''}`}
        style={{ contain: 'layout style paint' }}
        whileHover={isMobile ? undefined : { y: -3 }}
        whileTap={isMobile ? undefined : { scale: 0.98 }}
        transition={isMobile ? undefined : { type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Contenedor de imagen con todos los subdivs */}
        <div 
          className="relative w-full overflow-hidden mb-1.5 md:mb-1 rounded-[20px] md:rounded-xl md:shadow-[0_2px_14px_rgba(15,23,42,0.07)] md:group-hover:shadow-[0_10px_28px_rgba(15,23,42,0.13)] md:transition-shadow md:duration-300 md:ring-1 md:ring-black/[0.04]"
          style={{
            aspectRatio: isMobile ? '1' : '4 / 3',
            borderRadius: isMobile ? '20px' : '12px',
            width: '100%',
            contain: 'layout style paint',
          }}
        >
          {imageUrls.length > 0 ? (
            <>
              {/* Imagen principal - Optimizada para webview */}
              <div className="relative w-full h-full">
                <img
                  src={cdnFailed ? imageUrls[imageIndex] : getThumbUrl(imageUrls[imageIndex], 360)}
                  alt={service.serviceTypeName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{
                    display: 'block',
                    ...(priority ? {} : { contentVisibility: 'auto' as const }),
                  }}
                  loading={priority ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={priority ? 'high' : 'low'}
                  onError={() => {
                    if (!cdnFailed) setCdnFailed(true);
                  }}
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
                      background: '#ffffff',
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
                      {/* ⚡ SVG inline (antes hotlink a a0.muscache.com — CDN de Airbnb:
                          conexión third-party extra y riesgo de que bloqueen el hotlink). */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ display: 'block' }}
                        aria-hidden="true"
                      >
                        <path
                          d="M12 2l2.39 4.84 5.34.78-3.86 3.77.91 5.32L12 14.2l-4.78 2.51.91-5.32-3.86-3.77 5.34-.78L12 2z"
                          fill="#F59E0B"
                          stroke="#D97706"
                          strokeWidth="0.75"
                          strokeLinejoin="round"
                        />
                      </svg>
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

              {/* Botón de favorito — solo con sesión iniciada */}
              {isAuthenticated ? (
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
              ) : null}

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
                    <ChevronRight className="w-4 h-4 text-[#1c1c1c] rotate-180" />
                  </button>
                  <button
                    onClick={(e) => handleImageNavigation(e, 'next')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                    style={{
                      padding: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    <ChevronRight className="w-4 h-4 text-[#1c1c1c]" />
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
                                      loading="lazy"
                                      decoding="async"
                                    />
                                  ) : (
                                    <div
                                      className="w-full h-full flex items-center justify-center bg-brand"
                                      style={{
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
                            <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center">
                              <span className="text-[#a0a0a0] text-sm">Sin imagen</span>
                            </div>
                          )}
        </div>

        {/* Información del servicio - Estructura exacta como Airbnb */}
        <div style={{ marginTop: isMobile ? '0px' : '4px' }}>
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
              {(() => {
                // Rango de trabajo elegido por el experto (0 = solo en su taller).
                const workRadius = readWorkRadiusKm(service.expert);
                if (workRadius === null) return null;
                return (
                  <>
                    <span className="truncate">{formatWorkRadius(workRadius)}</span>
                    <span style={{ marginLeft: '4px', marginRight: '4px' }} aria-hidden="true">·</span>
                  </>
                );
              })()}
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
                    fill: '#F59E0B',
                    color: '#F59E0B',
                  }}
                />
                <span>
                  {service.averageRating ? service.averageRating.toFixed(2).replace('.', ',') : 'N/A'}
                </span>
              </span>
              <span style={{ marginLeft: '4px', marginRight: '4px' }} aria-hidden="true">·</span>
              <span>
                {price}
                {priceData.wasConverted && (
                  <span style={{ marginLeft: '4px', fontSize: '0.85em', color: '#6B7280' }}>
                    {priceData.sourceFormatted}
                  </span>
                )}
              </span>
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
                className="w-[400px] h-[400px] min-w-[250px] min-h-[250px] max-w-[80vw] max-h-[80vw] aspect-square rounded-full overflow-hidden flex items-center justify-center bg-[#fafafa] border-4 border-white shadow-lg"
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
    prevProps.initialIsFavorite === nextProps.initialIsFavorite &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.isAuthenticated === nextProps.isAuthenticated
  );
});

interface HorizontalScrollSectionProps {
  title: string;
  subtitle?: string;
  services: SearchServiceDetailDto[];
  forceGuestFavorite?: boolean;
  isLastSection?: boolean;
  /** ⚡ true en la primera sección (above the fold): sus 3 primeras fotos cargan
      con prioridad alta (candidatas a LCP) y sin content-visibility diferido. */
  priorityImages?: boolean;
  isMobile: boolean;
  isAuthenticated: boolean;
  onOpenService: (serviceId: number) => void;
  onToggleFavorite: (serviceId: number) => Promise<{ isFavorite: boolean; message: string } | null>;
}

// ✅ Memoizar HorizontalScrollSection para evitar re-renders innecesarios
const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = React.memo(({
  title,
  subtitle,
  services,
  forceGuestFavorite = false,
  isLastSection = false,
  priorityImages = false,
  isMobile,
  isAuthenticated,
  onOpenService,
  onToggleFavorite,
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
    if (!scrollElement) return;

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
    const resizeObserver = new ResizeObserver(() => checkScroll());
    resizeObserver.observe(scrollElement);
    window.addEventListener('resize', checkScroll);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      scrollElement.removeEventListener('scroll', throttledCheckScroll);
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, services.length]);

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
        contain: 'layout style paint',
        // ⚡ La primera sección se ve nada más cargar: content-visibility:auto ahí
        // puede retrasar su pintado. Solo se aplica a las secciones bajo el fold.
        ...(priorityImages ? {} : { contentVisibility: 'auto' as const }),
      }}
    >
      {/* Header sección + flechas de navegación */}
      <div className="mb-2 md:mb-3 md:px-0">
        <div className="flex items-center justify-between gap-3 md:gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="hp-section-title truncate">
              {title.replace(' >', '')}
            </h2>
            {subtitle && (
              <p className="hp-section-subtitle truncate">{subtitle}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full border border-[#e8e8e8] bg-white text-[#222222] shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
              aria-label="Ver revisiones anteriores"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full border border-[#e8e8e8] bg-white text-[#222222] shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
              aria-label="Ver más revisiones"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* Tablón horizontal — ancho completo; sin degradé lateral */}
      <div className="relative w-full">
        <div
          ref={scrollRef}
          className={`flex overflow-x-auto scrollbar-hide md:pb-3 md:px-0 md:pr-0 gap-4 min-[428px]:gap-[18px] md:gap-3 ${
            isLastSection ? 'pb-0 md:pb-3' : 'pb-1.5 md:pb-3'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'auto',
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: '0px',
            scrollPaddingRight: '0px',
            overscrollBehaviorX: 'contain',
            contain: 'layout style paint',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {services.map((service, cardIndex) => (
            <div key={service.id} className="flex-shrink-0 scroll-smooth" style={{ scrollSnapAlign: 'start' }}>
              <ServiceCard
                service={service}
                forceGuestFavorite={forceGuestFavorite}
                initialIsFavorite={service.isFavorite ?? false}
                isMobile={isMobile}
                isAuthenticated={isAuthenticated}
                priority={priorityImages && cardIndex < 3}
                onOpenService={onOpenService}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </div>
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
    prevProps.forceGuestFavorite === nextProps.forceGuestFavorite &&
    prevProps.isLastSection === nextProps.isLastSection &&
    prevProps.priorityImages === nextProps.priorityImages &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.isAuthenticated === nextProps.isAuthenticated
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

/**
 * Skeleton estructural del wall. Se reutiliza en:
 *   1. Estado loading inicial (sin datos en caché).
 *   2. Estado error (junto al banner con retry) — para que el layout sobreviva el outage
 *      en vez de colapsarse a un párrafo de texto rojo (mata la conversión).
 */
const WallSkeletonGrid: React.FC = () => (
  <>
    <div className="mb-2 md:mb-3 md:hidden">
      <Skeleton height={28} width={220} borderRadius={8} />
    </div>
    <div className="hidden md:block mb-5">
      <Skeleton height={12} width={80} borderRadius={4} className="mb-2" />
      <Skeleton height={32} width={280} borderRadius={8} />
    </div>
    <div className="space-y-6 md:space-y-12 lg:space-y-14">
      <div className="flex overflow-x-auto gap-4 pb-0 md:pb-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className={`flex-shrink-0 ${HP_WALL_CARD_WIDTH_CLASS}`}>
            <Skeleton height={138} className="w-full mb-1.5" borderRadius={12} />
            <Skeleton height={16} width="100%" borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  </>
);

export const HomepageWall: React.FC<HomepageWallProps> = React.memo(({
  countryCode = 'ES',
  serviceTypeId,
  categoryId,
  latitude: latitudeProp = null,
  longitude: longitudeProp = null,
  animateOnMount = true,
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { toggleFavoriteAsync } = useServiceFavorites();

  const handleOpenService = useCallback(
    (serviceId: number) => {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/service/${serviceId}`, { state: { returnTo } });
    },
    [navigate, location.pathname, location.search],
  );

  const handleToggleFavorite = useCallback(
    async (serviceId: number) => {
      if (!isAuthenticated) {
        homepageToast.loginRequired();
        return null;
      }
      const result = await toggleFavoriteAsync(serviceId);
      return { isFavorite: result.isFavorite, message: result.message };
    },
    [isAuthenticated, toggleFavoriteAsync],
  );

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

  const { data: sections, isLoading, error, isFetching, refetch } = useHomepageWallQuery(queryParams);

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
              className={[
                index === 0 ? 'pt-1 min-[428px]:pt-2 md:pt-2' : '',
                index > 0 ? 'mt-5 md:mt-8' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <HorizontalScrollSection
                title={section.title}
                subtitle={subtitle}
                services={filteredServices}
                forceGuestFavorite={index === 1}
                isLastSection={isLastSection}
                priorityImages={index === 0}
                isMobile={isMobile}
                isAuthenticated={isAuthenticated}
                onOpenService={handleOpenService}
                onToggleFavorite={handleToggleFavorite}
              />
            </motion.div>
          );
        })
        .filter(Boolean);
    },
    [filterServices, sectionVariants, isMobile, isAuthenticated, handleOpenService, handleToggleFavorite]
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
      _enabled:
        !serviceTypeId &&
        !isLoading &&
        !!sections &&
        !hasVisibleServices &&
        categoryId !== fallbackCategoryId,
    }),
    [
      fallbackCategoryId,
      countryCode,
      isLoading,
      sections,
      hasVisibleServices,
      categoryId,
      serviceTypeId,
    ]
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
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-1 md:pb-0">
          <WallSkeletonGrid />
        </div>
      </SkeletonTheme>
    );
  }

  if (error) {
    // 🔴 Antes: párrafo rojo plano "Error al cargar servicios: Failed to fetch" + nada más.
    // El usuario llegaba a la home y veía un mensaje técnico sin opción de recuperación →
    // bounce. Ahora: banner ámbar (no rojo destructivo) con botón Reintentar que llama a
    // refetch() de TanStack Query, y el skeleton estructural sobrevive debajo para que
    // el layout no colapse.
    console.error('❌ HomepageWall - Error:', error);
    return (
      <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-1 md:pb-0">
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 md:mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 md:px-4 md:py-3"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <p className="flex-1 text-sm leading-snug text-amber-900">
              No pudimos cargar los servicios. Vuelve a intentarlo en un momento.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-brand px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
              {isFetching ? 'Reintentando' : 'Reintentar'}
            </button>
          </div>
          <WallSkeletonGrid />
        </div>
      </SkeletonTheme>
    );
  }

  if (!sections || sections.length === 0) {
    // Estado vacío sin retry — el query fue OK pero no hay datos. Mantenemos copy
    // amable sin tono de error, encima del skeleton, para no romper el layout.
    console.warn('⚠️ HomepageWall - No hay secciones');
    return (
      <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
        <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-1 md:pb-0">
          <p className="mb-4 md:mb-5 text-sm text-[#6a6a6a]">
            Aún no hay servicios disponibles en esta categoría.
          </p>
          <WallSkeletonGrid />
        </div>
      </SkeletonTheme>
    );
  }

  if (!hasVisibleServices) {
    if (fallbackLoading) {
      return (
        <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
          <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-1">
            <div className="flex overflow-x-auto gap-4 pb-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`shrink-0 ${HP_WALL_CARD_WIDTH_CLASS}`}>
                  <Skeleton height={138} className="w-full mb-1.5" borderRadius={12} />
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
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0">
            <div className="rounded-2xl border border-[#ebebeb] bg-white px-5 py-3 md:py-4 mb-5 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-10 md:py-20 text-center">
        <h3 className="text-lg font-medium text-[#222222]">Aún no hay expertos aquí</h3>
        <p className="mt-2 text-[#717171] text-sm max-w-md mx-auto">
          Prueba Coches o Inmobiliaria, donde suele haber más revisores activos.
        </p>
        <div className="mt-4 md:mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => dispatchHomepagePickCategory(COCHES_CATEGORY_ID, 'Coches')}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-hover transition-colors shadow-[0_4px_16px_hsl(var(--brand)/0.2)]"
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
          className={`w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-1 md:pb-0 transition-opacity duration-200 ${
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
