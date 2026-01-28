import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

// 心率组件接口
export interface HeartRateProps {
  heartRate: number; // 当前心率（bpm）
  maxHeartRate?: number; // 最大心率（bpm）
  targetHeartRateRange?: [number, number]; // 目标心率范围（bpm）
}

// 心率组件
export const HeartRate: React.FC<HeartRateProps> = ({ 
  heartRate, 
  maxHeartRate,
  targetHeartRateRange 
}) => {
  return (
    <ThemedView style={styles.dataItem}>
      <ThemedText style={styles.dataLabel}>心率(bpm)</ThemedText>
      <ThemedText style={styles.mainValue}>{heartRate}</ThemedText>
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
    borderRadius: 15,
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