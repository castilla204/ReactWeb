import React, { useState } from 'react';
import { Plus, FolderTree, Folder } from 'lucide-react';
import { useCategories } from '../../contexts/CategoryContext';
import { CreateCategoryDialog } from '../../components/CreateCategoryDialog';
import {
  AdminButton,
  AdminCard,
  AdminCardHeader,
  AdminCardBody,
  AdminStatusPill,
  AdminTable,
  AdminTHead,
  AdminTH,
  AdminTBody,
  AdminTR,
  AdminTD,
  AdminEmptyState,
  AdminTableSkeleton,
} from '../../components/admin/ui';

const AdminCategoriesPage: React.FC = () => {
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const { categories: allCategories, loading: categoriesLoading, error: categoriesError } = useCategories();

  const newCategoryButton = (
    <AdminButton
      variant="brand"
      icon={<Plus className="h-4 w-4" />}
      onClick={() => setShowCreateCategoryDialog(true)}
    >
      Nueva Categoría
    </AdminButton>
  );

  const count = allCategories?.length ?? 0;
  const headerDescription =
    count === 0
      ? 'Administra las categorías del sistema'
      : `${count} ${count === 1 ? 'categoría' : 'categorías'} en el sistema`;

  return (
    <>
      <AdminCard>
        <AdminCardHeader
          title="Categorías"
          description={headerDescription}
          actions={newCategoryButton}
        />

        {categoriesLoading ? (
          <AdminTableSkeleton rows={6} cols={5} />
        ) : categoriesError ? (
          <AdminCardBody>
            <AdminEmptyState
              icon={<FolderTree className="h-6 w-6" />}
              title="No se pudieron cargar las categorías"
              description={categoriesError}
            />
          </AdminCardBody>
        ) : count === 0 ? (
          <AdminEmptyState
            icon={<FolderTree className="h-6 w-6" />}
            title="Sin categorías"
            description="Crea la primera categoría con «Nueva Categoría»."
            action={newCategoryButton}
          />
        ) : (
          <AdminTable zebra>
            <AdminTHead>
              <AdminTH>ID</AdminTH>
              <AdminTH>Nombre</AdminTH>
              <AdminTH>Categoría Padre</AdminTH>
              <AdminTH>Estado</AdminTH>
              <AdminTH>Fecha de Creación</AdminTH>
            </AdminTHead>
            <AdminTBody>
              {(allCategories || []).map((category) => {
                const isParent = category.isParent !== undefined
                  ? category.isParent
                  : category.parentId === null;

                const parentCategory = category.parentId
                  ? (allCategories || []).find((c) => c.id === category.parentId)
                  : null;

                return (
                  <AdminTR key={category.id}>
                    <AdminTD>{category.id}</AdminTD>
                    <AdminTD>
                      <div className="flex items-center gap-2">
                        {isParent ? (
                          <FolderTree className="h-4 w-4 text-[hsl(var(--ap-brand))]" />
                        ) : (
                          <Folder className="h-4 w-4 text-[hsl(var(--ap-muted))]" />
                        )}
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </AdminTD>
                    <AdminTD>{parentCategory ? parentCategory.name : '-'}</AdminTD>
                    <AdminTD>
                      <AdminStatusPill tone={category.isActive !== false ? 'success' : 'neutral'}>
                        {category.isActive !== false ? 'Activa' : 'Inactiva'}
                      </AdminStatusPill>
                    </AdminTD>
                    <AdminTD>
                      {category.createdAt
                        ? new Date(category.createdAt).toLocaleDateString('es-ES')
                        : '-'}
                    </AdminTD>
                  </AdminTR>
                );
              })}
            </AdminTBody>
          </AdminTable>
        )}
      </AdminCard>

      <CreateCategoryDialog
        open={showCreateCategoryDialog}
        onOpenChange={setShowCreateCategoryDialog}
      />
    </>
  );
};

export default AdminCategoriesPage;
