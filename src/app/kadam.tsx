import React, { useRef, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useKadamStore } from '@/store/kadam';

const KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', '⌫'],
] as const;

type Key = (typeof KEYS)[number][number];

export default function KadamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const noteInputRefs = useRef<Record<number, TextInput | null>>({});

  const { rows, totalText, setRowNote, setRowAmount, addRow, removeRow } = useKadamStore();

  const [activeField, setActiveField] = useState<{
    rowId: number;
    type: 'note' | 'amount';
  } | null>({ rowId: rows[0]?.id ?? 1, type: 'note' });
  const [isNumPadVisible, setIsNumPadVisible] = useState(false);

  const showNumberPad = isNumPadVisible && activeField?.type === 'amount';

  const handleSelectNote = (rowId: number) => {
    setIsNumPadVisible(false);
    setActiveField({ rowId, type: 'note' });
  };

  const handleSelectAmount = (rowId: number) => {
    Keyboard.dismiss();
    setActiveField({ rowId, type: 'amount' });
    setIsNumPadVisible(true);
  };

  const handleAddRow = () => {
    const newRowId = addRow();
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
      setIsNumPadVisible(false);
      setActiveField({ rowId: newRowId, type: 'note' });
      setTimeout(() => {
        noteInputRefs.current[newRowId]?.focus();
      }, 100);
    });
  };

  const handleToggleKeyboard = () => {
    if (showNumberPad) {
      setIsNumPadVisible(false);
      return;
    }
    if (activeField?.type === 'note') {
      Keyboard.dismiss();
    }
    const targetRowId = activeField?.rowId ?? rows[rows.length - 1]?.id ?? 1;
    setActiveField({ rowId: targetRowId, type: 'amount' });
    setIsNumPadVisible(true);
  };

  const getCurrentAmount = (): string => {
    if (!activeField || activeField.type !== 'amount') return '';
    const row = rows.find((r) => r.id === activeField.rowId);
    return row ? row.amount : '';
  };

  const handleKeyPress = (key: Key) => {
    if (!activeField || activeField.type !== 'amount') return;
    Vibration.vibrate(30);
    const current = getCurrentAmount();

    if (key === '⌫') {
      setRowAmount(activeField.rowId, current.slice(0, -1));
      return;
    }

    if (key === '.' && current.includes('.')) return;

    if (key !== '.' && current === '0') {
      setRowAmount(activeField.rowId, key);
      return;
    }

    setRowAmount(activeField.rowId, current + key);
  };

  const isFieldActive = (rowId: number, type: 'note' | 'amount') =>
    activeField?.rowId === rowId && activeField?.type === type;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#f8f3ef]">
      <View className="flex-1 px-5 pt-4">
        {/* Fixed-height Top Header: Back button + Always-visible Total Kadam */}
        <View
          style={{ height: 76 }}
          className="z-10 mb-4 flex-row items-stretch gap-2.5"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ height: 76 }}
            className="w-20 items-center justify-center rounded-2xl bg-[#eadfd8] px-2"
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text className="text-base font-extrabold text-[#5b4037]">Back</Text>
          </TouchableOpacity>

          <View
            style={{ height: 76 }}
            className="flex-1 justify-center overflow-hidden rounded-[28px] border-4 border-[#f2d6c7] bg-[#fdfbfa] px-4 shadow-sm"
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.35}
              style={{
                includeFontPadding: false,
                textAlignVertical: 'center',
                fontSize:
                  totalText.length <= 5
                    ? 48
                    : totalText.length <= 7
                      ? 38
                      : totalText.length <= 9
                        ? 30
                        : 24,
              }}
              className="font-extrabold text-[#2e1309]"
            >
              {totalText}
            </Text>
          </View>
        </View>

        {/* Column Header */}
        <View className="z-10 mb-2 rounded-xl bg-[#f3e7df] px-2 py-2.5">
          <View className="flex-row items-center">
            <Text className="w-9 px-1 text-center text-sm font-extrabold text-[#6f564d]">No.</Text>
            <Text className="flex-[1.5] px-2 text-sm font-extrabold text-[#6f564d]">Note</Text>
            <Text className="flex-[1.1] px-2 text-sm font-extrabold text-[#6f564d]">Amount</Text>
            <Text className="w-14 px-1 text-center text-sm font-extrabold text-[#6f564d]">Action</Text>
          </View>
        </View>

        {/* Kadam Rows */}
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 2 }}
        >
          <View>
            {rows.map((row, index) => {
              const noteActive = isFieldActive(row.id, 'note');
              const amountActive = isFieldActive(row.id, 'amount') && showNumberPad;

              return (
                <View
                  key={row.id}
                  className="mb-1.5 border-b border-[#eadfd8] bg-transparent px-1 py-2.5"
                >
                  {/* First line: Date (e.g. 12 Tue Jun, 2026) */}
                  <View className="mb-1.5 flex-row items-center pl-9">
                    <Text className="text-xs font-bold text-[#6f564d]">{row.date}</Text>
                  </View>

                  {/* Second line: No. + Note + Amount + Action */}
                  <View className="flex-row items-center">
                    <Text className="w-9 px-1 text-center text-base font-extrabold text-[#6f564d]">
                      {index + 1}
                    </Text>

                    {/* Note field — opens normal text keyboard on tap */}
                    <View
                      style={[
                        styles.inputBox,
                        {
                          flex: 1.5,
                          borderColor: noteActive ? '#5b4037' : '#edd4c6',
                        },
                        noteActive && styles.inputBoxActive,
                      ]}
                    >
                      <TextInput
                        ref={(el) => {
                          noteInputRefs.current[row.id] = el;
                        }}
                        value={row.note}
                        onChangeText={(val) => setRowNote(row.id, val)}
                        onFocus={() => handleSelectNote(row.id)}
                        placeholder="Name / Note"
                        placeholderTextColor="#a48f84"
                        keyboardType="default"
                        returnKeyType="next"
                        onSubmitEditing={() => handleSelectAmount(row.id)}
                        style={styles.inputText}
                      />
                    </View>

                    {/* Money field — opens custom number pad on tap */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleSelectAmount(row.id)}
                      style={[
                        styles.inputBox,
                        {
                          flex: 1.1,
                          marginLeft: 8,
                          borderColor: amountActive ? '#5b4037' : '#edd4c6',
                        },
                        amountActive && styles.inputBoxActive,
                      ]}
                    >
                      <TextInput
                        value={row.amount}
                        placeholder="0.00"
                        placeholderTextColor="#a48f84"
                        editable={false}
                        pointerEvents="none"
                        style={styles.inputText}
                      />
                    </TouchableOpacity>

                    {/* Delete / Paid button */}
                    <View className="w-14 items-center">
                      <TouchableOpacity
                        onPress={() => removeRow(row.id)}
                        disabled={rows.length === 1 && !row.note && !row.amount}
                        className={`rounded-lg px-3 py-3.5 ${
                          rows.length === 1 && !row.note && !row.amount
                            ? 'bg-[#efe6e1]'
                            : 'bg-[#f4d7c7]'
                        }`}
                        accessibilityRole="button"
                      >
                        <Text
                          className={`text-sm font-bold ${
                            rows.length === 1 && !row.note && !row.amount
                              ? 'text-[#b9aaa2]'
                              : 'text-[#7a2f1c]'
                          }`}
                        >
                          Del
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Bottom button row + attached Number Pad */}
      <View style={[styles.keyboardContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.toolbarRow}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={handleToggleKeyboard}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={showNumberPad ? 'Hide number pad' : 'Show number pad'}
          >
            <Text style={styles.toggleButtonText}>{showNumberPad ? '▼' : '▲'}</Text>
          </TouchableOpacity>

          <View style={styles.handleBar} />

          <TouchableOpacity
            style={styles.plusButton}
            onPress={handleAddRow}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add kadam row"
          >
            <Text style={styles.plusButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {showNumberPad &&
          KEYS.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.keyRow}>
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
    </SafeAreaView>
  );
}

const BROWN = '#5b4037';
const CREAM = '#fff7f2';
const KEY_BG = '#fdfbfa';
const KEY_BORDER = '#edd4c6';
const BACKSPACE_BG = '#f4d7c7';

const styles = StyleSheet.create({
  inputBox: {
    height: 58,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  inputBoxActive: {
    borderWidth: 2.5,
    shadowColor: BROWN,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  inputText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2e1309',
  },
  keyboardContainer: {
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
  keyRow: {
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
