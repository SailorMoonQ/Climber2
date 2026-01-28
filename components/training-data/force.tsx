import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

// 力量组件接口
export interface ForceProps {
  value: number; // 力量值（N）
  label: string; // 标签（如"左手力"）
}

// 力量组件
export const Force: React.FC<ForceProps> = ({ value, label }) => {
  return (
    <ThemedView style={styles.forceItem}>
      <ThemedText style={styles.forceLabel}>{label}</ThemedText>
      <ThemedText style={styles.forceValue}>{value.toFixed(1)}</ThemedText>
      <ThemedText style={styles.forceUnit}>(单位N)</ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  forceItem: {
    backgroundColor: '#E0E0E0', // 灰色背景，匹配设计图
    padding: 20,
    borderRadius: 50, // 圆形设计，匹配设计图
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    marginHorizontal: 5,
  },
  forceLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 5,
  },
  forceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  forceUnit: {
    fontSize: 10,
    opacity: 0.6,
  },
});