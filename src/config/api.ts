// Development server URL - only used in development
const DEV_SERVER = 'http://localhost:7124';

// Base API path that's always used
const API_PATH = '/api';

// In development, use the full URL. In production, use relative path
const API_BASE = import.meta.env.DEV ? DEV_SERVER + API_PATH : API_PATH;

export const API_CONFIG = {
    baseUrl: import.meta.env.DEV ? DEV_SERVER : '',  // Full URL in dev, empty for production
    endpoints: {
        auth: {
            googleAuth: `${API_BASE}/User/google-auth`,
            sendVerification: `${API_BASE}/User/send-verification`,
            verifyCode: `${API_BASE}/User/verify-code`,
        },
        categories: {
            list: `${API_BASE}/Categories`,
        },
        search: {
            create: `${API_BASE}/Search`,
            list: `${API_BASE}/Search`,
            listAll: `${API_BASE}/Search/all`,
            get: (id: number) => `${API_BASE}/Search/${id}`,
            delete: (id: number) => `${API_BASE}/Search/${id}`,
            update: (id: number) => `${API_BASE}/Search/${id}`,
            toggleActive: (id: number) => `${API_BASE}/Search/${id}/toggle-active`,
            revise: (id: number) => `${API_BASE}/Search/${id}/revise`,
        },
        searchParameters: {
            create: (searchId: number) => `${API_BASE}/SearchParameter/${searchId}`,
            get: (searchId: number) => `${API_BASE}/SearchParameter/${searchId}`,
            update: (searchId: number) => `${API_BASE}/SearchParameter/${searchId}`,
        },
        searchResults: {
            list: (searchId: number) => `${API_BASE}/SearchResult/${searchId}/results`,
            filtered: {
                list: (searchId: number) => `${API_BASE}/SearchResultFiltered/search/${searchId}`,
                add: (searchId: number, adId: string) => `${API_BASE}/SearchResultFiltered/filter/${searchId}/${adId}`,
                remove: (filteredId: number) => `${API_BASE}/SearchResultFiltered/${filteredId}`,
            },
        },
        likes: {
            check: (adId: string) => `${API_BASE}/Likes/check/${adId}`,
            toggle: (adId: string) => `${API_BASE}/Likes/${adId}`,
        },
        subscription: {
            plans: `${API_BASE}/Subscription/plans`,
            current: `${API_BASE}/Subscription/current`,
            details: `${API_BASE}/Subscription/details`,
            createCheckout: `${API_BASE}/Subscription/create-checkout-session`,
        },
        notifications: {
            list: `${API_BASE}/Notification`,
            create: `${API_BASE}/Notification`,
            delete: (id: string) => `${API_BASE}/Notification/${id}`,
            markAsRead: (id: string) => `${API_BASE}/Notification/${id}/read`,
        },
    }
}