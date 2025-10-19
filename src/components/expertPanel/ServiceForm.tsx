import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle, Loader2, XCircle, Upload, FileText, Video } from 'lucide-react';
import { useDeliverableTypes } from '../../hooks/useDeliverableTypes';
import { DeliverableType } from '../../types/deliverable';

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
    categories: { id: number; name: string }[] | undefined;
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
                    setFormData(prev => {
                        console.log('🔍 ServiceForm useEffect - Previous formData:', prev);
                        const newFormData = {
                            ...prev,
                            selectedDeliverableTypes: [...prev.selectedDeliverableTypes, pdfType.id]
                        };
                        console.log('🔍 ServiceForm useEffect - New formData:', newFormData);
                        return newFormData;
                    });
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

    if (!showServiceForm) return null;

    const handleCategorySelect = (id: string) => {
        const newSelected = selectedCategoryIds.includes(id)
            ? selectedCategoryIds.filter(catId => catId !== id)
            : [id];
        setSelectedCategoryIds(newSelected);
        setFormData({ ...formData, categoryId: newSelected[0] || '' });
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

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 pt-12 sm:pt-4">
            <div className="bg-white rounded-xl pt-6 px-4 pb-4 sm:p-6 lg:p-8 max-w-4xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 ease-in-out grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-0">
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 border-b pb-2">
                        {editingService ? 'Editar Servicio' : 'Nuevo Servicio de Búsqueda'}
                    </h3>
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <label className="block text-xs font-normal text-gray-500 mb-2">Categorías</label>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                                {categories?.map(category => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => handleCategorySelect(category.id.toString())}
                                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${selectedCategoryIds.includes(category.id.toString())
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                            {formErrors.categoryId && (
                                <p className="mt-1 text-xs text-red-500">{formErrors.categoryId}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-normal text-gray-500 mb-2">Tipo de Servicio</label>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                                {isLoadingServiceTypes ? (
                                    <span className="text-sm text-gray-500">Cargando...</span>
                                ) : Array.isArray(serviceTypes) ? (
                                    serviceTypes.map(serviceType => (
                                        <button
                                            key={serviceType.id}
                                            type="button"
                                            onClick={() => handleServiceTypeSelect(serviceType.id.toString())}
                                            className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${selectedServiceTypeIds.includes(serviceType.id.toString())
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                        >
                                            {serviceType.name}
                                        </button>
                                    ))
                                ) : (
                                    <span className="text-sm text-red-500">Error al cargar tipos de servicio</span>
                                )}
                            </div>
                            {formErrors.serviceTypeId && (
                                <p className="mt-1 text-xs text-red-500">{formErrors.serviceTypeId}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs font-normal text-gray-500 mb-2">Precio (€)</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-400 focus:outline-none transition-colors ${formErrors.price ? 'border-red-300' : 'border-gray-200 bg-gray-50/50'
                                        }`}
                                    placeholder="0.00"
                                    step="0.01"
                                    required
                                />
                                {formErrors.price && <p className="mt-1 text-xs text-red-500">{formErrors.price}</p>}
                            </div>
                            {parseInt(formData.serviceTypeId) === 1 && (
                                <div>
                                    <label className="block text-xs font-normal text-gray-500 mb-2">Duración (horas)</label>
                                    <input
                                        type="number"
                                        value={formData.durationInHours}
                                        onChange={(e) => setFormData({ ...formData, durationInHours: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-400 focus:outline-none transition-colors ${formErrors.durationInHours ? 'border-red-300' : 'border-gray-200 bg-gray-50/50'
                                            }`}
                                        min="1"
                                        required
                                    />
                                    {formErrors.durationInHours && (
                                        <p className="mt-1 text-xs text-red-500">{formErrors.durationInHours}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-normal text-gray-500 mb-2">Condiciones</label>
                            <textarea
                                value={formData.conditions}
                                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-400 focus:outline-none transition-colors resize-y ${formErrors.conditions ? 'border-red-300' : 'border-gray-200 bg-gray-50/50'
                                    }`}
                                rows={4}
                                placeholder="Describe las condiciones de tu servicio..."
                                required
                            />
                            {formErrors.conditions && (
                                <p className="mt-1 text-xs text-red-500">{formErrors.conditions}</p>
                            )}
                        </div>

                        {formErrors.general && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {formErrors.general}
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-4 lg:border-l lg:border-gray-200 lg:pl-6">
                    <label className="block text-xs font-normal text-gray-500 mb-2">Imágenes</label>
                    <div className="space-y-4">
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-lg p-4 sm:p-6 text-center hover:border-gray-300 transition-all bg-gray-50/30 cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Haz clic para subir imágenes</p>
                            <p className="text-xs text-gray-400 mt-1">PNG o JPG (máx. 5MB)</p>
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
                            <p className="mt-1 text-xs text-red-500">{formErrors.images}</p>
                        )}
                        
                        {/* Sistema unificado de imágenes */}
                        {(getCurrentExistingImages().length > 0 || selectedImages.length > 0) && (
                            <div className="space-y-3">
                                <p className="text-xs font-normal text-gray-500">
                                    Imágenes del servicio ({getTotalImagesCount()})
                                </p>
                                {/* Mensaje informativo cuando hay cambios */}
                                {(getCurrentExistingImages().length !== (editingService?.imageUrls?.length || 0) || selectedImages.length > 0) && editingService && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                        <div className="flex items-start gap-2">
                                            <div className="text-amber-600 mt-0.5">⚠️</div>
                                            <div className="text-sm text-amber-800">
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
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    {/* Imágenes existentes */}
                                    {getCurrentExistingImages().map((imageUrl, index) => (
                                        <div key={`existing-${index}`} className="relative group">
                                            <img
                                                src={imageUrl}
                                                alt={`Imagen ${index + 1}`}
                                                className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(index)}
                                                className="absolute -top-1 -right-1 bg-white shadow-md text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full p-1 transition-all duration-200 opacity-0 group-hover:opacity-100"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                            <div className="absolute bottom-1 left-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
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
                                                className="w-full h-20 sm:h-24 object-cover rounded-lg border border-green-200 shadow-sm group-hover:shadow-md transition-shadow"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute -top-1 -right-1 bg-white shadow-md text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full p-1 transition-all duration-200 opacity-0 group-hover:opacity-100"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                            <div className="absolute bottom-1 left-1 bg-green-500/90 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                                                Nueva
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sección de Tipos de Entregables */}
                <div className="col-span-1 lg:col-span-2">
                    <div>
                        <label className="block text-xs font-normal text-gray-500 mb-2">
                            Tipos de Informes a Entregar
                        </label>
                        {isLoadingDeliverableTypes ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando tipos de entregables...
                            </div>
                        ) : deliverableTypesError ? (
                            <div className="text-sm text-red-500">
                                Error cargando tipos de entregables: {deliverableTypesError.message}
                            </div>
                        ) : deliverableTypes && deliverableTypes.length > 0 ? (
                            <div className="space-y-3">
                                {deliverableTypes.map((deliverableType) => {
                                    const isSelected = formData.selectedDeliverableTypes.includes(deliverableType.id);
                                    const isPdf = deliverableType.name === 'PDF';
                                    const isRequired = deliverableType.isRequired || isPdf; // PDF siempre es obligatorio
                                    
                                    console.log(`🔍 Rendering deliverableType ${deliverableType.id} (${deliverableType.name}):`, {
                                        isSelected,
                                        isRequired,
                                        isPdf,
                                        selectedDeliverableTypes: formData.selectedDeliverableTypes
                                    });
                                    
                                    return (
                                        <div
                                            key={deliverableType.id}
                                            className={`p-3 rounded-lg border transition-all duration-200 ${
                                                isSelected
                                                    ? 'border-blue-200 bg-blue-50'
                                                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                                            } ${isPdf ? 'cursor-not-allowed opacity-75 bg-red-50 border-red-200' : 'cursor-pointer'}`}
                                            onClick={() => !isPdf && handleDeliverableTypeSelect(deliverableType.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                    isSelected
                                                        ? isPdf 
                                                            ? 'border-red-500 bg-red-500'
                                                            : 'border-blue-500 bg-blue-500'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {isSelected && (
                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {isPdf ? (
                                                            <FileText className="w-4 h-4 text-red-500" />
                                                        ) : (
                                                            <Video className="w-4 h-4 text-blue-500" />
                                                        )}
                                                        <span className={`text-sm font-medium ${
                                                            isSelected ? (isPdf ? 'text-red-900' : 'text-blue-900') : 'text-gray-900'
                                                        }`}>
                                                            {deliverableType.displayName}
                                                        </span>
                                                        {isPdf ? (
                                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                                                                Siempre Incluido
                                                            </span>
                                                        ) : isRequired && (
                                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                                                Obligatorio
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs ${
                                                        isSelected ? (isPdf ? 'text-red-700' : 'text-blue-700') : 'text-gray-600'
                                                    }`}>
                                                        {isPdf ? 'El informe en PDF siempre se incluye en todos los servicios' : deliverableType.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-sm text-yellow-600">
                                No se encontraron tipos de entregables disponibles
                            </div>
                        )}
                        {formErrors.selectedDeliverableTypes && (
                            <p className="mt-1 text-xs text-red-500">{formErrors.selectedDeliverableTypes}</p>
                        )}
                    </div>
                </div>
                
                {/* Botones de acción al final del modal */}
                <div className="col-span-1 lg:col-span-2 border-t border-gray-200 pt-4 mt-6">
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowServiceForm(false);
                                setSelectedImages([]);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                            className="w-full sm:w-auto px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors font-medium rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                if (editingService) {
                                    handleUpdateService?.(e as any);
                                } else {
                                    handleCreateService(e as any);
                                }
                            }}
                            disabled={(editingService ? isUpdatingService : isCreatingService) || isLoadingServiceTypes}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                        >
                            {(editingService ? isUpdatingService : isCreatingService) ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {editingService ? 'Actualizando...' : 'Creando...'}
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    {editingService ? 'Actualizar Servicio' : 'Crear Servicio'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}