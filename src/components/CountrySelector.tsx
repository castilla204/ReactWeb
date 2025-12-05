import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { getCountryName, getCountryFlagUrl } from '../utils/countries';
import { getAvailableCountries, getCountryCoordinates } from '../utils/countryCoordinates';

interface CountrySelectorProps {
  onCountrySelect: (countryCode: string, coordinates: { lat: number; lng: number; zoom: number }) => void;
  currentCountry?: string | null;
  className?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  onCountrySelect,
  currentCountry,
  className = ''
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botón trigger - estilo integrado */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-12 px-4 hover:bg-gray-50 transition-colors rounded-l-full"
      >
        {currentCountryFlag ? (
          <img
            src={currentCountryFlag}
            alt={currentCountryName}
            className="w-5 h-4 object-cover rounded-sm"
            loading="lazy"
          />
        ) : (
          <div className="w-5 h-4 bg-gray-200 rounded-sm flex items-center justify-center">
            <span className="text-[8px] text-gray-500">🌍</span>
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate hidden sm:block">
          {currentCountryName}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] overflow-hidden">
          {/* Header con búsqueda */}
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar país..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 text-sm bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Lista de países */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
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
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                        isSelected ? 'bg-gray-50' : ''
                      }`}
                    >
                      {flagUrl ? (
                        <img
                          src={flagUrl}
                          alt={country.name}
                          className="w-7 h-5 object-cover rounded shadow-sm"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-7 h-5 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-[10px] text-gray-400">{country.code}</span>
                        </div>
                      )}
                      <span className="flex-1 text-sm font-medium text-gray-900">{country.name}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-black" />
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
