import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useCalculatorStore } from '@/store/calculator';
import { useKeyboardStore } from '@/store/keyboard';
import { RateItem, useRatesStore } from '@/store/rates';
import { NumericKeyboard } from '@/components/numeric-keyboard';
import { HamburgerMenu } from '@/components/hamburger-menu';

export default function HomeScreen() {
  const router = useRouter();
  const { amountText, rows, nextRowId, setRowPricePerKg, setRowWeightInKg, addRow, removeRow, clear } =
    useCalculatorStore();
  const { activeField, setActiveField } = useKeyboardStore();
  const { items: rateItems, hydrate: hydrateRates } = useRatesStore();
  const scrollRef = useRef<ScrollView>(null);

  // State for picking a rate for a specific row
  const [pickerRowId, setPickerRowId] = useState<number | null>(null);
  const [rateSearchQuery, setRateSearchQuery] = useState('');
  const [selectedItemByRow, setSelectedItemByRow] = useState<Record<number, RateItem | undefined>>(
    {}
  );

  useEffect(() => {
    void hydrateRates();
  }, [hydrateRates]);

  const filteredRates = useMemo(() => {
    const q = rateSearchQuery.trim().toLowerCase();
    if (!q) return rateItems;
    return rateItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.amount.toLowerCase().includes(q)
    );
  }, [rateItems, rateSearchQuery]);

  const handleAddRow = () => {
    const newRowId = nextRowId;
    addRow();
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
      setActiveField({ rowId: newRowId, field: 'pricePerKg' });
    });
  };

  const handleClear = () => {
    setSelectedItemByRow({});
    clear();
  };

  const handleRemoveRow = (rowId: number) => {
    setSelectedItemByRow((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    removeRow(rowId);
  };

  const openRatePicker = (rowId: number) => {
    setRateSearchQuery('');
    setPickerRowId(rowId);
  };

  const closeRatePicker = () => {
    Keyboard.dismiss();
    setPickerRowId(null);
    setRateSearchQuery('');
  };

  const handleSelectRateItem = (item: RateItem) => {
    if (pickerRowId === null) return;
    const targetRowId = pickerRowId;
    setRowPricePerKg(targetRowId, item.amount);
    setSelectedItemByRow((prev) => ({ ...prev, [targetRowId]: item }));
    closeRatePicker();
    // Move active focus to Weight in machine so mom can immediately enter the weight
    setActiveField({ rowId: targetRowId, field: 'weightInKg' });
  };

  const isActive = (rowId: number, field: 'pricePerKg' | 'weightInKg') =>
    activeField?.rowId === rowId && activeField?.field === field;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#f8f3ef]">
      {/* Main content */}
      <View className="flex-1 px-5 pt-4">
        {/* Hamburger + Total amount card + Reset in one line */}
        <View
          style={{ height: 56 }}
          className="z-10 mb-4 flex-row items-stretch gap-2.5"
        >
          <HamburgerMenu buttonClassName="h-full w-12 items-center justify-center rounded-2xl bg-[#eadfd8]" />

          <View
            style={{ height: 56, paddingVertical: 2 }}
            className="flex-1 justify-center overflow-hidden rounded-2xl border-4 border-[#f2d6c7] bg-[#fdfbfa] px-4 shadow-sm"
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.35}
              style={{
                includeFontPadding: false,
                textAlignVertical: 'center',
                fontSize:
                  amountText.length <= 5
                    ? 48
                    : amountText.length <= 7
                      ? 38
                      : amountText.length <= 9
                        ? 30
                        : 24,
              }}
              className="font-extrabold text-[#2e1309]"
            >
              {amountText}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleClear}
            style={{ height: 56 }}
            className="w-20 items-center justify-center rounded-2xl bg-[#5b4037] px-2"
            accessibilityRole="button"
          >
            <Text className="text-center text-sm font-semibold text-[#fff7f2]">Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Column header */}
        <View className="z-10 mb-2 rounded-xl bg-[#f3e7df] px-2 py-2">
          <View className="flex-row items-center">
            <Text className="w-8 px-0.5 text-center text-xs font-bold text-[#6f564d]">No.</Text>
            <Text className="w-12 px-1 text-center text-xs font-bold text-[#6f564d]">Item</Text>
            <Text className="flex-[1.15] px-2 text-xs font-bold text-[#6f564d]">For 1 KG</Text>
            <Text className="flex-[1.35] px-2 text-xs font-bold text-[#6f564d]">
              Weight in machine
            </Text>
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
            {rows.map((row, index) => {
              const pickedItem = selectedItemByRow[row.id];
              return (
                <View
                  key={row.id}
                  className="mb-1 flex-row items-center border-b border-[#eadfd8] bg-transparent px-1 py-2"
                >
                  <Text className="w-8 px-0.5 text-center text-sm font-bold text-[#6f564d]">
                    {index + 1}
                  </Text>

                  {/* Fetch Rate Button (between No. and For 1 KG) */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => openRatePicker(row.id)}
                    style={styles.rateFetchButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Pick saved rate for row ${index + 1}`}
                  >
                    {pickedItem?.imageUri ? (
                      <Image
                        source={{ uri: pickedItem.imageUri }}
                        style={styles.pickedThumb}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="items-center justify-center px-0.5">
                        <Text style={{ fontSize: 15, lineHeight: 18 }}>🏷️</Text>
                        <Text
                          numberOfLines={1}
                          className="mt-0.5 text-[10px] font-extrabold text-[#5b4037]"
                        >
                          {pickedItem ? pickedItem.name : 'Pick'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Price per KG — tappable, not native keyboard */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setActiveField({ rowId: row.id, field: 'pricePerKg' })}
                    style={[
                      {
                        flex: 1.15,
                        height: 56,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        backgroundColor: '#fff',
                        paddingHorizontal: 10,
                        marginLeft: 6,
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
                      placeholder="Rate"
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
                        flex: 1.35,
                        height: 56,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        backgroundColor: '#fff',
                        paddingHorizontal: 10,
                        marginLeft: 6,
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
                      placeholder="Weight"
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
                      onPress={() => handleRemoveRow(row.id)}
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
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Persistent bottom button row + keyboard */}
      <NumericKeyboard onAddRow={handleAddRow} />

      {/* Pick Saved Rate Popup Overlay */}
      {pickerRowId !== null && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeRatePicker} />

          <View style={styles.pickerCard}>
            {/* Popup Header */}
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xl font-extrabold text-[#2e1309]">
                Select Item Rate
              </Text>
              <TouchableOpacity
                onPress={closeRatePicker}
                className="h-9 w-9 items-center justify-center rounded-xl bg-[#eadfd8]"
                accessibilityRole="button"
                accessibilityLabel="Close rate picker"
              >
                <Text className="text-sm font-extrabold text-[#5b4037]">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input inside Popup */}
            <View className="mb-3 flex-row items-center rounded-xl border-[1.5px] border-[#edd4c6] bg-[#fff] px-3 py-2.5">
              <Text className="mr-2 text-sm text-[#8c7065]">🔍</Text>
              <TextInput
                value={rateSearchQuery}
                onChangeText={setRateSearchQuery}
                placeholder="Search item..."
                placeholderTextColor="#a48f84"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {rateSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setRateSearchQuery('')}
                  className="ml-1 h-6 w-6 items-center justify-center rounded-full bg-[#eadfd8]"
                >
                  <Text className="text-[10px] font-extrabold text-[#5b4037]">✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Saved Rates List */}
            <ScrollView
              style={{ maxHeight: 340 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredRates.length === 0 ? (
                <View className="items-center justify-center py-8 px-4">
                  <Text className="text-center text-base font-bold text-[#5b4037]">
                    {rateItems.length === 0
                      ? 'No saved rates yet'
                      : 'No matching items found'}
                  </Text>
                  <Text className="mt-1 text-center text-xs text-[#8c7065]">
                    {rateItems.length === 0
                      ? 'Add items in the Rates page to quickly pick them here.'
                      : 'Try searching with another name.'}
                  </Text>
                  {rateItems.length === 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        closeRatePicker();
                        router.push('/rates');
                      }}
                      className="mt-4 rounded-xl bg-[#5b4037] px-5 py-3"
                    >
                      <Text className="text-sm font-extrabold text-[#fff7f2]">
                        Go to Rates Page
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filteredRates.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.75}
                    onPress={() => handleSelectRateItem(item)}
                    className="mb-2 flex-row items-center rounded-xl border border-[#edd4c6] bg-[#f8f3ef] p-2"
                  >
                    {/* Left side: small thumb image or placeholder */}
                    <View style={styles.pickerThumbBox}>
                      {item.imageUri ? (
                        <Image
                          source={{ uri: item.imageUri }}
                          style={styles.pickedThumb}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.placeholderBox}>
                          <View style={styles.placeholderIconFrame}>
                            <View style={styles.placeholderDot} />
                            <View style={styles.placeholderMountain} />
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Middle: Item Name */}
                    <View className="ml-3 flex-1 justify-center">
                      <Text
                        numberOfLines={2}
                        className="text-base font-extrabold text-[#2e1309]"
                      >
                        {item.name}
                      </Text>
                    </View>

                    {/* Right side: Rate Amount */}
                    <View className="ml-2 rounded-lg border border-[#edd4c6] bg-[#fff] px-3 py-2">
                      <Text className="text-base font-extrabold text-[#5b4037]">
                        {item.amount}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rateFetchButton: {
    width: 46,
    height: 56,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d9b09a',
    backgroundColor: '#eadfd8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pickedThumb: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: 'rgba(46, 19, 9, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#edd4c6',
    backgroundColor: '#fdfbfa',
    padding: 18,
    shadowColor: '#2e1309',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#2e1309',
    paddingVertical: 0,
  },
  pickerThumbBox: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#edd4c6',
    backgroundColor: '#f3e7df',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3e7df',
  },
  placeholderIconFrame: {
    width: 22,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#a48f84',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  placeholderDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#a48f84',
    position: 'absolute',
    top: 3,
    left: 3,
  },
  placeholderMountain: {
    width: 14,
    height: 8,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: '#c8b0a4',
  },
});
