# 蓝牙功能使用说明

## 安装依赖

由于PowerShell执行策略限制，无法直接通过脚本安装依赖。请手动运行以下命令安装蓝牙库：

```bash
# 打开命令提示符（cmd.exe）而非PowerShell
npm install --legacy-peer-deps react-native-ble-plx
```

或使用yarn：

```bash
yarn add react-native-ble-plx
```

## 项目结构

### 蓝牙服务

`services/BluetoothService.ts` - 蓝牙通讯核心服务，提供以下功能：

- 蓝牙状态检查和启用
- 设备扫描
- 设备连接和断开
- 数据发送和接收

### 蓝牙配置

`constants/bluetoothConfig.ts` - 蓝牙相关配置常量：

- 服务UUIDs
- 特征UUIDs
- 设备名称前缀
- 连接状态枚举
- 消息类型枚举
- 命令常量
- 数据格式配置

## 使用方法

### 导入蓝牙服务

```typescript
import BluetoothService from '@/services/BluetoothService';
```

### 检查和启用蓝牙

```typescript
const isEnabled = await BluetoothService.checkBluetoothState();
if (!isEnabled) {
  const enabled = await BluetoothService.requestEnable();
  if (!enabled) {
    // 蓝牙启用失败处理
  }
}
```

### 扫描设备

```typescript
BluetoothService.startScanning(
  (device) => {
    console.log('Found device:', device.name, device.id);
    // 处理发现的设备
  },
  [BLUETOOTH_SERVICES.MAIN_SERVICE], // 可选的服务UUID过滤器
  15000 // 扫描超时时间（毫秒）
);
```

### 连接设备

```typescript
const device = await BluetoothService.connectToDevice(deviceId);
if (device) {
  console.log('Connected to device:', device.name);
}
```

### 发送数据

```typescript
const success = await BluetoothService.sendData(
  deviceId,
  BLUETOOTH_SERVICES.COMMUNICATION_SERVICE,
  BLUETOOTH_CHARACTERISTICS.TX_CHARACTERISTIC,
  'Hello from app!'
);
```

### 接收数据

```typescript
const success = await BluetoothService.receiveData(
  deviceId,
  BLUETOOTH_SERVICES.COMMUNICATION_SERVICE,
  BLUETOOTH_CHARACTERISTICS.RX_CHARACTERISTIC,
  (data) => {
    console.log('Received data:', data);
    // 处理接收到的数据
  }
);
```

### 断开连接

```typescript
await BluetoothService.disconnectFromDevice(deviceId);
```

## 权限配置

已在`app.json`中配置了必要的蓝牙权限：

- BLUETOOTH
- BLUETOOTH_ADMIN
- BLUETOOTH_SCAN
- BLUETOOTH_CONNECT
- ACCESS_COARSE_LOCATION
- ACCESS_FINE_LOCATION

## 注意事项

1. 蓝牙功能需要在真实设备上测试，模拟器可能不支持
2. Android 12+ 需要额外的权限处理
3. 请确保设备支持BLE (Bluetooth Low Energy)
4. 连接设备前请确保已扫描到该设备

## 自定义配置

请根据实际硬件设备的蓝牙UUID配置`constants/bluetoothConfig.ts`文件中的参数：

- `BLUETOOTH_SERVICES` - 替换为实际的服务UUID
- `BLUETOOTH_CHARACTERISTICS` - 替换为实际的特征UUID
- `DEVICE_NAME_PREFIXES` - 替换为实际的设备名称前缀