// ✅ API: localhost en desarrollo, producción en render
const PRODUCTION_API = 'https://newapi-yn9v.onrender.com';

function isLocalhostApiUrl(url: string): boolean {
    return /localhost|127\.0\.0\.1/i.test(url);
}

/** v0 preview y sandboxes remotos no tienen backend en localhost:7124. */
function isRemotePreviewHost(): boolean {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return host.endsWith('.vusercontent.net') || host.endsWith('.vercel.app');
}

/** Página HTTPS remota (v0): http://localhost está bloqueado por el navegador (PNA). */
function isSecureRemotePreview(): boolean {
    return typeof window !== 'undefined'
        && window.location.protocol === 'https:'
        && isRemotePreviewHost();
}

const getApiBaseUrl = (): string => {
    const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');

    if (import.meta.env.DEV) {
        // v0/Vercel preview: same-origin '' → proxy Vite → Render (sin CORS ni localhost).
        if (isSecureRemotePreview()) {
            if (envUrl && !isLocalhostApiUrl(envUrl)) return envUrl;
            return '';
        }
        if (envUrl) return envUrl;
        return 'http://localhost:7124';
    }

    if (envUrl && !isLocalhostApiUrl(envUrl)) return envUrl;
    return PRODUCTION_API;
};

const API_PATH = '/api';

