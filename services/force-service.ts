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
      // 通知出错时 BLEService 会回调一个错误对象而非base64字符串，直接忽略
      if (typeof rawData !== 'string') {
        return;
      }
      // 解析base64编码的二进制数据
      const buffer = Buffer.from(rawData, 'base64');

      // 实际设备发送6字节纯数据(位置×2 + 力×4)；协议文档另描述带帧头的9字节格式
      // (0xAA 0xBB + 6字节数据 + 0x55)。两种都支持，data offset 相应为 0 或 2。
      let offset: number;
      if (buffer.length === 6) {
        offset = 0;
      } else if (buffer.length === 9 && buffer[0] === 0xAA && buffer[8] === 0x55) {
        offset = 2;
      } else {
        console.error('Invalid force data length:', buffer.length);
        return;
      }

      // 提取原始数据（小端格式）
      const forceData: Omit<ForceData, 'timestamp'> = {
        upperPosition: buffer.readUInt8(offset + 0), // Byte2: 上肢实时位置 cm
        lowerPosition: buffer.readUInt8(offset + 1), // Byte3: 下肢实时位置 cm
        upperForce: (((buffer[offset + 3] << 8) | buffer[offset + 2]) & 0xFFFF) > 0x7FFF ? ((buffer[offset + 3] << 8) | buffer[offset + 2]) - 0x10000 : (buffer[offset + 3] << 8) | buffer[offset + 2], // Byte4-5: 上肢实时力 N (小端格式)
        lowerForce: (((buffer[offset + 5] << 8) | buffer[offset + 4]) & 0xFFFF) > 0x7FFF ? ((buffer[offset + 5] << 8) | buffer[offset + 4]) - 0x10000 : (buffer[offset + 5] << 8) | buffer[offset + 4], // Byte6-7: 下肢实时力 N (小端格式)
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

      // 使用BLEService的通用通知方法（单一订阅，避免重复监听与重复错误）
      BLEService.startNotifications(
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

      // 扫描所有设备并按名称匹配（FORCE_DEVICE_UUID 是设备标识，非广播的服务UUID，
      // 用作扫描过滤会导致匹配不到设备）
      await bleManager.startDeviceScan(
        null,
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
        // 通过BLEService统一断开：清理连接表+通知订阅，确保之后能干净重连。
        // 不清空 forceCallback —— 重连后界面已注册的回调仍有效，数据可恢复。
        await BLEService.disconnectFromDevice(this.connectedDevice.id);
        this.connectedDevice = null;
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
        // Expected when no Force machine is paired yet — keep it quiet, not an error.
        console.debug('Skip sending resistance data: no connected device');
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
