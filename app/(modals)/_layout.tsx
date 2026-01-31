import { Stack } from "expo-router";

export default function RootLayout() {

  return (
    <Stack>
      <Stack.Screen name="user" options={{presentation: 'modal', headerShown: false}}/>
    </Stack>
  );
}