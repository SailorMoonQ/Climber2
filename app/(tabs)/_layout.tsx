import { Stack, useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { OrganizationContext } from '@/contexts/OrganizationContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const router = useRouter();
  const organizationContext = useContext(OrganizationContext);

  // 如果Context不存在，使用默认值
  const organizationName = organizationContext?.organizationName || '系统名称';

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
            <Ionicons name="settings-outline" size={28} color={tintColor}/>
          </TouchableOpacity>
        </View>
      ),
    }}>
      <Stack.Screen name="index" options={{title: organizationName}}/>
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