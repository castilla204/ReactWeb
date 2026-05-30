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

export const HomePage = lazyDefault(() => import('../pages/HomePage'));
export const SearchCreationPage = lazyDefault(() => import('../pages/SearchCreationPage'));
export const SearchesPage = lazyDefault(() => import('../pages/SearchesPage'));
export const BecomeExpertPage = lazyDefault(() => import('../pages/BecomeExpertPage'));
export const ExpertPanelPage = lazyNamed(
  () => import('../pages/ExpertPanelPage'),
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
export const ServiceDetailPage = lazyDefault(() => import('../pages/ServiceDetailPage'));
export const CheckoutPage = lazyNamed(() => import('../pages/CheckoutPage'), 'CheckoutPage');
export const PreHireChatPage = lazyNamed(() => import('../pages/PreHireChatPage'), 'PreHireChatPage');
export const MessagesPage = lazyNamed(() => import('../pages/MessagesPage'), 'MessagesPage');
export const QuienesSomosPage = lazyDefault(() => import('../pages/QuienesSomosPage'));
export const ComoFuncionaPage = lazyDefault(() => import('../pages/ComoFuncionaPage'));
export const FAQPage = lazyDefault(() => import('../pages/FAQPage'));
export const FavoritesPage = lazyNamed(() => import('../pages/FavoritesPage'), 'FavoritesPage');
export const AdminDashboard = lazyDefault(() => import('../pages/admin/AdminDashboard'));
export const AdminConfigPage = lazyDefault(() => import('../pages/admin/AdminConfigPage'));
export const AdminCategoriesPage = lazyDefault(() => import('../pages/admin/AdminCategoriesPage'));
export const AdminMappingsPage = lazyDefault(() => import('../pages/admin/AdminMappingsPage'));
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
