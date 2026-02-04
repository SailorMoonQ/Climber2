import { Stack } from "expo-router";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { UserProvider } from "@/contexts/UserContext";
import { BleError, BleManager, Characteristic } from "react-native-ble-plx";
import { PermissionsAndroid, Platform } from "react-native";
import { useEffect } from "react";

const SERVICE_UUID = '0000ffe5-0000-1000-8000-00805f9a34fb';
const NOTIFY_CHARACTERISTIC_UUID = '0000FFE4-0000-1000-8000-00805F9A34FB';
const DEVICE_NAME = 'WT901BLE68';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // const manager = new BleManager();
  //
  // const requestPermissions = async () => {
  //   if (Platform.OS === 'android') {
  //     if (Platform.Version >= 31) {
  //       // Android 12+
  //       const granted = await PermissionsAndroid.requestMultiple([
  //         PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  //         PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  //         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  //       ]);
  //       return (
  //         granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
  //         granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
  //         granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
  //       );
  //     } else {
  //       // Android 11 and below
  //       const granted = await PermissionsAndroid.request(
  //         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  //       );
  //       return granted === PermissionsAndroid.RESULTS.GRANTED;
  //     }
  //   }
  //   return true;
  // };
  //
  // const startNotifications = async (connectedDevice) => {
  //   console.log('Starting notifications...');
  //
  //   connectedDevice.monitorCharacteristicForService(
  //     SERVICE_UUID,
  //     NOTIFY_CHARACTERISTIC_UUID,
  //     (error: BleError | null, characteristic: (Characteristic | null)) => {
  //       console.log(characteristic);
  //       if (error) {
  //         console.error('Notification error:', error);
  //         return;
  //       }
  //
  //       if (characteristic?.value) {
  //         // Decode base64 value
  //         const rawData = atob(characteristic.value);
  //
  //         // Convert to hex string
  //         let hexString = '';
  //         for (let i = 0; i < rawData.length; i++) {
  //           const hex = rawData.charCodeAt(i).toString(16).toUpperCase();
  //           hexString += hex.padStart(2, '0');
  //         }
  //
  //         console.log('Full Hex Data:', hexString);
  //
  //         // Parse last 12 characters (6 bytes)
  //         const last12Chars = hexString.slice(-12);
  //         console.log('Last 12 chars:', last12Chars);
  //
  //         // Convert hex to decimal
  //         const decimalValue = parseInt(last12Chars, 16);
  //         console.log('Decimal value:', decimalValue);
  //
  //         // Update state
  //         // setReceivedData(prev => [
  //         //   {
  //         //     timestamp: new Date().toLocaleTimeString(),
  //         //     fullHex: hexString,
  //         //     last12Hex: last12Chars,
  //         //     decimal: decimalValue
  //         //   },
  //         //   ...prev
  //         // ].slice(0, 20)); // Keep last 20 entries
  //       }
  //     }
  //   );
  // };
  //
  // const connectToDevice = async (scannedDevice) => {
  //   try {
  //     console.log('Connecting to device...');
  //
  //     const connected = await scannedDevice.connect();
  //
  //     console.log('Discovering services and characteristics...');
  //     const device = await connected.discoverAllServicesAndCharacteristics();
  //
  //     console.log('Connected successfully! ', device);
  //
  //     // Start listening to notifications
  //     startNotifications(connected);
  //
  //   } catch (error) {
  //     console.error('Connection error:', error);
  //   }
  // };
  //
  // const scanAndConnect = async () => {
  //   console.log('Starting scan...');
  //
  //   manager.startDeviceScan(null, null, (error, scannedDevice) => {
  //     if (error) {
  //       console.error('Scan error:', error);
  //       return;
  //     }
  //
  //     // Check if this is the device we want
  //     if (scannedDevice!.name === DEVICE_NAME ||
  //       scannedDevice!.localName === DEVICE_NAME) {
  //       console.log('Device found:', scannedDevice.name);
  //
  //       manager.stopDeviceScan();
  //       connectToDevice(scannedDevice);
  //     }
  //   });
  // };
  //
  // useEffect(() => {
  //   // Request permissions for Android
  //   if (Platform.OS === 'android') {
  //     requestPermissions();
  //   }
  //
  //   setTimeout(() => {
  //     void scanAndConnect();
  //   }, 1000);
  //
  //   return () => {
  //     manager.destroy();
  //   };
  // }, []);

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