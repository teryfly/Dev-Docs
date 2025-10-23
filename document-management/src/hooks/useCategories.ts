import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/categories';
import { queryKeys } from './queryKeys';

export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoriesApi.getAll
  });
};