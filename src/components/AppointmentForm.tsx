import React, { useState } from 'react';
import { Calendar, MapPin, X, FileText } from 'lucide-react';
import { ProposeAppointmentDto } from '../types/appointment';
import AppointmentMap from './AppointmentMap';

interface AppointmentFormProps {
  searchHireId: number;
  onSubmit: (data: ProposeAppointmentDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
  // ✅ NUEVOS PROPS PARA INFORMACIÓN DEL EXPERTO
  expertLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  expertRange?: number | null;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  searchHireId,
  onSubmit, 
  onCancel,
  isLoading = false,
  expertLocation,
  expertRange
}) => {
  // searchHireId se usa implícitamente en el contexto del componente padre
  console.log('AppointmentForm initialized for searchHireId:', searchHireId);
  const [formData, setFormData] = useState<ProposeAppointmentDto>({
    proposedDate: '',
    proposedTime: '',
    address: '',
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
    if (!formData.address.trim() || !selectedLocation) {
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
      console.log('📋 DTO de creación de cita que se enviará:', formData);
      console.log('📍 Ubicación seleccionada:', selectedLocation);
      console.log('🔍 searchHireId:', searchHireId);
      
      // searchHireId se pasa al onSubmit a través del contexto del componente padre
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
    console.log('🎯 handleLocationSelect LLAMADO con:', location);
    console.log('📍 Dirección recibida:', location.address);
    
    // Actualizar estado usando callback para asegurar que se actualice
    setFormData(prevFormData => {
      const newFormData = {
        ...prevFormData,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude
      };
      console.log('📝 Actualizando formData con address:', newFormData.address);
      return newFormData;
    });
    
    setSelectedLocation(location);
    console.log('🔄 Estado actualizado correctamente');
  };

  // Obtener fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Proponer Cita</h3>
            <p className="text-sm text-gray-600 mt-1">Completa los datos para programar tu cita</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-full"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {/* Layout simple: siempre vertical en móvil, grid en desktop */}
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            {errors.length > 0 && (
              <div className="col-span-full bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-600">
                  {errors.map((error, index) => (
                    <p key={index} className="mb-1 last:mb-0">• {error}</p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Sección 1: Fecha y Hora */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Fecha y Hora</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha de la cita
                  </label>
                  <input
                    type="date"
                    value={formData.proposedDate}
                    onChange={handleDateChange}
                    min={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Hora de la cita
                  </label>
                  <input
                    type="time"
                    value={formData.proposedTime.replace(':00', '')}
                    onChange={handleTimeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Mapa */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Ubicación</h4>
              </div>
              
              <div className="h-64 lg:h-80">
                <AppointmentMap
                  onLocationSelect={handleLocationSelect}
                  initialLocation={selectedLocation ? { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude } : undefined}
                  disabled={isLoading}
                  expertLocation={expertLocation}
                  expertRange={expertRange}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Sección 3: Información Adicional */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4 lg:col-span-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Información Adicional</h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                    }}
                    placeholder="Escribe la dirección o selecciona en el mapa..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Número de puerta/garaje
                  </label>
                  <input
                    type="text"
                    value={formData.doorNumber || ''}
                    onChange={handleDoorNumberChange}
                    placeholder="Portal A, 2ºB, Garaje 15..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono del propietario
                  </label>
                  <input
                    type="tel"
                    value={formData.ownerPhone || ''}
                    onChange={handleOwnerPhoneChange}
                    placeholder="+34 666 123 456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Detalles específicos del sitio
                  </label>
                  <textarea
                    value={formData.siteDetails || ''}
                    onChange={handleSiteDetailsChange}
                    placeholder="Entrada por el garaje, timbre roto, código de acceso..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-colors text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Información importante y botones */}
          <div className="mt-4 space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2 flex items-center">
                <span className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center mr-2 text-xs">ℹ️</span>
                Información importante
              </p>
              <ul className="text-xs space-y-1 ml-6">
                <li className="flex items-start">
                  <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  La cita debe ser al menos 24 horas en el futuro
                </li>
                <li className="flex items-start">
                  <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  El experto tendrá 48 horas para confirmar o rechazar
                </li>
                <li className="flex items-start">
                  <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Una vez confirmada, no se podrán hacer cambios 12h antes
                </li>
              </ul>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-5 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Proponiendo...
                </span>
              ) : (
                'Proponer Cita'
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-5 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              disabled={isLoading}
            >
              Cancelar
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;

