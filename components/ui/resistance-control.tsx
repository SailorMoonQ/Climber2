import React, { useState, useContext } from 'react';
import { StyleSheet, TouchableOpacity, ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { BluetoothContext } from '@/context/bluetooth-context';

export type ResistanceControlProps = ViewProps & {
  title: string;
  initialValue?: number;
  onValueChange?: (newValue: number) => void;
  minValue?: number;
  maxValue?: number;
  isLeft?: boolean;
  isRight?: boolean;
  resistanceType?: 'upperLeft' | 'upperRight' | 'lowerLeft' | 'lowerRight'; // 新增属性
};

export function ResistanceControl({
                                    title,
                                    initialValue = 0,
                                    onValueChange,
                                    minValue = 0,
                                    maxValue = 10,
                                    isLeft = false,
                                    isRight = false,
                                    resistanceType = 'upperLeft', // 默认值
                                    style,
                                    ...otherProps
                                  }: ResistanceControlProps) {
  // 在组件内部管理value状态
  const [value, setValue] = useState(initialValue);
  
  // 获取蓝牙上下文
  const bluetoothContext = useContext(BluetoothContext);

  // 处理阻力值增减
  const handleDecrease = () => {
    const newResistance = value - 1;
    if (newResistance >= minValue) {
      setValue(newResistance);
      // 如果提供了onValueChange回调，通知父组件值的变化
      onValueChange?.(newResistance);
      
      // 发送蓝牙数据
      if (bluetoothContext && bluetoothContext.sendResistanceData) {
        const resistanceData = {
          [resistanceType]: newResistance,
          upperLeft: resistanceType === 'upperLeft' ? newResistance : bluetoothContext.currentResistance?.upperLeft || 0,
          upperRight: resistanceType === 'upperRight' ? newResistance : bluetoothContext.currentResistance?.upperRight || 0,
          lowerLeft: resistanceType === 'lowerLeft' ? newResistance : bluetoothContext.currentResistance?.lowerLeft || 0,
          lowerRight: resistanceType === 'lowerRight' ? newResistance : bluetoothContext.currentResistance?.lowerRight || 0,
        };
        bluetoothContext.sendResistanceData(resistanceData);
      }
    }
  };

  const handleIncrease = () => {
    const newResistance = value + 1;
    if (newResistance <= maxValue) {
      setValue(newResistance);
      // 如果提供了onValueChange回调，通知父组件值的变化
      onValueChange?.(newResistance);
      
      // 发送蓝牙数据
      if (bluetoothContext && bluetoothContext.sendResistanceData) {
        const resistanceData = {
          [resistanceType]: newResistance,
          upperLeft: resistanceType === 'upperLeft' ? newResistance : bluetoothContext.currentResistance?.upperLeft || 0,
          upperRight: resistanceType === 'upperRight' ? newResistance : bluetoothContext.currentResistance?.upperRight || 0,
          lowerLeft: resistanceType === 'lowerLeft' ? newResistance : bluetoothContext.currentResistance?.lowerLeft || 0,
          lowerRight: resistanceType === 'lowerRight' ? newResistance : bluetoothContext.currentResistance?.lowerRight || 0,
        };
        bluetoothContext.sendResistanceData(resistanceData);
      }
    }
  };

  return (
    <ThemedView
      style={[
        styles.resistanceCard,
        isLeft ? styles.leftResistanceCard : undefined,
        isRight ? styles.rightResistanceCard : undefined,
        style,
      ]}
      {...otherProps}
    >
      <ThemedText style={styles.resistanceLabel}>
        {title}
      </ThemedText>
      <ThemedView style={styles.resistanceControl}>
        <TouchableOpacity
          style={styles.resistanceButton}
          onPress={handleDecrease}
        >
          <Ionicons name="remove" size={20} color="#FF7F50"/>
        </TouchableOpacity>
        <ThemedText style={styles.resistanceValue}>
          {value}
        </ThemedText>
        <TouchableOpacity
          style={styles.resistanceButton}
          onPress={handleIncrease}
        >
          <Ionicons name="add" size={20} color="#FF7F50"/>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  resistanceCard: {
    backgroundColor: '#F5E4DC',
    padding: 40,
    width: '48%',
    alignItems: 'center',
  },
  leftResistanceCard: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 70,
    borderBottomRightRadius: 70,
  },
  rightResistanceCard: {
    borderTopLeftRadius: 70,
    borderBottomLeftRadius: 70,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  resistanceLabel: {
    fontSize: 14,
    color: '#000',
    opacity: 0.7,
    marginBottom: 15,
  },
  resistanceControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'transparent',
  },
  resistanceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF7F50',
  },
  resistanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    minWidth: 30,
    textAlign: 'center',
  },
});