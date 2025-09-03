import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../lib/auth';

interface ExpertProfile {
    id: number;
    profilePictureUrl: string;
    description: string;
    stripeAccountId: string | null;
    createdAt: string;
}

interface Search {
    id: number;
    client: { name: string; email: string };
    categoryId: number;
    status: string;
    createdAt: string;
}

interface ServiceType {
    id: number;
    name: string;
}

export function useExpert() {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<ExpertProfile | null>(null);
    const [searches, setSearches] = useState<Search[]>([]);
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isLoadingSearches, setIsLoadingSearches] = useState(false);
    const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(false);
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
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
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

    const fetchSearches = useCallback(async () => {
        if (!user) return;

        setIsLoadingSearches(true);
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/SearchHire/expert', {
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
                throw new Error(`Failed to fetch searches: ${response.statusText}`);
            }

            const data = await response.json();
            setSearches(data);
        } catch (error) {
            console.error('Error fetching searches:', error);
        } finally {
            setIsLoadingSearches(false);
        }
    }, [user, signOut]);

    const fetchServiceTypes = useCallback(async () => {
        setIsLoadingServiceTypes(true);
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/ServiceType', {
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
                throw new Error(`Failed to fetch service types: ${response.statusText}`);
            }

            const data = await response.json();
            setServiceTypes(data);
        } catch (error) {
            console.error('Error fetching service types:', error);
        } finally {
            setIsLoadingServiceTypes(false);
        }
    }, [signOut]);

    const startOnboarding = async () => {
        setIsStartingOnboarding(true);
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/Subscription/expert-onboarding', {
                method: 'POST',
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
            fetchServiceTypes();
            fetchSearches();
        }
    }, [user, fetchProfile, fetchServiceTypes, fetchSearches]);

    return {
        profile,
        isLoadingProfile,
        profileError,
        searches,
        isLoadingSearches,
        serviceTypes,
        isLoadingServiceTypes,
        startOnboarding,
        isStartingOnboarding,
        fetchProfile,
    };
}