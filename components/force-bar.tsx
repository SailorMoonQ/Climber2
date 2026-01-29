import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

// 力量进度条组件接口
export interface ForceBarProps {
  value: number; // 力量值（N）
  label: string; // 标签（如"左手力"）
  maxValue?: number; // 最大力量值（默认40N）
  style?: ViewStyle; // 支持自定义样式
}

// 力量进度条组件
export const ForceBar: React.FC<ForceBarProps> = ({ value, label, maxValue = 40, style }) => {
  // 确保值在0到maxValue之间
  const clampedValue = Math.max(0, Math.min(value, maxValue));
  // 计算进度百分比
  const progressPercentage = (clampedValue / maxValue) * 100;

  return (
    <ThemedView style={[styles.container, style]}>
      {/* 力量值显示 */}
      <ThemedText style={styles.forceValue}>{clampedValue.toFixed(1)}</ThemedText>
      
      {/* 进度条容器 */}
      <View style={styles.progressBarContainer}>
        {/* 背景进度条 */}
        <ThemedView style={styles.progressBarBackground}>
          {/* 填充进度条 */}
          <ThemedView 
            style={[
              styles.progressBarFill, 
              { height: `${progressPercentage}%` }
            ]}
            lightColor="#FFA500" // 橙色填充（浅色主题）
            darkColor="#FF8C00" // 深橙色填充（深色主题）
          />
        </ThemedView>
      </View>
      
      {/* 标签显示 */}
      <ThemedText style={styles.forceLabel}>{label}</ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  forceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressBarContainer: {
    width: 70,
    height: 280,
    marginBottom: 5,
    justifyContent: 'flex-end',
  },
  progressBarBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 40, // 上下圆弧效果
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressBarFill: {
    width: '100%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
  },
  forceLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
});