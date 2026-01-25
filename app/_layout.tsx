import { Stack } from "expo-router";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { OrganizationProvider } from "@/contexts/OrganizationContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <OrganizationProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
          <Stack.Screen name="modal" options={{presentation: 'modal', title: 'Modal'}}/>
        </Stack>
        <StatusBar style="auto"/>
      </OrganizationProvider>
    </ThemeProvider>
  );
}