import React, { createContext, useContext, ReactNode } from 'react';
import useBluetooth, { ResistanceData } from '@/hooks/useBluetooth';

// 定义蓝牙上下文类型
interface BluetoothContextType {
  isEnabled: boolean;
  connectionStatus: string;
  connectedDevice: any;
  devices: any[];
  scanning: boolean;
  startScan: () => Promise<void>;
  stopScan: () => void;
  connectToDevice: (device: any) => Promise<boolean>;
  disconnectFromDevice: () => Promise<void>;
  sendResistanceData: (resistanceData: ResistanceData) => Promise<boolean>;
  sendData: (commandData: any) => Promise<boolean>;
  parsedData: any;
  currentResistance?: ResistanceData;
}

// 创建蓝牙上下文
const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

// 蓝牙提供者组件
interface BluetoothProviderProps {
  children: ReactNode;
}

export const BluetoothProvider: React.FC<BluetoothProviderProps> = ({ children }) => {
  const bluetoothHook = useBluetooth();

  return (
    <BluetoothContext.Provider value={bluetoothHook}>
      {children}
    </BluetoothContext.Provider>
  );
};

// 自定义钩子用于访问蓝牙上下文
export const useBluetoothContext = () => {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error('useBluetoothContext must be used within a BluetoothProvider');
  }
  return context;
};

export { BluetoothContext };