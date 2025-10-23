import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { queryKeys } from './queryKeys';

export const useProjects = () => {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.getAll
  });
};