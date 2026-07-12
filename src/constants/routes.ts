/**
 * Inspecciono — mapa canónico de rutas (inglés, sin guiones en segmentos de app).
 *
 * ESTADO: rutas canónicas activas en App.tsx + redirects legacy.
 *
 * Convenciones:
 *  - Palabra simple: /messages, /login, /checkout
 *  - Jerarquía con /: /expert/panel, /appointment/schedule/:token
 *  - Landings SEO españolas: mantener slug legacy + alias inglés (ver SEO_LANDING_ALIASES)
 *  - Query params en inglés: ?filter=contracts, ?searchHireId=, ?serviceId=
 */

export const ROUTES = {
  home: '/',
  help: '/help',
  favorites: '/favorites',
  login: '/login',
  status: '/status',

  /** Buscar perito en mapa (legacy: /crear-busqueda) */
  hire: '/hire',

  /** SEO local: hub de cobertura nacional + landing por provincia */
  coverageHub: '/inspeccion-segunda-mano-espana',
  cityLanding: (citySlug: string) => `/inspeccion-segunda-mano-${citySlug}`,

  service: (id: number | string) => `/service/${id}`,
  checkout: (id: number | string) => `/checkout/${id}`,

  /** Bandeja unificada (legacy: /mis-mensajes) */
  messages: '/messages',
  /** Consulta precontrato móvil (legacy: /chat-pre-contratacion/:id) */
  inquiry: (serviceId: number | string) => `/inquiry/${serviceId}`,
  notifications: '/notifications',

  /** Contrataciones del cliente (legacy: /busquedas, /searchhire/:id) */
  hires: '/hires',
  hireDetail: (id: number | string) => `/hires/${id}`,
  /** Informe / resultados por searchId (legacy: /detalles/:id) */
  searchReport: (searchId: number | string) => `/searches/${searchId}/report`,
  /** Detalle admin por searchId (legacy: /busquedas/:id) */
  searchDetail: (searchId: number | string) => `/searches/${searchId}`,

  account: {
    transactions: '/account/transactions',
  },

  expert: {
    join: '/expert/join',
    panel: '/expert',
    inspection: (hireId: number | string) => `/expert/inspection/${hireId}`,
    stripe: {
      complete: '/expert/stripe/complete',
      refresh: '/expert/stripe/refresh',
    },
  },

  appointment: {
    schedule: (token: string) => `/appointment/schedule/${token}`,
    confirm: (token: string) => `/appointment/confirm/${token}`,
  },

  payment: {
    success: '/success',
    cancel: '/cancel',
  },

  legal: {
    privacy: '/legal/privacy',
    terms: '/legal/terms',
  },

  mfa: {
    setup: '/mfa/setup',
  },

  admin: {
    root: '/admin',
    users: '/admin/users',
    expertsEdit: (expertId: number | string) => `/admin/experts/${expertId}/edit`,
    config: '/admin/config',
    categories: '/admin/categories',
    mappings: '/admin/mappings',
    emailTemplates: '/admin/templates/email',
    notifications: '/admin/notifications',
    disputes: '/admin/disputes',
    jobs: '/admin/jobs',
  },

  /** OAuth Apple (ya referenciado en nativeAuthService) */
  auth: {
    appleCallback: '/auth/apple/callback',
  },

  listing: (id: number | string) => `/listing/${id}`,
} as const;

/**
 * Landings SEO — mantener URL española indexada; servir también alias inglés.
 * slug español → path inglés sin guiones.
 */
export const SEO_LANDING_ALIASES: Record<string, string> = {
  'inspeccion-coche-segunda-mano': '/inspections/car',
  'peritaje-piso': '/inspections/apartment',
  'inspeccion-moto-segunda-mano': '/inspections/motorcycle',
  'peritaje-maquinaria-segunda-mano': '/inspections/machinery',
  'inspeccion-bici-electrica-segunda-mano': '/inspections/ebike',
};

/** Query params — inglés en URLs nuevas */
export const QUERY = {
  filter: 'filter',
  filterContracts: 'contracts',
  filterInquiries: 'inquiries',
  searchHireId: 'searchHireId',
  serviceId: 'serviceId',
  conversationId: 'conversationId',
} as const;

/**
 * Redirects 301 permanentes: path legacy → path canónico.
 * Incluye rutas que hoy dan 404 o están fragmentadas.
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
  '/explorar': ROUTES.home,
  '/ayuda': ROUTES.help,
  '/favoritos': ROUTES.favorites,
  '/crear-busqueda': ROUTES.hire,
  '/mis-mensajes': ROUTES.messages,
  '/busquedas': ROUTES.hires,
  '/transacciones': ROUTES.account.transactions,
  '/become-expert': ROUTES.expert.join,
  '/expert-panel': ROUTES.expert.panel,
  '/complete-onboarding': ROUTES.expert.stripe.complete,
  '/refresh-onboarding': ROUTES.expert.stripe.refresh,
  '/quienes-somos': ROUTES.help,
  '/como-funciona': ROUTES.help,
  '/faq': ROUTES.help,
  '/privacy-policy.html': ROUTES.legal.privacy,
  '/terms.html': ROUTES.legal.terms,
  '/mfa/setup-required': ROUTES.mfa.setup,
  // Backend roto hoy → destino canónico
  '/profile': ROUTES.expert.panel,
};

/** Prefijos legacy que requieren lógica startsWith (no redirect simple) */
export const LEGACY_PREFIX_REDIRECTS: Array<{ from: string; to: string }> = [
  { from: '/chat-pre-contratacion/', to: '/inquiry/' },
  { from: '/searchhire/', to: '/hires/' },
  { from: '/detalles/', to: '/searches/' }, // → /searches/:id/report (caso especial)
  { from: '/coordinar-cita/', to: '/appointment/schedule/' },
  { from: '/confirmar-cita/', to: '/appointment/confirm/' },
  { from: '/expert-panel/inspeccion/', to: '/expert/inspection/' },
  { from: '/admin/email-templates', to: ROUTES.admin.emailTemplates },
];

/** Rutas donde el ChatbotFab se oculta (actualizar al migrar) */
export const CHATBOT_HIDDEN_PREFIXES = [
  '/admin',
  '/inquiry/',
  '/messages',
  '/service/',
  '/checkout/',
  '/hire',
] as const;

/** Rutas con bottom tab bar móvil */
export const TAB_BAR_PATHS = new Set([ROUTES.home, ROUTES.hires, ROUTES.help]);
