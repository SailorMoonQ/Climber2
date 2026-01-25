import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const router = useRouter();

  return (
    <Stack screenOptions={{ 
      headerShown: true, 
      headerTitleStyle: {
        fontSize: 24,
        fontWeight: 'bold',
      },
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={28} color={tintColor} />
          </TouchableOpacity>
        </View>
      ),
    }}>
      <Stack.Screen name="index" options={{title: '系统名称'}} />
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