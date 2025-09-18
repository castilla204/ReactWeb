import React, { useState } from 'react';
import { Calendar, Clock, MapPin, X } from 'lucide-react';
import { ProposeAppointmentDto } from '../types/appointment';

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
    latitude: undefined,
    longitude: undefined
  });
  
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    // Validar fecha (mínimo 12h en el futuro)
    if (formData.proposedDate && formData.proposedTime) {
      const appointmentDateTime = new Date(`${formData.proposedDate}T${formData.proposedTime}`);
      const twelveHoursFromNow = new Date(Date.now() + 12 * 60 * 60 * 1000);
      
      if (appointmentDateTime <= twelveHoursFromNow) {
        newErrors.push('La cita debe ser al menos 12 horas en el futuro');
      }
      
      // Validar que la fecha no sea en el pasado
      if (appointmentDateTime <= new Date()) {
        newErrors.push('La fecha no puede ser en el pasado');
      }
    }
    
    // Validar ubicación
    if (!formData.location.trim()) {
      newErrors.push('La ubicación es requerida');
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
    setFormData({ ...formData, proposedDate: e.target.value });
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, proposedTime: e.target.value + ':00' });
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, location: e.target.value });
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors.length > 0) {
      setErrors([]);
    }
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
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-600">
                {errors.map((error, index) => (
                  <p key={index} className="mb-1 last:mb-0">• {error}</p>
                ))}
              </div>
            </div>
          )}
          
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
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4 inline mr-2" />
              Ubicación
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={handleLocationChange}
              placeholder="Calle Mayor 123, Madrid"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Especifica la dirección exacta donde se realizará la cita
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="text-xs space-y-1">
                <li>• La cita debe ser al menos 12 horas en el futuro</li>
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
