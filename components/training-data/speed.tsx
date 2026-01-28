import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

// 速度组件接口
export interface SpeedProps {
  speed: number; // 当前速度（m/s）
  averageSpeed?: number; // 平均速度（m/s
  style?: StyleProp<ViewStyle>;
}

// 速度组件
export const Speed: React.FC<SpeedProps> = ({
                                              speed,
                                              averageSpeed,
                                              style
}) => {
  return (
    <ThemedView style={[styles.dataItem, style]}>
      <ThemedText style={styles.dataLabel}>速度(m/s)</ThemedText>
      <ThemedText style={styles.mainValue}>{speed.toFixed(1)}</ThemedText>
      {averageSpeed !== undefined && (
        <ThemedText style={styles.averageValue}>AVG {averageSpeed.toFixed(1)}</ThemedText>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  dataItem: {
    backgroundColor: '#F8E7E1', // 浅粉色背景，匹配设计图
    padding: 15,
    borderBottomRightRadius: 15,
    borderTopRightRadius: 15,
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
  averageValue: {
    fontSize: 12,
    opacity: 0.8,
    color: '#2196F3',
  },
});