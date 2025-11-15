import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle, Loader2, Upload, FileText, Video, X, ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { useDeliverableTypes } from '../../hooks/useDeliverableTypes';
import { CategoryWithDetailsDto } from '../../types/category';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../ui/empty';

// Componente para mostrar imagen de categoría
const CategoryImage: React.FC<{ categoryName: string; size?: 'sm' | 'md' }> = ({ categoryName, size = 'sm' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10'
    };

    // Determinar qué imagen usar según el nombre de la categoría
    const isMotoAgua = categoryName.toLowerCase().includes('moto') && categoryName.toLowerCase().includes('agua');
    const isMoto = categoryName.toLowerCase().includes('moto') && !isMotoAgua;
    const isCoche = categoryName.toLowerCase().includes('coche') || categoryName.toLowerCase().includes('vehículo');
    const isCasa = categoryName.toLowerCase().includes('inmobiliaria') || categoryName.toLowerCase().includes('casa') || categoryName.toLowerCase().includes('inmueble');

    if (isMotoAgua) {
        return (
            <img 
                src={new URL('../../media/motoagua.png', import.meta.url).href}
                alt="Moto de agua"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }
    
    if (isMoto) {
        return (
            <img 
                src={new URL('../../media/motopng.png', import.meta.url).href}
                alt="Moto"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }
    
    if (isCoche) {
        return (
            <img 
                src={new URL('../../media/cochepng.png', import.meta.url).href}
                alt="Coche"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }
    
    if (isCasa) {
        return (
            <img 
                src={new URL('../../media/casapng.png', import.meta.url).href}
                alt="Casa"
                className={`${sizeClasses[size]} object-contain rounded-md`}
            />
        );
    }

    // Fallback: icono por defecto
    return (
        <div className={`${sizeClasses[size]} rounded-md bg-muted flex items-center justify-center`}>
            <FolderTree className="w-4 h-4 text-muted-foreground" />
        </div>
    );
};

interface ServiceFormProps {
    showServiceForm: boolean;
    setShowServiceForm: (value: boolean) => void;
    selectedImages: File[];
    setSelectedImages: (value: File[]) => void;
    formErrors: { [key: string]: string };
    setFormErrors: (value: { [key: string]: string }) => void;
    formData: { categoryId: string; serviceTypeId: string; price: string; conditions: string; durationInHours: string; selectedDeliverableTypes: number[] };
    setFormData: (value: { categoryId: string; serviceTypeId: string; price: string; conditions: string; durationInHours: string; selectedDeliverableTypes: number[] }) => void;
    handleImageSelect: (e: React.ChangeEvent) => void;
    removeImage: (index: number) => void;
    handleCreateService: (e: React.FormEvent) => void;
    serviceTypes: { id: number; name: string }[];
    isLoadingServiceTypes: boolean;
    isCreatingService: boolean;
    categories: CategoryWithDetailsDto[] | undefined;
    editingService?: { id: number; categoryId: number; serviceTypeId: number; price: number; conditions: string; durationInHours: number | null; imageUrls: string[] } | null;
    handleUpdateService?: (e: React.FormEvent) => void;
    isUpdatingService?: boolean;
    existingImages?: string[];
    setExistingImages?: (images: string[]) => void;
}

export function ServiceForm({
    showServiceForm,
    setShowServiceForm,
    selectedImages,
    setSelectedImages,
    formErrors,
    setFormErrors,
    formData,
    setFormData,
    handleImageSelect,
    removeImage,
    handleCreateService,
    serviceTypes,
    isLoadingServiceTypes,
    isCreatingService,
    categories,
    editingService,
    handleUpdateService,
    isUpdatingService,
    existingImages: propExistingImages,
    setExistingImages: propSetExistingImages,
}: ServiceFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { deliverableTypes, isLoading: isLoadingDeliverableTypes, error: deliverableTypesError } = useDeliverableTypes();
    
    // Log adicional para debuggear
    console.log('🔍 ServiceForm render - deliverableTypes:', deliverableTypes);
    console.log('🔍 ServiceForm render - isLoadingDeliverableTypes:', isLoadingDeliverableTypes);
    console.log('🔍 ServiceForm render - deliverableTypesError:', deliverableTypesError);

    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(formData.categoryId ? [formData.categoryId] : []);
    const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<string[]>(formData.serviceTypeId ? [formData.serviceTypeId] : []);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [hasInitializedDeliverableTypes, setHasInitializedDeliverableTypes] = useState(false);
    const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);

    // Actualizar las selecciones cuando cambie formData o editingService
    useEffect(() => {
        if (formData.categoryId) {
            setSelectedCategoryIds([formData.categoryId]);
        } else {
            setSelectedCategoryIds([]);
        }
    }, [formData.categoryId]);

    useEffect(() => {
        if (formData.serviceTypeId) {
            setSelectedServiceTypeIds([formData.serviceTypeId]);
        } else {
            setSelectedServiceTypeIds([]);
        }
    }, [formData.serviceTypeId]);

    // Cargar imágenes existentes cuando se está editando
    useEffect(() => {
        if (editingService && editingService.imageUrls) {
            setExistingImages([...editingService.imageUrls]);
        } else {
            setExistingImages([]);
        }
    }, [editingService]);

    // Inicializar tipos de entregables seleccionados (PDF siempre obligatorio)
    useEffect(() => {
        console.log('🔍 ServiceForm useEffect - deliverableTypes:', deliverableTypes);
        console.log('🔍 ServiceForm useEffect - formData.selectedDeliverableTypes:', formData.selectedDeliverableTypes);
        console.log('🔍 ServiceForm useEffect - editingService:', editingService);
        console.log('🔍 ServiceForm useEffect - deliverableTypes.length:', deliverableTypes.length);
        console.log('🔍 ServiceForm useEffect - formData.selectedDeliverableTypes.length:', formData.selectedDeliverableTypes.length);
        
        if (deliverableTypes.length > 0 && !isLoadingDeliverableTypes) {
            const pdfType = deliverableTypes.find(dt => dt.name === 'PDF');
            console.log('🔍 ServiceForm useEffect - pdfType found:', pdfType);
            
            if (pdfType) {
                // Siempre asegurar que el PDF esté seleccionado
                const currentSelected = formData.selectedDeliverableTypes;
                const hasPdf = currentSelected.includes(pdfType.id);
                
                if (!hasPdf) {
                    console.log('🔍 ServiceForm useEffect - Adding PDF to selected types with ID:', pdfType.id);
                        const newFormData = {
                        ...formData,
                        selectedDeliverableTypes: [...formData.selectedDeliverableTypes, pdfType.id]
                        };
                        console.log('🔍 ServiceForm useEffect - New formData:', newFormData);
                    setFormData(newFormData);
                }
                
                // Solo marcar como inicializado si no estamos editando
                if (!editingService && !hasInitializedDeliverableTypes) {
                    setHasInitializedDeliverableTypes(true);
                }
            }
        }
    }, [deliverableTypes, editingService, isLoadingDeliverableTypes, hasInitializedDeliverableTypes, formData.selectedDeliverableTypes]);

    // Resetear el flag cuando se abre el formulario para crear un nuevo servicio
    useEffect(() => {
        if (showServiceForm && !editingService) {
            setHasInitializedDeliverableTypes(false);
        }
    }, [showServiceForm, editingService]);

    const handleCategorySelect = (id: string) => {
        const newSelected = selectedCategoryIds.includes(id)
            ? selectedCategoryIds.filter(catId => catId !== id)
            : [id];
        setSelectedCategoryIds(newSelected);
        setFormData({ ...formData, categoryId: newSelected[0] || '' });
    };

    const toggleCategoryExpand = (categoryId: number) => {
        setExpandedCategoryIds(prev => 
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Filtrar solo categorías padre
    const parentCategories = categories?.filter(cat => {
        // Calcular isParent si no viene del backend
        const isParent = cat.isParent !== undefined ? cat.isParent : cat.parentId === null;
        return isParent;
    }) || [];

    // Obtener subcategorías de una categoría padre
    const getSubcategories = (parentId: number) => {
        return categories?.filter(cat => cat.parentId === parentId) || [];
    };

    const handleServiceTypeSelect = (id: string) => {
        const newSelected = selectedServiceTypeIds.includes(id)
            ? selectedServiceTypeIds.filter(typeId => typeId !== id)
            : [id];
        setSelectedServiceTypeIds(newSelected);
        setFormData({ ...formData, serviceTypeId: newSelected[0] || '' });
    };

    const removeExistingImage = (index: number) => {
        const currentImages = propExistingImages || existingImages;
        const newImages = currentImages.filter((_, i) => i !== index);
        if (propSetExistingImages) {
            propSetExistingImages(newImages);
        } else {
            setExistingImages(newImages);
        }
    };

    const handleDeliverableTypeSelect = (deliverableTypeId: number) => {
        console.log('🔍 handleDeliverableTypeSelect called with:', deliverableTypeId);
        console.log('🔍 Current formData.selectedDeliverableTypes:', formData.selectedDeliverableTypes);
        
        const deliverableType = deliverableTypes.find(dt => dt.id === deliverableTypeId);
        console.log('🔍 Found deliverableType:', deliverableType);
        
        if (!deliverableType) return;

        // Si es PDF, no permitir deseleccionar (siempre obligatorio)
        if (deliverableType.name === 'PDF') {
            console.log('🔍 PDF is always required, cannot deselect');
            return;
        }

        const newSelected = formData.selectedDeliverableTypes.includes(deliverableTypeId)
            ? formData.selectedDeliverableTypes.filter(id => id !== deliverableTypeId)
            : [...formData.selectedDeliverableTypes, deliverableTypeId];

        console.log('🔍 New selected deliverable types:', newSelected);
        setFormData({ ...formData, selectedDeliverableTypes: newSelected });
    };

    const getCurrentExistingImages = () => {
        return propExistingImages || existingImages;
    };

    const getTotalImagesCount = () => {
        return getCurrentExistingImages().length + selectedImages.length;
    };

    // Función para renderizar el contenido del formulario (reutilizable)
    const renderFormContent = () => (
        <>
            <div>
                <div className="space-y-6">
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Categorías</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {parentCategories.map(parentCategory => {
                                const subcategories = getSubcategories(parentCategory.id);
                                const hasSubcategories = subcategories.length > 0;
                                const isExpanded = expandedCategoryIds.includes(parentCategory.id);
                                const isSelected = selectedCategoryIds.includes(parentCategory.id.toString());
                                
                                return (
                                    <div key={parentCategory.id} className="space-y-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleCategorySelect(parentCategory.id.toString())}
                                            className={`w-full relative border rounded-md transition-all text-left overflow-hidden ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                                    : 'border-border hover:border-primary/50 bg-background'
                                            }`}
                                        >
                                            <div className="flex flex-col items-center gap-1.5 p-2.5">
                                                <CategoryImage categoryName={parentCategory.name} size="sm" />
                                                <span className={`text-xs font-medium text-center leading-tight ${
                                                    isSelected ? 'text-primary' : 'text-foreground'
                                                }`}>
                                                    {parentCategory.name}
                                                </span>
                                                {isSelected && (
                                                    <CheckCircle className="w-3.5 h-3.5 text-primary absolute top-1.5 right-1.5" />
                                                )}
                                            </div>
                                        </button>
                                        {hasSubcategories && (
                                            <button
                                                type="button"
                                                onClick={() => toggleCategoryExpand(parentCategory.id)}
                                                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 py-0.5"
                                            >
                                                {isExpanded ? (
                                                    <>
                                                        <ChevronDown className="w-3 h-3" />
                                                        <span>Ocultar</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronRight className="w-3 h-3" />
                                                        <span>{subcategories.length} subcategoría{subcategories.length !== 1 ? 's' : ''}</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {isExpanded && hasSubcategories && (
                                            <div className="space-y-1.5 pt-1">
                                                {subcategories.map(subcategory => {
                                                    const isSubSelected = selectedCategoryIds.includes(subcategory.id.toString());
                                                    return (
                                                        <button
                                                            key={subcategory.id}
                                                            type="button"
                                                            onClick={() => handleCategorySelect(subcategory.id.toString())}
                                                            className={`w-full relative border rounded-md transition-all text-left overflow-hidden ${
                                                                isSubSelected
                                                                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                                                    : 'border-border hover:border-primary/50 bg-background'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col items-center gap-1 p-2">
                                                                <CategoryImage categoryName={subcategory.name} size="sm" />
                                                                <span className={`text-xs font-medium text-center leading-tight ${
                                                                    isSubSelected ? 'text-primary' : 'text-foreground'
                                                                }`}>
                                                                    {subcategory.name}
                                                                </span>
                                                                {isSubSelected && (
                                                                    <CheckCircle className="w-3 h-3 text-primary absolute top-1 right-1" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {formErrors.categoryId && (
                            <p className="mt-2 text-sm text-destructive">{formErrors.categoryId}</p>
                        )}
                    </div>

                    <div>
                        <Label className="text-sm font-medium mb-3 block">Tipo de Servicio</Label>
                        <div className="flex flex-wrap gap-2">
                            {isLoadingServiceTypes ? (
                                <span className="text-sm text-muted-foreground">Cargando...</span>
                            ) : Array.isArray(serviceTypes) ? (
                                serviceTypes.map(serviceType => (
                                    <Button
                                        key={serviceType.id}
                                        type="button"
                                        variant={selectedServiceTypeIds.includes(serviceType.id.toString()) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleServiceTypeSelect(serviceType.id.toString())}
                                        className={selectedServiceTypeIds.includes(serviceType.id.toString())
                                            ? ''
                                            : 'hover:bg-accent'
                                        }
                                    >
                                        {serviceType.name}
                                    </Button>
                                ))
                            ) : (
                                <span className="text-sm text-destructive">Error al cargar tipos de servicio</span>
                            )}
                        </div>
                        {formErrors.serviceTypeId && (
                            <p className="mt-2 text-sm text-destructive">{formErrors.serviceTypeId}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Precio (€)</Label>
                            <input
                                id="price"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                    formErrors.price ? 'border-destructive' : ''
                                }`}
                                placeholder="0.00"
                                step="0.01"
                                required
                            />
                            {formErrors.price && <p className="text-sm text-destructive">{formErrors.price}</p>}
                        </div>
                        {parseInt(formData.serviceTypeId) === 1 && (
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duración (horas)</Label>
                                <input
                                    id="duration"
                                    type="number"
                                    value={formData.durationInHours}
                                    onChange={(e) => setFormData({ ...formData, durationInHours: e.target.value })}
                                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                        formErrors.durationInHours ? 'border-destructive' : ''
                                    }`}
                                    min="1"
                                    required
                                />
                                {formErrors.durationInHours && (
                                    <p className="text-sm text-destructive">{formErrors.durationInHours}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="conditions">Condiciones</Label>
                        <textarea
                            id="conditions"
                            value={formData.conditions}
                            onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                            className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y ${
                                formErrors.conditions ? 'border-destructive' : ''
                            }`}
                            rows={4}
                            placeholder="Describe las condiciones de tu servicio..."
                            required
                        />
                        {formErrors.conditions && (
                            <p className="text-sm text-destructive">{formErrors.conditions}</p>
                        )}
                    </div>

                    {formErrors.general && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm border border-destructive/20">
                            {formErrors.general}
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-6 lg:border-l lg:border-border lg:pl-6">
                <div className="space-y-2">
                    <Label>Imágenes</Label>
                    <div
                        className="cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Empty className="py-8">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </EmptyMedia>
                                <EmptyTitle>Haz clic para subir imágenes</EmptyTitle>
                                <EmptyDescription>PNG o JPG (máx. 5MB)</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                        <input
                            id="image-input"
                            type="file"
                            accept="image/jpeg,image/png"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                            ref={fileInputRef}
                        />
                    </div>
                    {formErrors.images && (
                        <p className="text-sm text-destructive">{formErrors.images}</p>
                    )}
                    
                    {/* Sistema unificado de imágenes */}
                    {(getCurrentExistingImages().length > 0 || selectedImages.length > 0) && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-muted-foreground">
                                Imágenes del servicio ({getTotalImagesCount()})
                            </p>
                            {/* Mensaje informativo cuando hay cambios */}
                            {(getCurrentExistingImages().length !== (editingService?.imageUrls?.length || 0) || selectedImages.length > 0) && editingService && (
                                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                                    <div className="flex items-start gap-2">
                                        <div className="text-amber-600 dark:text-amber-400 mt-0.5">⚠️</div>
                                        <div className="text-sm text-amber-800 dark:text-amber-200">
                                            <p className="font-medium mb-1">Cambios en las imágenes:</p>
                                            {selectedImages.length > 0 ? (
                                                <p>Las nuevas imágenes reemplazarán todas las existentes.</p>
                                            ) : (
                                                <p>Se eliminarán las imágenes seleccionadas.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-3">
                                {/* Imágenes existentes */}
                                {getCurrentExistingImages().map((imageUrl, index) => (
                                    <div key={`existing-${index}`} className="relative group">
                                        <img
                                            src={imageUrl}
                                            alt={`Imagen ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-md border border-border shadow-sm group-hover:shadow-md transition-shadow"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => removeExistingImage(index)}
                                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                        <div className="absolute bottom-1 left-1 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                            Actual
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Imágenes nuevas */}
                                {selectedImages.map((image, index) => (
                                    <div key={`new-${index}`} className="relative group">
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt={`Nueva imagen ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-md border border-border shadow-sm group-hover:shadow-md transition-shadow"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                        <div className="absolute bottom-1 left-1 bg-emerald-500/90 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                                            Nueva
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="col-span-1 lg:col-span-2 space-y-6">
                <div>
                    <Label className="text-sm font-medium mb-3 block">
                        Tipos de Informes a Entregar
                    </Label>
                    {isLoadingDeliverableTypes ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Cargando tipos de entregables...
                        </div>
                    ) : deliverableTypesError ? (
                        <div className="text-sm text-destructive">
                            Error cargando tipos de entregables: {deliverableTypesError.message}
                        </div>
                    ) : deliverableTypes && deliverableTypes.length > 0 ? (
                        <div className="space-y-2">
                            {deliverableTypes.map((deliverableType) => {
                                const isSelected = formData.selectedDeliverableTypes.includes(deliverableType.id);
                                const isPdf = deliverableType.name === 'PDF';
                                const isRequired = deliverableType.isRequired || isPdf;
                                
                                return (
                                    <div
                                        key={deliverableType.id}
                                        className={`flex items-start gap-3 p-3 rounded-md border transition-all ${
                                            isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border bg-muted/30 hover:bg-muted/50'
                                        } ${isPdf ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                                        onClick={() => !isPdf && handleDeliverableTypeSelect(deliverableType.id)}
                                    >
                                        <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
                                            isSelected
                                                ? isPdf 
                                                    ? 'border-destructive bg-destructive'
                                                    : 'border-primary bg-primary'
                                                : 'border-muted-foreground/25'
                                        }`}>
                                            {isSelected && (
                                                <CheckCircle className="w-3 h-3 text-primary-foreground" />
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2">
                                                {isPdf ? (
                                                    <FileText className="w-4 h-4 text-destructive" />
                                                ) : (
                                                    <Video className="w-4 h-4 text-primary" />
                                                )}
                                                <span className="text-sm font-medium">
                                                    {deliverableType.displayName}
                                                </span>
                                                {isPdf && (
                                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                                                        Siempre Incluido
                                                    </Badge>
                                                )}
                                                {!isPdf && isRequired && (
                                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                                                        Obligatorio
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {isPdf ? 'El informe en PDF siempre se incluye en todos los servicios' : deliverableType.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            No se encontraron tipos de entregables disponibles
                        </div>
                    )}
                    {formErrors.selectedDeliverableTypes && (
                        <p className="mt-2 text-sm text-destructive">{formErrors.selectedDeliverableTypes}</p>
                    )}
                </div>
            </div>
        </>
    );

    // Prevenir scroll del body cuando el drawer está abierto
    useEffect(() => {
        if (showServiceForm) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showServiceForm]);

    // Usar Drawer en ambos casos, como en el ejemplo de shadcn/ui

    return (
        <>
        <Drawer 
            open={showServiceForm} 
            onOpenChange={setShowServiceForm}
        >
            <DrawerContent className="max-h-[96vh] flex flex-col h-[96vh]">
                <div className="mx-auto w-full max-w-7xl flex flex-col h-full max-h-[96vh]">
                    <DrawerHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <DrawerTitle className="text-lg sm:text-xl font-semibold">
                                {editingService ? 'Editar Servicio' : 'Nuevo Servicio de Búsqueda'}
                            </DrawerTitle>
                            <DrawerClose asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </DrawerClose>
                        </div>
                    </DrawerHeader>
                    {/* Contenido scrollable */}
                    <div className="px-4 sm:px-6 py-4 sm:py-6 flex-1 min-h-0 overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                            {renderFormContent()}
                        </div>
                    </div>

                    <Separator className="flex-shrink-0" />

                    {/* Botones de acción - Fijos en la parte inferior */}
                    <div className="px-4 sm:px-6 pt-3 pb-4 sm:py-4 bg-background border-t border-border flex-shrink-0 flex flex-row justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowServiceForm(false);
                                setSelectedImages([]);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                            className="flex-1 md:flex-none md:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                if (editingService) {
                                    handleUpdateService?.(e as any);
                                } else {
                                    handleCreateService(e as any);
                                }
                            }}
                            disabled={(editingService ? isUpdatingService : isCreatingService) || isLoadingServiceTypes}
                            className="flex-1 md:flex-none md:w-auto"
                        >
                            {(editingService ? isUpdatingService : isCreatingService) ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {editingService ? 'Actualizando...' : 'Creando...'}
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {editingService ? 'Actualizar Servicio' : 'Crear Servicio'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
        </>
    );
}
