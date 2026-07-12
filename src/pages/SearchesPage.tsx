import React, { Suspense, useEffect, lazy } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { SearchDashboard } from '../components/SearchDashboard';
import { useIsMobile } from '../hooks/useIsMobile';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin as isAdminUser } from '../utils/admin';

const MobileBottomBar = lazy(() =>
    import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

/**
 * /busquedas fusionada con la bandeja de mensajes (2026-07-08): para el cliente,
 * "Mis contrataciones" son sus conversaciones post-hire, así que redirigimos a
 * /mis-mensajes con ese filtro ya aplicado y nos ahorramos esta página. Se
 * conserva el SearchDashboard SOLO para admin, que lo usa como herramienta de
 * revisión (paginación + búsquedas sin revisar), no como bandeja personal.
 */
const SearchesPage: React.FC = () => {
    const location = useLocation();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const userIsAdmin =
        isAdminUser(user?.email) || user?.role === 'Admin' || user?.role === 'admin';

    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [location.pathname]);

    if (!userIsAdmin) {
        return <Navigate to="/messages?filter=contracts" replace />;
    }

    return (
        <>
            <SearchDashboard />
            {isMobile && (
                <Suspense fallback={null}>
                    <MobileBottomBar />
                </Suspense>
            )}
        </>
    );
};

export default SearchesPage;
