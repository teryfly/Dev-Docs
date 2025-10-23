export type SourceType = 'user' | 'server' | 'chat';
export type SortBy = 'filename' | 'created_time' | 'version';
export type Order = 'asc' | 'desc';
export type MigrateMode = 'all-history' | 'from-current';

export interface Project {
  id: number;
  name: string;
  dev_environment?: string;
  grpc_server_address?: string;
  llm_model?: string;
  llm_url?: string;
  git_work_dir?: string;
  ai_work_dir?: string;
  created_time: string;
  updated_time: string;
}

export interface Category {
  id: number;
  name: string;
  prompt_template?: string | null;
  message_method?: string | null;
  auto_save_category_id?: number | null;
  is_builtin: boolean;
  created_time: string;
}

export interface PlanDocumentResponse {
  id: number;
  project_id: number;
  category_id: number;
  filename: string;
  content: string;
  version: number;
  source: SourceType;
  related_log_id?: number | null;
  created_time: string;
}

export interface PlanDocumentCreateRequest {
  project_id: number;
  category_id: number;
  filename: string;
  content: string;
  version?: number;
  source?: SourceType;
  related_log_id?: number | null;
}

export interface PlanDocumentUpdateRequest {
  filename?: string;
  content?: string;
  source?: SourceType;
}

export interface LatestListResponse {
  total: number;
  page: number;
  page_size: number;
  items: PlanDocumentResponse[];
}

export interface TagModel {
  id: number;
  document_id: number;
  tag_name: string;
  created_time: string;
}

export interface TagsResponse {
  document_id: number;
  tags: TagModel[];
}

export interface DeleteResponse {
  message: string;
  deleted: {
    document_references: number;
    execution_logs: number;
    document_tags: number;
    plan_documents: number;
  };
}

export interface MigrateAllHistoryRequest {
  project_id: number;
  source_category_id: number;
  target_category_id: number;
  filename: string;
}

export interface MigrateAllHistoryResponse {
  message: string;
  migrated_count: number;
  target_category_id: number;
  filename: string;
  start_version: number;
  end_version: number;
}

export interface MigrateFromCurrentRequest {
  document_id: number;
  target_category_id: number;
  new_filename?: string;
  source?: SourceType;
}