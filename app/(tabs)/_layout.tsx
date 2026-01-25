import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <Stack screenOptions={{
      headerShown: true,
      title: 'XX系统名称XX',
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 15 }}>
          <Ionicons name="settings-outline" size={24} color={tintColor} />
        </TouchableOpacity>
      ),
    }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}