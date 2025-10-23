export const queryKeys = {
  projects: ['projects'] as const,
  categories: ['categories'] as const,
  // Full history for a project
  projectDocuments: (projectId?: number) => ['documents', 'project', projectId ?? 'none'] as const,
  documentsLatest: (params: any) => ['documents', 'latest', params] as const,
  documentsHistory: (params: any) => ['documents', 'history', params] as const,
  documentDetail: (id: number) => ['documents', 'detail', id] as const,
  tags: (documentId: number) => ['tags', documentId] as const
};