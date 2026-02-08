import { Device } from 'react-native-ble-plx';
import { bleManager, BLEService } from './bluetooth';
import { Buffer } from 'buffer';

// Force设备相关配置
export const FORCE_DEVICE_UUID = '3E2DD760-34F2-A764-AAA2-38736480A7D7';
export const FORCE_DEVICE_NAME = 'QD_CLIMETE';
export const FORCE_SERVICE_UUID = '9608';
export const FORCE_WRITE_CHARACTERISTIC_UUID = '9600';
export const FORCE_NOTIFY_CHARACTERISTIC_UUID = '9601';

// Force数据接口
export interface ForceData {
  // 原始数据
  upperPosition: number; // 上肢实时位置 cm
  lowerPosition: number; // 下肢实时位置 cm
  upperForce: number; // 上肢实时力 N
  lowerForce: number; // 下肢实时力 N

  // 计算后的数据
  upperLeftPosition?: number; // 上肢左侧位置 cm
  upperRightPosition?: number; // 上肢右侧位置 cm
  lowerLeftPosition?: number; // 下肢左侧位置 cm
  lowerRightPosition?: number; // 下肢右侧位置 cm
  upperLeftForce?: number; // 上肢左侧力 N
  upperRightForce?: number; // 上肢右侧力 N
  lowerLeftForce?: number; // 下肢左侧力 N
  lowerRightForce?: number; // 下肢右侧力 N

  timestamp: number;
}

// 阻力数据接口
export interface ResistanceData {
  upperLeft: number; // 上肢阻力左
  upperRight: number; // 上肢阻力右
  lowerLeft: number; // 下肢阻力左
  lowerRight: number; // 下肢阻力右
}

// 创建Force服务的单例类
class ForceServiceInstance {
  private scanning = false;
  private connectedDevice: Device | null = null;
  private forceCallback: ((forceData: ForceData) => void) | null = null;
  private lastCallbackTime = 0;
  private readonly callbackInterval = 1000 / 30; // 30Hz sampling rate in milliseconds
  
  setForceCallback(callback: (forceData: ForceData) => void) {
    this.forceCallback = callback;
  }

  constructor() {
    console.log('Force Service initialized successfully');
  }

  // 总行程参数（后续根据实际机械结构调整）
  private totalUpperStroke = 100; // 上肢总行程 cm
  private totalLowerStroke = 100; // 下肢总行程 cm

  // 计算左右侧位置
  private calculateLeftRightPositions = (data: Omit<ForceData, 'timestamp' | 'upperLeftPosition' | 'upperRightPosition' | 'lowerLeftPosition' | 'lowerRightPosition'>): Partial<ForceData> => {
    return {
      upperLeftPosition: this.totalUpperStroke - data.upperPosition,
      upperRightPosition: data.upperPosition,
      lowerLeftPosition: this.totalLowerStroke - data.lowerPosition,
      lowerRightPosition: data.lowerPosition
    };
  };

  // 计算左右侧力
  private calculateLeftRightForces = (data: Omit<ForceData, 'timestamp' | 'upperLeftForce' | 'upperRightForce' | 'lowerLeftForce' | 'lowerRightForce'>): Partial<ForceData> => {
    return {
      upperLeftForce: data.upperForce < 0 ? -data.upperForce : 0,
      upperRightForce: data.upperForce > 0 ? data.upperForce : 0,
      lowerLeftForce: data.lowerForce < 0 ? -data.lowerForce : 0,
      lowerRightForce: data.lowerForce > 0 ? data.lowerForce : 0
    };
  };

  // 处理接收到的原始数据并转换为ForceData
  private handleRawData = (rawData: string) => {
    try {
      // 解析base64编码的二进制数据
      const buffer = Buffer.from(rawData, 'base64');

      // 验证数据长度是否为6字节
      if (buffer.length !== 6) {
        console.error('Invalid force data length:', buffer.length);
        return;
      }

      // console.log(buffer[3], buffer[2]);

      // 提取原始数据（小端格式）
      const forceData: Omit<ForceData, 'timestamp'> = {
        upperPosition: buffer.readUInt8(0), // Byte0: 上肢实时位置 cm
        lowerPosition: buffer.readUInt8(1), // Byte1: 下肢实时位置 cm
        upperForce: (((buffer[3] << 8) | buffer[2]) & 0xFFFF) > 0x7FFF ? ((buffer[3] << 8) | buffer[2]) - 0x10000 : (buffer[3] << 8) | buffer[2], // Byte2-3: 上肢实时力 N (小端格式，Byte2是低位字节，Byte3是高位字节)
        lowerForce: (((buffer[5] << 8) | buffer[4]) & 0xFFFF) > 0x7FFF ? ((buffer[5] << 8) | buffer[4]) - 0x10000 : (buffer[5] << 8) | buffer[4], // Byte4-5: 下肢实时力 N (小端格式，Byte4是低位字节，Byte5是高位字节)
      };

      // 计算左右侧位置
      const positions = this.calculateLeftRightPositions(forceData);

      // 计算左右侧力
      const forces = this.calculateLeftRightForces(forceData);

      // 合并所有数据
      const completeData: ForceData = {
        ...forceData,
        ...positions,
        ...forces,
        timestamp: Date.now()
      };

      if (this.forceCallback) {
        const currentTime = Date.now();
        if (currentTime - this.lastCallbackTime >= this.callbackInterval) {
          this.forceCallback(completeData);
          this.lastCallbackTime = currentTime;
        }
      }
    } catch (error) {
      console.error('Error parsing force data:', error);
    }
  };

