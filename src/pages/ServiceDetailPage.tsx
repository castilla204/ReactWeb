import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ServiceReviewPage } from './ServiceReviewPage';
import { useApi } from '../hooks/useApi';
import { API_CONFIG } from '../config/api';
import { Service } from '../hooks/useServices';

const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { fetchApi } = useApi();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadService = async () => {
      if (!serviceId) {
        setError('ID de servicio no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const id = parseInt(serviceId, 10);
        if (isNaN(id)) {
          setError('ID de servicio no válido');
          setLoading(false);
          return;
        }

        const url = API_CONFIG.endpoints.expert.services.get(id);
        const fetchedService = await fetchApi<Service>(url);
        
        if (fetchedService) {
          setService(fetchedService);
        } else {
          setError('Servicio no encontrado');
        }
      } catch (err) {
        console.error('Error loading service:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el servicio');
      } finally {
        setLoading(false);
      }
    };

    loadService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleContinue = () => {
    // Navegar a la página de creación de búsqueda con el serviceId
    if (service) {
      const params = new URLSearchParams();
      params.append('serviceId', service.id.toString());
      if (service.serviceTypeId) {
        params.append('serviceTypeId', service.serviceTypeId.toString());
      }
      if (service.categoryId) {
        params.append('categoryId', service.categoryId.toString());
      }
      navigate(`/crear-busqueda?${params.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando servicio...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Servicio no encontrado'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <ServiceReviewPage
      serviceId={service.id}
      expertProfilePicture={service.expert?.profilePictureUrl}
      expertName={service.expert?.user?.name}
      servicePrice={service.price}
      serviceDescription={service.conditions}
      serviceImageUrls={service.imageUrls || []}
      categoryId={service.categoryId}
      serviceTypeId={service.serviceTypeId}
      currentStep={1}
      totalSteps={2}
      onBack={handleBack}
      onContinue={handleContinue}
    />
  );
};

export default ServiceDetailPage;

