import { BleError, Characteristic, Device } from 'react-native-ble-plx';
import { BLEService } from './bluetooth';

// Force设备相关配置
// 假设Force设备的UUID和名称，实际使用时需要替换为真实值
export const FORCE_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9a34fb';
export const FORCE_NOTIFY_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9a34fb';
export const FORCE_DEVICE_NAME = 'QD';

// Force数据接口
export interface ForceData {
  value: number; // 力量值（N）
  timestamp: number;
}

// 创建Force服务的单例类
class ForceServiceInstance {
  private scanning = false;
  private connectedDevice: Device | null = null;
  private forceCallback: ((forceData: ForceData) => void) | null = null;

  constructor() {
    console.log('Force Service initialized successfully');
  }

  // 处理接收到的原始数据并转换为ForceData
  private handleRawData = (rawData: string) => {
    try {
      // 假设数据格式为base64编码的二进制数据，实际使用时需要根据设备协议进行解析
      const rawBytes = atob(rawData);
      const forceValue = parseInt(rawBytes, 10);
      
      const forceData: ForceData = {
        value: forceValue,
        timestamp: Date.now()
      };
      
      if (this.forceCallback) {
        this.forceCallback(forceData);
      }
    } catch (error) {
      console.error('Error parsing force data:', error);
    }
  };

  // 开始监听Force通知
  startForceNotifications = async () => {
    try {
      if (!this.connectedDevice) {
        console.error('Cannot start notifications: No connected device');
        return;
      }

      console.log('Starting force notifications...');

      // 使用BLEService的通用通知方法
      await BLEService.startNotifications(
        this.connectedDevice,
        FORCE_SERVICE_UUID,
        FORCE_NOTIFY_CHARACTERISTIC_UUID,
        this.handleRawData
      );

    } catch (error) {
      console.error('Failed to start force notifications:', error);
    }
  };

  // 连接到Force设备
  connectToDevice = async (scannedDevice: Device) => {
    try {
      if (!scannedDevice) {
        console.error('Cannot connect: scannedDevice is null');
        return false;
      }

      console.log('Connecting to Force device...');

      // 使用BLEService的通用连接方法
      const connectedDevice = await BLEService.connectToDevice(scannedDevice, this.handleRawData);
      
      if (connectedDevice) {
        this.connectedDevice = connectedDevice;
        
        // 开始监听Force通知
        void this.startForceNotifications();

        console.log('Connected successfully to Force device!', connectedDevice.name);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Force device connection error:', error);
      return false;
    }
  };

  // 扫描并连接Force设备
  scanAndConnect = async (callback?: (forceData: ForceData) => void) => {
    try {
      // 设置Force回调
      if (callback) {
        this.forceCallback = callback;
      }
      
      if (this.scanning) {
        return;
      }
      
      console.log('Starting Force device scan...');

      // 使用BLEService的扫描功能
      await BLEService.scanForDevices(
        [{ name: FORCE_DEVICE_NAME, localName: FORCE_DEVICE_NAME }],
        async (scannedDevice) => {
          // 当找到设备时，停止扫描并连接
          console.log('Force device found:', scannedDevice);
          await BLEService.stopScan();
          await this.connectToDevice(scannedDevice);
        }
      );
    } catch (error) {
      console.error('Failed to start Force device scan:', error);
    }
  };

  // 断开连接
  disconnect = async () => {
    try {
      if (this.connectedDevice) {
        // 使用BLEService的断开方法
        await BLEService.disconnectFromDevice(this.connectedDevice.id);
        this.connectedDevice = null;
        this.forceCallback = null;
        console.log('Disconnected from Force device');
      }
    } catch (error) {
      console.error('Error disconnecting from Force device:', error);
    }
  };

  // 获取连接状态
  isConnected = (): boolean => {
    return this.connectedDevice !== null;
  };

  // 设置Force回调
  setForceCallback = (callback: (forceData: ForceData) => void) => {
    this.forceCallback = callback;
  };
}

// 导出Force服务的单例实例
export const ForceService = new ForceServiceInstance();