import { create } from 'zustand';

interface CalculatorRow {
  id: number;
  pricePerKg: string;
  weightInKg: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  rows: CalculatorRow[];
  amount: number;
  amountText: string;
}

interface CalculatorState {
  rows: CalculatorRow[];
  nextRowId: number;
  amount: number;
  amountText: string;
  history: HistoryItem[];
  setRowPricePerKg: (rowId: number, value: string) => void;
  setRowWeightInKg: (rowId: number, value: string) => void;
  addRow: () => void;
  removeRow: (rowId: number) => void;
  clear: () => void;
  clearHistory: () => void;
}

const sanitizeNumberInput = (value: string): string => {
  const normalized = value.replace(',', '.');
  const raw = normalized.replace(/[^\d.]/g, '');
  let result = '';
  let hasDecimal = false;

  for (const char of raw) {
    if (char === '.') {
      if (hasDecimal) {
        continue;
      }
      hasDecimal = true;
    }
    result += char;
  }

  return result;
};

const toNumber = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const calculateAmount = (pricePerKg: string, weightInKg: string): number => {
  const price = toNumber(pricePerKg);
  const weight = toNumber(weightInKg);
  const result = price * weight;
  return Number.isFinite(result) ? result : 0;
};

const calculateTotal = (rows: CalculatorRow[]): number =>
  rows.reduce((sum, row) => sum + calculateAmount(row.pricePerKg, row.weightInKg), 0);

const toMoney = (value: number): string => value.toFixed(2);

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  rows: [{ id: 1, pricePerKg: '', weightInKg: '' }],
  nextRowId: 2,
  amount: 0,
  amountText: '0.00',
  history: [],

  setRowPricePerKg: (rowId, value) => {
    const pricePerKg = sanitizeNumberInput(value);
    const { rows } = get();
    const nextRows = rows.map((row) => (row.id === rowId ? { ...row, pricePerKg } : row));
    const amount = calculateTotal(nextRows);
    set({ rows: nextRows, amount, amountText: toMoney(amount) });
  },

  setRowWeightInKg: (rowId, value) => {
    const weightInKg = sanitizeNumberInput(value);
    const { rows } = get();
    const nextRows = rows.map((row) => (row.id === rowId ? { ...row, weightInKg } : row));
    const amount = calculateTotal(nextRows);
    set({ rows: nextRows, amount, amountText: toMoney(amount) });
  },

  addRow: () => {
    const { rows, nextRowId } = get();
    const nextRows = [...rows, { id: nextRowId, pricePerKg: '', weightInKg: '' }];
    const amount = calculateTotal(nextRows);
    set({ rows: nextRows, nextRowId: nextRowId + 1, amount, amountText: toMoney(amount) });
  },

  removeRow: (rowId) => {
    const { rows } = get();
    if (rows.length <= 1) {
      return;
    }
    const nextRows = rows.filter((row) => row.id !== rowId);
    const amount = calculateTotal(nextRows);
    set({ rows: nextRows, amount, amountText: toMoney(amount) });
  },

  clear: () => {
    const { rows, amount, amountText, history } = get();
    let nextHistory = history;
    
    // Only save to history if there is a valid amount
    if (amount > 0) {
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        rows: [...rows],
        amount,
        amountText,
      };
      // Keep max 50 items in history
      nextHistory = [historyItem, ...history].slice(0, 50);
    }

    set({
      rows: [{ id: 1, pricePerKg: '', weightInKg: '' }],
      nextRowId: 2,
      amount: 0,
      amountText: '0.00',
      history: nextHistory,
    });
  },
  
  clearHistory: () => set({ history: [] }),
}));
