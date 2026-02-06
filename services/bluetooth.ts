import { BleError, BleManager, Characteristic, Device } from 'react-native-ble-plx'
import { PermissionsAndroid, Platform } from "react-native";
import { DEVICE_NAME, NOTIFY_CHARACTERISTIC_UUID, SERVICE_UUID } from "@/services/pose";


export const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) {
      // Android 12+
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
        granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
      );
    } else {
      // Android 11 and below
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  return true;
};

// create your own singleton class
class BLEServiceInstance {
  manager: BleManager | null = null;
  private scanning = false;

  constructor() {
    try {
      this.manager = new BleManager();
      console.log('BLE Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize BLE Manager:', error);
      this.manager = null;
    }
  }

  init = async () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(this.manager);
      }, 2000);
    });
  };

  startNotifications = async (connectedDevice: Device) => {
    try {
      console.log('Starting notifications...');

      if (!connectedDevice) {
        console.error('Cannot start notifications: connectedDevice is null');
        return;
      }

      connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        NOTIFY_CHARACTERISTIC_UUID,
        (error: BleError | null, characteristic: (Characteristic | null)) => {
          if (error) {
            console.error('Notification error:', error);
            return;
          }

          if (characteristic?.value) {
            try {
              // Decode base64 value
              const rawData = atob(characteristic.value);

              // Convert to hex string
              let hexString = '';
              for (let i = 0; i < rawData.length; i++) {
                const hex = rawData.charCodeAt(i).toString(16).toUpperCase();
                hexString += hex.padStart(2, '0');
              }

              console.log('Full Hex Data:', hexString);

              // Parse last 12 characters (6 bytes)
              const last12Chars = hexString.slice(-12);
              console.log('Last 12 chars:', last12Chars);

              // Convert hex to decimal
              const decimalValue = parseInt(last12Chars, 16);
              console.log('Decimal value:', decimalValue);

              // Update state
              // setReceivedData(prev => [
              //   {
              //     timestamp: new Date().toLocaleTimeString(),
              //     fullHex: hexString,
              //     last12Hex: last12Chars,
              //     decimal: decimalValue
              //   },
              //   ...prev
              // ].slice(0, 20)); // Keep last 20 entries
            } catch (parseError) {
              console.error('Error parsing notification data:', parseError);
            }
          }
        }
      );

    } catch (error) {
      console.error('Failed to start notifications:', error);
    }
  };

  connectToDevice = async (scannedDevice: Device) => {
    try {
      if (!scannedDevice) {
        console.error('Cannot connect: scannedDevice is null');
        return;
      }

      console.log('Connecting to device...');

      const connected = await scannedDevice.connect();

      console.log('Discovering services and characteristics...');
      const device = await connected.discoverAllServicesAndCharacteristics();

      console.log('Connected successfully! ', device);

      // Start listening to notifications
      void this.startNotifications(connected);

    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  scanAndConnect = async () => {
    try {
      if (this.scanning) {
        return;
      }
      
      if (!this.manager) {
        console.error('Cannot start scan: BLE Manager is null');
        return;
      }
      
      this.scanning = true;
      console.log('Starting scan...');

      this.manager.startDeviceScan(null, null, (error: BleError | null, scannedDevice: Device | null) => {
        if (error) {
          console.error('Scan error:', error);
          this.scanning = false;
          return;
        }

        // Check if this is the device we want
        if (scannedDevice && (scannedDevice.name === DEVICE_NAME || scannedDevice.localName === DEVICE_NAME)) {
          console.log('Device found:', scannedDevice?.name);

          try {
            this.manager?.stopDeviceScan();
            this.scanning = false;
            void this.connectToDevice(scannedDevice);
          } catch (stopScanError) {
            console.error('Error stopping scan:', stopScanError);
            this.scanning = false;
          }
        }
      });
    } catch (error) {
      console.error('Failed to start scan:', error);
      this.scanning = false;
    }
  };
}

export const BLEService = new BLEServiceInstance()
