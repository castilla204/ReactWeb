import React, { useRef, useState } from 'react';
import { CheckCircle, Loader2, XCircle, Upload } from 'lucide-react';

interface ServiceFormProps {
    showServiceForm: boolean;
    setShowServiceForm: (value: boolean) => void;
    selectedImages: File[];
    setSelectedImages: (value: File[]) => void;
    formErrors: { [key: string]: string };
    setFormErrors: (value: { [key: string]: string }) => void;
    formData: { categoryId: string; serviceTypeId: string; price: string; conditions: string; durationInHours: string };
    setFormData: (value: { categoryId: string; serviceTypeId: string; price: string; conditions: string; durationInHours: string }) => void;
    handleImageSelect: (e: React.ChangeEvent) => void;
    removeImage: (index: number) => void;
    handleCreateService: (e: React.FormEvent) => void;
    serviceTypes: { id: number; name: string }[];
    isLoadingServiceTypes: boolean;
    isCreatingService: boolean;
    categories: { id: number; name: string }[] | undefined;
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
}: ServiceFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(formData.categoryId ? [formData.categoryId] : []);
    const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<string[]>(formData.serviceTypeId ? [formData.serviceTypeId] : []);

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

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 shadow-2xl transform transition-all duration-300 ease-in-out grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Nuevo Servicio de Búsqueda</h3>
                    <form onSubmit={handleCreateService} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Categorías</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {categories?.map(category => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => handleCategorySelect(category.id.toString())}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategoryIds.includes(category.id.toString())
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Servicio</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {isLoadingServiceTypes ? (
                                    <span className="text-sm text-gray-500">Cargando...</span>
                                ) : (
                                    serviceTypes.map(serviceType => (
                                        <button
                                            key={serviceType.id}
                                            type="button"
                                            onClick={() => handleServiceTypeSelect(serviceType.id.toString())}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${selectedServiceTypeIds.includes(serviceType.id.toString())
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                        >
                                            {serviceType.name}
                                        </button>
                                    ))
                                )}
                            </div>
                            {formErrors.serviceTypeId && (
                                <p className="mt-1 text-xs text-red-500">{formErrors.serviceTypeId}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Precio (€)</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.price ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="0.00"
                                    step="0.01"
                                    required
                                />
                                {formErrors.price && <p className="mt-1 text-xs text-red-500">{formErrors.price}</p>}
                            </div>
                            {parseInt(formData.serviceTypeId) === 1 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Duración (horas)</label>
                                    <input
                                        type="number"
                                        value={formData.durationInHours}
                                        onChange={(e) => setFormData({ ...formData, durationInHours: e.target.value })}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.durationInHours ? 'border-red-300' : 'border-gray-300'
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Condiciones</label>
                            <textarea
                                value={formData.conditions}
                                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.conditions ? 'border-red-300' : 'border-gray-300'
                                    } resize-y`}
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

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowServiceForm(false);
                                    setSelectedImages([]);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                                className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isCreatingService || isLoadingServiceTypes}
                                className="px-4 py-2 bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingService ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Crear Servicio
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes</label>
                    <div className="space-y-4">
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-all bg-gray-50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Haz clic para subir imágenes</p>
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
                        {selectedImages.length > 0 && (
                            <div className="grid grid-cols-1 gap-3">
                                {selectedImages.map((image, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}