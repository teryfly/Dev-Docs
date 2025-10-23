import apiClient from './client';
import { Project } from '@/types/api';

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/v1/projects');
    return response.data;
  }
};