import { useState, useRef } from 'react';
import { Star, Trash2, X, Send, Upload, AlertTriangle, AlertCircle } from 'lucide-react';
import { useReview } from '../hooks/useReview.hooks';
import { useExpertReport } from '../hooks/useExpertReport';
import { showToast, NotificationType } from '../lib/toast';
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

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchHireId: number | undefined;
    reviewForm: { score: number; description: string; images: File[] };
    setReviewForm: React.Dispatch<React.SetStateAction<{ score: number; description: string; images: File[] }>>;
    onSubmit: () => void;
}

export function ReviewModal({ isOpen, onClose, searchHireId, reviewForm, setReviewForm, onSubmit }: ReviewModalProps) {
    const { createReview, isCreatingReview } = useReview();

    const addNotification = (type: NotificationType, message: string, duration?: number) => {
        showToast(type, message, duration);
    };

    const handleSubmit = async () => {
        if (!searchHireId) {
            addNotification('error', '❌ SearchHire ID not found');
            return;
        }
        if (reviewForm.score < 1 || reviewForm.score > 5) {
            addNotification('error', '❌ Score must be between 1 and 5');
            return;
        }
        if (!reviewForm.description.trim()) {
            addNotification('error', '❌ Please provide a review description');
            return;
        }
        try {
            await createReview({
                searchHireId,
                score: reviewForm.score,
                description: reviewForm.description,
                images: reviewForm.images,
            });
            addNotification('success', '✅ Review submitted successfully');
            onClose();
            onSubmit();
        } catch (error) {
            console.error('Error submitting review:', error);
            addNotification('error', '❌ Error submitting review');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).filter((file) => file instanceof File);
            console.log('Selected files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
            setReviewForm((prev) => ({
                ...prev,
                images: [...prev.images, ...files],
            }));
        }
    };

    const removeImage = (index: number) => {
        setReviewForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="max-h-[96dvh] flex flex-col border-t-4 border-destructive">
                <div className="mx-auto w-full max-w-md flex flex-col h-full max-h-[96dvh]">
                    <DrawerHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                                <Star className="w-5 h-5 text-white" fill="currentColor" />
                            </div>
                            <div className="flex-1">
                                <DrawerTitle className="text-lg sm:text-xl font-semibold">Enviar Reseña</DrawerTitle>
                                <DrawerDescription className="text-sm">Comparte tu experiencia</DrawerDescription>
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
                            <div>
                                <Label className="text-sm font-semibold mb-3 block">Calificación</Label>
                                <div className="flex gap-1 justify-center p-4 bg-muted rounded-xl">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Button
                                            key={star}
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setReviewForm((prev) => ({ ...prev, score: star }))}
                                            className={`h-12 w-12 rounded-full transition-all duration-200 transform hover:scale-110 ${
                                                reviewForm.score >= star 
                                                    ? 'text-yellow-500 bg-yellow-50 shadow-md' 
                                                    : 'text-muted-foreground hover:text-yellow-400 hover:bg-yellow-50'
                                            }`}
                                        >
                                            <Star className="w-7 h-7" fill={reviewForm.score >= star ? "currentColor" : "none"} />
                                        </Button>
                                    ))}
                                </div>
                                {reviewForm.score > 0 && (
                                    <p className="text-center text-sm text-muted-foreground mt-2">
                                        {reviewForm.score === 5 ? '¡Excelente!' : 
                                         reviewForm.score === 4 ? 'Muy bueno' :
                                         reviewForm.score === 3 ? 'Bueno' :
                                         reviewForm.score === 2 ? 'Regular' : 'Necesita mejorar'}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm font-semibold mb-3 block">Descripción</Label>
                                <textarea
                                    value={reviewForm.description}
                                    onChange={(e) => setReviewForm((prev) => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200 bg-background resize-none"
                                    rows={4}
                                    placeholder="Comparte tu experiencia con este servicio..."
                                    required
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-semibold mb-3 block">Imágenes (Opcional)</Label>
                                <div className="space-y-3">
                                    {reviewForm.images.filter((image) => image instanceof File).map((image, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-foreground truncate block">{image.name}</span>
                                                <span className="text-xs text-muted-foreground">{(image.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeImage(index)}
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <label className="block">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <div className="w-full px-4 py-6 border-2 border-dashed border-input rounded-xl text-center hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer">
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload className="w-8 h-8 text-muted-foreground" />
                                                <span className="text-sm font-medium text-foreground">Agregar imágenes</span>
                                                <span className="text-xs text-muted-foreground">PNG, JPG hasta 5MB</span>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="flex-shrink-0" />

                    {/* Footer con botones */}
                    <DrawerFooter className="flex-shrink-0">
                        <div className="flex gap-3 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isCreatingReview || reviewForm.score === 0}
                                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                            >
                                {isCreatingReview ? 'Enviando...' : 'Enviar Reseña'}
                            </Button>
                        </div>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

interface DisputeModalProps {
    isOpen: boolean;
    onClose: () => void;
    disputeReason: string;
    setDisputeReason: (value: string) => void;
    files: File[];
    setFiles: (files: File[]) => void;
    onSubmit: () => void;
    isSubmitting?: boolean;
}

export function DisputeModal({ 
    isOpen, 
    onClose, 
    disputeReason, 
    setDisputeReason, 
    files, 
    setFiles, 
    onSubmit, 
    isSubmitting = false 
}: DisputeModalProps) {
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validar archivos
    const validateFile = (file: File): string | null => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4', 'video/avi', 'video/quicktime'
        ];

        if (file.size > maxSize) {
            return `El archivo ${file.name} es demasiado grande. Máximo 10MB.`;
        }

        if (!allowedTypes.includes(file.type)) {
            return `El archivo ${file.name} no es de un tipo permitido.`;
        }

        return null;
    };

    const handleFileSelect = (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        const newFiles: File[] = [];
        const errors: string[] = [];

        Array.from(selectedFiles).forEach(file => {
            const error = validateFile(file);
            if (error) {
                errors.push(error);
            } else {
                newFiles.push(file);
            }
        });

        if (errors.length > 0) {
            alert(errors.join('\n'));
        }

        if (newFiles.length > 0) {
            setFiles([...files, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) {
            return '🖼️';
        } else if (file.type.startsWith('video/')) {
            return '🎥';
        } else if (file.type === 'application/pdf') {
            return '📄';
        } else if (file.type.includes('word')) {
            return '📝';
        } else {
            return '📎';
        }
    };

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="max-h-[96dvh] flex flex-col border-t-4 border-destructive">
                <div className="mx-auto w-full max-w-md flex flex-col h-full max-h-[96dvh] bg-background">
                    {/* Header minimalista */}
                    <DrawerHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-border flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DrawerTitle className="text-lg sm:text-xl font-semibold text-foreground">
                                    Iniciar Disputa
                                </DrawerTitle>
                                <DrawerDescription className="text-sm text-muted-foreground">
                                    Reporta un problema con evidencia
                                </DrawerDescription>
                            </div>
                            <DrawerClose asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    disabled={isSubmitting}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </DrawerClose>
                        </div>
                    </DrawerHeader>

                    {/* Contenido scrollable */}
                    <div className="px-4 sm:px-6 py-5 sm:py-6 flex-1 min-h-0 overflow-y-auto">
                        <div className="space-y-5">
                            {/* Alerta importante minimalista */}
                            <div className="p-3 bg-muted/50 border border-border rounded-lg">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    <span className="font-medium text-foreground">Importante:</span> Una disputa iniciará un proceso de mediación. Por favor, explica claramente el problema y adjunta evidencia para una resolución rápida.
                                </p>
                            </div>
                
                            {/* Campo de motivo */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">
                                    Motivo de la disputa <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <textarea
                                        value={disputeReason}
                                        onChange={(e) => setDisputeReason(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-destructive transition-colors bg-background resize-none text-sm"
                                        rows={5}
                                        placeholder="Describe detalladamente el problema que has experimentado con este servicio..."
                                        required
                                        disabled={isSubmitting}
                                        maxLength={1000}
                                    />
                                    <div className="absolute bottom-2 right-2">
                                        <span className={`text-xs ${disputeReason.length > 900 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                            {disputeReason.length}/1000
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* File Upload Section */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">
                                    Archivos de evidencia <span className="text-muted-foreground font-normal">(opcional)</span>
                                </Label>
                                
                                {/* Drop Zone */}
                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                        dragActive 
                                            ? 'border-destructive bg-destructive/5' 
                                            : 'border-input hover:border-primary/50'
                                    }`}
                                    onDragEnter={(e) => {
                                        e.preventDefault();
                                        setDragActive(true);
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        setDragActive(false);
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragActive(false);
                                        handleFileSelect(e.dataTransfer.files);
                                    }}
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                            <Upload className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-foreground">
                                                Arrastra archivos aquí o{' '}
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isSubmitting}
                                                    className="h-auto p-0 text-primary"
                                                >
                                                    selecciona archivos
                                                </Button>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                JPG, PNG, GIF, PDF, DOC, DOCX, MP4, AVI, MOV • Máximo 10MB por archivo
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.mp4,.avi,.mov"
                                    onChange={(e) => handleFileSelect(e.target.files)}
                                    className="hidden"
                                    disabled={isSubmitting}
                                />

                                {/* File List */}
                                {files.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <h4 className="text-xs font-medium text-muted-foreground">Archivos seleccionados ({files.length})</h4>
                                        <div className="space-y-1.5">
                                            {files.map((file, index) => (
                                                <div 
                                                    key={index} 
                                                    className="flex items-center justify-between p-2.5 bg-muted/50 border border-border rounded-lg"
                                                >
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <span className="text-base">{getFileIcon(file)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-foreground truncate">
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatFileSize(file.size)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeFile(index)}
                                                        disabled={isSubmitting}
                                                        className="h-7 w-7"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="flex-shrink-0" />

                    {/* Footer con botones */}
                    <DrawerFooter className="px-4 sm:px-6 py-4 flex-shrink-0">
                        <div className="flex gap-3 w-full">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={onSubmit}
                                disabled={!disputeReason.trim() || isSubmitting}
                                variant="destructive"
                                className="flex-1"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar Disputa'
                                )}
                            </Button>
                        </div>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

interface ResolveDisputeModalProps {
    isOpen: boolean;
    onClose: () => void;
    resolveInFavorOfClient: boolean | null;
    setResolveInFavorOfClient: (value: boolean | null) => void;
    resolutionReason: string;
    setResolutionReason: (value: string) => void;
    onSubmit: () => void;
}

export function ResolveDisputeModal({
    isOpen,
    onClose,
    resolveInFavorOfClient,
    setResolveInFavorOfClient,
    resolutionReason,
    setResolutionReason,
    onSubmit,
}: ResolveDisputeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90dvh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolver Disputa</h3>
                <p className="text-gray-600 mb-4">
                    Seleccione a quién dar la razón y proporcione una razón para la resolución.
                </p>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dar razón a:</label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setResolveInFavorOfClient(false)}
                            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${resolveInFavorOfClient === false
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Experto
                        </button>
                        <button
                            onClick={() => setResolveInFavorOfClient(true)}
                            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${resolveInFavorOfClient === true
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Cliente
                        </button>
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón de la Resolución</label>
                    <textarea
                        value={resolutionReason}
                        onChange={(e) => setResolutionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Explique la razón de la resolución..."
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Resolver Disputa
                    </button>
                </div>
            </div>
        </div>
    );
}

interface AddAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    newAd: {
        title: string;
        description: string;
        price: number;
        url: string;
        images: string[];
        category: string;
        province: string;
        city: string;
        sellerType: string;
        platformId: number;
    };
    setNewAd: React.Dispatch<React.SetStateAction<{
        title: string;
        description: string;
        price: number;
        url: string;
        images: string[];
        category: string;
        province: string;
        city: string;
        sellerType: string;
        platformId: number;
    }>>;
    categories: { id: number; name: string }[] | undefined;
    onSubmit: () => void;
}

export function AddAdModal({ isOpen, onClose, newAd, setNewAd, categories, onSubmit }: AddAdModalProps) {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90dvh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Add Manual Ad</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={newAd.title}
                            onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={newAd.description}
                            onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                            <input
                                type="number"
                                value={newAd.price}
                                onChange={(e) => setNewAd({ ...newAd, price: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                            <input
                                type="url"
                                value={newAd.url}
                                onChange={(e) => setNewAd({ ...newAd, url: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">Image URLs</label>
                            <button
                                type="button"
                                onClick={() => setNewAd((prev) => ({ ...prev, images: [...prev.images, ''] }))}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                + Add Image
                            </button>
                        </div>
                        <div className="space-y-2">
                            {newAd.images.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) =>
                                            setNewAd((prev) => ({
                                                ...prev,
                                                images: prev.images.map((u, i) => (i === index ? e.target.value : u)),
                                            }))
                                        }
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter image URL"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNewAd((prev) => ({
                                                ...prev,
                                                images: prev.images.filter((_, i) => i !== index),
                                            }))
                                        }
                                        className="p-2 text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {newAd.images.length === 0 && (
                                <button
                                    type="button"
                                    onClick={() => setNewAd((prev) => ({ ...prev, images: [...prev.images, ''] }))}
                                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                                >
                                    Click to add an image URL
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={newAd.category}
                                onChange={(e) => setNewAd({ ...newAd, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                {categories?.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                            <input
                                type="text"
                                value={newAd.province}
                                onChange={(e) => setNewAd({ ...newAd, province: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                            type="text"
                            value={newAd.city}
                            onChange={(e) => setNewAd({ ...newAd, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seller Type</label>
                        <select
                            value={newAd.sellerType}
                            onChange={(e) => setNewAd({ ...newAd, sellerType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="particular">Particular</option>
                            <option value="professional">Professional</option>
                            <option value="dealer">Dealer</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Add Ad
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface CancelServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function CancelServiceModal({ isOpen, onClose, onConfirm }: CancelServiceModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300 max-h-[90dvh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Cancelar Servicio</h3>
                            <p className="text-sm text-gray-500">Acción irreversible</p>
                        </div>
                    </div>
                </div>
                
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-amber-800 mb-1">¿Estás seguro?</p>
                            <p className="text-sm text-amber-700">
                                Esta acción cancelará permanentemente el servicio. No se puede deshacer y puede afectar tu reputación.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors duration-200"
                    >
                        Mantener Servicio
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Confirmar Cancelación
                    </button>
                </div>
            </div>
        </div>
    );
}

interface FinalizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFinalize: (favorExpert: boolean) => void;
}

export function FinalizeModal({ isOpen, onClose, onFinalize }: FinalizeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90dvh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Finalizar Búsqueda</h3>
                <p className="text-gray-600 mb-6">
                    ¿A quién deseas dar la razón al finalizar esta búsqueda?
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => onFinalize(true)}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Dar razón al Experto
                    </button>
                    <button
                        onClick={() => onFinalize(false)}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Dar razón al Cliente
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

// Modal para enviar reporte del experto
interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    onSuccess: () => void;
    setNotifications: React.Dispatch<React.SetStateAction<{ id: string; type: NotificationType; message: string; duration?: number }[]>>;
}

export function ReportModal({ isOpen, onClose, appointment, onSuccess, setNotifications }: ReportModalProps) {
    const { submitExpertReport, isSubmitting } = useExpertReport();

    const handleSubmit = async () => {
        if (!appointment) {
            setNotifications(prev => [...prev, {
                id: Math.random().toString(36).substring(2, 9),
                type: 'error',
                message: 'No se encontró la cita'
            }]);
            return;
        }

        try {
            const result = await submitExpertReport(appointment.id, '');
            console.log('📊 Reporte enviado, resultado:', result);
            console.log('📊 Estado después del reporte:', result.status);
            
            setNotifications(prev => [...prev, {
                id: Math.random().toString(36).substring(2, 9),
                type: 'success',
                message: 'Reporte enviado exitosamente'
            }]);
            
            // Llamar onSuccess antes de cerrar para que se actualice la UI
            onSuccess();
            onClose();
        } catch (error: any) {
            setNotifications(prev => [...prev, {
                id: Math.random().toString(36).substring(2, 9),
                type: 'error',
                message: error.message || 'Error al enviar el reporte'
            }]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90dvh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Enviar Reporte del Experto
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <div>
                                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                                        Confirmar envío del reporte
                                    </h4>
                                    <p className="text-sm text-blue-700 mb-2">
                                        Al enviar el reporte, confirmas que has completado el trabajo y que todos los archivos requeridos están subidos.
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        💡 Una vez enviado, el cliente tendrá 24 horas para aprobar o rechazar el trabajo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Enviando...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Enviar Reporte</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}