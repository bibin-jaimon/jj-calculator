import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCalculatorStore } from '@/store/calculator';
import { useKeyboardStore } from '@/store/keyboard';
import { NumericKeyboard } from '@/components/numeric-keyboard';

export default function HomeScreen() {
  const { amountText, rows, setRowPricePerKg, setRowWeightInKg, addRow, removeRow, clear } =
    useCalculatorStore();
  const { activeField, setActiveField } = useKeyboardStore();
  const scrollRef = useRef<ScrollView>(null);

  const handleAddRow = () => {
    addRow();
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const isActive = (rowId: number, field: 'pricePerKg' | 'weightInKg') =>
    activeField?.rowId === rowId && activeField?.field === field;

  return (
    <SafeAreaView className="flex-1 bg-[#f8f3ef]" edges={['top', 'left', 'right']}>
      {/* Main content */}
      <View className="flex-1 px-5 pt-6">
        {/* Total amount card + Reset */}
        <View className="z-10 mb-4 flex-row items-stretch gap-3">
          <View className="flex-1 rounded-[32px] border-4 border-[#f2d6c7] bg-[#fdfbfa] px-5 py-7 shadow-sm">
            <Text className="text-left text-2xl font-extrabold tracking-wide text-[#5b4037]">
              TOTAL PRICE
            </Text>
            <View className="mt-4 flex-row items-end justify-start">
              <Text className="text-6xl font-extrabold text-[#2e1309]">{amountText}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={clear}
            className="w-28 items-center justify-center rounded-2xl bg-[#5b4037] px-3"
            accessibilityRole="button"
          >
            <Text className="text-center text-sm font-semibold text-[#fff7f2]">Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Column header */}
        <View className="z-10 mb-2 rounded-xl bg-[#f3e7df] px-2 py-2">
          <View className="flex-row items-center">
            <Text className="w-10 px-1 text-center text-xs font-bold text-[#6f564d]">No.</Text>
            <Text className="flex-[1.2] px-2 text-xs font-bold text-[#6f564d]">For 1 KG</Text>
            <Text className="flex-[1.4] px-2 text-xs font-bold text-[#6f564d]">Weight in machine</Text>
            <Text className="w-14 px-1 text-center text-xs font-bold text-[#6f564d]">Action</Text>
          </View>
        </View>

        {/* Rows */}
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 12, paddingHorizontal: 2 }}
        >
          <View>
            {rows.map((row, index) => (
              <View
                key={row.id}
                className="mb-1 flex-row items-center border-b border-[#eadfd8] bg-transparent px-1 py-2"
              >
                <Text className="w-10 px-1 text-center text-sm font-bold text-[#6f564d]">
                  {index + 1}
                </Text>

                {/* Price per KG — tappable, not native keyboard */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setActiveField({ rowId: row.id, field: 'pricePerKg' })}
                  style={[
                    {
                      flex: 1.2,
                      height: 56,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      backgroundColor: '#fff',
                      paddingHorizontal: 12,
                      justifyContent: 'center',
                      borderColor: isActive(row.id, 'pricePerKg') ? '#5b4037' : '#edd4c6',
                    },
                    isActive(row.id, 'pricePerKg') && {
                      borderWidth: 2.5,
                      shadowColor: '#5b4037',
                      shadowOpacity: 0.18,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 3,
                    },
                  ]}
                >
                  <TextInput
                    value={row.pricePerKg}
                    onChangeText={(value) => setRowPricePerKg(row.id, value)}
                    placeholder="100"
                    placeholderTextColor="#a48f84"
                    editable={false}
                    pointerEvents="none"
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: '#2e1309',
                    }}
                  />
                </TouchableOpacity>

                {/* Weight in KG — tappable, not native keyboard */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setActiveField({ rowId: row.id, field: 'weightInKg' })}
                  style={[
                    {
                      flex: 1.4,
                      height: 56,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      backgroundColor: '#fff',
                      paddingHorizontal: 12,
                      marginLeft: 8,
                      justifyContent: 'center',
                      borderColor: isActive(row.id, 'weightInKg') ? '#5b4037' : '#edd4c6',
                    },
                    isActive(row.id, 'weightInKg') && {
                      borderWidth: 2.5,
                      shadowColor: '#5b4037',
                      shadowOpacity: 0.18,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 3,
                    },
                  ]}
                >
                  <TextInput
                    value={row.weightInKg}
                    onChangeText={(value) => setRowWeightInKg(row.id, value)}
                    placeholder="0.546"
                    placeholderTextColor="#a48f84"
                    editable={false}
                    pointerEvents="none"
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: '#2e1309',
                    }}
                  />
                </TouchableOpacity>

                <View className="w-14 items-center">
                  <TouchableOpacity
                    onPress={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className={`rounded-lg px-3 py-3 ${
                      rows.length === 1 ? 'bg-[#efe6e1]' : 'bg-[#f4d7c7]'
                    }`}
                    accessibilityRole="button"
                  >
                    <Text
                      className={`text-sm font-bold ${
                        rows.length === 1 ? 'text-[#b9aaa2]' : 'text-[#7a2f1c]'
                      }`}
                    >
                      Del
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Add row button */}
        <View className="items-end pt-3 pb-3">
          <TouchableOpacity
            onPress={handleAddRow}
            className="h-14 w-14 items-center justify-center rounded-full bg-[#5b4037]"
            accessibilityRole="button"
            accessibilityLabel="Add row"
          >
            <Text className="text-4xl font-bold leading-none text-[#fff7f2]">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Persistent on-screen keyboard — always visible at bottom */}
      <NumericKeyboard />
    </SafeAreaView>
  );
}
