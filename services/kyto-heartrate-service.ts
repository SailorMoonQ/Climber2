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

      // 解析心率数据
      // 根据KYTO心率设备的示例数据格式解析心率值
      // 示例数据格式：0X10A47601760176017601
      // 心率值通常是一个16位或8位的数值
      
      // 对于实时心率数据，通常在特定位置
      // 根据示例数据，我们可以看到重复的模式如7601, 7D01, 8401, B202等
      // 这些模式可能代表心率值
      
      let heartRate = 0;
      
      // 从第3个字节开始解析心率值（假设第1-2字节是设备ID或状态信息）
      if (hexString.length >= 6) {
        // 取第3-4个字节作为心率值
        const heartRateHex = hexString.substring(4, 6);
        heartRate = parseInt(heartRateHex, 16);
        
        // 如果心率值太小或太大，尝试其他位置
        if (heartRate < 40 || heartRate > 220) {
          // 尝试第5-6个字节
          if (hexString.length >= 8) {
            const alternativeHeartRateHex = hexString.substring(6, 8);
            const alternativeHeartRate = parseInt(alternativeHeartRateHex, 16);
            if (alternativeHeartRate >= 40 && alternativeHeartRate <= 220) {
              heartRate = alternativeHeartRate;
            }
          }
        }
      }

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

      this.connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        NOTIFY_CHARACTERISTIC_UUID,
        (error: BleError | null, characteristic: Characteristic | null) => {
          if (error) {
            console.error('Heart rate notification error:', error);
            return;
          }

          if (characteristic?.value) {
            const heartRateData = this.parseHeartRateData(characteristic.value);
            if (heartRateData && this.heartRateCallback) {
              this.heartRateCallback(heartRateData.heartRate);
            }
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

      const connected = await scannedDevice.connect();

      console.log('Discovering services and characteristics...');
      const device = await connected.discoverAllServicesAndCharacteristics();

      console.log('Connected successfully to KYTO heart rate device!', device.name);

      this.connectedDevice = device;

      // 开始监听心率通知
      void this.startHeartRateNotifications();

      return true;
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
        await this.connectedDevice.cancelConnection();
        this.connectedDevice = null;
        this.heartRateCallback = null;
        console.log('Disconnected from KYTO heart rate device');
      }
    } catch (error) {
      console.error('Error disconnecting from KYTO heart rate device:', error);
    }
  };

  // 获取连接状态
  isConnected = (): boolean => {
    return this.connectedDevice !== null;
  };

  // 设置心率回调
  setHeartRateCallback = (callback: (heartRate: number) => void) => {
    this.heartRateCallback = callback;
  };
}

export const KYTOHeartRateService = new KYTOHeartRateServiceInstance();