export const API_CONFIG = {
    get baseUrl() {
        return getApiBaseUrl();
    },
    endpoints: {
        auth: {
            googleAuth: `${API_PATH}/User/google-auth`,
            // 🛡️ Round 16: Apple OAuth ahora vive bajo /api/Auth (mismo controller que email/password).
            appleAuth: `${API_PATH}/Auth/apple-auth`,
            sendVerification: `${API_PATH}/User/send-verification`,
            verifyCode: `${API_PATH}/User/verify-code`,
            refreshToken: `${API_PATH}/auth/refresh-token`,
            logout: `${API_PATH}/auth/logout`,
            revokeAll: `${API_PATH}/auth/revoke-all`,
            // 🛡️ Round 16: nuevos endpoints email/password + OTP.
            register: `${API_PATH}/Auth/register`,
            verifyEmail: `${API_PATH}/Auth/verify-email`,
            resendOtp: `${API_PATH}/Auth/resend-otp`,
            loginPassword: `${API_PATH}/Auth/login-password`,
            forgotPassword: `${API_PATH}/Auth/forgot-password`,
            resetPassword: `${API_PATH}/Auth/reset-password`,
        },
        mfa: {
            setup: `${API_PATH}/auth/mfa/setup`,
            enable: `${API_PATH}/auth/mfa/enable`,
            verify: `${API_PATH}/auth/mfa/verify`,
            disable: `${API_PATH}/auth/mfa/disable`,
            status: `${API_PATH}/auth/mfa/status`,
        },
        categories: {
            list: `${API_PATH}/Categories`,
            create: `${API_PATH}/Categories`,
            parents: `${API_PATH}/Categories/parents`,
        },
        serviceTypes: {
            list: `${API_PATH}/ServiceType/public`,
        },
        search: {
            create: `${API_PATH}/Search`,
            createWithHire: `${API_PATH}/Search/create-with-hire`,
            list: `${API_PATH}/Search`,
            listAll: `${API_PATH}/Search/all`,
            get: (id: number) => `${API_PATH}/Search/${id}`,
            delete: (id: number) => `${API_PATH}/Search/${id}`,
            update: (id: number) => `${API_PATH}/Search/${id}`,
            toggleActive: (id: number) => `${API_PATH}/Search/${id}/toggle-active`,
            revise: (id: number) => `${API_PATH}/Search/${id}/revise`,
            // ✅ ENDPOINT OPTIMIZADO (details-additional eliminado)
            // ❌ ELIMINADO: detailsComplete - Usar expert.hires.detailsComplete en su lugar
            // detailsComplete: (id: number) => `${API_PATH}/Search/${id}/details-complete`,
        },
        searchParameters: {
            create: (searchId: number) => `${API_PATH}/SearchParameter/${searchId}`,
            get: (searchId: number) => `${API_PATH}/SearchParameter/${searchId}`,
            update: (searchId: number) => `${API_PATH}/SearchParameter/${searchId}`,
        },
        searchResults: {
            list: (searchId: number) => `${API_PATH}/SearchResult/${searchId}/results`,
            filtered: {
                list: (searchId: number) => `${API_PATH}/SearchResultFiltered/search/${searchId}`,
                add: (searchId: number, adId: string) => `${API_PATH}/SearchResultFiltered/filter/${searchId}/${adId}`,
                remove: (filteredId: number) => `${API_PATH}/SearchResultFiltered/${filteredId}`,
            },
        },
        likes: {
            check: (adId: string) => `${API_PATH}/Likes/check/${adId}`,
            toggle: (adId: string) => `${API_PATH}/Likes/${adId}`,
        },
        favorites: {
            toggle: `${API_PATH}/Favorites/toggle`,
            add: `${API_PATH}/Favorites`,
            remove: (searchServiceId: number) => `${API_PATH}/Favorites/${searchServiceId}`,
            check: (searchServiceId: number) => `${API_PATH}/Favorites/check/${searchServiceId}`,
            checkMultiple: `${API_PATH}/Favorites/check-multiple`,
            list: (page?: number, pageSize?: number) => {
                const params = new URLSearchParams();
                if (page) params.append('page', page.toString());
                if (pageSize) params.append('pageSize', pageSize.toString());
                return `${API_PATH}/Favorites${params.toString() ? `?${params.toString()}` : ''}`;
            },
            count: (searchServiceId: number) => `${API_PATH}/Favorites/service/${searchServiceId}/count`,
        },
        subscription: {
            plans: `${API_PATH}/Subscription/plans`,
            current: `${API_PATH}/Subscription/current`,
            details: `${API_PATH}/Subscription/details`,
            createCheckout: `${API_PATH}/Subscription/create-checkout-session`,
            cancel: `${API_PATH}/Subscription/cancel`,
            loadMoney: `${API_PATH}/Subscription/load-money`,
            hireService: `${API_PATH}/Subscription/hire-service`,
            expertOnboarding: `${API_PATH}/Subscription/expert-onboarding`,
            onboardingStatus: `${API_PATH}/Subscription/onboarding-status`,
            restartOnboarding: `${API_PATH}/Subscription/restart-onboarding`,
            syncStripeStatus: `${API_PATH}/Subscription/sync-stripe-status`,
            expertStatus: `${API_PATH}/Subscription/expert-status`,
            createAccountLink: `${API_PATH}/Subscription/create-account-link`,
            // 🛡️ Round 12 — D1: Express Dashboard login link (vista payouts/balance/transactions).
            // Distinto de createAccountLink que abre onboarding KYC.
            createLoginLink: `${API_PATH}/Subscription/create-login-link`,
        },
        notifications: {
            list: `${API_PATH}/Notification`,
            adminList: `${API_PATH}/Notification/admin`,
            create: `${API_PATH}/Notification`,
            delete: (id: string) => `${API_PATH}/Notification/${id}`,
            markAsRead: (id: string) => `${API_PATH}/Notification/${id}/read`,
            markAllAsRead: `${API_PATH}/Notification/read-all`,
            unreadCount: `${API_PATH}/Notification/unread-count`,
        },
        deviceToken: {
            register: `${API_PATH}/DeviceToken`,
            // DELETE se construye en runtime: `${register}/${encodeURIComponent(token)}`
        },
        expert: {
            profile: `${API_PATH}/User/expert-profile`,
            becomeExpert: `${API_PATH}/User/become-expert`,
            toggleVacationMode: `${API_PATH}/User/toggle-vacation-mode`,
            services: {
                list: `${API_PATH}/SearchService`,
                create: `${API_PATH}/SearchService`,
                get: (id: number) => `${API_PATH}/SearchService/${id}`,
                getByExpert: (expertId: number) => `${API_PATH}/SearchService/expert/${expertId}`,
                getByHireId: (hireId: number) => `${API_PATH}/SearchService/GetServiceByHireId/${hireId}`,
                reactivate: (id: number) => `${API_PATH}/SearchService/${id}/reactivate`,
                mapExperts: `${API_PATH}/SearchService/map-experts`,
                homepageWall: `${API_PATH}/SearchService/homepage-wall`, // ✅ Endpoint público para homepage
                detectedCountryFromIp: `${API_PATH}/SearchService/detected-country-from-ip`,
            },
            hires: {
                createCheckout: (serviceId: number) => `${API_PATH}/SearchHire/create-checkout-session/${serviceId}`,
                webhook: `${API_PATH}/SearchHire/webhook`,
                listAsClient: `${API_PATH}/SearchHire/client`,
                listAsExpert: `${API_PATH}/SearchHire/expert`,
                updateStatus: (hireId: number) => `${API_PATH}/SearchHire/${hireId}/status`,
                detailsComplete: (searchHireId: number) => `${API_PATH}/searchhire/${searchHireId}/details-complete`,
            },
        },
        users: {
            list: `${API_PATH}/User/all`,
            block: (userId: number) => `${API_PATH}/User/${userId}/block`,
            delete: (userId: number) => `${API_PATH}/User/${userId}`,
        },
        // 🖼️ Avatar de cuenta (foto de perfil unificada con la foto pública del experto).
        account: {
            avatar: `${API_PATH}/User/avatar`, // POST (multipart) sube/cambia · DELETE quita
            profile: `${API_PATH}/User/profile`, // PUT actualiza el nombre (el email no es editable)
        },
        support: {
            message: `${API_PATH}/SupportChat/message`,
        },
        ai: {
            rewriteDescription: `${API_PATH}/AISearch/rewrite-description`,
        },
        chat: {
            conversation: `${API_PATH}/chat/conversation`,
            conversationBySearchHire: (searchHireId: number) => `${API_PATH}/chat/by-searchhire/${searchHireId}`,
            conversationByService: (searchServiceId: number) => `${API_PATH}/Chat/conversation-by-service?searchServiceId=${searchServiceId}`,
            preHireConversations: `${API_PATH}/Chat/pre-hire-conversations`,  // ✅ NUEVO: Lista de conversaciones pre-contratación del experto
            myConversations: `${API_PATH}/Chat/my-conversations`,  // ✅ NUEVO: Todas las conversaciones del cliente (pre y post contratación)
            expertConversations: `${API_PATH}/Chat/expert-conversations`,  // ✅ NUEVO: Bandeja del experto (pre y post contratación), contraparte = cliente
            message: `${API_PATH}/chat/message`,
            markAsRead: (messageId: number) => `${API_PATH}/chat/message/${messageId}/read`,
            typing: `${API_PATH}/chat/typing`,
            conversationById: (conversationId: number) => `${API_PATH}/chat/conversation/${conversationId}`,
            ws: `${API_PATH}/chat/ws`,
            deliverable: (searchHireId: number) => `${API_PATH}/Chat/deliverable/${searchHireId}`,
        },
        // 🤝 Magic link del vendedor (sin login; el token es la credencial).
        sellerBooking: {
            context: (token: string) => `${API_PATH}/seller-booking/${token}`,
        },
        // 🔧 Confirmación del experto (sin login; el token es la credencial).
        expertConfirmation: {
            context: (token: string) => `${API_PATH}/expert-confirmation/${token}`,
        },
        appointment: {
            get: (id: number) => `${API_PATH}/appointment/${id}`,
            getBySearchHire: (searchHireId: number) => `${API_PATH}/appointment/search-hire/${searchHireId}`,
            myAppointments: `${API_PATH}/appointment/my-appointments`,
            propose: (searchHireId: number) => `${API_PATH}/appointment/propose/${searchHireId}`,
            confirm: `${API_PATH}/appointment/confirm`,
            reject: `${API_PATH}/appointment/reject`,
            cancel: `${API_PATH}/appointment/cancel`,
            submitReport: (appointmentId: number) => `${API_PATH}/Appointment/submit-report/${appointmentId}`,
            adminMetrics: `${API_PATH}/appointment/admin/metrics`,
            adminCheckTimers: `${API_PATH}/appointment/admin/check-timers`,
            statuses: `${API_PATH}/appointment/statuses`,
            moneyDistributionConfig: `${API_PATH}/appointment/money-distribution-config`,
        },
        appointmentConfig: {
            appointmentStatus: `${API_PATH}/AppointmentConfig/appointment-status`,
            appointmentStatusConfigs: `${API_PATH}/AppointmentConfig/appointment-status-configs`,
            appointmentStatusById: (id: number) => `${API_PATH}/AppointmentConfig/appointment-status/${id}`,
            serviceTypeCategory: `${API_PATH}/AppointmentConfig/service-type-category`,
            serviceTypeCategoryById: (id: number) => `${API_PATH}/AppointmentConfig/service-type-category/${id}`,
            serviceTypeCategoryByCategory: (categoryId: number) => `${API_PATH}/AppointmentConfig/service-type-category/category/${categoryId}`,
            categoryServiceType: `${API_PATH}/CategoryServiceTypeConfig`,
            categoryServiceTypeById: (id: number) => `${API_PATH}/CategoryServiceTypeConfig/${id}`,
            categoryServiceTypeByCategory: (categoryId: number) => `${API_PATH}/CategoryServiceTypeConfig/category/${categoryId}`,
            categoryServiceTypeByServiceType: (serviceTypeCategoryId: number) => `${API_PATH}/CategoryServiceTypeConfig/service-type/${serviceTypeCategoryId}`,
            // Endpoints específicos para cada tipo de configuración
            granularConfigurations: `${API_PATH}/AppointmentConfig/granular-configurations`,
            configurationsByCategory: `${API_PATH}/AppointmentConfig/configurations-by-category`,
            moneyDistribution: `${API_PATH}/AppointmentConfig/money-distribution`,
            moneyDistributionPublic: `${API_PATH}/AppointmentConfig/money-distribution/public`,
            // ✅ NUEVOS ENDPOINTS PARA GESTIÓN DE ESTADOS DE FINALIZACIÓN
            allStatuses: `${API_PATH}/AppointmentConfig/all-statuses`,
            updateFinalizationStatus: (statusId: number) => `${API_PATH}/AppointmentConfig/update-finalization-status/${statusId}`,
        },
        dispute: {
            create: `${API_PATH}/Dispute/dispute-service`,
            list: `${API_PATH}/dispute/all`,
            myDisputes: `${API_PATH}/dispute/my-disputes`,
            get: (id: number) => `${API_PATH}/dispute/${id}`,
            getDetails: (id: number) => `${API_PATH}/dispute/${id}/details`,
            getSearch: (id: number) => `${API_PATH}/dispute/${id}/search`,
            resolve: (id: number) => `${API_PATH}/dispute/${id}/resolve`,
            expertResponse: (id: number) => `${API_PATH}/dispute/${id}/expert-response`,
            details: (searchHireId: number) => `${API_PATH}/Dispute/details/${searchHireId}`,
            debug: (id: number) => `${API_PATH}/dispute/${id}/debug`,
        },
        deliverableTypes: {
            getAll: `${API_PATH}/DeliverableType`,
            select: `${API_PATH}/DeliverableType/select`,
        },
        systemStatus: {
            // Estados del sistema
            statuses: `${API_PATH}/SystemStatus/statuses`,
            statusesById: (id: number) => `${API_PATH}/SystemStatus/statuses/${id}`,
            statusesByType: (statusType: string) => `${API_PATH}/SystemStatus/statuses?statusType=${statusType}`,
            
            // Mapeos de estado
            mappings: `${API_PATH}/SystemStatus/mappings`,
            mappingsById: (id: number) => `${API_PATH}/SystemStatus/mappings/${id}`,
            
            // Configuraciones
            configurations: `${API_PATH}/SystemStatus/configurations`,
        },
        review: {
            expert: (expertId: number) => `${API_PATH}/Review/expert/${expertId}`,
        },
        accountDeletion: {
            status: `${API_PATH}/AccountDeletion/status`,
            delete: `${API_PATH}/AccountDeletion/delete`,
            requestOtp: `${API_PATH}/AccountDeletion/request-otp`,
            adminStatus: (userId: number) => `${API_PATH}/AccountDeletion/admin/status/${userId}`,
            adminDelete: (userId: number) => `${API_PATH}/AccountDeletion/admin/delete/${userId}`,
        },
        financialTransaction: {
            myTransactions: `${API_PATH}/FinancialTransaction/my-transactions`,
        },
        userSettings: {
            get: `${API_PATH}/UserSettings`,
            update: `${API_PATH}/UserSettings`,
            timezones: `${API_PATH}/UserSettings/timezones`,
        },
        admin: {
            stripe: {
                mode: `${API_PATH}/Admin/stripe/mode`,
                toggleMode: `${API_PATH}/Admin/stripe/toggle-mode`,
                webhooks: `${API_PATH}/Admin/stripe/webhooks`,
                webhook: (webhookId: string) => `${API_PATH}/Admin/stripe/webhooks/${webhookId}`,
            },
            emailTemplatePreviews: `${API_PATH}/Admin/email-templates/previews`,
        },
        legal: {
            terms: `${API_PATH}/Legal/terms`,
            privacy: `${API_PATH}/Legal/privacy`,
        },
    },
};
