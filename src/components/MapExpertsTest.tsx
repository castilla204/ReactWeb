import React, { useEffect } from 'react';
import { useMapExperts } from '../hooks/useMapExperts';

interface MapExpertsTestProps {
  categoryId: number | null;
  serviceTypeId: number | null;
}

export const MapExpertsTest: React.FC<MapExpertsTestProps> = ({ categoryId, serviceTypeId }) => {
  const { experts, totalCount, loading, error } = useMapExperts(categoryId, serviceTypeId);

  useEffect(() => {
    console.log('🧪 MapExpertsTest - datos actualizados:', { 
      experts: experts.length, 
      totalCount, 
      loading, 
      error 
    });
  }, [experts, totalCount, loading, error]);

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg m-4">
      <h3 className="font-bold text-lg mb-2">🧪 TEST: Map Experts</h3>
      <div className="space-y-2 text-sm">
        <div><strong>Category ID:</strong> {categoryId}</div>
        <div><strong>Service Type ID:</strong> {serviceTypeId}</div>
        <div><strong>Loading:</strong> {loading ? 'Sí' : 'No'}</div>
        <div><strong>Error:</strong> {error || 'Ninguno'}</div>
        <div><strong>Total Count:</strong> {totalCount}</div>
        <div><strong>Experts:</strong> {experts.length}</div>
        {experts.length > 0 && (
          <div>
            <strong>Primer experto:</strong>
            <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(experts[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
