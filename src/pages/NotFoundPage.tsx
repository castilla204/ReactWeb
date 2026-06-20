import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ErrorState } from '../components/feedback/ErrorState';

/**
 * Página 404 - Recurso no encontrado
 */
export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
            {/* 🛡️ SEO: 404 SIEMPRE noindex (mata duplicate-content + ahorra crawl budget).
                Idealmente el servidor también devolvería HTTP 404 — pendiente Fase 3 (nginx). */}
            <SEO
                title="Página no encontrada (404) | Inspecciono"
                description="La página que buscas no existe o ha sido movida. Vuelve al inicio para seguir explorando inspecciones y peritajes."
                noindex
            />
            <ErrorState
                variant="notFound"
                primaryAction={{ label: 'Ir al inicio', onClick: () => navigate('/') }}
                secondaryAction={{ label: 'Volver atrás', onClick: () => navigate(-1) }}
            />
        </>
    );
};
