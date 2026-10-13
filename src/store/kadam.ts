import { create } from 'zustand';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatKadamDate = (date: Date = new Date()): string => {
  const day = date.getDate();
  const weekday = DAYS[date.getDay()];
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${weekday} ${month}, ${year}`;
};

export interface KadamRow {
  id: number;
  date: string;
  note: string;
  amount: string;
}

interface KadamState {
  rows: KadamRow[];
  nextRowId: number;
  totalAmount: number;
  totalText: string;
  setRowNote: (rowId: number, note: string) => void;
  setRowAmount: (rowId: number, amount: string) => void;
  addRow: () => number;
  removeRow: (rowId: number) => void;
  clearAll: () => void;
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

const calculateTotal = (rows: KadamRow[]): number =>
  rows.reduce((sum, row) => sum + toNumber(row.amount), 0);

const toMoney = (value: number): string => value.toFixed(2);

export const useKadamStore = create<KadamState>((set, get) => ({
  rows: [{ id: 1, date: formatKadamDate(), note: '', amount: '' }],
  nextRowId: 2,
  totalAmount: 0,
  totalText: '0.00',

  setRowNote: (rowId, note) => {
    const { rows } = get();
    const nextRows = rows.map((row) => (row.id === rowId ? { ...row, note } : row));
    set({ rows: nextRows });
  },

  setRowAmount: (rowId, value) => {
    const amount = sanitizeNumberInput(value);
    const { rows } = get();
    const nextRows = rows.map((row) => (row.id === rowId ? { ...row, amount } : row));
    const totalAmount = calculateTotal(nextRows);
    set({ rows: nextRows, totalAmount, totalText: toMoney(totalAmount) });
  },

  addRow: () => {
    const { rows, nextRowId } = get();
    const newId = nextRowId;
    const nextRows = [...rows, { id: newId, date: formatKadamDate(), note: '', amount: '' }];
    const totalAmount = calculateTotal(nextRows);
    set({
      rows: nextRows,
      nextRowId: nextRowId + 1,
      totalAmount,
      totalText: toMoney(totalAmount),
    });
    return newId;
  },

  removeRow: (rowId) => {
    const { rows } = get();
    if (rows.length <= 1) {
      set({
        rows: [{ id: 1, date: formatKadamDate(), note: '', amount: '' }],
        nextRowId: 2,
        totalAmount: 0,
        totalText: '0.00',
      });
      return;
    }
    const nextRows = rows.filter((row) => row.id !== rowId);
    const totalAmount = calculateTotal(nextRows);
    set({ rows: nextRows, totalAmount, totalText: toMoney(totalAmount) });
  },

  clearAll: () => {
    set({
      rows: [{ id: 1, date: formatKadamDate(), note: '', amount: '' }],
      nextRowId: 2,
      totalAmount: 0,
      totalText: '0.00',
    });
  },
}));
