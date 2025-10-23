import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/api/documents';
import { queryKeys } from './queryKeys';
import { PlanDocumentResponse, SortBy, Order } from '@/types/api';

/**
 * Fetch all documents history for a project once.
 * Server returns full history (already id desc commonly), we handle:
 * - category filter (optional)
 * - filename search (client-side, substring)
 * - latest by filename (grouping)
 * - sorting by created_time | filename | version
 * - front-end pagination
 */

export const useProjectDocuments = (projectId?: number) => {
  const query = useQuery({
    queryKey: queryKeys.projectDocuments(projectId),
    queryFn: async () => {
      if (!projectId) return [] as PlanDocumentResponse[];
      // Only project_id required per guideline
      const all = await documentsApi.getHistory({ project_id: projectId });
      return Array.isArray(all) ? all : [];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000
  });

  return query;
};

type LatestListParams = {
  projectId?: number;
  categoryId?: number;
  searchQuery?: string;
  sortBy?: SortBy; // created_time | filename | version
  order?: Order;   // asc | desc
  page?: number;
  pageSize?: number;
};

export const useSelectLatestByFilename = (
  allDocs: PlanDocumentResponse[] | undefined,
  params: LatestListParams
) => {
  const {
    categoryId,
    searchQuery = '',
    sortBy = 'created_time',
    order = 'desc',
    page = 1,
    pageSize = 20
  } = params;

  const result = useMemo(() => {
    const docs = (allDocs || []) as PlanDocumentResponse[];

    // 1) optional category filter
    const filteredByCategory = categoryId
      ? docs.filter(d => d.category_id === categoryId)
      : docs;

    // 2) group by filename and take latest by version (or created_time if needed)
    const latestMap = new Map<string, PlanDocumentResponse>();
    for (const d of filteredByCategory) {
      const existed = latestMap.get(d.filename);
      if (!existed) {
        latestMap.set(d.filename, d);
      } else {
        // compare by version then created_time to be safe
        if (d.version > existed.version) {
          latestMap.set(d.filename, d);
        } else if (d.version === existed.version) {
          if (d.created_time > existed.created_time) {
            latestMap.set(d.filename, d);
          }
        }
      }
    }
    let latestList = Array.from(latestMap.values());

    // 3) search by filename substring (case-insensitive)
    const q = (searchQuery || '').trim().toLowerCase();
    if (q) {
      latestList = latestList.filter(item => item.filename.toLowerCase().includes(q));
    }

    // 4) sort
    latestList.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'filename':
          cmp = a.filename.localeCompare(b.filename);
          break;
        case 'version':
          cmp = a.version - b.version;
          break;
        case 'created_time':
        default:
          // ISO strings compare lexicographically
          cmp = a.created_time.localeCompare(b.created_time);
          break;
      }
      return order === 'asc' ? cmp : -cmp;
    });

    // 5) pagination (front-end)
    const total = latestList.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = latestList.slice(start, end);

    return { total, page, page_size: pageSize, items };
  }, [allDocs, categoryId, searchQuery, sortBy, order, page, pageSize]);

  return result;
};

export const useSelectHistoryByFilename = (
  allDocs: PlanDocumentResponse[] | undefined,
  filename?: string,
  categoryId?: number
) => {
  const list = useMemo(() => {
    const docs = (allDocs || []) as PlanDocumentResponse[];
    if (!filename) return [] as PlanDocumentResponse[];
    const inCategory = categoryId ? docs.filter(d => d.category_id === categoryId) : docs;
    // take same filename history, sort by version desc then created_time desc
    const history = inCategory
      .filter(d => d.filename === filename)
      .sort((a, b) => {
        if (b.version !== a.version) return b.version - a.version;
        return b.created_time.localeCompare(a.created_time);
      });
    return history;
  }, [allDocs, filename, categoryId]);

  return list;
};

/**
 * Helper to invalidate project documents after mutations.
 */
export const invalidateProjectDocuments = (qc: ReturnType<typeof useQueryClient>, projectId?: number) => {
  if (!projectId) return;
  qc.invalidateQueries({ queryKey: queryKeys.projectDocuments(projectId) });
};