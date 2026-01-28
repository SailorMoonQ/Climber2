import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// 能量消耗组件接口
export interface CaloriesProps {
  calories: number; // 当前消耗卡路里
  targetCalories?: number; // 目标消耗卡路里
  onTargetPress?: () => void;
}

// 能量消耗组件
export const Calories: React.FC<CaloriesProps> = ({ 
  calories, 
  targetCalories,
  onTargetPress 
}) => {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  
  return (
    <ThemedView style={styles.dataItem}>
      <ThemedText style={styles.dataLabel}>能量消耗(kcal)</ThemedText>
      <ThemedText style={styles.mainValue}>{calories.toFixed(1)}</ThemedText>
      {targetCalories && (
        <ThemedText style={styles.targetValue}>目标 {targetCalories}</ThemedText>
      )}
      {onTargetPress && (
        <TouchableOpacity style={styles.targetButton} onPress={onTargetPress}>
          <Ionicons name="flame-outline" size={16} color={tintColor} />
          <ThemedText style={styles.targetButtonText}>设定目标</ThemedText>
        </TouchableOpacity>
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
  targetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    marginTop: 5,
  },
  targetButtonText: {
    fontSize: 12,
    marginLeft: 5,
  },
});