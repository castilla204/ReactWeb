const DEV_SERVER = import.meta.env.DEV ? 'http://localhost:7124' : '';
const API_PATH = '/api';

export const API_CONFIG = {
    baseUrl: DEV_SERVER,
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
            createWithHire: `${API_PATH}/Search/create-with-hire`,
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
            cancel: `${API_PATH}/Subscription/cancel`,
            loadMoney: `${API_PATH}/Subscription/load-money`,
            hireService: `${API_PATH}/Subscription/hire-service`,
        },
        dispute: {
            details: (searchHireId: number) => `${API_PATH}/Dispute/details/${searchHireId}`,
        },
        notifications: {
            list: `${API_PATH}/Notification`,
            create: `${API_PATH}/Notification`,
            delete: (id: string) => `${API_PATH}/Notification/${id}`,
            markAsRead: (id: string) => `${API_PATH}/Notification/${id}/read`,
        },
        expert: {
            profile: `${API_PATH}/User/expert-profile`,
            becomeExpert: `${API_PATH}/User/become-expert`,
            services: {
                list: `${API_PATH}/SearchService`,
                create: `${API_PATH}/SearchService`,
                get: (id: number) => `${API_PATH}/SearchService/${id}`,
                getByExpert: (expertId: number) => `${API_PATH}/SearchService/expert/${expertId}`,
                getByHireId: (hireId: number) => `${API_PATH}/SearchService/GetServiceByHireId/${hireId}`,
            },
            hires: {
                createCheckout: (serviceId: number) => `${API_PATH}/SearchHire/create-checkout-session/${serviceId}`,
                webhook: `${API_PATH}/SearchHire/webhook`,
                listAsClient: `${API_PATH}/SearchHire/client`,
                listAsExpert: `${API_PATH}/SearchHire/expert`,
                updateStatus: (hireId: number) => `${API_PATH}/SearchHire/${hireId}/status`,
            },
        },
        users: {
            list: `${API_PATH}/User/all`,
            block: (userId: number) => `${API_PATH}/User/${userId}/block`,
            delete: (userId: number) => `${API_PATH}/User/${userId}`,
        },
        chat: {
            conversation: `${API_PATH}/chat/conversation`,
            message: `${API_PATH}/chat/message`,
            markAsRead: (messageId: number) => `${API_PATH}/chat/message/${messageId}/read`,
            ws: `${API_PATH}/chat/ws`,
            deliverable: `${API_PATH}/chat/deliverable`, // Added deliverable endpoint
        },
    },
};