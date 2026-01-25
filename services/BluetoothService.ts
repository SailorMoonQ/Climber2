import { BleManager, Device } from 'react-native-ble-plx';
import { Platform } from 'react-native';

class BluetoothService {
  private manager: BleManager;
  private connectedDevices: Map<string, Device> = new Map();

  constructor() {
    this.manager = new BleManager();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.manager.onStateChange((state) => {
      console.log('Bluetooth State:', state);
    }, true);
  }

  public async checkBluetoothState(): Promise<boolean> {
    const state = await this.manager.state();
    return state === 'PoweredOn';
  }

  public async requestEnable(): Promise<boolean> {
    if (Platform.OS === 'android') {
      // On Android, we can try to enable Bluetooth programmatically
      try {
        await this.manager.enable();
        return true;
      } catch (error) {
        console.error('Error enabling Bluetooth:', error);
        return false;
      }
    }
    return this.checkBluetoothState();
  }

  public startScanning(
    onDeviceFound: (device: Device) => void,
    serviceUUIDs?: string[],
    timeout: number = 10000
  ) {
    this.manager.startDeviceScan(serviceUUIDs, null, (error, device) => {
      if (error) {
        console.error('Scanning error:', error);
        return;
      }

      if (device) {
        onDeviceFound(device);
      }
    });

    // Stop scanning after timeout
    setTimeout(() => {
      this.stopScanning();
    }, timeout);
  }

  public stopScanning() {
    void this.manager.stopDeviceScan();
  }

  public async connectToDevice(deviceId: string): Promise<Device | null> {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevices.set(deviceId, device);
      return device;
    } catch (error) {
      console.error('Connection error:', error);
      return null;
    }
  }

  public async disconnectFromDevice(deviceId: string): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      await this.manager.cancelDeviceConnection(deviceId);
      this.connectedDevices.delete(deviceId);
    }
  }

  public async sendData(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: string | Uint8Array
  ): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      console.error('Device not connected');
      return false;
    }

    try {
      const bytes = typeof data === 'string' ? new Uint8Array(Buffer.from(data)) : data;
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        bytes
      );
      return true;
    } catch (error) {
      console.error('Error sending data:', error);
      return false;
    }
  }

  public async receiveData(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    onDataReceived: (data: Uint8Array) => void
  ): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      console.error('Device not connected');
      return false;
    }

    try {
      await device.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.error('Monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            const data = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
            onDataReceived(data);
          }
        }
      );
      return true;
    } catch (error) {
      console.error('Error setting up data reception:', error);
      return false;
    }
  }

  public getConnectedDevices(): Device[] {
    return Array.from(this.connectedDevices.values());
  }
}

export default new BluetoothService();