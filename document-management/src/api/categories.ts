import apiClient from './client';
import { Category } from '@/types/api';

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/v1/plan/categories');
    return response.data;
  }
};