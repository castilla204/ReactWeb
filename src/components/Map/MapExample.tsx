import React, { useState } from 'react';
import { MapContainer } from './MapContainer';
import { Service } from '../../hooks/useServiceLoader';

/**
 * Ejemplo de uso del componente MapContainer
 * 
 * Este componente muestra cómo integrar el mapa profesional
 * con carga dinámica de servicios en tu aplicación
 */
export const MapExample: React.FC = () => {
  const [categoryId, setCategoryId] = useState<number | null>(1);
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const isMobile = window.innerWidth < 768;

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    console.log('Servicio seleccionado:', service);
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Controles opcionales */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
          Configuración del Mapa
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>
            Category ID:
            <input
              type="number"
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
              style={{ marginLeft: '8px', padding: '4px 8px', width: '80px' }}
            />
          </label>
          <label>
            Service Type ID:
            <input
              type="number"
              value={serviceTypeId || ''}
              onChange={(e) => setServiceTypeId(e.target.value ? parseInt(e.target.value) : null)}
              style={{ marginLeft: '8px', padding: '4px 8px', width: '80px' }}
            />
          </label>
        </div>
      </div>

      {/* Información del servicio seleccionado */}
      {selectedService && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            right: isMobile ? '20px' : 'auto',
            maxWidth: isMobile ? '100%' : '400px',
            zIndex: 1000,
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
            {selectedService.name}
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
            Precio: €{Math.round(selectedService.price)}
          </p>
          {selectedService.type && (
            <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
              Tipo: {selectedService.type}
            </p>
          )}
        </div>
      )}

      {/* Mapa */}
      <MapContainer
        categoryId={categoryId}
        serviceTypeId={serviceTypeId}
        initialCenter={{ lat: 40.4168, lng: -3.7038 }} // Madrid
        initialZoom={12}
        onServiceSelect={handleServiceSelect}
        selectedServiceId={selectedService?.id}
        isMobile={isMobile}
      />
    </div>
  );
};
