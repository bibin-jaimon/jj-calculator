import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function RatesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f8f3ef]">
      <View className="mb-4 flex-row items-center justify-between px-5 pt-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-xl bg-[#eadfd8] px-4 py-2"
        >
          <Text className="text-sm font-bold text-[#5b4037]">Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-[#2e1309]">Rates</Text>
        <View className="w-16" />
      </View>
    </SafeAreaView>
  );
}
