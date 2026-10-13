import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useCalculatorStore } from '@/store/calculator';

export default function HistoryScreen() {
  const router = useRouter();
  const { history, clearHistory } = useCalculatorStore();

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f3ef]">
      <View className="flex-row items-center justify-between px-5 pt-6 mb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-xl bg-[#eadfd8] px-4 py-2"
        >
          <Text className="text-sm font-bold text-[#5b4037]">Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-[#2e1309]">History</Text>
        <View className="w-16" />
      </View>

      <ScrollView className="flex-1 px-5">
        {history.length === 0 ? (
          <View className="flex-1 items-center justify-center pt-20">
            <Text className="text-[#a48f84] text-lg font-medium">No history yet</Text>
            <Text className="text-[#a48f84] text-sm mt-2 text-center">
              Complete calculations and press Reset to save them here.
            </Text>
          </View>
        ) : (
          history.map((item) => (
            <View
              key={item.id}
              className="mb-4 rounded-2xl bg-[#fff] p-4 shadow-sm border border-[#eadfd8]"
            >
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-[#a48f84]">{formatDate(item.date)}</Text>
                <Text className="text-sm font-extrabold text-[#2e1309]">Total: {item.amountText}</Text>
              </View>

              <View className="bg-[#f8f3ef] rounded-xl p-3">
                <View className="flex-row border-b border-[#eadfd8] pb-2 mb-2">
                  <Text className="flex-[1.2] text-xs font-bold text-[#6f564d]">Rate</Text>
                  <Text className="flex-[1.4] text-xs font-bold text-[#6f564d]">Weight</Text>
                </View>
                {item.rows.map((row, index) => (
                  <View key={row.id} className="flex-row py-1">
                    <Text className="flex-[1.2] text-sm text-[#2e1309] font-medium">
                      {row.pricePerKg || '0'}
                    </Text>
                    <Text className="flex-[1.4] text-sm text-[#2e1309] font-medium">
                      {row.weightInKg || '0'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        {history.length > 0 && (
          <TouchableOpacity
            onPress={clearHistory}
            className="mt-4 mb-10 items-center justify-center rounded-2xl bg-[#5b4037] py-4"
          >
            <Text className="text-center text-sm font-semibold text-[#fff7f2]">
              Clear All History
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
