import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';

const MENU_ITEMS = [
  { label: 'Calculator', path: '/' },
  { label: 'Kadam', path: '/kadam' },
  { label: 'Rates', path: '/rates' },
  { label: 'History', path: '/history' },
] as const;

interface HamburgerMenuProps {
  buttonClassName?: string;
}

export function HamburgerMenu({
  buttonClassName = 'h-12 w-12 items-center justify-center rounded-2xl bg-[#eadfd8]',
}: HamburgerMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const handleNavigate = (path: (typeof MENU_ITEMS)[number]['path']) => {
    setMenuOpen(false);
    if (pathname === path) return;
    if (path === '/') {
      router.replace('/');
    } else {
      router.push(path);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setMenuOpen(true)}
        className={buttonClassName}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
      >
        <View className="w-5 gap-1.5">
          <View className="h-[2.5px] w-5 rounded-full bg-[#5b4037]" />
          <View className="h-[2.5px] w-5 rounded-full bg-[#5b4037]" />
          <View className="h-[2.5px] w-5 rounded-full bg-[#5b4037]" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View
            style={[
              styles.menuCard,
              {
                marginTop: insets.top + 92,
                marginLeft: 20,
              },
            ]}
          >
            {MENU_ITEMS.map((item) => {
              const isCurrent = pathname === item.path;
              return (
                <TouchableOpacity
                  key={item.path}
                  onPress={() => handleNavigate(item.path)}
                  style={[styles.menuItem, isCurrent && styles.menuItemCurrent]}
                  activeOpacity={0.7}
                  accessibilityRole="menuitem"
                >
                  <Text style={[styles.menuItemText, isCurrent && styles.menuItemTextCurrent]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'flex-start',
  },
  menuCard: {
    width: 200,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#eadfd8',
    backgroundColor: '#fdfbfa',
    padding: 8,
    gap: 4,
    shadowColor: '#2e1309',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemCurrent: {
    backgroundColor: '#f3e7df',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5b4037',
  },
  menuItemTextCurrent: {
    fontWeight: '800',
    color: '#2e1309',
  },
});
