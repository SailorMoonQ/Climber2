import { BleError, BleManager, Characteristic, Device, Subscription } from 'react-native-ble-plx'
import { AppState, AppStateStatus, PermissionsAndroid, Platform } from "react-native";
import { DEVICE_NAME, NOTIFY_CHARACTERISTIC_UUID, SERVICE_UUID, PoseData, parsePoseData } from "@/services/pose";


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

// BLE Status enum
export enum BLEStatus {
  IDLE = 'idle',
  SCANNING = 'scanning',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// create your own singleton class
class BLEServiceInstance {
  manager: BleManager | null = null;
  private scanning = false;
  private connectedDevices: Map<string, Device> = new Map(); // Store connected devices by ID
  private notificationCallbacks: Map<string, (data: PoseData) => void> = new Map();
  private subscriptions: Map<string, Subscription> = new Map(); // Store all subscriptions for unified cleanup
  private appStateSubscription: any = null;
  private reconnectTimers: Map<string, number> = new Map();
  private state: BLEStatus = BLEStatus.IDLE;
  private lastConnectedDeviceId: string | null = null;

  constructor() {
    try {
      this.manager = new BleManager();
      console.log('BLE Manager initialized successfully');
      this.setupAppStateListener();
    } catch (error) {
      console.error('Failed to initialize BLE Manager:', error);
      this.manager = null;
      this.state = BLEStatus.ERROR;
    }
  }

