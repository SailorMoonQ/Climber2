import { BleError, BleManager, Characteristic, Device, Subscription } from 'react-native-ble-plx'
import { AppState, AppStateStatus, PermissionsAndroid, Platform } from "react-native";


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
  private notificationCallbacks: Map<string, (data: any) => void> = new Map();
  private subscriptions: Map<string, Subscription> = new Map(); // Store all subscriptions for unified cleanup
  private appStateSubscription: any = null;
  private reconnectTimers: Map<string, number> = new Map();
  private state: BLEStatus = BLEStatus.IDLE;
  private lastConnectedDeviceId: string | null = null;
  private targetDevices: {name?: string, localName?: string, id?: string}[] = []; // Devices we're looking for
  private foundDevices: Map<string, Device> = new Map(); // Devices that have been found during current scan
  private scanCallback?: (device: Device) => void;

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

  // Generic notification start method - to be implemented by specific services
  startNotifications = async (connectedDevice: Device, serviceUUID: string, characteristicUUID: string, callback?: (data: any) => void) => {
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
        serviceUUID,
        characteristicUUID,
        (error: BleError | null, characteristic: (Characteristic | null)) => {
          if (error) {
            console.error('Notification error for device', connectedDevice.id, ':', error);
            // Handle connection loss due to notification error
            this.handleConnectionLoss(connectedDevice.id);
            return;
          }

          if (characteristic?.value) {
            // Pass raw data to callback - parsing should be done by specific service
            const deviceCallback = this.notificationCallbacks.get(connectedDevice.id);
            if (deviceCallback) {
              deviceCallback(characteristic.value);
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

  connectToDevice = async (scannedDevice: Device, callback?: (data: any) => void) => {
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
              // void this.startPoseNotifications(fullyConnectedDevice, callback);
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
        this.targetDevices = [];
        this.foundDevices.clear();
        console.log('Scan stopped');
      } catch (error) {
        console.error('Error stopping scan:', error);
        this.scanning = false;
      }
    }
  };

  scanForDevices = async (targetDeviceCriteria: Array<{name?: string, localName?: string, id?: string}>, callback?: (device: Device) => void) => {
    try {
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
      
      // Add target devices to the array
      this.targetDevices.push(...targetDeviceCriteria);
      
      // If already scanning, just return the current found devices
      if (this.scanning) {
        console.log('Scan already in progress, added new target devices');
        return this.foundDevices;
      }
      
      this.scanning = true;
      this.state = BLEStatus.SCANNING;
      this.scanCallback = callback;
      console.log('Starting scan for devices...');
      console.log('Target devices:', this.targetDevices);

      this.manager.startDeviceScan(null, null, (error: BleError | null, scannedDevice: Device | null) => {
        if (error) {
          console.error('Scan error:', error);
          this.scanning = false;
          this.state = BLEStatus.IDLE;
          return;
        }

        // Process scanned device
        if (scannedDevice) {
          this.processScannedDevice(scannedDevice);
        }
      });

      return this.foundDevices;
    } catch (error) {
      console.error('Failed to start scan:', error);
      this.scanning = false;
      this.state = BLEStatus.IDLE;
      return new Map<string, Device>();
    }
  };

  private processScannedDevice = (scannedDevice: Device) => {
    // Check if this device matches any of the target criteria
    const matchesTarget = this.targetDevices.some(target => {
      return (
        (target.id && scannedDevice.id === target.id) ||
        (target.name && scannedDevice.name === target.name) ||
        (target.localName && scannedDevice.localName === target.localName)
      );
    });

    // If it matches a target and not already found
    if (matchesTarget && !this.foundDevices.has(scannedDevice.id)) {
      this.foundDevices.set(scannedDevice.id, scannedDevice);
      console.log('Target device found:', scannedDevice.id, scannedDevice.name);
      
      // Notify callback if provided
      if (this.scanCallback) {
        this.scanCallback(scannedDevice);
      }
      
      // Check if we've found all target devices
      this.checkIfAllTargetsFound();
    }
  };

  private checkIfAllTargetsFound = () => {
    if (this.targetDevices.length === 0) {
      return; // No targets defined
    }
    
    // Check if all target devices have been found
    const allFound = this.targetDevices.every(target => {
      return Array.from(this.foundDevices.values()).some(found => {
        return (
          (target.id && found.id === target.id) ||
          (target.name && found.name === target.name) ||
          (target.localName && found.localName === target.localName)
        );
      });
    });
    
    if (allFound) {
      console.log('All target devices found, stopping scan');
      this.stopScan();
    }
  };
}

export const BLEService = new BLEServiceInstance()