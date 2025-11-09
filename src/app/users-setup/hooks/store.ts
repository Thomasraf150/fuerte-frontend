import { createStore } from 'zustand';
import { DataRow } from '@/utils/DataTypes';

interface BranchListsState {
  selectedRow: DataRow | null;
  setSelectedRow: (row: DataRow | null) => void;
}

export const useBranchListsStore = createStore<BranchListsState>((set) => ({
  selectedRow: null,
  setSelectedRow: (row) => set({ selectedRow: row }),
}));