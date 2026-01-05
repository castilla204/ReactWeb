import React, { useState } from 'react';
import { Plus, FolderTree } from 'lucide-react';
import { useCategories } from '../../contexts/CategoryContext';
import { CreateCategoryDialog } from '../../components/CreateCategoryDialog';

const AdminCategoriesPage: React.FC = () => {
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const { categories: allCategories, loading: categoriesLoading, error: categoriesError } = useCategories();

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Cargando categorías...</div>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar categorías: {categoriesError}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h2>
          <p className="text-gray-600 mt-1">Administra las categorías del sistema</p>
        </div>
        <button
          onClick={() => setShowCreateCategoryDialog(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría Padre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Creación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(allCategories || []).map((category) => {
                const isParent = category.isParent !== undefined 
                  ? category.isParent 
                  : category.parentId === null;
                
                const parentCategory = category.parentId 
                  ? (allCategories || []).find(c => c.id === category.parentId)
                  : null;
                
                return (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isParent ? (
                          <FolderTree className="w-4 h-4 text-blue-500 mr-2" />
                        ) : (
                          <div className="w-4 h-4 mr-2" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parentCategory ? parentCategory.name : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.isActive !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive !== false ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.createdAt 
                        ? new Date(category.createdAt).toLocaleDateString('es-ES')
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateCategoryDialog && (
        <CreateCategoryDialog
          isOpen={showCreateCategoryDialog}
          onClose={() => setShowCreateCategoryDialog(false)}
        />
      )}
    </div>
  );
};

export default AdminCategoriesPage;

