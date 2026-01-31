import { useState, useEffect, useCallback } from 'react';
import { Device, State } from 'react-native-ble-plx';
import {
  BLUETOOTH_SERVICES,
  BLUETOOTH_CHARACTERISTICS,
  BluetoothConnectionStatus,
  BLUETOOTH_COMMANDS,
  DEVICE_NAME_PREFIXES
} from '@/constants/bluetoothConfig';
import { Buffer } from 'buffer';
import { BLEService } from "@/services/bluetooth";

// 定义阻力数据结构
export interface ResistanceData {
  upperLeft: number;
  upperRight: number;
  lowerLeft: number;
  lowerRight: number;
}

// 定义通知数据结构
export interface NotificationData {
  upperPosition: number;
  lowerPosition: number;
  upperForce: number;
  lowerForce: number;
  heartRate?: number; // 心率（bpm）
  upperLeftPosition?: number;
  upperRightPosition?: number;
  lowerLeftPosition?: number;
  lowerRightPosition?: number;
  upperLeftForce?: number;
  upperRightForce?: number;
  lowerLeftForce?: number;
  lowerRightForce?: number;
}

const useBluetooth = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<BluetoothConnectionStatus>(BluetoothConnectionStatus.DISCONNECTED);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);

  useEffect(() => {
    try {
      const subscription = BLEService.manager.onStateChange((state) => {
        setIsEnabled(state === State.PoweredOn);
        if (state === State.PoweredOn) {
          startScan();
        } else if (state === State.PoweredOff) {
          stopScan();
        }
      }, true);



      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('Failed to initialize Bluetooth manager:', error);
    }
  }, []);

  const startScan = useCallback(async () => {
    if (!BLEService.manager || scanning) return;

    setScanning(true);
    setDevices([]);

    try {
      await BLEService.manager.startDeviceScan(
        null, // 扫描所有服务
        null, // 没有过滤条件
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            setScanning(false);
            return;
          }

          if (device) {
             // 只添加具有特定前缀的设备
             // 使用配置文件中的设备名称前缀进行过滤
             if (device.name?.startsWith(DEVICE_NAME_PREFIXES.LOWER_COMPUTER) || 
                 device.name?.startsWith(DEVICE_NAME_PREFIXES.UPPER_COMPUTER)) {
               setDevices((prevDevices) => {
                 const exists = prevDevices.find(d => d.id === device.id);
                 if (exists) return prevDevices;
                 return [...prevDevices, device];
               });
             }
           }
        }
      );

      // 扫描10秒后自动停止
      setTimeout(() => {
        stopScan();
      }, 10000);
    } catch (error: any) {
      console.error('Failed to start scan:', error);
      // Check if the error is a BleError and log its reason
      if (error.hasOwnProperty('reason')) {
        console.error('BLE Error reason:', error.reason);
      }
      setScanning(false);
    }
  }, [BLEService.manager, scanning]);

  const stopScan = useCallback(() => {
    if (!BLEService.manager || !scanning) return;

    try {
      BLEService.manager.stopDeviceScan();
    } catch (error) {
      console.error('Failed to stop scan:', error);
    } finally {
      setScanning(false);
    }
  }, [BLEService.manager, scanning]);

  const connectToDevice = useCallback(async (device: Device) => {
    if (!BLEService.manager) return false;

    setConnectionStatus(BluetoothConnectionStatus.CONNECTING);

    try {
      // Ensure the device is not already connected
      if (connectedDevice && connectedDevice.id === device.id) {
        console.log('Device already connected');
        setConnectionStatus(BluetoothConnectionStatus.CONNECTED);
        return true;
      }

      // Disconnect from any existing device first
      if (connectedDevice) {
        // 直接执行断开连接操作，避免循环依赖
        setConnectionStatus(BluetoothConnectionStatus.DISCONNECTING);
        
        try {
          if (connectedDevice) {
            await BLEService.manager.cancelDeviceConnection(connectedDevice.id);
          }
        } catch (disconnectError) {
          console.error('Error during disconnection:', disconnectError);
        }
        
        setConnectedDevice(null);
        setConnectionStatus(BluetoothConnectionStatus.DISCONNECTED);
      }

      const newConnectedDevice = await BLEService.manager.connectToDevice(device.id, { timeout: 10000 }); // 10秒超时

      // Discover services and characteristics
      await newConnectedDevice.discoverAllServicesAndCharacteristics();

      setConnectedDevice(newConnectedDevice);
      setConnectionStatus(BluetoothConnectionStatus.CONNECTED);

      // Set up notifications
      newConnectedDevice.monitorCharacteristicForService(
        BLUETOOTH_SERVICES.MAIN_SERVICE,
        BLUETOOTH_CHARACTERISTICS.NOTIFY_CHARACTERISTIC,
        (error, characteristic) => {
          if (error) {
            console.error('Monitor error:', error);
            // Check if the error is a BleError and log its reason
            if (error.hasOwnProperty('reason')) {
              console.error('BLE Monitor Error reason:', error.reason);
            }
            return;
          }

          if (characteristic?.value) {
            // 处理接收到的数据
            const data = parseBluetoothNotificationData(characteristic.value);
            handleReceivedData(data);
          }
        }
      );

      return true;
    } catch (error: any) {
      console.error('Connection failed:', error);
      // Check if the error is a BleError and log its reason
      if (error.hasOwnProperty('reason')) {
        console.error('BLE Connection Error reason:', error.reason);
      }
      setConnectionStatus(BluetoothConnectionStatus.DISCONNECTED);
      return false;
    }
  }, [BLEService.manager, connectedDevice]);

  const disconnectFromDevice = useCallback(async () => {
    if (!BLEService.manager || !connectedDevice) return;

    setConnectionStatus(BluetoothConnectionStatus.DISCONNECTING);

    try {
      await BLEService.manager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setConnectionStatus(BluetoothConnectionStatus.DISCONNECTED);
    } catch (error: any) {
      console.error('Disconnection failed:', error);
      // Check if the error is a BleError and log its reason
      if (error.hasOwnProperty('reason')) {
        console.error('BLE Disconnection Error reason:', error.reason);
      }
      setConnectionStatus(BluetoothConnectionStatus.DISCONNECTED);
    }
  }, [BLEService.manager, connectedDevice]);

  const sendResistanceData = useCallback(async (resistanceData: ResistanceData) => {
    if (!BLEService.manager || !connectedDevice) {
      console.warn('Cannot send data: no manager or connected device');
      return false;
    }

    try {
      const encodedData = encodeResistanceData(resistanceData);
      console.log('Sending encoded data:', Buffer.from(encodedData, 'utf-8').toString('base64'));

      const characteristic = await connectedDevice.writeCharacteristicWithResponseForService(
        BLUETOOTH_SERVICES.MAIN_SERVICE,
        BLUETOOTH_CHARACTERISTICS.WRITE_CHARACTERISTIC,
        encodedData
      );

      console.log('Data sent successfully:', characteristic);
      return true;
    } catch (error: any) {
      console.error('Failed to send resistance data:', error);
      // Check if the error is a BleError and log its reason
      if (error.hasOwnProperty('reason')) {
        console.error('BLE Send Data Error reason:', error.reason);
      }
      return false;
    }
  }, [BLEService.manager, connectedDevice]);

  // 解析通知数据 (6字节)
  const parseBluetoothNotificationData = (value: string): NotificationData | null => {
    try {
      const buffer = Buffer.from(value, 'base64');

      if (buffer.length !== 6) {
        console.error('Invalid notification data length:', buffer.length);
        return null;
      }

      const data: NotificationData = {
        // Byte0: 上肢实时位置 (cm)
        upperPosition: buffer.readUInt8(0),
        // Byte1: 下肢实时位置 (cm)
        lowerPosition: buffer.readUInt8(1),
        // Byte2-3: 上肢实时力 (N), 小端格式
        upperForce: buffer.readInt16LE(2),
        // Byte4-5: 下肢实时力 (N), 小端格式
        lowerForce: buffer.readInt16LE(4)
      };

      return data;
    } catch (error) {
      console.error('Failed to parse Bluetooth notification data:', error);
      return null;
    }
  };

  // 编码阻力数据 (2字节)
  const encodeResistanceData = (resistanceData: ResistanceData): string => {
    try {
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

      return buffer.toString('base64');
    } catch (error) {
      console.error('Failed to encode resistance data:', error);
      return '';
    }
  };

  // 计算左右侧位置 (需要总行程参数)
  const calculateLeftRightPositions = (totalUpperStroke: number, totalLowerStroke: number, notificationData: NotificationData): NotificationData => {
    return {
      ...notificationData,
      upperLeftPosition: totalUpperStroke - notificationData.upperPosition,
      upperRightPosition: notificationData.upperPosition,
      lowerLeftPosition: totalLowerStroke - notificationData.lowerPosition,
      lowerRightPosition: notificationData.lowerPosition
    };
  };

  // 计算左右侧力
  const calculateLeftRightForces = (notificationData: NotificationData): NotificationData => {
    return {
      ...notificationData,
      upperLeftForce: notificationData.upperForce < 0 ? -notificationData.upperForce : 0,
      upperRightForce: notificationData.upperForce > 0 ? notificationData.upperForce : 0,
      lowerLeftForce: notificationData.lowerForce < 0 ? -notificationData.lowerForce : 0,
      lowerRightForce: notificationData.lowerForce > 0 ? notificationData.lowerForce : 0
    };
  };

  // 存储解析后的数据
  const [parsedData, setParsedData] = useState<NotificationData | null>(null);

  // 总行程参数（后续根据实际机械结构调整）
  const totalUpperStroke = 100; // 上肢总行程 cm
  const totalLowerStroke = 100; // 下肢总行程 cm

  const handleReceivedData = (data: NotificationData | null) => {
    // 处理接收到的数据的逻辑
    if (data) {
      // 计算左右侧位置
      const dataWithLeftRightPositions = calculateLeftRightPositions(totalUpperStroke, totalLowerStroke, data);
      // 计算左右侧力
      const completeData = calculateLeftRightForces(dataWithLeftRightPositions);

      console.log('Received complete data:', completeData);
      setParsedData(completeData);
    }
  };

  // 发送命令数据
  const sendData = useCallback(async (commandData: any) => {
    if (!BLEService.manager || !connectedDevice) {
      console.warn('Cannot send command data: no manager or connected device');
      return false;
    }
    console.log(commandData);

    try {
      // 根据命令类型编码数据
      let encodedData: string;

      switch (commandData.type) {
        case BLUETOOTH_COMMANDS.START_TRAINING:
          // 开始训练命令格式: [0x01, 模式(1字节), 配置数据]
          // 模式: 0x00 = 评估模式, 0x01 = 训练模式
          const mode = commandData.mode === 'assessment' ? 0x00 : 0x01;
          const configBytes = Buffer.from(JSON.stringify(commandData.config));
          const startBuffer = Buffer.alloc(2 + configBytes.length);
          startBuffer.writeUInt8(0x01, 0);
          startBuffer.writeUInt8(mode, 1);
          configBytes.copy(startBuffer, 2);
          encodedData = startBuffer.toString('base64');
          break;

        case BLUETOOTH_COMMANDS.STOP_TRAINING:
          // 停止训练命令格式: [0x02]
          const stopBuffer = Buffer.from([0x02]);
          encodedData = stopBuffer.toString('base64');
          break;

        case BLUETOOTH_COMMANDS.GET_STATUS:
          // 获取状态命令格式: [0x03]
          const statusBuffer = Buffer.from([0x03]);
          encodedData = statusBuffer.toString('base64');
          break;

        case BLUETOOTH_COMMANDS.SEND_CONFIG:
          // 发送配置命令格式: [0x04, 配置数据]
          const configBuffer = Buffer.from(JSON.stringify(commandData.config));
          const sendConfigBuffer = Buffer.alloc(1 + configBuffer.length);
          sendConfigBuffer.writeUInt8(0x04, 0);
          configBuffer.copy(sendConfigBuffer, 1);
          encodedData = sendConfigBuffer.toString('base64');
          break;

        default:
          console.error('Unknown command type:', commandData.type);
          return false;
      }

      console.log('Sending command:', commandData.type, 'with data:', encodedData);

      const characteristic = await connectedDevice.writeCharacteristicWithResponseForService(
        BLUETOOTH_SERVICES.MAIN_SERVICE,
        BLUETOOTH_CHARACTERISTICS.WRITE_CHARACTERISTIC,
        encodedData
      );

      console.log('Command sent successfully:', characteristic);
      return true;
    } catch (error: any) {
      console.error('Failed to send command data:', error);
      // Check if the error is a BleError and log its reason
      if (error.hasOwnProperty('reason')) {
        console.error('BLE Send Command Error reason:', error.reason);
      }
      return false;
    }
  }, [BLEService.manager, connectedDevice]);

  return {
    isEnabled,
    connectionStatus,
    connectedDevice,
    devices,
    scanning,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    sendResistanceData,
    sendData,
    calculateLeftRightPositions,
    calculateLeftRightForces,
    parsedData
  };
};

export default useBluetooth;