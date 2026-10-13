import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardStore } from '@/store/keyboard';
import { useCalculatorStore } from '@/store/calculator';

const KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', '⌫'],
] as const;

type Key = (typeof KEYS)[number][number];

interface NumericKeyboardProps {
  onAddRow: () => void;
}

export function NumericKeyboard({ onAddRow }: NumericKeyboardProps) {
  const insets = useSafeAreaInsets();
  const { activeField, isVisible, toggleKeyboard } = useKeyboardStore();
  const { rows, setRowPricePerKg, setRowWeightInKg } = useCalculatorStore();

  const showKeypad = isVisible && activeField !== null;

  const getCurrentValue = (): string => {
    if (!activeField) return '';
    const row = rows.find((r) => r.id === activeField.rowId);
    if (!row) return '';
    return activeField.field === 'pricePerKg' ? row.pricePerKg : row.weightInKg;
  };

  const updateValue = (val: string) => {
    if (!activeField) return;
    if (activeField.field === 'pricePerKg') {
      setRowPricePerKg(activeField.rowId, val);
    } else {
      setRowWeightInKg(activeField.rowId, val);
    }
  };

  const handleKeyPress = (key: Key) => {
    Vibration.vibrate(30);
    const current = getCurrentValue();

    if (key === '⌫') {
      updateValue(current.slice(0, -1));
      return;
    }

    // Prevent multiple dots
    if (key === '.' && current.includes('.')) return;

    // Prevent leading zeros like "007"
    if (key !== '.' && current === '0') {
      updateValue(key);
      return;
    }

    updateValue(current + key);
  };

  const handleToggleKeyboard = () => {
    const fallbackRowId = rows[rows.length - 1]?.id ?? 1;
    toggleKeyboard(fallbackRowId);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Small button row — stays at bottom when hidden, attached to top of keyboard when open */}
      <View style={styles.toolbarRow}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={handleToggleKeyboard}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={showKeypad ? 'Hide keyboard' : 'Show keyboard'}
        >
          <Text style={styles.toggleButtonText}>{showKeypad ? '▼' : '▲'}</Text>
        </TouchableOpacity>

        <View style={styles.handleBar} />

        <TouchableOpacity
          style={styles.plusButton}
          onPress={onAddRow}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add row"
        >
          <Text style={styles.plusButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {showKeypad &&
        KEYS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((key) => {
              const isBackspace = key === '⌫';
              const isDot = key === '.';
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.key,
                    isBackspace && styles.keyBackspace,
                    isDot && styles.keyDot,
                  ]}
                  onPress={() => handleKeyPress(key)}
                  activeOpacity={0.65}
                  accessibilityLabel={isBackspace ? 'Backspace' : key}
                  accessibilityRole="button"
                >
                  <Text style={[styles.keyText, isBackspace && styles.keyTextBackspace]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
    </View>
  );
}

const BROWN = '#5b4037';
const CREAM = '#fff7f2';
const KEY_BG = '#fdfbfa';
const KEY_BORDER = '#edd4c6';
const BACKSPACE_BG = '#f4d7c7';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3e7df',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderTopWidth: 1.5,
    borderTopColor: KEY_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  toggleButton: {
    height: 38,
    minWidth: 52,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#eadfd8',
    borderWidth: 1,
    borderColor: KEY_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: BROWN,
  },
  plusButton: {
    height: 48,
    minWidth: 76,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: BROWN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButtonText: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
    color: CREAM,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c8b0a4',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  key: {
    flex: 1,
    backgroundColor: KEY_BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: KEY_BORDER,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7a4030',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  keyBackspace: {
    backgroundColor: BACKSPACE_BG,
    borderColor: '#d9b09a',
  },
  keyDot: {
    backgroundColor: '#f0e6e0',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '700',
    color: BROWN,
  },
  keyTextBackspace: {
    fontSize: 22,
    color: '#7a2f1c',
  },
});
