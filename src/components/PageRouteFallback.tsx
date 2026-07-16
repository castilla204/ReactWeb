import { AppPageSkeleton } from './ui/generic-page-skeletons';

/**
 * Fallback por defecto mientras carga un chunk de ruta.
 *
 * Antes era un spinner centrado ("Preparando página…") — un estado genérico que
 * saltaba visualmente al aparecer la página real. Ahora pinta un skeleton de
 * página fiel (topbar + contenido) que comparte chrome con la app, así el
 * reemplazo skeleton → contenido no da tumbo. Las rutas de alto tráfico pasan su
 * propio skeleton bespoke vía `RouteSuspense fallback={…}`.
 */
export const PageRouteFallback: React.FC = () => <AppPageSkeleton />;
