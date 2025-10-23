import apiClient from './client';
import { TagModel, TagsResponse } from '@/types/api';

export const tagsApi = {
  getAll: async (documentId: number): Promise<TagsResponse> => {
    const response = await apiClient.get<TagsResponse>(
      `/v1/plan/documents/${documentId}/tags`
    );
    return response.data;
  },

  add: async (documentId: number, tagName: string): Promise<{ message: string; tag: TagModel }> => {
    const response = await apiClient.post(
      `/v1/plan/documents/${documentId}/tags`,
      { tag_name: tagName }
    );
    return response.data;
  },

  remove: async (documentId: number, tagName: string): Promise<{ message: string; removed_count: number }> => {
    const response = await apiClient.delete(
      `/v1/plan/documents/${documentId}/tags/${tagName}`
    );
    return response.data;
  },

  batch: async (
    documentId: number,
    data: { add?: string[]; remove?: string[] }
  ): Promise<any> => {
    const response = await apiClient.post(
      `/v1/plan/documents/${documentId}/tags:batch`,
      data
    );
    return response.data;
  }
};