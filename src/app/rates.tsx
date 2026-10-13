import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  persistImageUri,
  RateItem,
  sanitizeAmountInput,
  useRatesStore,
} from '@/store/rates';

function pickImageOnWeb(): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(undefined);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(undefined);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : undefined);
      };
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

export default function RatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, hydrate, addItem, updateItem, removeItem } = useRatesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<RateItem | null>(null);

  // Popup form fields
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemImageUri, setItemImageUri] = useState<string | undefined>(undefined);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.amount.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const openAddPopup = () => {
    Keyboard.dismiss();
    setEditingItem(null);
    setItemName('');
    setItemAmount('');
    setItemImageUri(undefined);
    setPopupVisible(true);
  };

  const openEditPopup = (item: RateItem) => {
    Keyboard.dismiss();
    setEditingItem(item);
    setItemName(item.name);
    setItemAmount(item.amount);
    setItemImageUri(item.imageUri);
    setPopupVisible(true);
  };

  const closePopup = () => {
    Keyboard.dismiss();
    setPopupVisible(false);
    setEditingItem(null);
    setItemName('');
    setItemAmount('');
    setItemImageUri(undefined);
  };

  const handlePickImage = async (source: 'library' | 'camera' = 'library') => {
    Keyboard.dismiss();

    if (Platform.OS === 'web') {
      const dataUrl = await pickImageOnWeb();
      if (dataUrl) {
        setItemImageUri(dataUrl);
      }
      return;
    }

    // 1. Try native ExponentImagePicker directly (works in Expo Go & dev builds with expo-image-picker)
    const nativeImagePicker = requireOptionalNativeModule<any>('ExponentImagePicker');
    if (nativeImagePicker) {
      try {
        if (source === 'camera') {
          if (nativeImagePicker.requestCameraPermissionsAsync) {
            const perm = await nativeImagePicker.requestCameraPermissionsAsync();
            if (!perm?.granted && perm?.status !== 'granted') {
              Alert.alert('Permission needed', 'Please allow camera access in Settings to take item photos.');
              return;
            }
          }
          const result = await nativeImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.7,
          });
          if (!result?.canceled && result?.assets?.[0]?.uri) {
            const savedUri = await persistImageUri(result.assets[0].uri);
            setItemImageUri(savedUri);
          }
          return;
        }

        // Photo Library (PHPicker on iOS 14+ does not require photo library permissions when allowsEditing is false)
        const result = await nativeImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.7,
        });
        if (!result?.canceled && result?.assets?.[0]?.uri) {
          const savedUri = await persistImageUri(result.assets[0].uri);
          setItemImageUri(savedUri);
        }
        return;
      } catch (err: any) {
        const msg = String(err?.message || err || '').toLowerCase();
        if (msg.includes('cancel')) {
          return;
        }
        // If camera or library failed, fall through to FileSystem picker below
      }
    }

    // 2. Fallback to native Expo FileSystem file picker (built into existing dev builds)
    const nativeFileSystem = requireOptionalNativeModule<any>('FileSystem');
    if (nativeFileSystem?.pickFileAsync) {
      try {
        const picked = await nativeFileSystem.pickFileAsync({
          mimeTypes: ['image/*'],
          multipleFiles: false,
        });
        const uri = Array.isArray(picked) ? picked[0]?.uri : picked?.uri;
        if (uri) {
          const savedUri = await persistImageUri(uri);
          setItemImageUri(savedUri);
        }
        return;
      } catch (err: any) {
        const msg = String(err?.message || err || '').toLowerCase();
        if (msg.includes('cancel')) {
          return;
        }
      }
    }

    Alert.alert('Unable to pick image', 'Could not open the image picker on this device.');
  };

  const handleSaveItem = () => {
    const trimmedName = itemName.trim();
    const trimmedAmount = sanitizeAmountInput(itemAmount).trim();

    if (!trimmedName && !trimmedAmount) {
      Alert.alert('Missing details', 'Please enter the item name and amount.');
      return;
    }

    if (editingItem) {
      updateItem(editingItem.id, trimmedName || 'Item', trimmedAmount || '0', itemImageUri);
    } else {
      addItem(trimmedName || 'Item', trimmedAmount || '0', itemImageUri);
    }

    closePopup();
  };

  const handleDeleteCurrent = () => {
    if (!editingItem) return;
    removeItem(editingItem.id);
    closePopup();
  };

  const canSubmit = itemName.trim().length > 0 || itemAmount.trim().length > 0;
  const hasCameraSupport =
    Platform.OS !== 'web' && Boolean(requireOptionalNativeModule('ExponentImagePicker'));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-[#f8f3ef]">
      <View className="flex-1 px-5 pt-4">
        {/* Top Header: Back Button + Search Bar */}
        <View
          style={{ height: 56 }}
          className="z-10 mb-4 flex-row items-stretch gap-2.5"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ height: 56 }}
            className="w-20 items-center justify-center rounded-2xl bg-[#eadfd8] px-2"
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text className="text-base font-extrabold text-[#5b4037]">Back</Text>
          </TouchableOpacity>

          {/* Search Field */}
          <View
            style={{ height: 56 }}
            className="flex-1 flex-row items-center rounded-2xl border-2 border-[#edd4c6] bg-[#fdfbfa] px-3.5 shadow-sm"
          >
            <Text className="mr-2 text-base text-[#8c7065]">🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search item rate..."
              placeholderTextColor="#a48f84"
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="ml-1 h-7 w-7 items-center justify-center rounded-full bg-[#eadfd8]"
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Text className="text-xs font-extrabold text-[#5b4037]">✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Table Column Header (like Calculator page) */}
        <View className="z-10 mb-2 rounded-xl bg-[#f3e7df] px-2.5 py-2.5">
          <View className="flex-row items-center">
            <Text className="w-14 text-center text-xs font-extrabold text-[#6f564d]">
              Image
            </Text>
            <Text className="flex-1 px-3 text-xs font-extrabold text-[#6f564d]">
              Item
            </Text>
            <Text className="w-28 px-2 text-right text-xs font-extrabold text-[#6f564d]">
              Amount
            </Text>
          </View>
        </View>

        {/* Table Rows */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 2 }}
        >
          {filteredItems.length === 0 ? (
            <View className="items-center justify-center pt-16 px-4">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl border border-[#edd4c6] bg-[#f3e7df]">
                <Text className="text-2xl">🏷️</Text>
              </View>
              <Text className="text-center text-lg font-extrabold text-[#5b4037]">
                {items.length === 0 ? 'No item rates saved yet' : 'No matching items found'}
              </Text>
              <Text className="mt-1.5 text-center text-sm font-medium text-[#8c7065]">
                {items.length === 0
                  ? 'Tap the + button below to add an item, its rate, and photo.'
                  : 'Try searching with a different item name.'}
              </Text>
            </View>
          ) : (
            <View>
              {filteredItems.map((item) => (
                <View
                  key={item.id}
                  className="mb-1.5 flex-row items-center border-b border-[#eadfd8] bg-transparent px-1 py-2"
                >
                  {/* Left side: small thumbnail image or placeholder */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      item.imageUri ? setPreviewImageUri(item.imageUri) : openEditPopup(item)
                    }
                    style={styles.thumbBox}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name} thumbnail`}
                  >
                    {item.imageUri ? (
                      <Image
                        source={{ uri: item.imageUri }}
                        style={styles.thumbImage}
                        contentFit="cover"
                        transition={150}
                      />
                    ) : (
                      <View style={styles.placeholderBox}>
                        <View style={styles.placeholderIconFrame}>
                          <View style={styles.placeholderDot} />
                          <View style={styles.placeholderMountain} />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Middle: Item text */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => openEditPopup(item)}
                    style={[styles.tableCell, { flex: 1, marginLeft: 8 }]}
                  >
                    <Text numberOfLines={2} style={styles.itemText}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>

                  {/* Right side: Amount */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => openEditPopup(item)}
                    style={[
                      styles.tableCell,
                      {
                        width: 112,
                        marginLeft: 8,
                        alignItems: 'flex-end',
                      },
                    ]}
                  >
                    <Text numberOfLines={1} adjustsFontSizeToFit style={styles.amountText}>
                      {item.amount}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Bottom Toolbar with Plus Button (consistent with Calculator & Kadam pages) */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.toolbarRow}>
          <Text className="pl-2 text-xs font-bold text-[#8c7065]">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>

          <View style={styles.handleBar} />

          <TouchableOpacity
            style={styles.plusButton}
            onPress={openAddPopup}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add item rate"
          >
            <Text style={styles.plusButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add / Edit Item Rate Popup (in-screen overlay so iOS PHPicker/DocumentPicker presents without Modal conflicts) */}
      {popupVisible && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closePopup} />

          <View style={styles.popupCard}>
            {/* Popup Header */}
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-extrabold text-[#2e1309]">
                {editingItem ? 'Edit Item Rate' : 'Add Item Rate'}
              </Text>
              <TouchableOpacity
                onPress={closePopup}
                className="h-9 w-9 items-center justify-center rounded-xl bg-[#eadfd8]"
                accessibilityRole="button"
                accessibilityLabel="Close popup"
              >
                <Text className="text-sm font-extrabold text-[#5b4037]">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Text Field */}
            <View className="mb-3.5">
              <Text className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-[#6f564d]">
                Item Name
              </Text>
              <View style={styles.popupInputBox}>
                <TextInput
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="Enter item name (e.g. Sugar)"
                  placeholderTextColor="#a48f84"
                  style={styles.popupInputText}
                  autoFocus={!editingItem}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Amount Field */}
            <View className="mb-3.5">
              <Text className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-[#6f564d]">
                Amount / Rate
              </Text>
              <View style={styles.popupInputBox}>
                <TextInput
                  value={itemAmount}
                  onChangeText={(val) => setItemAmount(sanitizeAmountInput(val))}
                  placeholder="Enter rate (e.g. 45)"
                  placeholderTextColor="#a48f84"
                  keyboardType="decimal-pad"
                  style={styles.popupInputText}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Image Upload Field */}
            <View className="mb-5">
              <Text className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-[#6f564d]">
                Image (Optional)
              </Text>

              {itemImageUri ? (
                <View className="flex-row items-center rounded-2xl border-[1.5px] border-[#edd4c6] bg-[#f8f3ef] p-3">
                  <Image
                    source={{ uri: itemImageUri }}
                    style={styles.popupPreviewThumb}
                    contentFit="cover"
                  />
                  <View className="ml-3 flex-1 gap-2">
                    <TouchableOpacity
                      onPress={() => handlePickImage('library')}
                      className="items-center justify-center rounded-xl bg-[#eadfd8] py-2.5"
                    >
                      <Text className="text-xs font-extrabold text-[#5b4037]">Change Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setItemImageUri(undefined)}
                      className="items-center justify-center rounded-xl bg-[#f4d7c7] py-2"
                    >
                      <Text className="text-xs font-bold text-[#7a2f1c]">Remove Image</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View className="rounded-2xl border-[1.5px] border-dashed border-[#d9b09a] bg-[#f8f3ef] p-3.5">
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handlePickImage('library')}
                    className="items-center justify-center py-2"
                  >
                    <View className="mb-1.5 h-11 w-11 items-center justify-center rounded-xl bg-[#eadfd8]">
                      <Text className="text-xl">📷</Text>
                    </View>
                    <Text className="text-sm font-extrabold text-[#5b4037]">
                      Tap to Upload Image
                    </Text>
                    <Text className="mt-0.5 text-xs text-[#8c7065]">
                      Choose a photo from your phone
                    </Text>
                  </TouchableOpacity>

                  {hasCameraSupport && (
                    <View className="mt-2.5 flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handlePickImage('library')}
                        className="flex-1 items-center justify-center rounded-xl bg-[#eadfd8] py-2.5"
                      >
                        <Text className="text-xs font-extrabold text-[#5b4037]">Gallery</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handlePickImage('camera')}
                        className="flex-1 items-center justify-center rounded-xl bg-[#eadfd8] py-2.5"
                      >
                        <Text className="text-xs font-extrabold text-[#5b4037]">Camera</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2.5">
              {editingItem && (
                <TouchableOpacity
                  onPress={handleDeleteCurrent}
                  activeOpacity={0.75}
                  className="items-center justify-center rounded-2xl bg-[#f4d7c7] px-5 py-4"
                  accessibilityRole="button"
                  accessibilityLabel="Delete item"
                >
                  <Text className="text-base font-extrabold text-[#7a2f1c]">Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSaveItem}
                disabled={!canSubmit}
                activeOpacity={0.8}
                className={`flex-1 items-center justify-center rounded-2xl py-4 ${
                  canSubmit ? 'bg-[#5b4037]' : 'bg-[#c8b0a4]'
                }`}
                accessibilityRole="button"
                accessibilityLabel={editingItem ? 'Save item' : 'Add item'}
              >
                <Text className="text-base font-extrabold text-[#fff7f2]">
                  {editingItem ? 'Save' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Full Image Preview Overlay when tapping a thumbnail */}
      {previewImageUri !== null && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPreviewImageUri(null)}
        >
          <View className="w-[85%] max-w-[360px] items-center rounded-3xl border-2 border-[#edd4c6] bg-[#fdfbfa] p-4">
            <Image
              source={{ uri: previewImageUri }}
              style={{ width: 280, height: 280, borderRadius: 16 }}
              contentFit="cover"
            />
            <TouchableOpacity
              onPress={() => setPreviewImageUri(null)}
              className="mt-4 w-full items-center justify-center rounded-2xl bg-[#5b4037] py-3"
            >
              <Text className="text-sm font-extrabold text-[#fff7f2]">Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const BROWN = '#5b4037';
const CREAM = '#fff7f2';
const KEY_BORDER = '#edd4c6';

const styles = StyleSheet.create({
  searchInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#2e1309',
    paddingVertical: 0,
  },
  thumbBox: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: KEY_BORDER,
    backgroundColor: '#f3e7df',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3e7df',
  },
  placeholderIconFrame: {
    width: 28,
    height: 24,
    borderRadius: 5,
    borderWidth: 1.8,
    borderColor: '#a48f84',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  placeholderDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#a48f84',
    position: 'absolute',
    top: 4,
    left: 4,
  },
  placeholderMountain: {
    width: 18,
    height: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: '#c8b0a4',
  },
  tableCell: {
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: KEY_BORDER,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e1309',
  },
  amountText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2e1309',
  },
  bottomBar: {
    backgroundColor: '#f3e7df',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
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
  popupCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: KEY_BORDER,
    backgroundColor: '#fdfbfa',
    padding: 20,
    shadowColor: '#2e1309',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  popupInputBox: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: KEY_BORDER,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  popupInputText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e1309',
  },
  popupPreviewThumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: KEY_BORDER,
  },
});
