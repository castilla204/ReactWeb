import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { getCountryName, getCountryFlagUrl } from '../utils/countries';
import { getAvailableCountries, getCountryCoordinates } from '../utils/countryCoordinates';

interface CountrySelectorProps {
  onCountrySelect: (countryCode: string, coordinates: { lat: number; lng: number; zoom: number }) => void;
  currentCountry?: string | null;
  className?: string;
  variant?: 'default' | 'compact'; // Nueva prop para variante compacta
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  onCountrySelect,
  currentCountry,
  className = '',
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const countries = getAvailableCountries();

  // Filtrar países según la búsqueda
  const filteredCountries = countries.filter(country =>
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

  // Focus en el input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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

  const isCompact = variant === 'compact';
  
  return (
    <div className={`relative z-50 ${className}`} ref={dropdownRef}>
      {/* Botón trigger - estilo adaptativo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={isCompact 
          ? "flex items-center gap-1.5 h-9 px-2.5 hover:bg-accent/60 transition-all border border-border/40 hover:border-border/60 text-xs font-medium text-foreground/80 hover:text-foreground bg-background/50"
          : "flex items-center gap-2 h-12 px-4 hover:bg-accent/60 transition-colors text-foreground"
        }
        style={{ borderRadius: '0', boxShadow: 'none' }}
      >
        {currentCountryFlag ? (
          <img
            src={currentCountryFlag}
            alt={currentCountryName}
            className={`${isCompact ? "w-4 h-3" : "w-5 h-4"} object-cover country-flag-img`}
            loading="lazy"
          />
        ) : (
          <div className={isCompact ? "w-4 h-3 bg-muted flex items-center justify-center" : "w-5 h-4 bg-muted flex items-center justify-center"}>
            <span className={isCompact ? "text-[6px] text-muted-foreground" : "text-[8px] text-muted-foreground"}>🌍</span>
          </div>
        )}
        {!isCompact && (
          <span className="text-sm font-medium text-foreground max-w-[80px] truncate hidden sm:block">
            {currentCountryName}
          </span>
        )}
        {isCompact && (
          <span className="hidden sm:inline text-xs font-medium text-foreground/80">
            {currentCountry?.toUpperCase()}
          </span>
        )}
        <ChevronDown className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute top-full ${isCompact ? 'right-0' : 'left-0'} mt-2 w-72 bg-background rounded-2xl shadow-2xl border border-border z-[99999] overflow-hidden backdrop-blur-md`} style={{ position: 'absolute' }}>
          {/* Header con búsqueda */}
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

          {/* Lista de países */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No se encontraron países
              </div>
            ) : (
              <div className="py-2">
                {filteredCountries.map((country) => {
                  const flagUrl = getCountryFlagUrl(country.code, 32);
                  const isSelected = currentCountry?.toUpperCase() === country.code.toUpperCase();
                  
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountryClick(country.code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/60 transition-colors text-left ${
                        isSelected ? 'bg-accent/40' : ''
                      }`}
                    >
                      {flagUrl ? (
                        <img
                          src={flagUrl}
                          alt={country.name}
                          className="w-7 h-5 object-cover shadow-sm country-flag-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-7 h-5 bg-muted flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground">{country.code}</span>
                        </div>
                      )}
                      <span className="flex-1 text-sm font-medium text-foreground">{country.name}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary" />
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
