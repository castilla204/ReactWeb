/**
 * ═══════════════════════════════════════════════════════════════
 * COMPONENTE SELECTOR DE ZONA HORARIA
 * ═══════════════════════════════════════════════════════════════
 * 
 * Este componente permite al usuario seleccionar su zona horaria
 * desde una lista de opciones obtenidas del backend.
 */

import React, { useState, useMemo } from 'react';
import { Globe, Search, Check, ChevronDown } from 'lucide-react';
import { useTimezones } from '../hooks/useTimezones';
import { useUserSettings } from '../hooks/useUserSettings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';

interface TimezoneSelectorProps {
  /** Valor actual (timezone ID) */
  value?: string;
  /** Callback cuando cambia el valor */
  onChange?: (timezone: string) => void;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Mostrar label */
  showLabel?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Variante compacta (sin label, menos padding) */
  compact?: boolean;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  showLabel = true,
  className = '',
  compact = false,
}) => {
  const { timezones, isLoading, getBrowserTimezone, getTimezoneDisplayName } = useTimezones();
  const { timezone: currentTimezone, updateTimezone, isUpdating } = useUserSettings();
  const [searchQuery, setSearchQuery] = useState('');

  // Valor actual (prop o del settings)
  const selectedValue = value ?? currentTimezone;

  // Filtrar timezones por búsqueda
  const filteredTimezones = useMemo(() => {
    if (!searchQuery.trim()) return timezones;
    
    const query = searchQuery.toLowerCase();
    return timezones.filter(tz => 
      tz.id.toLowerCase().includes(query) ||
      tz.displayName.toLowerCase().includes(query)
    );
  }, [timezones, searchQuery]);

  // Manejar cambio
  const handleChange = (newTimezone: string) => {
    if (onChange) {
      onChange(newTimezone);
    } else {
      // Si no hay onChange, actualizar directamente en settings
      updateTimezone(newTimezone);
    }
  };

  // Detectar y usar timezone del navegador
  const handleDetectTimezone = () => {
    const browserTz = getBrowserTimezone();
    handleChange(browserTz);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <Globe className="w-4 h-4 animate-pulse" />
        <span>Cargando zonas horarias...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && !compact && (
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          Zona Horaria
        </Label>
      )}
      
      <div className="flex gap-2">
        <Select
          value={selectedValue}
          onValueChange={handleChange}
          disabled={disabled || isUpdating}
        >
          <SelectTrigger className={compact ? 'h-9 text-sm' : 'h-10'}>
            <SelectValue placeholder="Selecciona zona horaria">
              {selectedValue && (
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {getTimezoneDisplayName(selectedValue) || selectedValue}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {/* Búsqueda */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar zona horaria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            
            {/* Lista de timezones */}
            {filteredTimezones.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No se encontraron zonas horarias
              </div>
            ) : (
              filteredTimezones.map((tz) => (
                <SelectItem key={tz.id} value={tz.id}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span>{tz.displayName}</span>
                    <span className="text-xs text-gray-400 font-mono">{tz.offset}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* Botón para detectar automáticamente */}
        {!compact && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDetectTimezone}
            disabled={disabled || isUpdating}
            title="Detectar mi zona horaria"
            className="shrink-0"
          >
            <Globe className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Mensaje de ayuda */}
      {!compact && (
        <p className="text-xs text-gray-500">
          Las fechas y horas de tus citas se mostrarán en esta zona horaria.
        </p>
      )}
    </div>
  );
};

/**
 * Componente simplificado para mostrar la zona horaria actual
 */
interface TimezoneDisplayProps {
  timezone?: string;
  showIcon?: boolean;
  className?: string;
}

export const TimezoneDisplay: React.FC<TimezoneDisplayProps> = ({
  timezone,
  showIcon = true,
  className = '',
}) => {
  const { timezone: currentTimezone } = useUserSettings();
  const { getTimezoneDisplayName, getTimezoneOffset } = useTimezones();

  const tz = timezone ?? currentTimezone;
  const displayName = getTimezoneDisplayName(tz) || tz;
  const offset = getTimezoneOffset(tz);

  return (
    <div className={`flex items-center gap-1.5 text-sm text-gray-600 ${className}`}>
      {showIcon && <Globe className="w-3.5 h-3.5 text-gray-400" />}
      <span>{displayName}</span>
      {offset && (
        <span className="text-xs text-gray-400 font-mono">({offset})</span>
      )}
    </div>
  );
};

/**
 * Componente para primera configuración de timezone
 * Muestra un modal/banner para que el usuario confirme su zona horaria
 */
interface TimezoneSetupBannerProps {
  onConfirm?: (timezone: string) => void;
  onDismiss?: () => void;
}

export const TimezoneSetupBanner: React.FC<TimezoneSetupBannerProps> = ({
  onConfirm,
  onDismiss,
}) => {
  const { getBrowserTimezone } = useTimezones();
  const { updateTimezone } = useUserSettings();
  const [selectedTz, setSelectedTz] = useState(getBrowserTimezone());

  const handleConfirm = () => {
    updateTimezone(selectedTz);
    onConfirm?.(selectedTz);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Globe className="w-5 h-5 text-blue-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">Configura tu zona horaria</h3>
          <p className="text-sm text-gray-600 mt-1">
            Detectamos que estás en <strong>{getBrowserTimezone()}</strong>. 
            ¿Es correcto?
          </p>
        </div>
      </div>

      <TimezoneSelector
        value={selectedTz}
        onChange={setSelectedTz}
        compact
        showLabel={false}
      />

      <div className="flex gap-2 justify-end">
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Más tarde
          </Button>
        )}
        <Button size="sm" onClick={handleConfirm}>
          <Check className="w-4 h-4 mr-1" />
          Confirmar
        </Button>
      </div>
    </div>
  );
};

export default TimezoneSelector;

