import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import useBluetooth from '@/hooks/useBluetooth';

// 心率组件接口
export interface HeartRateProps {
  maxHeartRate?: number; // 最大心率（bpm）
  targetHeartRateRange?: [number, number]; // 目标心率范围（bpm）
  style?: StyleProp<ViewStyle>;
}

// 心率组件
export const HeartRate: React.FC<HeartRateProps> = ({ 
  maxHeartRate,
  targetHeartRateRange,
  style,
}) => {
  const { parsedData } = useBluetooth();
  const [heartRate, setHeartRate] = useState<number>(0);

  // 监听蓝牙数据变化，提取心率信息
  useEffect(() => {
    if (parsedData && parsedData.heartRate !== undefined) {
      setHeartRate(parsedData.heartRate);
    }
  }, [parsedData]);

  // 添加默认值和错误处理
  const effectiveMaxHeartRate = maxHeartRate ?? 220; // 默认最大心率为220
  const effectiveTargetRange = targetHeartRateRange ?? [0, 0];

  // 计算心率百分比用于显示
  const heartRatePercentage = heartRate > 0 ? (heartRate / effectiveMaxHeartRate) * 100 : 0;

  // 根据心率百分比确定颜色
  let heartRateColor = '#000'; // 默认黑色
  if (heartRatePercentage >= 85) {
    heartRateColor = '#F44336'; // 红色 - 高强度
  } else if (heartRatePercentage >= 70) {
    heartRateColor = '#FF9800'; // 橙色 - 中高强度
  } else if (heartRatePercentage >= 50) {
    heartRateColor = '#4CAF50'; // 绿色 - 中等强度
  }

  // 检查当前心率是否在目标范围内
  const isInTargetRange = heartRate >= effectiveTargetRange[0] && heartRate <= effectiveTargetRange[1];

  return (
    <ThemedView style={[styles.dataItem, style]}>
      <ThemedText style={styles.dataLabel}>心率(bpm)</ThemedText>
      <ThemedText style={[styles.mainValue, { color: heartRateColor }]}>{heartRate || '--'}</ThemedText>
      {targetHeartRateRange && (
        <ThemedText style={styles.targetValue}>
          目标 {targetHeartRateRange[0]}-{targetHeartRateRange[1]}
        </ThemedText>
      )}
      {maxHeartRate !== undefined && (
        <ThemedText style={styles.maxValue}>MAX {maxHeartRate}</ThemedText>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  dataItem: {
    backgroundColor: '#F8E7E1', // 浅粉色背景，匹配设计图
    padding: 15,
    borderBottomLeftRadius: 15,
    borderTopLeftRadius: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
  mainValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  targetValue: {
    fontSize: 12,
    opacity: 0.8,
    color: '#4CAF50',
    marginBottom: 5,
  },
  maxValue: {
    fontSize: 12,
    opacity: 0.8,
    color: '#F44336',
  },
});