  private setupAppStateListener = () => {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  };

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App has come to foreground, check BLE status
      if (this.manager) {
        // BLE enabled check removed
      } else {
        console.error('Cannot check BLE status: manager is null');
        this.state = BLEStatus.ERROR;
      }
      // Try to reconnect if we were previously connected
      if (this.lastConnectedDeviceId) {
        await this.autoReconnect(this.lastConnectedDeviceId);
      }
    } else if (nextAppState === 'background') {
      // App has gone to background, clean up unnecessary subscriptions
      this.pause();
    }
  };

  private handleConnectionLoss = (deviceId: string) => {
    console.warn(`Connection lost with device: ${deviceId}`);
    this.connectedDevices.delete(deviceId);
    this.lastConnectedDeviceId = deviceId;
    this.state = BLEStatus.DISCONNECTED;
    this.autoReconnect(deviceId);
  };

  init = async (): Promise<BleManager | null> => {
    try {
      if (!this.manager) {
        // Only initialize if manager is null
        this.manager = new BleManager();
        console.log('BLE Manager initialized successfully');
      }
      return this.manager;
    } catch (error) {
      console.error('Failed to initialize BLE Manager:', error);
      this.state = BLEStatus.ERROR;
      return null;
    }
  };

  startPoseNotifications = async (connectedDevice: Device, callback?: (data: PoseData) => void) => {
    try {
      console.log('Starting notifications for device:', connectedDevice.id);

      if (!connectedDevice) {
        console.error('Cannot start notifications: connectedDevice is null');
        return;
      }

      // Remove any existing subscription for this device
      this.stopNotifications(connectedDevice.id);

      if (callback) {
        this.notificationCallbacks.set(connectedDevice.id, callback);
      }

      // Store the subscription
      const subscription = connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        NOTIFY_CHARACTERISTIC_UUID,
        (error: BleError | null, characteristic: (Characteristic | null)) => {
          if (error) {
            console.error('Notification error for device', connectedDevice.id, ':', error);
            // Handle connection loss due to notification error
            this.handleConnectionLoss(connectedDevice.id);
            return;
          }

          if (characteristic?.value) {
            try {
              // Parse pose data using the external function
              const poseData = parsePoseData(characteristic.value);
              
              if (poseData) {
                console.log('Device', connectedDevice.id, 'Full Hex Data:', poseData.fullHex);
                console.log('Device', connectedDevice.id, 'Last 12 chars:', poseData.last12Hex);
                console.log('Device', connectedDevice.id, 'Decimal value:', poseData.decimal);

                // Call device-specific callback if registered
                const deviceCallback = this.notificationCallbacks.get(connectedDevice.id);
                if (deviceCallback) {
                  deviceCallback(poseData);
                }
              }
            } catch (parseError) {
              console.error('Error parsing notification data for device', connectedDevice.id, ':', parseError);
            }
          }
        }
      );

      // Store the subscription with a unique key
      const subscriptionKey = `notification_${connectedDevice.id}`;
      this.subscriptions.set(subscriptionKey, subscription);

    } catch (error) {
      console.error('Failed to start notifications for device', connectedDevice.id, ':', error);
    }
  };

  stopNotifications = (deviceId: string) => {
    const subscriptionKey = `notification_${deviceId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      try {
        subscription.remove();
        this.subscriptions.delete(subscriptionKey);
        console.log('Stopped notifications for device:', deviceId);
      } catch (error) {
        console.error('Error stopping notifications for device', deviceId, ':', error);
      }
    }
    this.notificationCallbacks.delete(deviceId);
  };

  connectToDevice = async (scannedDevice: Device, callback?: (data: PoseData) => void) => {
    try {
      if (!scannedDevice) {
        console.error('Cannot connect: scannedDevice is null');
        return null;
      }

      // Check if already connected
      if (this.connectedDevices.has(scannedDevice.id)) {
        console.log('Device already connected:', scannedDevice.id);
        return this.connectedDevices.get(scannedDevice.id);
      }

      // Check BLE status before connecting
      if (!this.manager) {
        console.error('Cannot connect: BLE Manager is null');
        this.state = BLEStatus.ERROR;
        return null;
      }

      // Check permissions
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        console.error('Cannot connect: Missing BLE permissions');
        this.state = BLEStatus.ERROR;
        return null;
      }

      this.state = BLEStatus.CONNECTING;
      console.log('Connecting to device:', scannedDevice.id, scannedDevice.name);

      const connected = await scannedDevice.connect({
        timeout: 15000 // 15 second timeout
      });

      console.log('Discovering services and characteristics for device:', scannedDevice.id);
      const device = await connected.discoverAllServicesAndCharacteristics();

      console.log('Connected successfully to device! ', device.id, device.name);
      this.state = BLEStatus.CONNECTED;
      this.lastConnectedDeviceId = device.id;

      // Add to connected devices map
      this.connectedDevices.set(device.id, device);

      // Start listening to notifications
      void this.startPoseNotifications(device, callback);

      // Set up connection loss handler
      this.setupConnectionLossHandler(device);

      return device;

    } catch (error) {
      console.error('Connection error for device', scannedDevice?.id, ':', error);
      this.state = BLEStatus.ERROR;
      return null;
    }
  };

  private setupConnectionLossHandler = (device: Device) => {
    if (!this.manager) return;

    const connectionHandlerKey = `connection_${device.id}`;
    
    // Remove any existing connection handler
    const existingHandler = this.subscriptions.get(connectionHandlerKey);
    if (existingHandler) {
      existingHandler.remove();
      this.subscriptions.delete(connectionHandlerKey);
    }

    // Set up connection state monitoring
    const connectionHandler = this.manager.onDeviceDisconnected(device.id, () => {
      this.handleConnectionLoss(device.id);
    });

    this.subscriptions.set(connectionHandlerKey, connectionHandler);
  };

  private autoReconnect = async (deviceId: string): Promise<void> => {
    // Clear any existing reconnect timer
    this.clearReconnectTimer(deviceId);

    // Try to reconnect after delay
    const timer = setTimeout(async () => {
      try {
        console.log(`Attempting to reconnect to device: ${deviceId}`);
        
        // Check permissions
        const hasPermissions = await requestPermissions();
        
        if (hasPermissions && this.manager) {
          // Try to retrieve and reconnect to the device
          const device = await this.manager.connectToDevice(deviceId, {
            autoConnect: true,
            timeout: 10000
          });
          
          if (device) {
            const fullyConnectedDevice = await device.discoverAllServicesAndCharacteristics();
            console.log(`Successfully reconnected to device: ${deviceId}`);
            
            this.connectedDevices.set(deviceId, fullyConnectedDevice);
            this.state = BLEStatus.CONNECTED;
            
            // Restore notifications
            const callback = this.notificationCallbacks.get(deviceId);
            if (callback) {
              void this.startPoseNotifications(fullyConnectedDevice, callback);
            }
            
            // Clear the reconnect timer
            this.clearReconnectTimer(deviceId);
          }
        } else {
          // Try again in 5 seconds
          await this.autoReconnect(deviceId);
        }
      } catch (error) {
        console.error(`Reconnection failed for device ${deviceId}:`, error);
        // Try again in 5 seconds
        await this.autoReconnect(deviceId);
      }
    }, 5000);

    this.reconnectTimers.set(deviceId, timer);
  };

  private clearReconnectTimer = (deviceId: string) => {
    const timer = this.reconnectTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(deviceId);
    }
  };

  disconnectFromDevice = async (deviceId: string) => {
    try {
      const device = this.connectedDevices.get(deviceId);
      if (device) {
        // Cancel any reconnect attempts
        this.clearReconnectTimer(deviceId);
        
        // Stop notifications and remove subscription
        this.stopNotifications(deviceId);
        
        // Cancel connection
        await device.cancelConnection();
        
        // Remove from connected devices
        this.connectedDevices.delete(deviceId);
        
        // Update state
        if (this.connectedDevices.size === 0) {
          this.state = BLEStatus.DISCONNECTED;
        }
        
        // Clear last connected device if it's this one
        if (this.lastConnectedDeviceId === deviceId) {
          this.lastConnectedDeviceId = null;
        }
        
        console.log('Disconnected from device:', deviceId);
      }
    } catch (error) {
      console.error('Disconnection error for device', deviceId, ':', error);
    }
  };

  disconnectAllDevices = async () => {
    try {
      // Cancel all reconnect timers
      for (const timer of this.reconnectTimers.values()) {
        clearTimeout(timer);
      }
      this.reconnectTimers.clear();
      
      // Disconnect each device
      for (const deviceId of this.connectedDevices.keys()) {
        await this.disconnectFromDevice(deviceId);
      }
      
      console.log('Disconnected from all devices');
    } catch (error) {
      console.error('Error disconnecting all devices:', error);
    }
  };

  private clearAllSubscriptions = () => {
    try {
      // Remove all stored subscriptions
      for (const subscription of this.subscriptions.values()) {
        subscription.remove();
      }
      this.subscriptions.clear();
      
      // Clear notification callbacks
      this.notificationCallbacks.clear();
      
      console.log('Cleared all BLE subscriptions');
    } catch (error) {
      console.error('Error clearing subscriptions:', error);
    }
  };

  pause = () => {
    // Called when app goes to background
    this.stopScan();
    // We keep connections active in background, but can pause scanning
    console.log('BLE service paused');
  };

  resume = async () => {
    // Called when app comes back to foreground
    if (this.manager) {
      // BLE enabled check removed
    }
    console.log('BLE service resumed');
  };

  cleanup = async () => {
    // Complete cleanup when service is no longer needed
    await this.disconnectAllDevices();
    this.stopScan();
    this.clearAllSubscriptions();
    
    // Remove app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    console.log('BLE service cleaned up');
  };

  getConnectedDevices = () => {
    return Array.from(this.connectedDevices.values());
  };

  isDeviceConnected = (deviceId: string) => {
    return this.connectedDevices.has(deviceId);
  };

  getManager = () => {
    return this.manager;
  };

  getState = () => {
    return this.state;
  };

  stopScan = () => {
    if (this.scanning && this.manager) {
      try {
        this.manager.stopDeviceScan();
        this.scanning = false;
        this.state = BLEStatus.IDLE;
        console.log('Scan stopped');
      } catch (error) {
        console.error('Error stopping scan:', error);
        this.scanning = false;
      }
    }
  };
  scanForDevices = async (durationMs: number = 5000, callback?: (device: Device) => void) => {
    try {
      if (this.scanning) {
        console.warn('Scan already in progress, stopping existing scan first');
        this.stopScan();
      }
      
      if (!this.manager) {
        console.error('Cannot start scan: BLE Manager is null');
        return new Map<string, Device>();
      }
      
      // Check BLE status
      if (!this.manager) {
        console.error('Cannot start scan: BLE Manager is null');
        this.state = BLEStatus.ERROR;
        return new Map<string, Device>();
      }
      
      // Check permissions
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        console.error('Cannot start scan: Missing BLE permissions');
        this.state = BLEStatus.ERROR;
        return new Map<string, Device>();
      }
      
      this.scanning = true;
      this.state = BLEStatus.SCANNING;
      console.log('Starting scan for devices...');

      // Store discovered devices to avoid duplicates
      const discoveredDevices = new Map<string, Device>();

      this.manager.startDeviceScan(null, null, (error: BleError | null, scannedDevice: Device | null) => {
        if (error) {
          console.error('Scan error:', error);
          this.scanning = false;
          this.state = BLEStatus.IDLE;
          return;
        }

        // Check if this is the device we want and not already discovered
        if (scannedDevice && (scannedDevice.name === DEVICE_NAME || scannedDevice.localName === DEVICE_NAME)) {
          if (!discoveredDevices.has(scannedDevice.id)) {
            discoveredDevices.set(scannedDevice.id, scannedDevice);
            console.log('Device found:', scannedDevice.id, scannedDevice.name);
            
            // Notify callback if provided
            if (callback) {
              callback(scannedDevice);
            }
          }
        }
      });

      // Stop scanning after duration
      setTimeout(() => {
        this.stopScan();
        console.log('Scan completed. Found', discoveredDevices.size, 'devices.');
      }, durationMs);

      return discoveredDevices;
    } catch (error) {
      console.error('Failed to start scan:', error);
      this.scanning = false;
      this.state = BLEStatus.IDLE;
      return new Map<string, Device>();
    }
  };

  // Original scanAndConnect method for backward compatibility
  scanAndConnect = async () => {
    try {
      if (this.scanning) {
        console.warn('Scan already in progress, stopping existing scan first');
        this.stopScan();
      }
      
      if (!this.manager) {
        console.error('Cannot start scan: BLE Manager is null');
        return;
      }
      
      // Check BLE status
      if (!this.manager) {
        console.error('Cannot start scan: BLE Manager is null');
        this.state = BLEStatus.ERROR;
        return;
      }
      
      // Check permissions
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        console.error('Cannot start scan: Missing BLE permissions');
        this.state = BLEStatus.ERROR;
        return;
      }
      
      this.scanning = true;
      this.state = BLEStatus.SCANNING;
      console.log('Starting scan...');

      this.manager.startDeviceScan(null, null, (error: BleError | null, scannedDevice: Device | null) => {
        if (error) {
          console.error('Scan error:', error);
          this.scanning = false;
          this.state = BLEStatus.IDLE;
          return;
        }

        // Check if this is the device we want
        if (scannedDevice && (scannedDevice.name === DEVICE_NAME || scannedDevice.localName === DEVICE_NAME)) {
          console.log('Device found:', scannedDevice?.name);

          try {
            this.stopScan();
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
      this.state = BLEStatus.IDLE;
    }
  };
}

export const BLEService = new BLEServiceInstance()