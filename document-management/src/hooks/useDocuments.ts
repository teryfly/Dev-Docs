import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/api/documents';
import { queryKeys } from './queryKeys';
import { message } from 'antd';
import { invalidateProjectDocuments } from './useProjectDocuments';

// Keep history-by-filename query unused by UI; prefer unified cache via useProjectDocuments
export const useDocumentsHistory = (params: {
  project_id?: number;
  category_id?: number;
  filename?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.documentsHistory(params),
    queryFn: () => {
      if (!params.project_id || !params.filename) {
        return Promise.resolve([]);
      }
      return documentsApi.getHistory({
        project_id: params.project_id,
        category_id: params.category_id,
        filename: params.filename
      });
    },
    enabled: !!params.project_id && !!params.filename
  });
};

// 获取文档详情
export const useDocumentDetail = (documentId?: number) => {
  return useQuery({
    queryKey: queryKeys.documentDetail(documentId!),
    queryFn: () => documentsApi.getById(documentId!),
    enabled: !!documentId
  });
};

// 创建文档
export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.create,
    onSuccess: (res) => {
      // Invalidate documents caches
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      invalidateProjectDocuments(queryClient, res.project_id);
      message.success('文档创建成功');
    },
    onError: (error: Error) => {
      message.error(`创建失败: ${error.message}`);
    }
  });
};

// 更新文档（保存为新版本或改名）
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => documentsApi.update(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      invalidateProjectDocuments(queryClient, res.project_id);
      message.success('保存成功');
    },
    onError: (error: Error) => {
      message.error(`保存失败: ${error.message}`);
    }
  });
};

// 删除单个版本
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.deleteOne,
    onSuccess: (_res, documentId, context) => {
      // We don't know project_id from delete response; invalidate broad documents keys
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      // Also invalidate all project documents cache
      queryClient.invalidateQueries({ queryKey: ['documents', 'project'] });
      message.success('删除成功');
    },
    onError: (error: Error) => {
      message.error(`删除失败: ${error.message}`);
    }
  });
};

// 删除全部历史 - 使用 project_id + category_id + filename
export const useDeleteAllHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.deleteAll,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      invalidateProjectDocuments(queryClient, variables.project_id);
      message.success('全部历史已删除');
    },
    onError: (error: Error) => {
      message.error(`删除失败: ${error.message}`);
    }
  });
};

// 迁移全部历史
export const useMigrateAllHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.migrateAllHistory,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      invalidateProjectDocuments(queryClient, variables.project_id);
      message.success('迁移成功');
    },
    onError: (error: Error) => {
      message.error(`迁移失败: ${error.message}`);
    }
  });
};

// 从当前版本迁移
export const useMigrateFromCurrent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.migrateFromCurrent,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      invalidateProjectDocuments(queryClient, res.project_id);
      message.success('迁移成功');
    },
    onError: (error: Error) => {
      message.error(`迁移失败: ${error.message}`);
    }
  });
};