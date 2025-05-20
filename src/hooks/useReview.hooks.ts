import { useMutation, useQuery } from '@tanstack/react-query';
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
        onSuccess: () => {
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

    const getExpertReviews = (expertId: number) =>
        useQuery<ReviewResponse[]>({
            queryKey: ['expertReviews', expertId],
            queryFn: async () => {
                const response = await fetchApi(`/api/review/expert/${expertId}`, {
                    method: 'GET',
                });
                return response.reviews as ReviewResponse[];
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