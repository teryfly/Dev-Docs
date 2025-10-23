import apiClient from './client';
import {
  PlanDocumentResponse,
  PlanDocumentCreateRequest,
  PlanDocumentUpdateRequest,
  LatestListResponse,
  DeleteResponse,
  MigrateAllHistoryRequest,
  MigrateAllHistoryResponse,
  MigrateFromCurrentRequest
} from '@/types/api';

// Keep util for cleaning query params
const cleanParams = (params: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

export const documentsApi = {
  // Deprecated from UI: server "latest" list. Keeping for compatibility if needed elsewhere.
  getLatest: async (params: {
    project_id: number | string;
    category_id?: number | string;
    query?: string;
    sort_by?: 'filename' | 'created_time' | 'version';
    order?: 'asc' | 'desc';
    page?: number | string;
    page_size?: number | string;
  }): Promise<LatestListResponse> => {
    const apiParams: Record<string, any> = {
      project_id: String(params.project_id || ''),
      category_id: params.category_id ? String(params.category_id) : '',
      query: params.query || '',
      sort_by: params.sort_by || 'created_time',
      order: params.order || 'desc'
    };
    const response = await apiClient.get<LatestListResponse>(
      '/v1/plan/documents/latest',
      { params: cleanParams(apiParams) }
    );
    return response.data;
  },

  // Per guideline: read all history by project, server supports optional filters
  getHistory: async (params: {
    project_id: number | string;
    category_id?: number | string;
    filename?: string;
  }): Promise<PlanDocumentResponse[]> => {
    const apiParams: Record<string, any> = {
      project_id: String(params.project_id || ''),
      category_id: params.category_id ? String(params.category_id) : '',
      filename: params.filename || ''
    };

    const response = await apiClient.get<PlanDocumentResponse[]>(
      '/v1/plan/documents/history',
      { params: cleanParams(apiParams) }
    );
    return response.data;
  },

  getById: async (documentId: number): Promise<PlanDocumentResponse> => {
    const response = await apiClient.get<PlanDocumentResponse>(
      `/v1/plan/documents/${documentId}`
    );
    return response.data;
  },

  create: async (data: PlanDocumentCreateRequest): Promise<PlanDocumentResponse> => {
    const response = await apiClient.post<PlanDocumentResponse>(
      '/v1/plan/documents',
      data
    );
    return response.data;
  },

  update: async (
    documentId: number,
    data: PlanDocumentUpdateRequest
  ): Promise<PlanDocumentResponse> => {
    const response = await apiClient.put<PlanDocumentResponse>(
      `/v1/plan/documents/${documentId}`,
      data
    );
    return response.data;
  },

  deleteOne: async (documentId: number): Promise<DeleteResponse> => {
    const response = await apiClient.delete<DeleteResponse>(
      `/v1/plan/documents/${documentId}`
    );
    return response.data;
  },

  deleteAll: async (params: {
    project_id: number;
    category_id: number;
    filename: string;
  }): Promise<DeleteResponse> => {
    const response = await apiClient.delete<DeleteResponse>(
      '/v1/plan/documents',
      { params: cleanParams(params) }
    );
    return response.data;
  },

  migrateAllHistory: async (
    data: MigrateAllHistoryRequest
  ): Promise<MigrateAllHistoryResponse> => {
    const response = await apiClient.post<MigrateAllHistoryResponse>(
      '/v1/plan/documents/migrate/all-history',
      data
    );
    return response.data;
  },

  migrateFromCurrent: async (
    data: MigrateFromCurrentRequest
  ): Promise<PlanDocumentResponse> => {
    const response = await apiClient.post<PlanDocumentResponse>(
      '/v1/plan/documents/migrate/from-current',
      data
    );
    return response.data;
  }
};