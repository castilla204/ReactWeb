import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ExpertProfile {
    id: number;
    profilePictureUrl: string;
    description: string;
    stripeAccountId: string | null;
    createdAt: string;
}

interface Service {
    id: number;
    expertProfileId: number;
    categoryId: number;
    price: number;
    conditions: string;
    durationInHours: number;
    imageUrls: string[];
    createdAt: string;
}

interface Search {
    id: number;
    client: { name: string; email: string };
    categoryId: number;
    status: string;
    createdAt: string;
}

export function useExpert() {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<ExpertProfile | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [searches, setSearches] = useState<Search[]>([]);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [isLoadingSearches, setIsLoadingSearches] = useState(false);
    const [isCreatingService, setIsCreatingService] = useState(false);
    const [isStartingOnboarding, setIsStartingOnboarding] = useState(false);
    const [profileError, setProfileError] = useState<Error | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!user) {
            console.log('No user, cannot fetch profile');
            return;
        }

        setIsLoadingProfile(true);
        setProfileError(null);
        try {
            const token = localStorage.getItem('authToken');
            console.log('Fetching expert profile with token:', token ? 'present' : 'missing');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/User/expert-profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('401 Unauthorized, signing out');
                    signOut();
                    throw new Error('Request failed with status 401');
                }
                throw new Error(`Failed to fetch profile: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Fetched expert profile:', data);
            setProfile(data);
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            setProfileError(error);
        } finally {
            setIsLoadingProfile(false);
        }
    }, [user, signOut]);

    const fetchServices = useCallback(async () => {
        if (!user) return;

        setIsLoadingServices(true);
        try {
            const response = await fetch('/api/Services', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch services: ${response.statusText}`);
            }

            const data = await response.json();
            setServices(data);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setIsLoadingServices(false);
        }
    }, [user]);

    const fetchSearches = useCallback(async () => {
        if (!user) return;

        setIsLoadingSearches(true);
        try {
            const response = await fetch('/api/Searches/expert', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch searches: ${response.statusText}`);
            }

            const data = await response.json();
            setSearches(data);
        } catch (error) {
            console.error('Error fetching searches:', error);
        } finally {
            setIsLoadingSearches(false);
        }
    }, [user]);

    const createService = async (serviceData: {
        expertProfileId: number;
        categoryId: number;
        price: number;
        conditions: string;
        durationInHours: number;
        images: File[];
    }) => {
        setIsCreatingService(true);
        try {
            const formData = new FormData();
            formData.append('expertProfileId', serviceData.expertProfileId.toString());
            formData.append('categoryId', serviceData.categoryId.toString());
            formData.append('price', serviceData.price.toString());
            formData.append('conditions', serviceData.conditions);
            formData.append('durationInHours', serviceData.durationInHours.toString());
            serviceData.images.forEach((image, index) => {
                formData.append(`images[${index}]`, image);
            });

            const response = await fetch('/api/Services', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Failed to create service: ${response.statusText}`);
            }

            await fetchServices();
        } catch (error) {
            console.error('Error creating service:', error);
            throw error;
        } finally {
            setIsCreatingService(false);
        }
    };

    const startOnboarding = async () => {
        setIsStartingOnboarding(true);
        try {
            const response = await fetch('/api/Subscription/expert-onboarding', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to start onboarding: ${response.statusText}`);
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error('Error starting onboarding:', error);
            throw error;
        } finally {
            setIsStartingOnboarding(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'Expert') {
            fetchProfile();
            fetchServices();
            fetchSearches();
        }
    }, [user, fetchProfile, fetchServices, fetchSearches]);

    return {
        profile,
        isLoadingProfile,
        profileError,
        services,
        isLoadingServices,
        searches,
        isLoadingSearches,
        createService,
        isCreatingService,
        startOnboarding,
        isStartingOnboarding,
        fetchProfile,
    };
}