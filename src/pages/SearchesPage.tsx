import React, { Suspense, useEffect, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { SearchDashboard } from '../components/SearchDashboard';
import { useIsMobile } from '../hooks/useIsMobile';

const MobileBottomBar = lazy(() =>
    import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

const SearchesPage: React.FC = () => {
    const location = useLocation();
    const isMobile = useIsMobile();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [location.pathname]);

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