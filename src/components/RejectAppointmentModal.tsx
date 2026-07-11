import React, { useState } from 'react';
import { X, AlertTriangle, Send, Calendar, MapPin, Phone, DoorOpen } from 'lucide-react';
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
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

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
      <DrawerContent className="max-h-[96dvh] flex flex-col border-t-4 border-destructive">
        <div className="mx-auto w-full max-w-2xl lg:max-w-3xl flex flex-col h-full max-h-[96dvh]">
          <DrawerHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DrawerTitle className="text-lg sm:text-xl font-semibold">
                  {actionType === 'cancel' ? 'Cancelar Cita' : 'Rechazar Cita'}
                </DrawerTitle>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
            <DrawerDescription className="text-sm text-muted-foreground mt-1.5">
              {actionType === 'cancel' ? 'Proporciona una razón para cancelar esta cita' : 'Proporciona una razón para rechazar esta cita'}
            </DrawerDescription>
          </DrawerHeader>

          {/* Contenido scrollable */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-4">
              {/* Información de la cita */}
              {appointment && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium text-foreground">
                      {(() => {
                        // ✅ CORRECTO: Usar campos *Local que el backend proporciona (ya están en hora local)
                        // ⚠️ NO usar proposedDate/proposedTime para mostrar (están en UTC)
                        const dateToUse = appointment.proposedDateLocal || appointment.proposedDate;
                        const timeToUse = appointment.proposedTimeLocal || appointment.proposedTime;
                        
                        // ✅ Manejar caso cuando timeToUse es undefined o null
                        const formattedTime = timeToUse ? (timeToUse.substring ? timeToUse.substring(0, 5) : String(timeToUse).substring(0, 5)) : '';
                        
                        return (
                          <>
                            {dateToUse ? new Date(dateToUse).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'Fecha no disponible'}{formattedTime ? ` ${formattedTime}` : ''}
                          </>
                        );
                      })()}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{appointment.location}</span>
                  </div>
                  {appointment.doorNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DoorOpen className="w-4 h-4" />
                      <span className="text-foreground">Puerta: {appointment.doorNumber}</span>
                    </div>
                  )}
                  {appointment.ownerPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span className="text-foreground">{appointment.ownerPhone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Advertencia sobre rechazos/cancelaciones */}
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  {actionType === 'cancel' ? 'Cancelaciones' : 'Rechazos'} realizadas
                  <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700 text-xs font-normal">
                    {actionType === 'cancel' 
                      ? (userRole === 'client' ? (appointment?.clientCancellationCount || 0) : (appointment?.expertCancellationCount || 0))
                      : (appointment?.rejectionCount || 0)
                    } / 2
                  </Badge>
                </AlertTitle>
                <AlertDescription className="mt-2">
                  <Accordion type="single" collapsible defaultValue="warning-details" className="w-full">
                    <AccordionItem value="warning-details" className="border-none">
                      <AccordionTrigger className="py-1.5 text-xs hover:no-underline text-amber-800 dark:text-amber-200">
                        {actionType === 'cancel' ? (
                          userRole === 'client' ? (
                            appointment && (appointment.clientCancellationCount || 0) >= 1 ? (
                              '⚠️ Última cancelación'
                            ) : (
                              'Ver detalles'
                            )
                          ) : (
                            appointment && (appointment.expertCancellationCount || 0) >= 1 ? (
                              '⚠️ Última cancelación'
                            ) : (
                              'Ver detalles'
                            )
                          )
                        ) : (
                          appointment && appointment.rejectionCount >= 1 ? (
                            '⚠️ Último rechazo'
                          ) : (
                            'Ver detalles'
                          )
                        )}
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-0">
                        <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
                          {actionType === 'cancel' ? (
                            userRole === 'client' ? (
                              appointment && (appointment.clientCancellationCount || 0) >= 1 ? (
                                <>Si cancelas esta cita, el servicio se cancelará definitivamente y se aplicarán las políticas de reembolso correspondientes.</>
                              ) : (
                                <>Si cancelas esta cita, podrás proponer una nueva fecha y hora.</>
                              )
                            ) : (
                              appointment && (appointment.expertCancellationCount || 0) >= 1 ? (
                                <>Si cancelas esta cita, el servicio se cancelará definitivamente y se aplicarán las políticas de reembolso correspondientes.</>
                              ) : (
                                <>Si cancelas esta cita, podrás proponer una nueva fecha y hora.</>
                              )
                            )
                          ) : (
                            appointment && appointment.rejectionCount >= 1 ? (
                              <>Si rechazas esta cita, el servicio se cancelará automáticamente y el cliente recibirá el reembolso completo.</>
                            ) : (
                              <>Si rechazas esta cita, el cliente podrá proponer una nueva fecha y hora.</>
                            )
                          )}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </AlertDescription>
              </Alert>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium">
                    Razón de la {actionType === 'cancel' ? 'cancelación' : 'rechazo'} *
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setReason(e.target.value);
                      setError('');
                    }}
                    placeholder={actionType === 'cancel' 
                      ? "Explica por qué necesitas cancelar esta cita (mínimo 10 caracteres)..."
                      : "Explica por qué no puedes aceptar esta cita (mínimo 10 caracteres)..."
                    }
                    className="min-h-[100px] resize-none"
                    rows={4}
                    disabled={isLoading}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {reason.length}/500 caracteres
                    </span>
                    {error && (
                      <span className="text-xs text-destructive font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
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
          <DrawerFooter className="flex-shrink-0 px-4 sm:px-6 py-4 gap-3">
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
                disabled={isLoading || !reason.trim() || reason.trim().length < 10}
                variant="destructive"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
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
























