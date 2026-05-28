import { useQuery } from '@tanstack/react-query';
import { HomepageWallResponse } from '../types/homepageWall';
import {
  fetchHomepageWall,
  getHomepageWallQueryKey,
  HOMEPAGE_WALL_STALE_MS,
  type HomepageWallQueryParams,
} from '../utils/homepageWallQuery';

export type HomepageWallParams = HomepageWallQueryParams;

export const useHomepageWallQuery = (params: HomepageWallParams) => {
  if (!params.categoryId) {
    throw new Error('categoryId es requerido para homepage-wall');
  }

  return useQuery<HomepageWallResponse>({
    queryKey: getHomepageWallQueryKey(params),
    queryFn: () => fetchHomepageWall(params),
    staleTime: HOMEPAGE_WALL_STALE_MS,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!params.categoryId && params._enabled !== false,
    refetchOnReconnect: false,
  });
};

export { prefetchHomepageWall } from '../utils/homepageWallQuery';
