import { Stack } from "expo-router";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { UserProvider } from "@/contexts/UserContext";
import { LanguageProvider } from "@/i18n";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform } from "react-native";
import { useEffect } from "react";
import { BLEService, requestPermissions } from "@/services/bluetooth";
import { initDatabase } from "@/utils/database";
import { BluetoothProvider } from "@/context/bluetooth-provider";
import { BluetoothStatusBanner } from "@/components/ui/bluetooth-status-banner";


export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Request permissions for Android
  if (Platform.OS === 'android') {
    void requestPermissions();
  }

  useEffect(() => {
    // 初始化数据库
    initDatabase().then(() => {
      console.log('Database initialized successfully');
    }).catch(error => {
      console.error('Error initializing database:', error);
    });

    BLEService.init().then(() => {
      console.log('BLE Service initialized successfully');
    });

    return () => {
      BLEService.manager?.destroy().then(r => console.log('BLE manager destroyed:', r));
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <LanguageProvider>
          <BluetoothProvider>
            <UserProvider>
              <OrganizationProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(modals)" options={{ presentation: 'modal', title: 'Modal' }} />
                </Stack>
                <BluetoothStatusBanner />
                <StatusBar style="auto" />
              </OrganizationProvider>
            </UserProvider>
          </BluetoothProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}