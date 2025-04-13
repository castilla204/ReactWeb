// Development server URL - only used in development
const DEV_SERVER = import.meta.env.DEV ? 'http://localhost:7124' : '';

// Base API path that's always used
const API_PATH = '/api';

export const API_CONFIG = {
    baseUrl: DEV_SERVER,  // Full URL in dev, empty for production
    endpoints: {
        auth: {
            googleAuth: `${API_PATH}/User/google-auth`,
            sendVerification: `${API_PATH}/User/send-verification`,
            verifyCode: `${API_PATH}/User/verify-code`,
        },
        categories: {
            list: `${API_PATH}/Categories`,
        },
        search: {
            create: `${API_PATH}/Search`,
            list: `${API_PATH}/Search`,
            listAll: `${API_PATH}/Search/all`,
            get: (id: number) => `${API_PATH}/Search/${id}`,
            delete: (id: number) => `${API_PATH}/Search/${id}`,
            update: (id: number) => `${API_PATH}/Search/${id}`,
            toggleActive: (id: number) => `${API_PATH}/Search/${id}/toggle-active`,
            revise: (id: number) => `${API_PATH}/Search/${id}/revise`,
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
        subscription: {
            plans: `${API_PATH}/Subscription/plans`,
            current: `${API_PATH}/Subscription/current`,
            details: `${API_PATH}/Subscription/details`,
            createCheckout: `${API_PATH}/Subscription/create-checkout-session`,
        },
        notifications: {
            list: `${API_PATH}/Notification`,
            create: `${API_PATH}/Notification`,
            delete: (id: string) => `${API_PATH}/Notification/${id}`,
            markAsRead: (id: string) => `${API_PATH}/Notification/${id}/read`,
        },
    }
}