// Bluetooth Service UUIDs
export const BLUETOOTH_SERVICES = {
  // 自定义服务UUID
  MAIN_SERVICE: '00009608-0000-1000-8000-00805F9B34FB',
};

// Bluetooth Characteristic UUIDs
export const BLUETOOTH_CHARACTERISTICS = {
  // 读写特征值UUID
  WRITE_CHARACTERISTIC: '00009600-0000-1000-8000-00805F9B34FB',
  // 通知特征值UUID
  NOTIFY_CHARACTERISTIC: '00009601-0000-1000-8000-00805F9B34FB',
};

// 蓝牙设备名称前缀
export const DEVICE_NAME_PREFIXES = {
  // 上位机设备名称前缀
  UPPER_COMPUTER: 'UpperComputer',
  // 下位机设备名称前缀
  LOWER_COMPUTER: 'LowerComputer',
};

// 蓝牙连接状态
export enum BluetoothConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
};

// 蓝牙消息类型
export enum BluetoothMessageType {
  COMMAND = 'command',
  DATA = 'data',
  STATUS = 'status',
  RESPONSE = 'response',
};

// 蓝牙命令常量
export const BLUETOOTH_COMMANDS = {
  // 开始训练命令
  START_TRAINING: 'START_TRAINING',
  // 停止训练命令
  STOP_TRAINING: 'STOP_TRAINING',
  // 获取状态命令
  GET_STATUS: 'GET_STATUS',
  // 发送配置命令
  SEND_CONFIG: 'SEND_CONFIG',
};

// 蓝牙数据格式配置
export const BLUETOOTH_DATA_FORMAT = {
  // 数据包头
  HEADER: [0xAA, 0x55],
  // 数据包尾
  FOOTER: [0x55, 0xAA],
  // 最大数据包大小
  MAX_PACKET_SIZE: 255,
};