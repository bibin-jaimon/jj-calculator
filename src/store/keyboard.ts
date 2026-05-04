import { create } from 'zustand';

export type FieldType = 'pricePerKg' | 'weightInKg';

export interface ActiveField {
  rowId: number;
  field: FieldType;
}

interface KeyboardState {
  activeField: ActiveField | null;
  setActiveField: (field: ActiveField | null) => void;
  clearActiveField: () => void;
}

export const useKeyboardStore = create<KeyboardState>((set) => ({
  activeField: null,
  setActiveField: (field) => set({ activeField: field }),
  clearActiveField: () => set({ activeField: null }),
}));