  // 开始监听Force通知
  startForceNotifications = () => {
    try {
      if (!this.connectedDevice) {
        console.error('Cannot start notifications: No connected device');
        return;
      }

      console.log('Starting force notifications...');

      // 使用BLEService的通用通知方法
      BLEService.startNotifications(
        this.connectedDevice,
        FORCE_SERVICE_UUID,
        FORCE_NOTIFY_CHARACTERISTIC_UUID,
        this.handleRawData
      );

      this.connectedDevice.monitorCharacteristicForService(
        FORCE_SERVICE_UUID,
        FORCE_NOTIFY_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Error monitoring characteristic:', error);
            return;
          }

          if (!characteristic || !characteristic.value) {
            console.debug('Error monitoring characteristic: Characteristic not found or no value');
            return;
          }

          this.handleRawData(characteristic.value);
        }
      )

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

  // 设置Force回调或扫描连接设备
  scanAndConnect = async (callback?: (forceData: ForceData) => void) => {
    try {
      // 设置Force回调
      if (callback) {
        this.forceCallback = callback;
        console.log('Force callback set successfully');
      }
      
      // 如果已经连接了设备，不需要再次扫描
      if (this.connectedDevice) {
        console.log('Force device already connected');
        return;
      }
      
      // 如果没有回调函数，不执行扫描连接
      if (!callback) {
        console.log('No callback provided, skipping scan');
        return;
      }
      
      if (this.scanning) {
        console.log('Already scanning for Force device');
        return;
      }
      
      console.log('Starting Force device scan...');
      this.scanning = true;

      // 使用BLEService的扫描功能
      await bleManager.startDeviceScan(
        [FORCE_DEVICE_UUID],
        null,
        async (error, scannedDevice) => {
          if (error) {
            console.error('Force device scan error:', error);
            this.scanning = false;
            return;
          }

          console.log(`${scannedDevice?.name} ${scannedDevice?.localName}`);
          if (scannedDevice?.name?.startsWith(FORCE_DEVICE_NAME)) {
            // 当找到设备时，停止扫描并连接
            console.log('Force device found:', scannedDevice);
            bleManager.stopDeviceScan();
            this.scanning = false;
            await this.connectToDevice(scannedDevice);
          }
        }
      );
    } catch (error) {
      console.error('Error in scanAndConnect:', error);
      this.scanning = false;
    }
  };

  // 断开连接
  disconnect = async () => {
    try {
      this.scanning = false;
      if (this.connectedDevice) {
        // 使用BLEService的断开方法
        // await BLEService.disconnectFromDevice(this.connectedDevice.id);
        this.connectedDevice.cancelConnection();
        this.connectedDevice = null;
        this.forceCallback = null;
        console.log('Disconnected from Force device');
      } else {
        bleManager.stopDeviceScan();
      }
    } catch (error) {
      console.error('Error disconnecting from Force device:', error);
    }
  };

  // 发送阻力数据
  sendResistanceData = async (resistanceData: ResistanceData): Promise<boolean> => {
    try {
      if (!this.connectedDevice) {
        console.error('Cannot send resistance data: No connected device');
        return false;
      }

      // 确保阻力值在0-15范围内
      const upperLeft = Math.max(0, Math.min(15, resistanceData.upperLeft));
      const upperRight = Math.max(0, Math.min(15, resistanceData.upperRight));
      const lowerLeft = Math.max(0, Math.min(15, resistanceData.lowerLeft));
      const lowerRight = Math.max(0, Math.min(15, resistanceData.lowerRight));

      // 构建2字节数据
      // 0-3位: 上肢阻力左
      // 4-7位: 上肢阻力右
      // 8-11位: 下肢阻力左
      // 12-15位: 下肢阻力右
      const value = (upperLeft << 0) | (upperRight << 4) | (lowerLeft << 8) | (lowerRight << 12);

      const buffer = Buffer.alloc(2);
      buffer.writeUInt16LE(value);

      const encodedData = buffer.toString('base64');

      // 发送数据
      const characteristic = await this.connectedDevice.writeCharacteristicWithResponseForService(
        FORCE_SERVICE_UUID,
        FORCE_WRITE_CHARACTERISTIC_UUID,
        encodedData
      );

      console.log('Resistance data sent successfully:', characteristic);
      return true;
    } catch (error) {
      console.error('Failed to send resistance data:', error);
      return false;
    }
  };
}

// 导出Force服务的单例实例
export const ForceService = new ForceServiceInstance();
