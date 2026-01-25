import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <Stack screenOptions={{ 
      headerShown: true, 
      headerTitleStyle: {
        fontSize: 24,
        fontWeight: 'bold',
      },
      headerRight: () => (
        <View style={styles.headerRight}>
          <Text style={[styles.userName, { color: tintColor }]}>李丽</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={28} color={tintColor} />
          </TouchableOpacity>
        </View>
      ),
    }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  userName: {
    fontSize: 20,
    marginRight: 10,
    fontWeight: '600',
  },
  settingsButton: {
    marginLeft: 10,
  },
});