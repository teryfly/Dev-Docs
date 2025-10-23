export interface CurrentSelection {
  projectId?: number;
  categoryId?: number;
  searchQuery?: string;
  sortBy?: 'filename' | 'created_time' | 'version';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CompareState {
  leftDocId?: number;
  rightDocId?: number;
  currentFilename?: string;
}