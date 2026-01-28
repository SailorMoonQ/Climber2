import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// 距离组件接口
export interface DistanceProps {
  distance: number; // 当前距离（m）
  targetDistance?: number; // 目标距离（m）
  onTargetPress?: () => void;
}

// 距离组件
export const Distance: React.FC<DistanceProps> = ({ 
  distance, 
  targetDistance,
  onTargetPress 
}) => {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  
  return (
    <ThemedView style={styles.dataItem}>
      <ThemedText style={styles.dataLabel}>攀爬距离(m)</ThemedText>
      <ThemedText style={styles.mainValue}>{Math.floor(distance)}</ThemedText>
      {targetDistance && (
        <ThemedText style={styles.targetValue}>目标 {targetDistance}</ThemedText>
      )}
      {onTargetPress && (
        <TouchableOpacity style={styles.targetButton} onPress={onTargetPress}>
          <Ionicons name="walk-outline" size={16} color={tintColor} />
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