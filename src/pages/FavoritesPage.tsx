import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, ChevronRight } from 'lucide-react';
import { useServiceFavorites } from '../hooks/useServiceFavorites';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../lib/toast';
import { Footer } from '../components/Footer';
import { SearchServiceDetailDto } from '../types/homepageWall';
import { useCurrency } from '../contexts/CurrencyContext';

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
  initialIsFavorite?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, initialIsFavorite = true }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toggleFavoriteAsync } = useServiceFavorites();
  const [isFavorite, setIsFavorite] = useState(service.isFavorite ?? initialIsFavorite);
  const [imageIndex, setImageIndex] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (service.isFavorite !== undefined) {
      setIsFavorite(service.isFavorite);
    } else if (initialIsFavorite !== undefined) {
      setIsFavorite(initialIsFavorite);
    }
  }, [service.isFavorite, initialIsFavorite]);

  const handleCardClick = () => {
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
      if (!result.isFavorite) {
        showToast('success', 'Favorito eliminado', 2000);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        showToast('success', result.message, 2000);
      }
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
  const isGuestFavorite = service.completedSearches > 10 && service.averageRating >= 4.5;
  // Round 24: conversión multi-moneda.
  const { formatPriceWithSource, preferredCurrency } = useCurrency();
  const priceData = (() => {
    if (!service.price) return { display: 'Consultar', wasConverted: false, sourceFormatted: '' };
    const src = (service as any).priceCurrency || (service as any).currency || 'EUR';
    const info = formatPriceWithSource(service.price, src, preferredCurrency);
    if (!info.wasConverted) {
      const symbol = src === 'USD' ? '$' : src === 'GBP' ? '£' : src === 'CHF' ? 'CHF ' : src === 'CAD' ? 'C$' : '€';
      return { display: `${symbol}${Math.round(service.price)}`, wasConverted: false, sourceFormatted: '' };
    }
    const tSym = preferredCurrency === 'USD' ? '$' : preferredCurrency === 'GBP' ? '£' : preferredCurrency === 'CHF' ? 'CHF ' : preferredCurrency === 'CAD' ? 'C$' : '€';
    const sSym = src === 'USD' ? '$' : src === 'GBP' ? '£' : src === 'CHF' ? 'CHF ' : src === 'CAD' ? 'C$' : '€';
    return {
      display: `≈ ${tSym}${Math.round(info.convertedAmount)} ${preferredCurrency}`,
      wasConverted: true,
      sourceFormatted: `(${sSym}${Math.round(service.price)} ${src})`,
    };
  })();
  const price = priceData.display;
  
  const formatAvailability = () => {
    const availability = service.expert?.currentAvailability;
    if (!availability) return 'Flexible';
    
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
    
    const dayAbbr = days
      .slice(0, 5)
      .map((day: string) => dayMap[day] || day.charAt(0))
      .join('');
    
    const startTime = availability.startTime ? availability.startTime.substring(0, 5) : '';
    const endTime = availability.endTime ? availability.endTime.substring(0, 5) : '';
    
    if (startTime && endTime) {
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
      <div className="relative cursor-pointer group w-full">
        <div className="relative w-full overflow-hidden mb-2" style={{ aspectRatio: '1', borderRadius: '20px', width: '100%' }}>
          {imageUrls.length > 0 ? (
            <>
              <div className="relative w-full h-full">
                <img
                  src={imageUrls[imageIndex]}
                  alt={service.serviceTypeName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ display: 'block' }}
                />
              </div>
              
              {isGuestFavorite && (
                <div
                  className="absolute top-3 left-3 z-10"
                  style={{ padding: '0' }}
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
                  </div>
                </div>
              )}

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

              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => handleImageNavigation(e, 'prev')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                    style={{ padding: '6px', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700 rotate-180" />
                  </button>
                  <button
                    onClick={(e) => handleImageNavigation(e, 'next')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
                    style={{ padding: '6px', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                  
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

        <div style={{ marginTop: '6px' }}>
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
              <span>
                {price}
                {priceData.wasConverted && (
                  <span style={{ marginLeft: 4, fontSize: '0.85em', color: '#6B7280' }}>
                    {priceData.sourceFormatted}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
};

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getUserFavorites } = useServiceFavorites();
  const { data: favoritesResponse, isLoading, error } = getUserFavorites(1, 50);
  const favorites = favoritesResponse?.data || [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-8">
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Inicia sesión para ver tus favoritos</h2>
            <p className="text-gray-600 mb-6">Guarda tus servicios favoritos y accede a ellos fácilmente</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-[#ff385c] text-white rounded-lg hover:bg-[#e31c5f] transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff385c] mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando favoritos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-8">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Error al cargar los favoritos</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#ff385c] text-white rounded-lg hover:bg-[#e31c5f] transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 
                className="text-xl font-semibold flex items-center gap-2"
                style={{
                  fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                  color: 'rgb(34, 34, 34)',
                }}
              >
                <Heart className="w-5 h-5 text-[#ff385c] fill-[#ff385c]" />
                Mis Favoritos
              </h1>
            </div>
            {favorites.length > 0 && (
              <div 
                className="text-sm"
                style={{
                  fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                  color: 'rgb(106, 106, 106)',
                }}
              >
                {favorites.length} {favorites.length === 1 ? 'favorito' : 'favoritos'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido - Flex grow para ocupar el espacio disponible */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 
              className="text-xl font-semibold mb-2"
              style={{
                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                color: 'rgb(34, 34, 34)',
              }}
            >
              No tienes favoritos guardados
            </h2>
            <p 
              className="text-gray-600 mb-6"
              style={{
                fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
              }}
            >
              Explora servicios y guarda tus favoritos para acceder a ellos fácilmente
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-[#ff385c] text-white rounded-lg hover:bg-[#e31c5f] transition-colors"
            >
              Explorar servicios
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6" style={{ gap: '12px' }}>
            {favorites.map((favorite) => {
              const service = favorite.service;
              if (!service) {
                console.warn('Favorito sin servicio:', favorite);
                return null;
              }
              
              // ✅ Convertir el servicio a SearchServiceDetailDto (formato de HomepageWall)
              const serviceDetail: SearchServiceDetailDto = {
                id: service.id,
                categoryId: service.categoryId,
                serviceTypeId: service.serviceTypeId,
                serviceTypeName: service.serviceTypeName,
                price: service.price,
                imageUrls: service.imageUrls || [],
                categoryName: service.categoryName,
                completedSearches: service.completedSearches || 0,
                averageRating: service.averageRating || 0,
                isFavorite: true, // Siempre es favorito en esta página
                expert: service.expert ? {
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
                  currentAvailability: undefined, // No disponible en favoritos según la guía
                } : undefined,
                requiresAppointment: false,
                conditions: '',
                durationInHours: 0,
                createdAt: '',
                isActive: true,
                selectedDeliverableTypes: [],
              };
              
              return (
                <ServiceCard key={favorite.id} service={serviceDetail} initialIsFavorite={true} />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Siempre al final, independiente de las cards */}
      <div className="mt-auto w-full">
        <Footer />
      </div>
    </div>
  );
};
