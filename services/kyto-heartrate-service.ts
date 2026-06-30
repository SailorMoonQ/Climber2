import { BleError, Characteristic, Device } from 'react-native-ble-plx';
import { DEVICE_NAME, SERVICE_UUID, NOTIFY_CHARACTERISTIC_UUID } from './kyto-heartrate';
import { BLEService } from './bluetooth';

export interface HeartRateData {
  heartRate: number;
  fullHex: string;
}

// 创建KYTO心率服务的单例类
class KYTOHeartRateServiceInstance {
  private scanning = false;
  private connectedDevice: Device | null = null;
  private heartRateCallback: ((heartRate: number) => void) | null = null;

  constructor() {
    console.log('KYTO Heart Rate Service initialized successfully');
  }

  // 注册心率回调（连接由BluetoothProvider统一管理，界面只负责注册回调）
  setHeartRateCallback = (callback: (heartRate: number) => void) => {
    this.heartRateCallback = callback;
  };

  // 解析心率数据
  parseHeartRateData = (value: string): HeartRateData | null => {
    try {
      // 解码base64值
      const rawData = atob(value);

      // 转换为十六进制字符串
      let hexString = '';
      for (let i = 0; i < rawData.length; i++) {
        const hex = rawData.charCodeAt(i).toString(16).toUpperCase();
        hexString += hex.padStart(2, '0');
      }

      console.log('KYTO Heart Rate Full Hex Data:', hexString);

      // 解析心率数据 - 遵循心率数据格式规范
      // 第1个字节是Flags字段（位域）
      // 第2个字节或第2-3个字节是心率值
      
      let heartRate = 0;
      
      if (rawData.length < 2) {
        console.error('Insufficient data length for heart rate parsing');
        return null;
      }
      
      // 获取Flags字节
      const flagsByte = rawData.charCodeAt(0);
      
      // 解析心率值
      console.log(hexString);

      // 标准心率测量(2A37): 第0字节为Flags, 第1字节为8位心率值。
      // (此前误取第2字节，实为RR间期数据)
      heartRate = parseInt(hexString.substring(2, 4), 16);

      console.log('KYTO Heart Rate:', heartRate);

      return {
        heartRate,
        fullHex: hexString
      };
    } catch (parseError) {
      console.error('Error parsing KYTO heart rate data:', parseError);
      return null;
    }
  };

  // 开始监听心率通知
  startHeartRateNotifications = async () => {
    try {
      if (!this.connectedDevice) {
        console.error('Cannot start notifications: No connected device');
        return;
      }

      console.log('Starting heart rate notifications...');

      // 使用BLEService的通用通知方法，确保订阅被正确跟踪和清理
      await BLEService.startNotifications(
        this.connectedDevice,
        SERVICE_UUID,
        NOTIFY_CHARACTERISTIC_UUID,
        (rawData) => {
          const heartRateData = this.parseHeartRateData(rawData);
          if (heartRateData && this.heartRateCallback) {
            this.heartRateCallback(heartRateData.heartRate);
          }
        }
      );

    } catch (error) {
      console.error('Failed to start heart rate notifications:', error);
    }
  };

  // 连接到心率设备
  connectToDevice = async (scannedDevice: Device) => {
    try {
      if (!scannedDevice) {
        console.error('Cannot connect: scannedDevice is null');
        return false;
      }

      console.log('Connecting to KYTO heart rate device...');

      // 使用BLEService的通用连接方法
      const connectedDevice = await BLEService.connectToDevice(scannedDevice);
      
      if (connectedDevice) {
        this.connectedDevice = connectedDevice;
        
        // 开始监听心率通知
        void this.startHeartRateNotifications();

        console.log('Connected successfully to KYTO heart rate device!', connectedDevice.name);
        return true;
      }

      return false;
    } catch (error) {
      console.error('KYTO heart rate device connection error:', error);
      return false;
    }
  };

  // 扫描并连接KYTO心率设备
  scanAndConnect = async (callback?: (heartRate: number) => void) => {
    try {
      if (this.scanning) {
        return;
      }
      
      const manager = BLEService.getManager();
      if (!manager) {
        console.error('Cannot start scan: BLE Manager is null');
        return;
      }
      
      // 设置心率回调
      if (callback) {
        this.heartRateCallback = callback;
      }
      
      this.scanning = true;
      console.log('Starting KYTO heart rate device scan...');

      manager.startDeviceScan(null, null, (error: BleError | null, scannedDevice: Device | null) => {
        if (error) {
          console.error('Scan error:', error);
          this.scanning = false;
          return;
        }

        // 检查是否是KYTO心率设备
        if (scannedDevice &&
            (scannedDevice.name?.includes('KYTO') || scannedDevice.localName?.includes('KYTO'))) {
          console.log('KYTO heart rate device found:', scannedDevice.name);

          try {
            manager.stopDeviceScan();
            this.scanning = false;
            void this.connectToDevice(scannedDevice);
          } catch (stopScanError) {
            console.error('Error stopping scan:', stopScanError);
            this.scanning = false;
          }
        }
      });
    } catch (error) {
      console.error('Failed to start KYTO heart rate device scan:', error);
      this.scanning = false;
    }
  };

  // 断开连接
  disconnect = async () => {
    try {
      if (this.connectedDevice) {
        // 使用BLEService的断开方法，确保统一的资源管理
        await BLEService.disconnectFromDevice(this.connectedDevice.id);
        this.connectedDevice = null;
        // keep heartRateCallback so a reconnect resumes data without a screen remount
        console.log('Disconnected from KYTO heart rate device');
      }
    } catch (error) {
      console.error('Error disconnecting from KYTO heart rate device:', error);
    }
  };
}

export const KYTOHeartRateService = new KYTOHeartRateServiceInstance();