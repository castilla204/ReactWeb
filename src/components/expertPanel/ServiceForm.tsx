import React, { useRef, useState, useEffect, useMemo } from 'react';
import { CheckCircle, Loader2, Upload, FileText, Video, X, ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { useDeliverableTypes } from '../../hooks/useDeliverableTypes';
import { CategoryWithDetailsDto } from '../../types/category';
// 🛡️ Round 28: derivar símbolo de moneda del país del experto (no más € hardcoded).
import { getCurrencyForCountry, getCurrencySymbol } from '../../utils/priceUtils';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../ui/empty';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { markFilePickerOpening } from '../../utils/filePickerGuard';

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
    categoriesLoading?: boolean;
    categoriesError?: string | null;
    // 🛡️ Round 28: añadir currency/priceCurrency al tipo para que en modo edit
    // el form pueda mostrar la moneda REAL del servicio (snapshot inmutable), no la
    // derivada del país actual del experto. Sin estos campos, un experto que se mudó
    // veía "Precio (£)" sobre un servicio EUR antiguo y guardaba con desalineamiento.
    editingService?: { id: number; categoryId: number; serviceTypeId: number; price: number; conditions: string; durationInHours: number | null; imageUrls: string[]; currency?: string; priceCurrency?: string } | null;
    handleUpdateService?: (e: React.FormEvent) => void;
    isUpdatingService?: boolean;
    existingImages?: string[];
    setExistingImages?: (images: string[]) => void;
    existingImagesWithIds?: Array<{ id: number; url: string }>; // ✅ NUEVO: Imágenes con IDs
    imagesToDelete?: number[]; // ✅ NUEVO: IDs de imágenes a eliminar
    setImagesToDelete?: (ids: number[]) => void; // ✅ NUEVO: Función para actualizar IDs a eliminar
    // 🛡️ Round 28: país del experto (ISO 3166-1 alpha-2). Usado para mostrar el símbolo
    // correcto en el label "Precio (X)". Opcional — fallback a EUR si no se pasa.
    expertCountry?: string | null;
}

