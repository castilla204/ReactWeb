import React, { useRef } from 'react'; import { CheckCircle, Loader2, XCircle, Upload } from 'lucide-react';

interface ServiceFormProps { showServiceForm: boolean; setShowServiceForm: (value: boolean) => void; selectedImages: File[]; setSelectedImages: (value: File[]) => void; formErrors: { [key: string]: string }; setFormErrors: (value: { [key: string]: string }) => void; formData: { categoryId: string; serviceTypeId: string; price: string; conditions: string; durationInHours: string }; setFormData: (value: { categoryId: string; serviceTypeId: string; price: string; conditions: string; durationInHours: string }) => void; handleImageSelect: (e: React.ChangeEvent) => void; removeImage: (index: number) => void; handleCreateService: (e: React.FormEvent) => void; serviceTypes: { id: number; name: string }[]; isLoadingServiceTypes: boolean; isCreatingService: boolean; categories: { id: number; name: string }[] | undefined; }

export function ServiceForm({ showServiceForm, setShowServiceForm, selectedImages, setSelectedImages, formErrors, setFormErrors, formData, setFormData, handleImageSelect, removeImage, handleCreateService, serviceTypes, isLoadingServiceTypes, isCreatingService, categories, }: ServiceFormProps) {
    const fileInputRef = useRef(null);

    if (!showServiceForm) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Nuevo Servicio de Búsqueda
                </h3>
                <form onSubmit={handleCreateService} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría
                        </label>
                        <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.categoryId ? 'border-red-300' : 'border-gray-300'}`}
                            required
                        >
                            <option value="">Seleccionar categoría</option>
                            {categories?.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {formErrors.categoryId && (
                            <p className="mt-1 text-xs text-red-500">{formErrors.categoryId}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Servicio
                        </label>
                        <select
                            value={formData.serviceTypeId}
                            onChange={(e) => setFormData({ ...formData, serviceTypeId: e.target.value })}
                            className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.serviceTypeId ? 'border-red-300' : 'border-gray-300'}`}
                            required
                        >
                            <option value="">Seleccionar tipo de servicio</option>
                            {isLoadingServiceTypes ? (
                                <option disabled>Cargando...</option>
                            ) : (
                                serviceTypes.map(serviceType => (
                                    <option key={serviceType.id} value={serviceType.id}>
                                        {serviceType.name}
                                    </option>
                                ))
                            )}
                        </select>
                        {formErrors.serviceTypeId && (
                            <p className="mt-1 text-xs text-red-500">{formErrors.serviceTypeId}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.price ? 'border-red-300' : 'border-gray-300'}`}
                                placeholder="0.00"
                                required
                            />
                            {formErrors.price && <p className="mt-1 text-xs text-red-500">{formErrors.price}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duración (horas)
                            </label>
                            <input
                                type="number"
                                value={formData.durationInHours}
                                onChange={(e) => setFormData({ ...formData, durationInHours: e.target.value })}
                                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.durationInHours ? 'border-red-300' : 'border-gray-300'}`}
                                min="1"
                                required
                            />
                            {formErrors.durationInHours && (
                                <p className="mt-1 text-xs text-red-500">{formErrors.durationInHours}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Condiciones
                        </label>
                        <textarea
                            value={formData.conditions}
                            onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                            className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.conditions ? 'border-red-300' : 'border-gray-300'}`}
                            rows={3}
                            placeholder="Describe las condiciones de tu servicio..."
                            required
                        />
                        {formErrors.conditions && (
                            <p className="mt-1 text-xs text-red-500">{formErrors.conditions}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imágenes (al menos una requerida)
                        </label>
                        <div className="space-y-2">
                            <div
                                className="border-2 border-dashed border-gray-300 rounded p-4 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                    Haz clic para subir imágenes
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    PNG o JPG (máx. 5MB)
                                </p>
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
                                <div className="grid grid-cols-3 gap-2">
                                    {selectedImages.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={URL.createObjectURL(image)}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-20 object-cover rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {formErrors.general && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded text-sm">
                            {formErrors.general}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setShowServiceForm(false);
                                setSelectedImages([]);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isCreatingService || isLoadingServiceTypes}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
        </div>
    );

}