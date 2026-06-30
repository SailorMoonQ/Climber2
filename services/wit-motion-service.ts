import { BleError, Characteristic, Device } from 'react-native-ble-plx';
import { DEVICE_NAME, SERVICE_UUID, NOTIFY_CHARACTERISTIC_UUID, PoseData, parsePoseData } from './pose';
import { BLEService } from './bluetooth';

// 创建Wit Motion服务的单例类
class WitMotionServiceInstance {
  private scanning = false;
  private connectedDevice: Device | null = null;
  private poseCallback: ((poseData: PoseData) => void) | null = null;

  constructor() {
    console.log('Wit Motion Service initialized successfully');
  }

  // 处理接收到的原始数据并转换为PoseData
  private handleRawData = (rawData: string) => {
    const poseData = parsePoseData(rawData);
    if (poseData && this.poseCallback) {
      this.poseCallback(poseData);
    }
  };

  // 开始监听姿态通知
  startPoseNotifications = async () => {
    try {
      if (!this.connectedDevice) {
        console.error('Cannot start notifications: No connected device');
        return;
      }

      console.log('Starting pose notifications...');

      // 使用BLEService的通用通知方法
      await BLEService.startNotifications(
        this.connectedDevice,
        SERVICE_UUID,
        NOTIFY_CHARACTERISTIC_UUID,
        this.handleRawData
      );

    } catch (error) {
      console.error('Failed to start pose notifications:', error);
    }
  };

  // 连接到姿态设备
  connectToDevice  = async (scannedDevice: Device) => {
    try {
      if (!scannedDevice) {
        console.error('Cannot connect: scannedDevice is null');
        return false;
      }

      console.log('Connecting to Wit Motion device...');

      // 使用BLEService的通用连接方法
      const connectedDevice = await BLEService.connectToDevice(scannedDevice, this.handleRawData);
      
      if (connectedDevice) {
        this.connectedDevice = connectedDevice;
        
        // 开始监听姿态通知
        void this.startPoseNotifications();

        console.log('Connected successfully to Wit Motion device!', connectedDevice.name);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Wit Motion device connection error:', error);
      return false;
    }
  };

  // 扫描并连接Wit Motion设备
  scanAndConnect = async (callback?: (poseData: PoseData) => void) => {
    try {
      // 设置姿态回调
      if (callback) {
        this.poseCallback = callback;
      }
      
      if (this.scanning) {
        return;
      }
      
      console.log('Starting Wit Motion device scan...');

      // 使用BLEService的扫描功能
      await BLEService.scanForDevices(
        [{ name: DEVICE_NAME, localName: DEVICE_NAME }],
        async (scannedDevice) => {
          // 当找到设备时，停止扫描并连接
          console.log('Wit Motion device found:', scannedDevice);
          await BLEService.stopScan();
          await this.connectToDevice(scannedDevice);
        }
      );
    } catch (error) {
      console.error('Failed to start Wit Motion device scan:', error);
    }
  };

  // 断开连接
  disconnect = async () => {
    try {
      if (this.connectedDevice) {
        // 使用BLEService的断开方法
        await BLEService.disconnectFromDevice(this.connectedDevice.id);
        this.connectedDevice = null;
        // keep poseCallback so a reconnect resumes data without a screen remount
        console.log('Disconnected from Wit Motion device');
      }
    } catch (error) {
      console.error('Error disconnecting from Wit Motion device:', error);
    }
  };

  // 获取连接状态
  isConnected = (): boolean => {
    return this.connectedDevice !== null;
  };

  // 设置姿态回调
  setPoseCallback = (callback: (poseData: PoseData) => void) => {
    this.poseCallback = callback;
  };
}

// 导出Wit Motion服务的单例实例
export const WitMotionService = new WitMotionServiceInstance();