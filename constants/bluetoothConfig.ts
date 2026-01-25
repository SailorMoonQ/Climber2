// Bluetooth Service UUIDs
export const BLUETOOTH_SERVICES = {
  // 主服务UUID
  MAIN_SERVICE: 'your-main-service-uuid-here',
  // 通信服务UUID
  COMMUNICATION_SERVICE: 'your-communication-service-uuid-here',
};

// Bluetooth Characteristic UUIDs
export const BLUETOOTH_CHARACTERISTICS = {
  // 发送数据特征
  TX_CHARACTERISTIC: 'your-tx-characteristic-uuid-here',
  // 接收数据特征
  RX_CHARACTERISTIC: 'your-rx-characteristic-uuid-here',
  // 状态特征
  STATUS_CHARACTERISTIC: 'your-status-characteristic-uuid-here',
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