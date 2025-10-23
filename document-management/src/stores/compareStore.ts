import { create } from 'zustand';
import { CompareState } from '@/types/store';

interface CompareStore extends CompareState {
  setLeftDocId: (id?: number) => void;
  setRightDocId: (id?: number) => void;
  setCurrentFilename: (filename?: string) => void;
  reset: () => void;
  canCompare: () => boolean;
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  leftDocId: undefined,
  rightDocId: undefined,
  currentFilename: undefined,
  setLeftDocId: (id) => set({ leftDocId: id }),
  setRightDocId: (id) => set({ rightDocId: id }),
  setCurrentFilename: (filename) => set({ currentFilename: filename, leftDocId: undefined, rightDocId: undefined }),
  reset: () => set({ leftDocId: undefined, rightDocId: undefined, currentFilename: undefined }),
  canCompare: () => {
    const { leftDocId, rightDocId } = get();
    return leftDocId !== undefined && rightDocId !== undefined && leftDocId !== rightDocId;
  }
}));