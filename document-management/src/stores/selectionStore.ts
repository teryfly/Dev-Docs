import { create } from 'zustand';
import { CurrentSelection } from '@/types/store';

interface SelectionStore extends CurrentSelection {
  setProjectId: (id?: number) => void;
  setCategoryId: (id?: number) => void;
  setSearchQuery: (query?: string) => void;
  setSortBy: (sortBy?: 'filename' | 'created_time' | 'version') => void;
  setOrder: (order?: 'asc' | 'desc') => void;
  setPage: (page?: number) => void;
  setPageSize: (pageSize?: number) => void;
  reset: () => void;
}

// 根据 API 文档的宽容参数设计初始化默认值
const initialState: CurrentSelection = {
  projectId: undefined,
  categoryId: undefined,
  searchQuery: '', // 空字符串，后端会视为未提供
  sortBy: 'created_time', // 默认按创建时间排序
  order: 'desc', // 默认降序
  page: 1, // 默认第一页
  pageSize: 20 // 默认每页20条
};

export const useSelectionStore = create<SelectionStore>((set) => ({
  ...initialState,
  
  // 设置项目ID，重置分类和页码
  setProjectId: (id) => set({ 
    projectId: id, 
    categoryId: undefined, 
    searchQuery: '', 
    page: 1 
  }),
  
  // 设置分类ID，重置页码
  setCategoryId: (id) => set({ 
    categoryId: id, 
    page: 1 
  }),
  
  // 设置搜索关键词，重置页码
  // 允许空字符串（宽容参数），后端会视为未提供
  setSearchQuery: (query) => set({ 
    searchQuery: query !== undefined ? query : '', 
    page: 1 
  }),
  
  // 设置排序字段，重置页码
  setSortBy: (sortBy) => set({ 
    sortBy: sortBy || 'created_time', 
    page: 1 
  }),
  
  // 设置排序方向，重置页码
  setOrder: (order) => set({ 
    order: order || 'desc', 
    page: 1 
  }),
  
  // 设置页码
  setPage: (page) => set({ 
    page: page || 1 
  }),
  
  // 设置每页条数，重置页码
  setPageSize: (pageSize) => set({ 
    pageSize: pageSize || 20, 
    page: 1 
  }),
  
  // 重置所有状态
  reset: () => set(initialState)
}));