import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';

interface CreateReviewRequest {
    searchHireId: number;
    score: number;
    description: string;
    images?: File[];
}

interface ReviewResponse {
    id: number;
    reviewerId: number;
    expertId: number;
    searchHireId: number;
    score: number;
    description: string;
    imageUrls: string[];
    createdAt: string;
}

export const useReview = () => {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient(); // 🛡️ R19: invalidar cache tras crear review

    const createReviewMutation = useMutation({
        mutationFn: async ({ searchHireId, score, description, images }: CreateReviewRequest) => {
            const formData = new FormData();
            formData.append('Score', score.toString());
            formData.append('Description', description);

            if (images && images.length > 0) {
                images.forEach((image, index) => {
                    // Use just 'Images' as the key for ASP.NET Core IFormFile[] binding
                    formData.append('Images', image);
                    // Log for debugging
                    console.log(`Appending image ${index}:`, image.name, image.size, image.type);
                });
            } else {
                console.log('No images provided');
            }

            // Debug FormData contents
            for (const [key, value] of formData.entries()) {
                console.log(`FormData entry: ${key}=`, value);
            }

            const response = await fetchApi(`/api/review/search-hire/${searchHireId}`, {
                method: 'POST',
                body: formData,
                // Ensure no Content-Type header is set manually (browser sets multipart/form-data with boundary)
            });

            return response.review as ReviewResponse;
        },
        onSuccess: (_, variables) => {
            // 🛡️ R19 FIX: invalidar queries de hire/expert para que la review aparezca al instante
            const { searchHireId } = variables;
            queryClient.invalidateQueries({ queryKey: ['searchDetailsCompleteByHire', searchHireId] });
            queryClient.invalidateQueries({ queryKey: ['searchDetailsComplete'] });
            queryClient.invalidateQueries({ queryKey: ['expertReviews'] });
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✅ Review submitted successfully',
                },
            }));
        },
        onError: (error: any) => {
            console.error('Error creating review:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: `❌ Failed to submit review: ${error.message || 'Unknown error'}`,
                },
            }));
        },
    });

    const getExpertReviews = (expertId: number, page: number = 1, pageSize: number = 20) =>
        useQuery<{ reviews: ReviewResponse[]; pagination?: any }>({
            queryKey: ['expertReviews', expertId, page, pageSize],
            queryFn: async () => {
                const response = await fetchApi(`/api/review/expert/${expertId}?page=${page}&pageSize=${pageSize}`, {
                    method: 'GET',
                });
                // Manejar respuesta paginada o no paginada
                if (response.reviews && response.pagination) {
                    return {
                        reviews: response.reviews as ReviewResponse[],
                        pagination: response.pagination
                    };
                } else if (Array.isArray(response)) {
                    return {
                        reviews: response as ReviewResponse[],
                        pagination: null
                    };
                } else {
                    return {
                        reviews: response.reviews || [],
                        pagination: null
                    };
                }
            },
            enabled: !!expertId,
            retry: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
        });

    return {
        createReview: createReviewMutation.mutateAsync,
        getExpertReviews,
        isCreatingReview: createReviewMutation.isPending,
    };
};