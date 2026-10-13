import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import { create } from 'zustand';

export interface RateItem {
  id: number;
  name: string;
  amount: string;
  imageUri?: string;
}

interface RatesState {
  items: RateItem[];
  nextId: number;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addItem: (name: string, amount: string, imageUri?: string) => void;
  updateItem: (id: number, name: string, amount: string, imageUri?: string) => void;
  removeItem: (id: number) => void;
}

const STORAGE_KEY = 'jj_calculator_rates_v1';

function normalizeDir(p?: string | null): string | null {
  if (!p) return null;
  return p.replace(/\/*$/, '') + '/';
}

function getLegacyFileSystem(): any {
  if (Platform.OS === 'web') return null;
  return requireOptionalNativeModule('ExponentFileSystem');
}

export const sanitizeAmountInput = (value: string): string => {
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

async function saveRatesToDisk(items: RateItem[], nextId: number) {
  const payload = JSON.stringify({ items, nextId });
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, payload);
      }
      return;
    }
    const fs = getLegacyFileSystem();
    const docDir = normalizeDir(fs?.documentDirectory);
    if (fs?.writeAsStringAsync && docDir) {
      await fs.writeAsStringAsync(`${docDir}${STORAGE_KEY}.json`, payload, {});
    }
  } catch {
    // Ignore persistence errors silently
  }
}

async function loadRatesFromDisk(): Promise<{ items: RateItem[]; nextId: number } | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
      return null;
    }
    const fs = getLegacyFileSystem();
    const docDir = normalizeDir(fs?.documentDirectory);
    if (fs?.getInfoAsync && fs?.readAsStringAsync && docDir) {
      const path = `${docDir}${STORAGE_KEY}.json`;
      const info = await fs.getInfoAsync(path, {});
      if (info?.exists) {
        const raw = await fs.readAsStringAsync(path, {});
        return JSON.parse(raw);
      }
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

export async function persistImageUri(uri?: string): Promise<string | undefined> {
  if (!uri) return undefined;
  if (Platform.OS === 'web' || uri.startsWith('data:')) {
    return uri;
  }
  try {
    const fs = getLegacyFileSystem();
    const docDir = normalizeDir(fs?.documentDirectory);
    if (!fs || !docDir) return uri;

    const dir = `${docDir}rate_images/`;
    if (uri.startsWith(dir)) {
      return uri;
    }

    const dirInfo = await fs.getInfoAsync(dir, {});
    if (!dirInfo?.exists) {
      await fs.makeDirectoryAsync(dir, { intermediates: true });
    }

    const extMatch = uri.match(/\.[a-zA-Z0-9]+(\?|$)/);
    const ext = extMatch ? extMatch[0].replace('?', '') : '.jpg';
    const dest = `${dir}item_${Date.now()}${ext}`;
    await fs.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

export const useRatesStore = create<RatesState>((set, get) => ({
  items: [],
  nextId: 1,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const saved = await loadRatesFromDisk();
    if (saved && Array.isArray(saved.items)) {
      const maxId = saved.items.reduce((max, item) => Math.max(max, item.id), 0);
      set({
        items: saved.items,
        nextId: Math.max(saved.nextId || 1, maxId + 1),
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },

  addItem: (name, amount, imageUri) => {
    const { items, nextId } = get();
    const cleanedName = name.trim();
    const cleanedAmount = sanitizeAmountInput(amount).trim();
    if (!cleanedName && !cleanedAmount) return;

    const newItem: RateItem = {
      id: nextId,
      name: cleanedName || 'Unnamed Item',
      amount: cleanedAmount || '0',
      imageUri,
    };
    const nextItems = [newItem, ...items];
    const updatedNextId = nextId + 1;
    set({ items: nextItems, nextId: updatedNextId });
    void saveRatesToDisk(nextItems, updatedNextId);
  },

  updateItem: (id, name, amount, imageUri) => {
    const { items, nextId } = get();
    const cleanedName = name.trim();
    const cleanedAmount = sanitizeAmountInput(amount).trim();
    const nextItems = items.map((item) =>
      item.id === id
        ? {
            ...item,
            name: cleanedName || item.name,
            amount: cleanedAmount || '0',
            imageUri,
          }
        : item
    );
    set({ items: nextItems });
    void saveRatesToDisk(nextItems, nextId);
  },

  removeItem: (id) => {
    const { items, nextId } = get();
    const nextItems = items.filter((item) => item.id !== id);
    set({ items: nextItems });
    void saveRatesToDisk(nextItems, nextId);
  },
}));