export function ServiceForm({
    showServiceForm,
    setShowServiceForm,
    selectedImages,
    // setSelectedImages se mantiene en el contrato de props (el padre lo sigue pasando),
    // pero el formulario ya no muta selectedImages directamente: las altas/bajas pasan por
    // handleImageSelect/removeImage y el reseteo lo controla el padre tras un cierre intencionado.
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
    categoriesLoading = false,
    categoriesError = null,
    editingService,
    handleUpdateService,
    isUpdatingService,
    existingImages: propExistingImages,
    setExistingImages: propSetExistingImages,
    existingImagesWithIds: propExistingImagesWithIds,
    imagesToDelete: propImagesToDelete = [],
    setImagesToDelete: propSetImagesToDelete,
    expertCountry,
}: ServiceFormProps) {
    // 🛡️ Round 28: derivar símbolo del país del experto (GB → £, CH → CHF, SE → kr, …).
    // En modo EDICIÓN priorizamos la moneda real del servicio (snapshot inmutable) sobre
    // el país actual del experto — un experto que se mudó ES→GB no debe ver "Precio (£)"
    // sobre un servicio EUR antiguo. En modo CREACIÓN cae al país (experto crea en su divisa).
    const editingCurrencyCode = editingService?.currency ?? editingService?.priceCurrency;
    const priceCurrencyCode = editingCurrencyCode
        ? editingCurrencyCode.toUpperCase()
        : getCurrencyForCountry(expertCountry ?? null);
    const priceCurrencySymbol = getCurrencySymbol(priceCurrencyCode);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // ✅ FIX ARQUITECTÓNICO (no es un hack de timing):
    // El Drawer se renderiza con `dismissible={false}` (ver más abajo). Eso hace que vaul
    // IGNORE por completo cualquier intento de cierre que no venga del prop `open` controlado:
    // clic fuera, Escape y —sobre todo— la pérdida de foco cuando se abre el selector de
    // archivos nativo del SO. Por eso ya no hace falta el antiguo flag `isPickingFileRef`
    // ni el listener de `window 'focus'`: el cierre espurio simplemente no puede ocurrir,
    // así que `selectedImages` nunca se borra al elegir una foto.
    const { deliverableTypes, isLoading: isLoadingDeliverableTypes, error: deliverableTypesError } = useDeliverableTypes();
    
    // Log adicional para debuggear
    console.log('🔍 ServiceForm render - deliverableTypes:', deliverableTypes);
    console.log('🔍 ServiceForm render - isLoadingDeliverableTypes:', isLoadingDeliverableTypes);
    console.log('🔍 ServiceForm render - deliverableTypesError:', deliverableTypesError);

    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() => {
        const catId = formData.categoryId;
        return catId ? [String(catId)] : [];
    });
    const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<string[]>(() => {
        const stId = formData.serviceTypeId;
        return stId ? [String(stId)] : [];
    });
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [hasInitializedDeliverableTypes, setHasInitializedDeliverableTypes] = useState(false);
    const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);

    // Actualizar las selecciones cuando cambie formData o editingService
    useEffect(() => {
        const catId = formData.categoryId;
        if (catId) {
            setSelectedCategoryIds([String(catId)]);
        } else {
            setSelectedCategoryIds([]);
        }
    }, [formData.categoryId]);

    useEffect(() => {
        const stId = formData.serviceTypeId;
        if (stId) {
            setSelectedServiceTypeIds([String(stId)]);
        } else {
            setSelectedServiceTypeIds([]);
        }
    }, [formData.serviceTypeId]);
    
    // ✅ CRÍTICO: Cargar deliverable types seleccionados cuando se abre el formulario para editar
    useEffect(() => {
        if (editingService && formData.selectedDeliverableTypes.length > 0 && deliverableTypes.length > 0 && !isLoadingDeliverableTypes) {
            console.log('🔍 ServiceForm - Loading deliverable types for editing:', {
                selectedIds: formData.selectedDeliverableTypes,
                availableDeliverableTypes: deliverableTypes.map(dt => {
                    const dtAny = dt as any;
                    return {
                        id: dt.id ?? dtAny.Id,
                        name: dt.name ?? dtAny.Name
                    };
                })
            });
            
            // Normalizar los IDs seleccionados para asegurar que coincidan con los deliverable types disponibles
            const normalizedSelectedIds = formData.selectedDeliverableTypes
                .map(selectedId => {
                    // Buscar el deliverable type que coincida con este ID
                    const dt = deliverableTypes.find(dt => {
                        const dtAny = dt as any;
                        const dtId = dt.id ?? dtAny.Id;
                        return dtId === selectedId;
                    });
                    if (dt) {
                        const dtAny = dt as any;
                        return dt.id ?? dtAny.Id;
                    }
                    return selectedId;
                })
                .filter((id): id is number => id != null && !isNaN(Number(id)));
            
            // Solo actualizar si hay diferencias
            if (normalizedSelectedIds.length !== formData.selectedDeliverableTypes.length ||
                normalizedSelectedIds.some((id, index) => id !== formData.selectedDeliverableTypes[index])) {
                console.log('🔍 ServiceForm - Normalizing deliverable types IDs:', {
                    original: formData.selectedDeliverableTypes,
                    normalized: normalizedSelectedIds
                });
                setFormData({
                    ...formData,
                    selectedDeliverableTypes: normalizedSelectedIds
                });
            }
        }
    }, [editingService, formData.selectedDeliverableTypes, deliverableTypes, isLoadingDeliverableTypes]);

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
        
        if (deliverableTypes.length > 0 && !isLoadingDeliverableTypes) {
            // ✅ CRÍTICO: Si estamos editando y ya hay deliverable types seleccionados, no hacer nada
            // (ya se cargaron desde handleEditService)
            if (editingService && formData.selectedDeliverableTypes.length > 0) {
                console.log('🔍 ServiceForm useEffect - Editing service with existing deliverable types, skipping auto-add');
                // Solo asegurar que el PDF esté incluido
                const pdfType = deliverableTypes.find(dt => {
                    const dtAny = dt as any;
                    const name = dt.name ?? dtAny.Name ?? '';
                    return name === 'PDF' || name === 'pdf';
                });
                if (pdfType) {
                    const pdfTypeAny = pdfType as any;
                    const pdfId = pdfType.id ?? pdfTypeAny.Id;
                    if (pdfId != null && !formData.selectedDeliverableTypes.includes(pdfId)) {
                        setFormData({
                            ...formData,
                            selectedDeliverableTypes: [...formData.selectedDeliverableTypes, pdfId]
                        });
                    }
                }
                return;
            }
            
            // Normalizar deliverable types para buscar PDF
            const pdfType = deliverableTypes.find(dt => {
                const dtAny = dt as any;
                const name = dt.name ?? dtAny.Name ?? '';
                return name === 'PDF' || name === 'pdf';
            });
            console.log('🔍 ServiceForm useEffect - pdfType found:', pdfType);
            
            if (pdfType) {
                // Obtener ID normalizado
                const pdfTypeAny = pdfType as any;
                const pdfId = pdfType.id ?? pdfTypeAny.Id;
                
                if (pdfId != null) {
                    // Siempre asegurar que el PDF esté seleccionado
                    const currentSelected = formData.selectedDeliverableTypes;
                    const hasPdf = currentSelected.includes(pdfId);
                    
                    if (!hasPdf) {
                        console.log('🔍 ServiceForm useEffect - Adding PDF to selected types with ID:', pdfId);
                        const newFormData = {
                            ...formData,
                            selectedDeliverableTypes: [...formData.selectedDeliverableTypes, pdfId]
                        };
                        console.log('🔍 ServiceForm useEffect - New formData:', newFormData);
                        setFormData(newFormData);
                    }
                }
                
                // Solo marcar como inicializado si no estamos editando
                if (!editingService && !hasInitializedDeliverableTypes) {
                    setHasInitializedDeliverableTypes(true);
                }
            }
        }
    }, [deliverableTypes, editingService, isLoadingDeliverableTypes, hasInitializedDeliverableTypes, formData]);

    // ✅ CRÍTICO: Resetear el flag cuando se abre el formulario para crear un nuevo servicio
    useEffect(() => {
        if (showServiceForm && !editingService) {
            setHasInitializedDeliverableTypes(false);
        }
    }, [showServiceForm, editingService]);
    
    // ✅ CRÍTICO: Log cuando se abre/cierra el formulario
    useEffect(() => {
        console.log('🔍 ServiceForm - showServiceForm changed:', showServiceForm);
        if (showServiceForm) {
            console.log('🔍 ServiceForm - Form opened, current state:', {
                categories: categories?.length || 0,
                serviceTypes: serviceTypes?.length || 0,
                deliverableTypes: deliverableTypes?.length || 0,
                categoriesLoading,
                isLoadingServiceTypes,
                isLoadingDeliverableTypes
            });
        }
    }, [showServiceForm, categories, serviceTypes, deliverableTypes, categoriesLoading, isLoadingServiceTypes, isLoadingDeliverableTypes]);

    const handleCategorySelect = (id: string | number | null | undefined) => {
        if (id == null) return;
        const idStr = String(id);
        const newSelected = selectedCategoryIds.includes(idStr)
            ? selectedCategoryIds.filter(catId => catId !== idStr)
            : [idStr];
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

    // ✅ CRÍTICO: Normalizar categorías del backend (PascalCase -> camelCase)
    const normalizedCategories = useMemo(() => {
        if (!Array.isArray(categories)) return [];
        
        return categories.map(cat => {
            if (!cat) return null;
            // Normalizar de PascalCase a camelCase usando type assertion
            const catAny = cat as any;
            return {
                id: cat.id ?? catAny.Id ?? null,
                name: cat.name ?? catAny.Name ?? '',
                parentId: cat.parentId ?? catAny.ParentId ?? null,
                isParent: cat.isParent ?? catAny.IsParent ?? false,
                hasSubcategories: cat.hasSubcategories ?? catAny.HasSubcategories ?? false,
                subcategoriesCount: cat.subcategoriesCount ?? catAny.SubcategoriesCount ?? 0
            };
        }).filter((cat): cat is NonNullable<typeof cat> => cat !== null && cat.id != null);
    }, [categories]);
    
    // ✅ CRÍTICO: Filtrar categorías padre
    const parentCategories = useMemo(() => {
        return normalizedCategories.filter(cat => {
            // Prioridad 1: Usar isParent
            if (cat.isParent === true) return true;
            // Prioridad 2: Verificar hasSubcategories
            if (cat.hasSubcategories === true) return true;
            // Prioridad 3: Verificar parentId (null = padre)
            return cat.parentId === null || cat.parentId === undefined;
        });
    }, [normalizedCategories]);
    

    // Obtener subcategorías de una categoría padre
    const getSubcategories = (parentId: number) => {
        return normalizedCategories.filter(cat => cat.parentId === parentId);
    };

    const handleServiceTypeSelect = (id: string | number | null | undefined) => {
        if (id == null) return;
        const idStr = String(id);
        const newSelected = selectedServiceTypeIds.includes(idStr)
            ? selectedServiceTypeIds.filter(typeId => typeId !== idStr)
            : [idStr];
        setSelectedServiceTypeIds(newSelected);
        setFormData({ ...formData, serviceTypeId: newSelected[0] || '' });
    };

    const removeExistingImage = (imageId: number) => {
        console.log('🔍 removeExistingImage called with imageId:', imageId);
        
        // ✅ Validar que el ID es positivo (real del backend)
        if (imageId <= 0) {
            console.error('❌ No se puede eliminar: ID temporal/negativo. El backend debe devolver IDs reales.');
            // Mostrar mensaje al usuario
            setFormErrors({ 
                general: 'No se puede eliminar esta imagen porque no tiene un ID válido. Por favor, recarga la página.' 
            });
            return;
        }
        
        // ✅ Agregar a imagesToDelete solo si el ID es válido (positivo)
        if (propSetImagesToDelete) {
            const currentIdsToDelete = propImagesToDelete || [];
            if (!currentIdsToDelete.includes(imageId)) {
                console.log('✅ Adding valid imageId to imagesToDelete:', imageId);
                propSetImagesToDelete([...currentIdsToDelete, imageId]);
            }
        }
        
        // ✅ SIEMPRE remover de la lista visual para feedback inmediato
        const currentImages = propExistingImages || existingImages;
        
        if (propExistingImagesWithIds && propExistingImagesWithIds.length > 0) {
            // Si tenemos imágenes con IDs, encontrar el índice por ID
            const imageIndex = propExistingImagesWithIds.findIndex(img => img.id === imageId);
            if (imageIndex !== -1) {
                const newImages = currentImages.filter((_, i) => i !== imageIndex);
                if (propSetExistingImages) {
                    propSetExistingImages(newImages);
                } else {
                    setExistingImages(newImages);
                }
            }
        } else {
            // Fallback: sin IDs, remover por índice
            // Si imageId es negativo (temporal), convertirlo a índice: -(imageId + 1)
            const indexToRemove = imageId < 0 ? (-imageId - 1) : imageId;
            const newImages = currentImages.filter((_, i) => i !== indexToRemove);
            if (propSetExistingImages) {
                propSetExistingImages(newImages);
            } else {
                setExistingImages(newImages);
            }
        }
    };

    const handleDeliverableTypeSelect = (deliverableTypeId: number | null | undefined) => {
        if (deliverableTypeId == null) return;
        
        // Buscar el tipo de entregable (normalizado o no)
        const deliverableType = deliverableTypes.find(dt => {
            const dtAny = dt as any;
            const dtId = dt.id ?? dtAny.Id;
            return dtId === deliverableTypeId;
        });
        
        if (!deliverableType) return;

        // Normalizar nombre para comparación
        const dtAny = deliverableType as any;
        const dtName = deliverableType.name ?? dtAny.Name ?? '';
        const isPdf = dtName === 'PDF' || dtName === 'pdf';

        // Si es PDF, no permitir deseleccionar (siempre obligatorio)
        if (isPdf) return;

        // ✅ CRÍTICO: Toggle de selección - solo este ID específico
        const newSelected = formData.selectedDeliverableTypes.includes(deliverableTypeId)
            ? formData.selectedDeliverableTypes.filter(id => id !== deliverableTypeId)
            : [...formData.selectedDeliverableTypes, deliverableTypeId];

        setFormData({ ...formData, selectedDeliverableTypes: newSelected });
    };

    const getCurrentExistingImages = () => {
        // ✅ NUEVO: Si tenemos imágenes con IDs, filtrar las que no están marcadas para eliminar
        if (propExistingImagesWithIds && propExistingImagesWithIds.length > 0) {
            const idsToDelete = propImagesToDelete || [];
            return propExistingImagesWithIds
                .filter(img => !idsToDelete.includes(img.id))
                .map(img => img.url);
        }
        return propExistingImages || existingImages;
    };

    const getTotalImagesCount = () => {
        return getCurrentExistingImages().length + selectedImages.length;
    };

    // ✅ FIX (fuga de memoria + parpadeo): generar UNA sola object URL por File en lugar de
    // llamar a URL.createObjectURL en cada render. Se recalcula sólo cuando cambia la lista
    // de archivos y se revocan las URLs anteriores; el cleanup revoca todo al desmontar.
    const newImagePreviews = useMemo(
        () => selectedImages.map(file => URL.createObjectURL(file)),
        [selectedImages]
    );
    useEffect(() => {
        return () => {
            newImagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [newImagePreviews]);

    // Función para renderizar el contenido del formulario (reutilizable)
    const renderFormContent = () => (
        <>
            <div>
                <div className="space-y-6">
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Categorías</Label>
                        {categoriesLoading ? (
                            <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando categorías...
                            </div>
                        ) : categoriesError ? (
                            <div className="text-sm text-destructive p-4 border border-dashed rounded-md">
                                Error al cargar categorías: {categoriesError}
                            </div>
                        ) : normalizedCategories.length === 0 ? (
                            <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md">
                                No hay categorías disponibles
                            </div>
                        ) : (
                            // ✅ CRÍTICO: Si no hay categorías padre, mostrar todas las categorías
                            parentCategories.length === 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {normalizedCategories.map(cat => {
                                        if (!cat || cat.id == null) return null;
                                        const catIdStr = String(cat.id);
                                        const isSelected = selectedCategoryIds.includes(catIdStr);
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => handleCategorySelect(cat.id)}
                                                className={`w-full relative border rounded-md transition-all text-left overflow-hidden p-2.5 ${
                                                    isSelected
                                                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                                                        : 'border-border hover:border-primary/50 bg-background'
                                                }`}
                                            >
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <CategoryImage categoryName={cat.name} size="sm" />
                                                    <span className={`text-xs font-medium text-center leading-tight ${
                                                        isSelected ? 'text-primary' : 'text-foreground'
                                                    }`}>
                                                        {cat.name}
                                                    </span>
                                                    {isSelected && (
                                                        <CheckCircle className="w-3.5 h-3.5 text-primary absolute top-1.5 right-1.5" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                            {parentCategories.map(parentCategory => {
                                    if (!parentCategory || parentCategory.id == null) return null;
                                    const subcategories = getSubcategories(parentCategory.id);
                                    const hasSubcategories = subcategories.length > 0;
                                    const isExpanded = expandedCategoryIds.includes(parentCategory.id);
                                    const catIdStr = String(parentCategory.id);
                                    const isSelected = selectedCategoryIds.includes(catIdStr);
                                
                                return (
                                    <div key={parentCategory.id} className="space-y-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleCategorySelect(parentCategory.id)}
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
                                                        if (!subcategory || subcategory.id == null) return null;
                                                        const subIdStr = String(subcategory.id);
                                                        const isSubSelected = selectedCategoryIds.includes(subIdStr);
                                                        return (
                                                            <button
                                                                key={subcategory.id}
                                                                type="button"
                                                                onClick={() => handleCategorySelect(subcategory.id)}
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
                            )
                        )}
                        {formErrors.categoryId && (
                            <p className="mt-2 text-sm text-destructive">{formErrors.categoryId}</p>
                        )}
                    </div>

                    <div>
                        <Label className="text-sm font-medium mb-3 block">Tipo de Servicio</Label>
                        <div className="flex flex-wrap gap-2">
                            {isLoadingServiceTypes ? (
                                <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md flex items-center gap-2 w-full">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando tipos de servicio...
                                </div>
                            ) : (() => {
                                // ✅ CRÍTICO: Normalizar tipos de servicio del backend (PascalCase -> camelCase)
                                if (!serviceTypes || !Array.isArray(serviceTypes)) {
                                    return (
                                        <div className="text-sm text-destructive p-4 border border-dashed rounded-md w-full">
                                            Error: serviceTypes no es un array válido
                                        </div>
                                    );
                                }
                                
                                // Normalizar de PascalCase a camelCase usando type assertion
                                const normalizedServiceTypes = serviceTypes.map(st => {
                                    if (!st) return null;
                                    const stAny = st as any;
                                    return {
                                        id: st.id ?? stAny.Id ?? null,
                                        name: st.name ?? stAny.Name ?? '',
                                        description: (st as any).description ?? stAny.Description ?? '',
                                        serviceTypeCategoryId: (st as any).serviceTypeCategoryId ?? stAny.ServiceTypeCategoryId ?? null,
                                        serviceTypeCategoryName: (st as any).serviceTypeCategoryName ?? stAny.ServiceTypeCategoryName ?? null,
                                        position: (st as any).position ?? stAny.Position ?? 0,
                                        requiresAppointment: (st as any).requiresAppointment ?? stAny.RequiresAppointment ?? false
                                    };
                                }).filter((st): st is NonNullable<typeof st> => st !== null && st.name !== '');
                                
                                if (normalizedServiceTypes.length === 0) {
                                    return (
                                        <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md w-full">
                                            No hay tipos de servicio disponibles
                                        </div>
                                    );
                                }
                                
                                // ✅ CRÍTICO: Renderizar botones
                                return normalizedServiceTypes.map(serviceType => {
                                    if (!serviceType || serviceType.id == null) return null;
                                    const serviceTypeId = String(serviceType.id);
                                    const isSelected = selectedServiceTypeIds.includes(serviceTypeId);
                                    
                                    return (
                                        <Button
                                            key={serviceType.id}
                                            type="button"
                                            variant={isSelected ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleServiceTypeSelect(serviceType.id)}
                                            className={isSelected ? '' : 'hover:bg-accent'}
                                        >
                                            {serviceType.name}
                                        </Button>
                                    );
                                });
                            })()}
                        </div>
                        {formErrors.serviceTypeId && (
                            <p className="mt-2 text-sm text-destructive">{formErrors.serviceTypeId}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Precio ({priceCurrencySymbol})</Label>
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
                            {/* 🛡️ Round 28 MUD-AD: aclaración país↔moneda. Stripe Connect liga la
                                cuenta al país (inmutable), y eso fuerza la moneda de cobro. El
                                experto NO puede elegir moneda manualmente — viene dada por el país. */}
                            {!editingService && expertCountry && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tu cuenta de cobros está en <span className="font-medium">{expertCountry}</span> y opera en
                                    <span className="font-medium"> {priceCurrencyCode}</span>. Para cambiar de moneda necesitas mudarte a otro país desde el panel de experto.
                                </p>
                            )}
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
                            {String(formErrors.general || 'Error desconocido')}
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-6 lg:border-l lg:border-border lg:pl-6">
                <div className="space-y-2">
                    <Label>Imágenes</Label>
                    <div
                        className="cursor-pointer"
                        onClick={(e) => {
                            // ✅ FIX: Evitar re-entrancia. El <input> es descendiente de este div,
                            // por lo que el .click() programático vuelve a burbujear hasta aquí.
                            // Ignorar los clics que ya provienen del propio input.
                            if (e.target === fileInputRef.current) return;
                            markFilePickerOpening();
                            fileInputRef.current?.click();
                        }}
                    >
                        <Empty className="py-8">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </EmptyMedia>
                                <EmptyTitle>Haz clic para subir imágenes</EmptyTitle>
                                <EmptyDescription>PNG o JPG (máx. 10MB). Se guardan al pulsar Crear/Actualizar.</EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                        <input
                            id="image-input"
                            type="file"
                            accept="image/jpeg,image/png"
                            multiple
                            onClick={(e) => {
                                e.stopPropagation();
                                markFilePickerOpening();
                            }}
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
                            {((propImagesToDelete && propImagesToDelete.length > 0) || selectedImages.length > 0) && editingService && (
                                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                                    <div className="flex items-start gap-2">
                                        <div className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
                                        <div className="text-sm text-blue-800 dark:text-blue-200">
                                            <p className="font-medium mb-1">Cambios en las imágenes:</p>
                                            {selectedImages.length > 0 && (propImagesToDelete && propImagesToDelete.length > 0) ? (
                                                <p>Se agregarán {selectedImages.length} nueva(s) imagen(es) y se eliminarán {propImagesToDelete.length} imagen(es). Las demás se conservarán.</p>
                                            ) : selectedImages.length > 0 ? (
                                                <p>Se agregarán {selectedImages.length} nueva(s) imagen(es). Las imágenes existentes se conservarán.</p>
                                            ) : (
                                                <p>Se eliminarán {propImagesToDelete?.length || 0} imagen(es). Las demás se conservarán.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-3">
                                {/* Imágenes existentes */}
                                {(() => {
                                    // ✅ NUEVO: Usar imágenes con IDs si están disponibles
                                    const idsToDelete = propImagesToDelete || [];
                                    const imagesToShow = propExistingImagesWithIds && propExistingImagesWithIds.length > 0
                                        ? propExistingImagesWithIds.filter(img => !idsToDelete.includes(img.id))
                                        : getCurrentExistingImages().map((url, index) => ({ id: -(index + 1), url }));
                                    
                                    console.log('🔍 Rendering images - imagesToShow:', imagesToShow.length, 'idsToDelete:', idsToDelete);
                                    console.log('🔍 Images with real IDs:', imagesToShow.filter(img => img.id > 0).length);
                                    console.log('🔍 Images with temp IDs:', imagesToShow.filter(img => img.id <= 0).length);
                                    
                                    return imagesToShow.map((image) => (
                                        <div key={`existing-${image.id}`} className="relative group">
                                            <img
                                                src={image.url}
                                                alt={`Imagen ${image.id}`}
                                                className="w-full h-24 object-cover rounded-md border border-border shadow-sm group-hover:shadow-md transition-shadow"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    console.log('🔍 Button clicked for image:', image.id);
                                                    removeExistingImage(image.id);
                                                }}
                                                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                            <div className="absolute bottom-1 left-1 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                                Actual
                                            </div>
                                        </div>
                                    ));
                                })()}
                                
                                {/* Imágenes nuevas */}
                                {selectedImages.map((_image, index) => (
                                    <div key={`new-${index}`} className="relative group">
                                        <img
                                            src={newImagePreviews[index]}
                                            alt={`Nueva imagen ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-md border border-border shadow-sm group-hover:shadow-md transition-shadow"
                                        />
                                        {/* Círculo de subida: overlay mientras se sube la imagen al guardar */}
                                        {(editingService ? isUpdatingService : isCreatingService) && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            </div>
                                        )}
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
                            {(() => {
                                // ✅ CRÍTICO: Normalizar tipos de entregables del backend (PascalCase -> camelCase)
                                const normalizedDeliverableTypes = deliverableTypes.map(dt => {
                                    if (!dt) return null;
                                    const dtAny = dt as any;
                                    return {
                                        id: dt.id ?? dtAny.Id ?? null,
                                        name: dt.name ?? dtAny.Name ?? '',
                                        displayName: dt.displayName ?? dtAny.DisplayName ?? dt.name ?? dtAny.Name ?? '',
                                        description: dt.description ?? dtAny.Description ?? '',
                                        isRequired: dt.isRequired ?? dtAny.IsRequired ?? false,
                                        isActive: dt.isActive ?? dtAny.IsActive ?? true
                                    };
                                }).filter((dt): dt is NonNullable<typeof dt> => dt !== null && dt.id != null);
                                
                                return normalizedDeliverableTypes.map((deliverableType) => {
                                    if (!deliverableType || deliverableType.id == null) return null;
                                    
                                    const isSelected = formData.selectedDeliverableTypes.includes(deliverableType.id);
                                    const isPdf = deliverableType.name === 'PDF' || deliverableType.name === 'pdf';
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
                            });
                            })()}
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

    useBodyScrollLock(showServiceForm);

    useEffect(() => {
        if (showServiceForm) {
            document.body.dataset.drawerOpen = 'service';
        } else if (document.body.dataset.drawerOpen === 'service') {
            delete document.body.dataset.drawerOpen;
        }
        return () => {
            if (document.body.dataset.drawerOpen === 'service') {
                delete document.body.dataset.drawerOpen;
            }
        };
    }, [showServiceForm]);

    // Estado para rastrear si el drawer está cerrando (para evitar cambios de key durante el cierre)
    const [isClosing, setIsClosing] = React.useState(false);
    const getDrawerKey = () => {
        if (editingService && editingService.id != null) {
            return `edit-${editingService.id}`;
        }
        return 'create';
    };
    const drawerKeyRef = React.useRef<string>(getDrawerKey());

    // Actualizar la key cuando editingService cambia (solo cuando el drawer está abierto y no está cerrando)
    React.useEffect(() => {
        if (showServiceForm && !isClosing) {
            drawerKeyRef.current = getDrawerKey();
        }
    }, [editingService, showServiceForm, isClosing]);

    // ✅ Cierre EXPLÍCITO del Drawer (único camino de cierre permitido).
    // Como el Drawer es `dismissible={false}`, vaul ignora cualquier cierre que no
    // controlemos nosotros vía el prop `open`. Por tanto, los botones Cancelar / X / submit
    // deben llamar a esta función para cerrar de verdad. El reseteo de estado (incluido
    // selectedImages) se delega al wrapper de setShowServiceForm en el componente padre,
    // que sólo resetea tras un cierre intencionado.
    const closeDrawer = () => {
        setIsClosing(true);
        setShowServiceForm(false);
        // Esperar a que la animación de salida termine antes de permitir cambios de key.
        setTimeout(() => {
            setIsClosing(false);
            drawerKeyRef.current = getDrawerKey();
        }, 350); // Tiempo de animación del drawer + margen de seguridad
    };

    // Handler para onOpenChange de vaul. Con dismissible={false} vaul NO lo invoca para
    // cierres espurios (foco/outside/Escape); aun así lo dejamos para abrir y como red de
    // seguridad. Nunca cerramos aquí de forma implícita.
    const handleDrawerOpenChange = (open: boolean) => {
        if (open && !showServiceForm) {
            setIsClosing(false);
            drawerKeyRef.current = getDrawerKey();
            setShowServiceForm(true);
        }
        // open === false: ignorado a propósito. El cierre real pasa por closeDrawer().
    };

    return (
        <Drawer
            open={showServiceForm}
            onOpenChange={handleDrawerOpenChange}
            dismissible={false}
            repositionInputs={false}
            shouldScaleBackground={false}
        >
            <DrawerContent
                className="max-h-[96vh] flex flex-col h-[96vh]"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                // ✅ Cinturón y tirantes: aunque dismissible={false} ya bloquea estos cierres,
                // prevenimos explícitamente los eventos de cierre de Radix por si alguno se
                // disparase (p. ej. el blur al abrir el diálogo de archivos del SO).
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                onFocusOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="mx-auto w-full max-w-7xl flex flex-col h-full max-h-[96vh]">
                    <DrawerHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <DrawerTitle className="text-lg sm:text-xl font-semibold">
                                {editingService ? 'Editar Servicio' : 'Nuevo Servicio de Búsqueda'}
                            </DrawerTitle>
                            {/* ✅ Con dismissible={false}, DrawerClose (DialogPrimitive.Close)
                                quedaría ignorado por vaul. Cerramos explícitamente. */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={closeDrawer}
                            >
                                <X className="h-4 w-4" />
                            </Button>
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
                                // Cierre intencionado: el wrapper de setShowServiceForm en el
                                // padre se encarga de resetear el formulario (incluidas las
                                // imágenes) tras la animación de cierre.
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                                closeDrawer();
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
    );
}
