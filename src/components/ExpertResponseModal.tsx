import { useState } from 'react';
import { MessageCircle, Upload, X, AlertTriangle, User, Calendar, FileText } from 'lucide-react';
import { DisputeDto } from '../types/searchDetails';
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

interface ExpertResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (response: string, files: File[]) => void;
  isSubmitting?: boolean;
  dispute?: DisputeDto;
}

export function ExpertResponseModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting = false,
  dispute
}: ExpertResponseModalProps) {
  const [responseText, setResponseText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!responseText.trim()) return;
    
    onSubmit(responseText, selectedFiles);
    
    // Limpiar el formulario
    setResponseText('');
    setSelectedFiles([]);
  };

  const handleClose = () => {
    setResponseText('');
    setSelectedFiles([]);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[96dvh] flex flex-col border-t-4 border-destructive">
        <div className="mx-auto w-full max-w-lg flex flex-col h-full max-h-[96dvh]">
          <DrawerHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <DrawerTitle className="text-lg sm:text-xl font-semibold">Responder Disputa</DrawerTitle>
                <DrawerDescription className="text-sm">Proporciona tu respuesta a la disputa</DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Contenido scrollable */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 flex-1 min-h-0 overflow-y-auto">

            <div className="space-y-6">
              {/* Dispute Information */}
              {dispute && (
                <div className="space-y-4">
                  {/* Dispute Header */}
                  <Card className="p-4 bg-destructive/10 border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <h4 className="font-semibold text-destructive-foreground">Información de la Disputa</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground font-medium">ID:</span>
                        <span className="text-foreground ml-1">#{dispute.id}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Estado:</span>
                        <span className="text-foreground ml-1">{dispute.status}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">SearchHire ID:</span>
                        <span className="text-foreground ml-1">#{dispute.searchHireId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Fecha:</span>
                        <span className="text-foreground ml-1">
                          {new Date(dispute.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Dispute Reason */}
                  <Card className="p-4 bg-muted">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-semibold text-foreground">Motivo de la Disputa</h4>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{dispute.reason}</p>
                  </Card>

                  {/* Search Information */}
                  <Card className="p-4 bg-primary/10 border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-primary-foreground">Detalles del Servicio</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground font-medium">SearchHire ID:</span>
                        <span className="text-foreground ml-1">#{dispute.searchHireId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Reporter ID:</span>
                        <span className="text-foreground ml-1">#{dispute.reporterId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Estado:</span>
                        <span className="text-foreground ml-1">{dispute.status}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                {/* Response Text */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Tu respuesta a la disputa
                  </Label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary resize-none bg-background"
                    rows={4}
                    placeholder="Explica tu punto de vista sobre la disputa y proporciona evidencia si es necesario..."
                    disabled={isSubmitting}
                  />
                </div>

                {/* File Upload */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Archivos de soporte (opcional)
                  </Label>
                  <div className="border-2 border-dashed border-input rounded-lg p-4 hover:border-primary transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer hover:bg-muted rounded-lg p-4 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-foreground">
                        Haz clic para subir archivos o arrastra aquí
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        PDF, imágenes, documentos
                      </span>
                    </label>
                  </div>

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {file.name.split('.').pop()?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="w-6 h-6 rounded-full bg-destructive/10 hover:bg-destructive/20"
                            disabled={isSubmitting}
                          >
                            <X className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="flex-shrink-0" />

          {/* Footer con botones */}
          <DrawerFooter className="flex-shrink-0">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!responseText.trim() || isSubmitting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar Respuesta
                  </>
                )}
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
