import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { getCountryName, getCountryFlagUrl } from '../utils/countries';
import { getAvailableCountries, getCountryCoordinates } from '../utils/countryCoordinates';

interface CountrySelectorProps {
  onCountrySelect: (countryCode: string, coordinates: { lat: number; lng: number; zoom: number }) => void;
  currentCountry?: string | null;
  className?: string;
  variant?: 'default' | 'compact'; // Nueva prop para variante compacta
  style?: React.CSSProperties; // Estilos inline para control dinámico
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  onCountrySelect,
  currentCountry,
  className = '',
  variant = 'default',
  style
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const countries = getAvailableCountries();
  const isCompact = variant === 'compact';

  // Países permitidos para el modo compacto: España, Inglaterra, Estados Unidos, Francia, Italia
  const allowedCountries = ['ES', 'GB', 'US', 'FR', 'IT'];
  
  // Filtrar países según la búsqueda o solo los permitidos si es compacto
  const filteredCountries = isCompact 
    ? countries.filter(country => allowedCountries.includes(country.code.toUpperCase()))
    : countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus en el input cuando se abre (solo si no es compacto)
  useEffect(() => {
    if (isOpen && inputRef.current && !isCompact) {
      inputRef.current.focus();
    }
  }, [isOpen, isCompact]);

  const handleCountryClick = (countryCode: string) => {
    const coordinates = getCountryCoordinates(countryCode);
    if (coordinates) {
      onCountrySelect(countryCode, coordinates);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const currentCountryName = currentCountry ? getCountryName(currentCountry) : 'País';
  const currentCountryFlag = currentCountry ? getCountryFlagUrl(currentCountry, 24) : null;
  
  return (
    <div className={`relative z-50 ${className}`} ref={dropdownRef} style={{ width: 'auto', minWidth: 'auto' }}>
      {/* Botón trigger - estilo adaptativo - Sin padding derecho para pegar separador */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={isCompact 
          ? "flex items-center gap-1.5 h-9 px-2.5 hover:bg-accent/60 transition-all border border-border/40 hover:border-border/60 text-xs font-medium text-foreground/80 hover:text-foreground bg-background/50"
          : "flex items-center hover:bg-gray-50 transition-colors text-foreground"
        }
        style={{ 
          ...style,
          borderRadius: '0', 
          boxShadow: 'none', 
          paddingRight: isCompact ? undefined : '0',
          marginRight: '0'
        }}
      >
        {currentCountryFlag ? (
          <img
            src={currentCountryFlag}
            alt={currentCountryName}
            className="object-cover country-flag-img flex-shrink-0"
            style={{ 
              width: isCompact ? '16px' : (style?.height ? `${parseInt(style.height.toString()) * 0.35}px` : '20px'),
              height: isCompact ? '12px' : (style?.height ? `${parseInt(style.height.toString()) * 0.25}px` : '16px')
            }}
            loading="lazy"
          />
        ) : (
          <div 
            className="bg-muted flex items-center justify-center flex-shrink-0"
            style={{ 
              width: isCompact ? '16px' : (style?.height ? `${parseInt(style.height.toString()) * 0.35}px` : '20px'),
              height: isCompact ? '12px' : (style?.height ? `${parseInt(style.height.toString()) * 0.25}px` : '16px')
            }}
          >
            <span className="text-muted-foreground" style={{ fontSize: isCompact ? '6px' : '8px' }}>🌍</span>
          </div>
        )}
        {!isCompact && (
          <span 
            className="font-medium text-foreground truncate hidden sm:block"
            style={{ 
              fontSize: style?.height ? `${parseInt(style.height.toString()) * 0.25}px` : '14px',
              maxWidth: style?.minWidth ? `${parseInt(style.minWidth.toString()) - 60}px` : '80px'
            }}
          >
            {currentCountryName}
          </span>
        )}
        {isCompact && (
          <span className="hidden sm:inline text-xs font-medium text-foreground/80">
            {currentCountry?.toUpperCase()}
          </span>
        )}
        <ChevronDown 
          className="text-muted-foreground transition-transform flex-shrink-0"
          style={{ 
            width: isCompact ? '12px' : (style?.height ? `${parseInt(style.height.toString()) * 0.3}px` : '16px'),
            height: isCompact ? '12px' : (style?.height ? `${parseInt(style.height.toString()) * 0.3}px` : '16px'),
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginRight: '0px'
          }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute top-full ${isCompact ? 'right-0' : 'left-0'} mt-1.5 ${isCompact ? 'w-14' : 'w-72'} bg-background ${isCompact ? 'rounded-md' : 'rounded-2xl'} shadow-lg border border-border z-[99999] overflow-hidden backdrop-blur-md`} style={{ position: 'absolute' }}>
          {/* Header con búsqueda - Solo si no es compacto */}
          {!isCompact && (
            <div className="p-3 bg-accent/30 border-b border-border">
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar país..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-4 text-sm bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          {/* Lista de países */}
          <div className={isCompact ? 'py-1' : 'max-h-64 overflow-y-auto'}>
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No se encontraron países
              </div>
            ) : (
              <div className={isCompact ? 'flex flex-col gap-0.5' : 'py-2'}>
                {filteredCountries.map((country) => {
                  // Usar tamaño más grande para mejor calidad pero mostrar más pequeño con CSS
                  const flagUrl = getCountryFlagUrl(country.code, isCompact ? 40 : 32);
                  const isSelected = currentCountry?.toUpperCase() === country.code.toUpperCase();
                  
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountryClick(country.code)}
                      className={isCompact 
                        ? `w-full flex items-center justify-center px-1 py-1.5 hover:bg-accent/60 transition-colors ${
                            isSelected ? 'bg-accent/40' : ''
                          }`
                        : `w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/60 transition-colors text-left ${
                            isSelected ? 'bg-accent/40' : ''
                          }`
                      }
                    >
                      {flagUrl ? (
                        <img
                          src={flagUrl}
                          alt={country.name}
                          className={isCompact 
                            ? "w-10 h-7 object-cover shadow-sm country-flag-img rounded border border-gray-200/50"
                            : "w-7 h-5 object-cover shadow-sm country-flag-img"
                          }
                          style={isCompact ? { imageRendering: 'crisp-edges' } : {}}
                          loading="lazy"
                        />
                      ) : (
                        <div className={isCompact ? "w-10 h-7 bg-muted flex items-center justify-center rounded border border-gray-200/50" : "w-7 h-5 bg-muted flex items-center justify-center"}>
                          <span className="text-badge text-muted-foreground">{country.code}</span>
                        </div>
                      )}
                      {!isCompact && (
                        <>
                          <span className="flex-1 text-sm font-medium text-foreground">{country.name}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
