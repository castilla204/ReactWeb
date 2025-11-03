import React, { useState } from 'react';
import { X, AlertTriangle, Send, Calendar, Clock, MapPin, Phone, DoorOpen } from 'lucide-react';
import { Appointment } from '../types/appointment';
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
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Card } from './ui/card';

interface RejectAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  appointment: Appointment | null;
  isLoading?: boolean;
  actionType?: 'reject' | 'cancel'; // Nuevo prop para distinguir entre rechazo y cancelación
  userRole?: 'client' | 'expert'; // Nuevo prop para distinguir entre cliente y experto
}

const RejectAppointmentModal: React.FC<RejectAppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  isLoading = false,
  actionType = 'reject',
  userRole = 'client'
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError(`Por favor, proporciona una razón para la ${actionType === 'cancel' ? 'cancelación' : 'rechazo'}`);
      return;
    }

    if (reason.trim().length < 10) {
      setError('La razón debe tener al menos 10 caracteres');
      return;
    }

    setError('');
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[96vh] flex flex-col">
        <div className="mx-auto w-full max-w-2xl flex flex-col h-full max-h-[96vh]">
          <DrawerHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <DrawerTitle className="text-lg sm:text-xl font-semibold">
                  {actionType === 'cancel' ? 'Cancelar Cita' : 'Rechazar Cita'}
                </DrawerTitle>
                <DrawerDescription className="text-sm">
                  {actionType === 'cancel' ? 'Proporciona una razón para cancelar esta cita' : 'Proporciona una razón para rechazar esta cita'}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Contenido scrollable */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 flex-1 min-h-0 overflow-y-auto">

            <div className="space-y-6">
              {/* Información de la cita */}
              {appointment && (
                <Card className="p-4 bg-muted">
                  <h4 className="text-sm font-medium text-foreground mb-4">Detalles de la cita</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">Fecha:</span>
                        <span className="ml-2 text-foreground font-medium">
                          {new Date(appointment.proposedDate).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">Hora:</span>
                        <span className="ml-2 text-foreground font-medium">{appointment.proposedTime.substring(0, 5)}</span>
                      </div>
                    </div>
                    <div className="lg:col-span-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="text-muted-foreground">Ubicación:</span>
                        <span className="ml-2 text-foreground font-medium">{appointment.location}</span>
                      </div>
                    </div>
                    {appointment.doorNumber && (
                      <div className="flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Puerta:</span>
                          <span className="ml-2 text-foreground font-medium">{appointment.doorNumber}</span>
                        </div>
                      </div>
                    )}
                    {appointment.ownerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Teléfono:</span>
                          <span className="ml-2 text-foreground font-medium">{appointment.ownerPhone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Advertencia sobre rechazos/cancelaciones */}
              <Card className="p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    {actionType === 'cancel' ? 'Cancelaciones' : 'Rechazos'} realizadas: {actionType === 'cancel' ? (userRole === 'client' ? (appointment?.clientCancellationCount || 0) : (appointment?.expertCancellationCount || 0)) : (appointment?.rejectionCount || 0)} de 2 máximo
                  </p>
                </div>
                <p className="text-amber-700 dark:text-amber-300 leading-relaxed text-sm">
                  {actionType === 'cancel' ? (
                    userRole === 'client' ? (
                      appointment && (appointment.clientCancellationCount || 0) >= 1 ? (
                        <>
                          <strong className="text-amber-900 dark:text-amber-100">⚠️ Última cancelación:</strong> Si cancelas esta cita, el servicio se cancelará definitivamente y se aplicarán las políticas de reembolso correspondientes.
                        </>
                      ) : (
                        <>Si cancelas esta cita, podrás proponer una nueva fecha y hora.</>
                      )
                    ) : (
                      appointment && (appointment.expertCancellationCount || 0) >= 1 ? (
                        <>
                          <strong className="text-amber-900 dark:text-amber-100">⚠️ Última cancelación:</strong> Si cancelas esta cita, el servicio se cancelará definitivamente y se aplicarán las políticas de reembolso correspondientes.
                        </>
                      ) : (
                        <>Si cancelas esta cita, podrás proponer una nueva fecha y hora.</>
                      )
                    )
                  ) : (
                    appointment && appointment.rejectionCount >= 1 ? (
                      <>
                        <strong className="text-amber-900 dark:text-amber-100">⚠️ Último rechazo:</strong> Si rechazas esta cita, el servicio se cancelará automáticamente y el cliente recibirá el reembolso completo.
                      </>
                    ) : (
                      <>Si rechazas esta cita, el cliente podrá proponer una nueva fecha y hora.</>
                    )
                  )}
                </p>
              </Card>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="reason" className="text-sm font-medium mb-3 block">
                    Razón de la {actionType === 'cancel' ? 'cancelación' : 'rechazo'} *
                  </Label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={actionType === 'cancel' 
                      ? "Explica por qué necesitas cancelar esta cita (mínimo 10 caracteres)..."
                      : "Explica por qué no puedes aceptar esta cita (mínimo 10 caracteres)..."
                    }
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-destructive resize-none bg-background"
                    rows={4}
                    disabled={isLoading}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      {reason.length}/500 caracteres
                    </span>
                    {error && (
                      <span className="text-xs text-destructive">
                        {error}
                      </span>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <Separator className="flex-shrink-0" />

          {/* Footer con botones */}
          <DrawerFooter className="flex-shrink-0">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || !reason.trim()}
                className="flex-1 bg-destructive hover:bg-destructive/90"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span>{actionType === 'cancel' ? 'Cancelando...' : 'Rechazando...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    <span>{actionType === 'cancel' ? 'Cancelar Cita' : 'Rechazar Cita'}</span>
                  </>
                )}
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RejectAppointmentModal;
























