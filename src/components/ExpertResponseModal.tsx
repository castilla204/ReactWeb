import { useState } from 'react';
import { MessageCircle, Upload, X, AlertTriangle, User, Calendar, FileText } from 'lucide-react';
import { NotificationType } from './Notification';
import { DisputeDto } from '../types/searchDetails';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Responder Disputa</h3>
              <p className="text-sm text-gray-500">Proporciona tu respuesta a la disputa</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Dispute Information */}
        {dispute && (
          <div className="mb-6 space-y-4">
            {/* Dispute Header */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-red-900">Información de la Disputa</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-red-700 font-medium">ID:</span>
                  <span className="text-red-800 ml-1">#{dispute.id}</span>
                </div>
                <div>
                  <span className="text-red-700 font-medium">Estado:</span>
                  <span className="text-red-800 ml-1">{dispute.status}</span>
                </div>
                <div>
                  <span className="text-red-700 font-medium">SearchHire ID:</span>
                  <span className="text-red-800 ml-1">#{dispute.searchHireId}</span>
                </div>
                <div>
                  <span className="text-red-700 font-medium">Fecha:</span>
                  <span className="text-red-800 ml-1">
                    {new Date(dispute.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>

            {/* Dispute Reason */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Motivo de la Disputa</h4>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{dispute.reason}</p>
            </div>

            {/* Search Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Detalles del Servicio</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">SearchHire ID:</span>
                  <span className="text-blue-800 ml-1">#{dispute.searchHireId}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Reporter ID:</span>
                  <span className="text-blue-800 ml-1">#{dispute.reporterId}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Estado:</span>
                  <span className="text-blue-800 ml-1">{dispute.status}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Response Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu respuesta a la disputa
            </label>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              rows={4}
              placeholder="Explica tu punto de vista sobre la disputa y proporciona evidencia si es necesario..."
              disabled={isSubmitting}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivos de soporte (opcional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 rounded-lg p-4 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Haz clic para subir archivos o arrastra aquí
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PDF, imágenes, documentos
                </span>
              </label>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                      disabled={isSubmitting}
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!responseText.trim() || isSubmitting}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              !responseText.trim() || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                Enviar Respuesta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
