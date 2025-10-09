import React, { useState } from 'react';
import { Calendar, Clock, MapPin, X, Phone, Home, FileText } from 'lucide-react';
import { ProposeAppointmentDto } from '../types/appointment';
import AppointmentMap from './AppointmentMap';

interface AppointmentFormProps {
  searchHireId: number;
  onSubmit: (data: ProposeAppointmentDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  searchHireId, 
  onSubmit, 
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ProposeAppointmentDto>({
    proposedDate: '',
    proposedTime: '',
    location: '',
    latitude: null,
    longitude: null,
    doorNumber: null,
    ownerPhone: null,
    siteDetails: null
  });

  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    // Validar fecha (mínimo 24h en el futuro)
    if (formData.proposedDate && formData.proposedTime) {
      const appointmentDateTime = new Date(`${formData.proposedDate}T${formData.proposedTime}`);
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Validar que la fecha no sea en el pasado
      if (appointmentDateTime <= now) {
        newErrors.push('La fecha y hora no pueden ser en el pasado');
      }
      // Validar que sea al menos 24 horas en el futuro
      else if (appointmentDateTime <= twentyFourHoursFromNow) {
        const hoursRemaining = Math.ceil((twentyFourHoursFromNow.getTime() - now.getTime()) / (1000 * 60 * 60));
        newErrors.push(`La cita debe ser al menos 24 horas en el futuro (faltan ${hoursRemaining} horas)`);
      }
    }
    
    // Validar ubicación
    if (!formData.location.trim() || !selectedLocation) {
      newErrors.push('Debes seleccionar una ubicación en el mapa');
    }
    
    // Validar fecha
    if (!formData.proposedDate) {
      newErrors.push('La fecha es requerida');
    }
    
    // Validar hora
    if (!formData.proposedTime) {
      newErrors.push('La hora es requerida');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormData = { ...formData, proposedDate: e.target.value };
    setFormData(newFormData);
    
    // Validar en tiempo real si tenemos fecha y hora
    if (newFormData.proposedDate && newFormData.proposedTime) {
      validateDateTime(newFormData.proposedDate, newFormData.proposedTime);
    } else {
      // Limpiar errores si no tenemos ambos campos
      setErrors([]);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormData = { ...formData, proposedTime: e.target.value + ':00' };
    setFormData(newFormData);
    
    // Validar en tiempo real si tenemos fecha y hora
    if (newFormData.proposedDate && newFormData.proposedTime) {
      validateDateTime(newFormData.proposedDate, newFormData.proposedTime);
    } else {
      // Limpiar errores si no tenemos ambos campos
      setErrors([]);
    }
  };

  const validateDateTime = (date: string, time: string) => {
    const appointmentDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const newErrors: string[] = [];
    
    if (appointmentDateTime <= now) {
      newErrors.push('La fecha y hora no pueden ser en el pasado');
    } else if (appointmentDateTime <= twentyFourHoursFromNow) {
      const hoursRemaining = Math.ceil((twentyFourHoursFromNow.getTime() - now.getTime()) / (1000 * 60 * 60));
      newErrors.push(`La cita debe ser al menos 24 horas en el futuro (faltan ${hoursRemaining} horas)`);
    }
    
    setErrors(newErrors);
  };


  const handleDoorNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, doorNumber: e.target.value || null });
  };

  const handleOwnerPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, ownerPhone: e.target.value || null });
  };

  const handleSiteDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, siteDetails: e.target.value || null });
  };

  const handleLocationSelect = (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    setSelectedLocation(location);
    setFormData({
      ...formData,
      location: location.address,
      latitude: location.latitude,
      longitude: location.longitude
    });
  };

  // Obtener fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Proponer Cita</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-600">
                {errors.map((error, index) => (
                  <p key={index} className="mb-1 last:mb-0">• {error}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Sección 1: Fecha y Hora */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
              📅 Fecha y Hora
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha de la cita
                </label>
                <input
                  type="date"
                  value={formData.proposedDate}
                  onChange={handleDateChange}
                  min={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Hora de la cita
                </label>
                <input
                  type="time"
                  value={formData.proposedTime.replace(':00', '')}
                  onChange={handleTimeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Ubicación */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
              📍 Ubicación
            </h4>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <MapPin className="w-4 h-4 inline mr-2" />
                Ubicación de la cita
              </label>
              <AppointmentMap
                onLocationSelect={handleLocationSelect}
                initialLocation={selectedLocation}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Sección 3: Información Adicional */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
              ℹ️ Información Adicional
            </h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Home className="w-4 h-4 inline mr-2" />
                  Número de puerta/garaje
                </label>
                <input
                  type="text"
                  value={formData.doorNumber || ''}
                  onChange={handleDoorNumberChange}
                  placeholder="Portal A, 2ºB, Garaje 15..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Información adicional para facilitar el acceso
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono del propietario
                </label>
                <input
                  type="tel"
                  value={formData.ownerPhone || ''}
                  onChange={handleOwnerPhoneChange}
                  placeholder="+34 666 123 456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Teléfono de contacto del propietario del objeto/servicio
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Detalles específicos del sitio
                </label>
                <textarea
                  value={formData.siteDetails || ''}
                  onChange={handleSiteDetailsChange}
                  placeholder="Entrada por el garaje, timbre roto, código de acceso..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Información adicional que pueda ser útil para el experto
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="text-xs space-y-1">
                <li>• La cita debe ser al menos 24 horas en el futuro</li>
                <li>• El experto tendrá 48 horas para confirmar o rechazar</li>
                <li>• Una vez confirmada, no se podrán hacer cambios 12h antes</li>
              </ul>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Proponiendo...' : 'Proponer Cita'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;

