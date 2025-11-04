import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, FileText, Clock, AlertCircle, CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from './ui/form';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CurrentExpertAvailabilityDto, formatDaysOfWeek, formatTimeSpan, isDayAvailable } from '../utils/availability';
import ExpertAvailability from './ExpertAvailability';

interface AppointmentFormProps {
  searchHireId: number;
  onSubmit: (data: ProposeAppointmentDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
  expertLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  expertRange?: number | null;
  expertAvailability?: CurrentExpertAvailabilityDto | null;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  searchHireId,
  onSubmit, 
  onCancel,
  isLoading = false,
  error: externalError = null,
  expertLocation,
  expertRange,
  expertAvailability
}) => {
  console.log('AppointmentForm initialized for searchHireId:', searchHireId);
  
  const form = useForm<ProposeAppointmentDto>({
    defaultValues: {
      proposedDate: '',
      proposedTime: '',
      location: '',
      latitude: null,
      longitude: null,
      doorNumber: null,
      ownerPhone: null,
      siteDetails: null
    }
  });
  
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

  // Función para validar si una fecha/hora está dentro del horario del experto
  const isDateTimeWithinAvailability = (date: string, time: string): boolean => {
    if (!expertAvailability || !date || !time) return true; // Si no hay disponibilidad, no validar
    
    // Obtener el día de la semana en inglés (Monday, Tuesday, etc.)
    const appointmentDate = new Date(date);
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Verificar si el día está disponible
    if (!isDayAvailable(expertAvailability, dayName)) {
      return false;
    }
    
    // Verificar si la hora está dentro del rango
    const timeOnly = time.split(':')[0] + ':' + time.split(':')[1]; // HH:mm
    const [selectedHour, selectedMinute] = timeOnly.split(':').map(Number);
    const [startHour, startMinute] = expertAvailability.startTime.split(':').map(Number);
    const [endHour, endMinute] = expertAvailability.endTime.split(':').map(Number);
    
    const selectedMinutes = selectedHour * 60 + selectedMinute;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return selectedMinutes >= startMinutes && selectedMinutes <= endMinutes;
  };

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
      
      // Validar horario del experto
      if (expertAvailability) {
        if (!isDateTimeWithinAvailability(formData.proposedDate, formData.proposedTime)) {
          const daysFormatted = formatDaysOfWeek(expertAvailability.daysOfWeek);
          const timeRange = `${formatTimeSpan(expertAvailability.startTime)} - ${formatTimeSpan(expertAvailability.endTime)}`;
          newErrors.push(`La fecha/hora seleccionada no está dentro del horario del experto. Disponible: ${daysFormatted}, ${timeRange}`);
        }
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
    
    // Validar horario del experto
    if (expertAvailability && date && time) {
      if (!isDateTimeWithinAvailability(date, time)) {
        const daysFormatted = formatDaysOfWeek(expertAvailability.daysOfWeek);
        const timeRange = `${formatTimeSpan(expertAvailability.startTime)} - ${formatTimeSpan(expertAvailability.endTime)}`;
        newErrors.push(`La fecha/hora no está dentro del horario del experto (${daysFormatted}, ${timeRange})`);
      }
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


  return (
    <Drawer open={true} onOpenChange={(open) => !open && onCancel()}>
      <DrawerContent className="max-h-[96vh]">
        <DrawerHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-xl font-semibold">Proponer Cita</DrawerTitle>
              <DrawerDescription className="mt-1.5">
            Completa los datos para programar una cita con el experto
          </DrawerDescription>
            </div>
            <DrawerClose className="absolute right-4 top-4" />
          </div>
        </DrawerHeader>
        
        <Form {...form}>
          <form id="appointment-form" onSubmit={handleSubmit} autoComplete="off" className="overflow-y-auto flex-1">
            <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Errores */}
          {(errors.length > 0 || externalError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {externalError && (
                  <p className="font-medium mb-2">
                    {externalError}
                  </p>
                )}
          {errors.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                      <li key={index}>
                        {error}
                      </li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Layout de dos columnas en desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
              
              {/* Columna izquierda - Formulario */}
              <div className="space-y-8">
                {/* Fecha y Hora */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold">Fecha y Hora</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="proposedDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha</FormLabel>
                          <FormControl>
                            <DatePicker
                              selected={formData.proposedDate ? new Date(formData.proposedDate + 'T12:00:00') : null}
                              onChange={(date: Date | null) => {
                                if (date) {
                                  // Usar métodos locales para evitar problemas de zona horaria
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  const formattedDate = `${year}-${month}-${day}`;
                                  field.onChange(formattedDate);
                                  handleDateChange({ target: { value: formattedDate } } as React.ChangeEvent<HTMLInputElement>);
                                }
                              }}
                              dateFormat="dd/MM/yyyy"
                              placeholderText="Selecciona una fecha"
                              minDate={new Date()}
                              disabled={isLoading}
                              autoComplete="off"
                              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              wrapperClassName="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <label htmlFor="time" className="text-sm font-medium">Hora</label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <select
                            id="hour"
                            value={formData.proposedTime ? formData.proposedTime.split(':')[0] : ''}
                            onChange={(e) => {
                              const hour = e.target.value;
                              const minutes = formData.proposedTime ? formData.proposedTime.split(':')[1] || '00' : '00';
                              handleTimeChange({ target: { value: hour + ':' + minutes } } as React.ChangeEvent<HTMLInputElement>);
                            }}
                      disabled={isLoading}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.75rem center',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="" disabled>Hora</option>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              const hourStr = hour + ':00:00';
                              const isDisabled = expertAvailability ? 
                                (hourStr < expertAvailability.startTime || hourStr > expertAvailability.endTime) : false;
                              if (isDisabled) return null;
                              return (
                                <option key={hour} value={hour}>
                                  {hour}:00
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div className="flex-1">
                          <select
                            id="minutes"
                            value={formData.proposedTime ? formData.proposedTime.split(':')[1] || '00' : ''}
                            onChange={(e) => {
                              const minutes = e.target.value;
                              const hour = formData.proposedTime ? formData.proposedTime.split(':')[0] : '00';
                              handleTimeChange({ target: { value: hour + ':' + minutes } } as React.ChangeEvent<HTMLInputElement>);
                            }}
                            disabled={isLoading || !formData.proposedTime}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.75rem center',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="" disabled>Min</option>
                            {[0, 15, 30, 45].map((min) => {
                              const minutes = min.toString().padStart(2, '0');
                              return (
                                <option key={minutes} value={minutes}>
                                  {minutes}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Accordion con horario del experto */}
                  {expertAvailability && (
                    <Accordion type="single" defaultValue="schedule-info" collapsible className="w-full">
                      <AccordionItem value="schedule-info" className="border-none">
                        <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>Horario disponible del experto</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="space-y-3 text-sm">
                            <ExpertAvailability availability={expertAvailability} compact={false} />
                            <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                              Asegúrate de seleccionar una fecha y hora dentro de este horario. De lo contrario, no podrás enviar la propuesta.
                            </p>
                  </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>

                {/* Dirección */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold">Dirección</h3>
              </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección completa</FormLabel>
                          <FormControl>
                            <Input
                      type="text"
                              {...field}
                      value={formData.location || ''}
                      onChange={(e) => {
                                field.onChange(e);
                        setFormData({ ...formData, location: e.target.value });
                      }}
                      placeholder="Escribe la dirección o selecciona en el mapa..."
                      disabled={isLoading}
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="doorNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de puerta/garaje</FormLabel>
                          <FormControl>
                            <Input
                      type="text"
                              {...field}
                      value={formData.doorNumber || ''}
                              onChange={(e) => {
                                field.onChange(e);
                                handleDoorNumberChange(e);
                              }}
                      placeholder="Portal A, 2ºB, Garaje 15..."
                      disabled={isLoading}
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold">Información Adicional</h3>
              </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ownerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono del propietario</FormLabel>
                          <FormControl>
                            <Input
                      type="tel"
                              {...field}
                      value={formData.ownerPhone || ''}
                              onChange={(e) => {
                                field.onChange(e);
                                handleOwnerPhoneChange(e);
                              }}
                      placeholder="+34 666 123 456"
                      disabled={isLoading}
                              autoComplete="tel"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="siteDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detalles específicos del sitio</FormLabel>
                          <FormControl>
                    <textarea
                              {...field}
                      value={formData.siteDetails || ''}
                              onChange={(e) => {
                                field.onChange(e);
                                handleSiteDetailsChange(e);
                              }}
                      placeholder="Entrada por el garaje, timbre roto, código de acceso..."
                              rows={4}
                              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      disabled={isLoading}
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Accordion con información */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="info" className="border-none">
                    <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                      Información importante
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4 text-sm text-muted-foreground">
                        {/* Horario del experto */}
                        {expertAvailability && (
                          <div className="pb-3 border-b border-border/50">
                            <p className="text-xs font-medium text-foreground mb-2">Horario del experto:</p>
                            <ExpertAvailability availability={expertAvailability} compact={true} />
                          </div>
                        )}
                        
                        {/* Reglas importantes */}
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-foreground">•</span>
                            <span>La cita debe ser al menos 24 horas en el futuro</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-foreground">•</span>
                            <span>El experto tendrá 48 horas para confirmar o rechazar</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-foreground">•</span>
                            <span>Una vez confirmada, no se podrán hacer cambios 12h antes</span>
                          </li>
                          {expertAvailability && (
                            <li className="flex items-start gap-2">
                              <span className="text-foreground">•</span>
                              <span>La fecha y hora deben estar dentro del horario disponible del experto</span>
                            </li>
                          )}
                        </ul>
                        
                        {/* Leyenda del mapa */}
                        <div className="pt-3 border-t border-border/50 space-y-2">
                          <p className="text-xs font-medium text-foreground">Leyenda del mapa:</p>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Ubicación del experto</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Tu selección</span>
                  </div>
                </div>
              </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
            </div>

            {/* Columna derecha - Mapa */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                    <h3 className="text-base font-semibold">Selecciona la ubicación</h3>
                  </div>

                  <div className="h-[500px] rounded-lg overflow-hidden border border-border relative">
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
          </div>
        </form>
        </Form>
        
        <DrawerFooter className="border-t border-border/50 bg-muted/30">
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-7xl mx-auto px-6">
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
              className="w-full sm:w-auto sm:min-w-[120px]"
            >
              Cancelar
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AppointmentForm;