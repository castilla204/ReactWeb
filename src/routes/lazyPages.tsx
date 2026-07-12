import { lazy, type ComponentType } from 'react';

function lazyDefault<T extends { default: ComponentType<unknown> }>(
  factory: () => Promise<T>,
) {
  return lazy(() => factory().then((m) => ({ default: m.default })));
}

function lazyNamed<T extends Record<string, ComponentType<unknown>>>(
  factory: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(() =>
    factory().then((m) => ({
      default: m[exportName] as ComponentType<unknown>,
    })),
  );
}

// HomePage se importa de forma eager en App.tsx (shell persistente, sin swap de
// skeleton de ruta). El export lazy queda por compatibilidad con prefetchRoutes.
const importHomePage = () => import('../pages/HomePage');
// 🛡️ Round 15 — R5 FIX: LoginPage real para que navigate('/login') no caiga en 404.
export const LoginPage = lazyDefault(() => import('../pages/LoginPage'));
export const SearchCreationPage = lazyDefault(() => import('../pages/SearchCreationPage'));
export const SearchesPage = lazyDefault(() => import('../pages/SearchesPage'));
export const BecomeExpertPage = lazyDefault(() => import('../pages/BecomeExpertPage'));
const importExpertPanelPage = () => import('../pages/ExpertPanelPage');
const expertPanelWarmup =
  typeof window !== 'undefined' && window.location.pathname === '/expert'
    ? importExpertPanelPage()
    : null;
export const ExpertPanelPage = lazyNamed(
  () => expertPanelWarmup ?? importExpertPanelPage(),
  'ExpertPanelPage',
);
export const StripeOnboardingReturnPage = lazyNamed(
  () => import('../pages/StripeOnboardingReturnPage'),
  'StripeOnboardingReturnPage',
);
export const SearchResultsPage = lazyNamed(
  () => import('../pages/SearchResultsPage'),
  'SearchResultsPage',
);
export const TransactionsPage = lazyDefault(() => import('../pages/TransactionsPage'));
export const ExpertInspectionPage = lazyDefault(() => import('../pages/ExpertInspectionPage'));
export const SellerBookingPage = lazyDefault(() => import('../pages/SellerBookingPage'));
export const ExpertConfirmationPage = lazyDefault(() => import('../pages/ExpertConfirmationPage'));
export const ServiceDetailPage = lazyDefault(() => import('../pages/ServiceDetailPage'));
export const CheckoutPage = lazyNamed(() => import('../pages/CheckoutPage'), 'CheckoutPage');
export const PreHireChatPage = lazyNamed(() => import('../pages/PreHireChatPage'), 'PreHireChatPage');
export const MessagesPage = lazyNamed(() => import('../pages/MessagesPage'), 'MessagesPage');
export const CentroAyudaPage = lazyDefault(() => import('../pages/CentroAyudaPage'));
// lazy() directo (no lazyDefault): la página recibe la prop `slug` y lazyDefault
// borra el tipado de props (ComponentType<unknown> → TS2322 en App.tsx).
export const CategoryLandingPage = lazy(() => import('../pages/CategoryLandingPage'));
// Landings SEO locales por provincia + hub de cobertura.
export const CityLandingPage = lazy(() => import('../pages/CityLandingPage'));
export const CoverageHubPage = lazyDefault(() => import('../pages/CoverageHubPage'));
export const FavoritesPage = lazyNamed(() => import('../pages/FavoritesPage'), 'FavoritesPage');
// 🛡️ MUD-DI — página full-page para emails que apuntan a /notifications.
export const NotificationsPage = lazyDefault(() => import('../pages/NotificationsPage'));
export const AdminDashboard = lazyDefault(() => import('../pages/admin/AdminDashboard'));
export const AdminConfigPage = lazyDefault(() => import('../pages/admin/AdminConfigPage'));
export const AdminCategoriesPage = lazyDefault(() => import('../pages/admin/AdminCategoriesPage'));
export const AdminMappingsPage = lazyDefault(() => import('../pages/admin/AdminMappingsPage'));
export const AdminEmailTemplatesPage = lazyDefault(() => import('../pages/admin/AdminEmailTemplatesPage'));
export const AdminExpertEditPage = lazyDefault(() => import('../pages/admin/AdminExpertEditPage'));
export const MFASetupPage = lazyNamed(() => import('../pages/MFASetupPage'), 'MFASetupPage');
export const SearchDetails = lazyDefault(() => import('../components/SearchDetails'));
export const UserManagement = lazyNamed(
  () => import('../components/UserManagement'),
  'UserManagement',
);
export const NotificationManagement = lazyDefault(
  () => import('../components/NotificationManagement'),
);
export const DisputePanel = lazyNamed(() => import('../components/DisputePanel'), 'DisputePanel');
export const HangfirePanel = lazyDefault(() => import('../components/HangfirePanel'));
