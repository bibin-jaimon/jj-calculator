import { create } from 'zustand';

export type FieldType = 'pricePerKg' | 'weightInKg';

export interface ActiveField {
  rowId: number;
  field: FieldType;
}

interface KeyboardState {
  activeField: ActiveField | null;
  isVisible: boolean;
  setActiveField: (field: ActiveField | null) => void;
  toggleKeyboard: (defaultRowId?: number) => void;
  clearActiveField: () => void;
}

export const useKeyboardStore = create<KeyboardState>((set, get) => ({
  activeField: { rowId: 1, field: 'pricePerKg' },
  isVisible: false,
  setActiveField: (field) => set({ activeField: field, isVisible: field !== null }),
  toggleKeyboard: (defaultRowId = 1) => {
    const { isVisible, activeField } = get();
    if (isVisible) {
      set({ isVisible: false });
    } else {
      set({
        isVisible: true,
        activeField: activeField ?? { rowId: defaultRowId, field: 'pricePerKg' },
      });
    }
  },
  clearActiveField: () => set({ activeField: null, isVisible: false }),
}));
