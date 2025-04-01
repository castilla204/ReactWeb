// API configuration
export const API_CONFIG = {
    baseUrl: import.meta.env.VITE_API_URL || 'http://new-api-svc:80',
    endpoints: {
        auth: {
            googleAuth: '/api/User/google-auth',
            sendVerification: '/api/User/send-verification',
            verifyCode: '/api/User/verify-code',
        },
        categories: {
            list: '/api/Categories',
        },
        search: {
            create: '/api/Search',
            list: '/api/Search',
            listAll: '/api/Search/all',
            get: (id: number) => `/api/Search/${id}`,
            delete: (id: number) => `/api/Search/${id}`,
            update: (id: number) => `/api/Search/${id}`,
            toggleActive: (id: number) => `/api/Search/${id}/toggle-active`,
            revise: (id: number) => `/api/Search/${id}/revise`,
        },
        searchParameters: {
            create: (searchId: number) => `/api/SearchParameter/${searchId}`,
            get: (searchId: number) => `/api/SearchParameter/${searchId}`,
            update: (searchId: number) => `/api/SearchParameter/${searchId}`,
        },
        searchResults: {
            list: (searchId: number) => `/api/SearchResult/${searchId}/results`,
            filtered: {
                list: (searchId: number) => `/api/SearchResultFiltered/search/${searchId}`,
                add: (searchId: number, adId: string) => `/api/SearchResultFiltered/filter/${searchId}/${adId}`,
                remove: (filteredId: number) => `/api/SearchResultFiltered/${filteredId}`,
            },
        },
        likes: {
            check: (adId: string) => `/api/Likes/check/${adId}`,
            toggle: (adId: string) => `/api/Likes/${adId}`,
        },
        subscription: {
            plans: '/api/Subscription/plans',
            current: '/api/Subscription/current',
            details: '/api/Subscription/details',
            createCheckout: '/api/Subscription/create-checkout-session',
        },
        notifications: {
            list: '/api/Notification',
            create: '/api/Notification',
            delete: (id: string) => `/api/Notification/${id}`,
            markAsRead: (id: string) => `/api/Notification/${id}/read`,
        },
    },
}