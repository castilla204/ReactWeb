import React, { useState } from 'react';
import { Calendar, MapPin, FileText } from 'lucide-react';
import { ProposeAppointmentDto } from '../types/appointment';
import AppointmentMap from './AppointmentMap';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from './ui/drawer';
import { Button } from './ui/button';
import { Label } from './ui/label';

interface AppointmentFormProps {
  searchHireId: number;
  onSubmit: (data: ProposeAppointmentDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
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
  console.log('AppointmentForm initialized for searchHireId:', searchHireId);
  
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
    
    if (formData.proposedDate && formData.proposedTime) {
      const appointmentDateTime = new Date(`${formData.proposedDate}T${formData.proposedTime}`);
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      if (appointmentDateTime <= now) {
        newErrors.push('La fecha y hora no pueden ser en el pasado');
      } else if (appointmentDateTime <= twentyFourHoursFromNow) {
        const hoursRemaining = Math.ceil((twentyFourHoursFromNow.getTime() - now.getTime()) / (1000 * 60 * 60));
        newErrors.push(`La cita debe ser al menos 24 horas en el futuro (faltan ${hoursRemaining} horas)`);
      }
    }
    
    if (!formData.location.trim() || !selectedLocation) {
      newErrors.push('Debes seleccionar una ubicación en el mapa');
    }
    
    if (!formData.proposedDate) {
      newErrors.push('La fecha es requerida');
    }
    
    if (!formData.proposedTime) {
      newErrors.push('La hora es requerida');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('🚀 ENVIANDO AL BACKEND:');
      console.log('📋 DTO de creación de cita que se enviará:', formData);
      console.log('📍 Ubicación seleccionada:', selectedLocation);
      console.log('🔍 searchHireId:', searchHireId);
      console.log('📝 Location que se envía:', formData.location);
      console.log('📝 Latitude que se envía:', formData.latitude);
      console.log('📝 Longitude que se envía:', formData.longitude);
      console.log('📝 DoorNumber que se envía:', formData.doorNumber);
      console.log('📝 OwnerPhone que se envía:', formData.ownerPhone);
      console.log('📝 SiteDetails que se envía:', formData.siteDetails);
      console.log('📝 ProposedDate que se envía:', formData.proposedDate);
      console.log('📝 ProposedTime que se envía:', formData.proposedTime);
      
      // Verificar que el location no esté vacío
      if (!formData.location || formData.location.trim() === '') {
        console.error('❌ ERROR: El campo location está vacío!');
      } else {
        console.log('✅ Location válido:', formData.location);
      }
      
      // Verificar que las coordenadas no sean null
      if (formData.latitude === null || formData.longitude === null) {
        console.error('❌ ERROR: Las coordenadas son null!');
      } else {
        console.log('✅ Coordenadas válidas:', formData.latitude, formData.longitude);
      }
      
      onSubmit(formData);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormData = { ...formData, proposedDate: e.target.value };
    setFormData(newFormData);
    
    if (newFormData.proposedDate && newFormData.proposedTime) {
      validateDateTime(newFormData.proposedDate, newFormData.proposedTime);
    } else {
      setErrors([]);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormData = { ...formData, proposedTime: e.target.value + ':00' };
    setFormData(newFormData);
    
    if (newFormData.proposedDate && newFormData.proposedTime) {
      validateDateTime(newFormData.proposedDate, newFormData.proposedTime);
    } else {
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
    console.log('📍 Latitud recibida:', location.latitude);
    console.log('📍 Longitud recibida:', location.longitude);
    
    setFormData(prevFormData => {
      const newFormData = {
        ...prevFormData,
        location: location.address,
        latitude: location.latitude,
        longitude: location.longitude
      };
      console.log('📝 NUEVO formData completo:', newFormData);
      console.log('📝 Location en formData:', newFormData.location);
      console.log('📝 Latitude en formData:', newFormData.latitude);
      console.log('📝 Longitude en formData:', newFormData.longitude);
      return newFormData;
    });
    
    setSelectedLocation(location);
    console.log('🔄 Estado actualizado correctamente');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onCancel()}>
      <DrawerContent className="max-h-[96vh]">
        <DrawerHeader>
          <DrawerTitle>Proponer Cita</DrawerTitle>
          <DrawerDescription>
            Completa los datos para programar una cita con el experto
          </DrawerDescription>
          <DrawerClose />
        </DrawerHeader>
        
        <form id="appointment-form" onSubmit={handleSubmit} className="px-4 pb-4 overflow-y-auto flex-1">
          
          {/* Errores */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
              <div className="text-sm text-destructive">
                {errors.map((error, index) => (
                  <p key={index} className="mb-1 last:mb-0">• {error}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Layout de dos columnas en desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Columna izquierda */}
            <div className="space-y-6">
              {/* 1. Fecha y Hora */}
              <div>
                <h4 className="text-sm font-medium text-foreground flex items-center mb-3">
                  <Calendar className="w-4 h-4 mr-2 text-primary" />
                  Fecha y Hora
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date">Fecha</Label>
                    <input
                      id="date"
                      type="date"
                      value={formData.proposedDate}
                      onChange={handleDateChange}
                      min={today}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="time">Hora</Label>
                    <input
                      id="time"
                      type="time"
                      value={formData.proposedTime.replace(':00', '')}
                      onChange={handleTimeChange}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Dirección */}
              <div>
                <h4 className="text-sm font-medium text-foreground flex items-center mb-3">
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  Dirección
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="location">Dirección completa</Label>
                    <input
                      id="location"
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, location: e.target.value });
                      }}
                      placeholder="Escribe la dirección o selecciona en el mapa..."
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="doorNumber">Número de puerta/garaje</Label>
                    <input
                      id="doorNumber"
                      type="text"
                      value={formData.doorNumber || ''}
                      onChange={handleDoorNumberChange}
                      placeholder="Portal A, 2ºB, Garaje 15..."
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Información Adicional */}
              <div>
                <h4 className="text-sm font-medium text-foreground flex items-center mb-3">
                  <FileText className="w-4 h-4 mr-2 text-primary" />
                  Información Adicional
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="ownerPhone">Teléfono del propietario</Label>
                    <input
                      id="ownerPhone"
                      type="tel"
                      value={formData.ownerPhone || ''}
                      onChange={handleOwnerPhoneChange}
                      placeholder="+34 666 123 456"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="siteDetails">Detalles específicos del sitio</Label>
                    <textarea
                      id="siteDetails"
                      value={formData.siteDetails || ''}
                      onChange={handleSiteDetailsChange}
                      placeholder="Entrada por el garaje, timbre roto, código de acceso..."
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Mapa */}
            <div>
              <h4 className="text-sm font-medium text-foreground flex items-center mb-3">
                <MapPin className="w-4 h-4 mr-2 text-primary" />
                Ubicación en el Mapa
              </h4>
              
              <div className="h-96 border border-border rounded-md">
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
          </div>

          {/* Información importante */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-6">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-2">Información importante</p>
              <ul className="text-xs space-y-1">
                <li>• La cita debe ser al menos 24 horas en el futuro</li>
                <li>• El experto tendrá 48 horas para confirmar o rechazar</li>
                <li>• Una vez confirmada, no se podrán hacer cambios 12h antes</li>
              </ul>
            </div>
          </div>
        </form>
        
        <DrawerFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            form="appointment-form"
            className="w-full sm:flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Proponiendo...' : 'Proponer Cita'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AppointmentForm;