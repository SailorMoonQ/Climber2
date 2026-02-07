import { Stack } from "expo-router";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { UserProvider } from "@/contexts/UserContext";
import { Platform } from "react-native";
import { useEffect } from "react";
import { BLEService, requestPermissions } from "@/services/bluetooth";


export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Request permissions for Android
  if (Platform.OS === 'android') {
    void requestPermissions();
  }

  useEffect(() => {
    BLEService.init().then(() => {
      console.log('BLE Service initialized successfully');
    });

    return () => {
      BLEService.manager?.destroy().then(r => console.log('BLE manager destroyed:', r));
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <UserProvider>
        <OrganizationProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
            <Stack.Screen name="(modals)" options={{presentation: 'modal', title: 'Modal'}}/>
          </Stack>
          <StatusBar style="auto"/>
        </OrganizationProvider>
      </UserProvider>
    </ThemeProvider>
  );
}