import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// 运动时长组件接口
export interface ExerciseDurationProps {
  duration: number; // 当前时长（秒）
  targetDuration?: number; // 目标时长（秒）
  onTargetPress?: () => void;
}

// 运动时长组件
export const ExerciseDuration: React.FC<ExerciseDurationProps> = ({ 
  duration, 
  targetDuration,
  onTargetPress 
}) => {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  
  // 格式化时间为 MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <ThemedView style={styles.dataItem}>
      <ThemedText style={styles.dataLabel}>运动时长</ThemedText>
      <ThemedView style={styles.durationValue}>
        <ThemedText style={styles.mainValue}>{formatTime(duration)}</ThemedText>
        {targetDuration && (
          <ThemedText style={styles.targetValue}>目标 {formatTime(targetDuration)}</ThemedText>
        )}
      </ThemedView>
      {onTargetPress && (
        <TouchableOpacity style={styles.targetButton} onPress={onTargetPress}>
          <Ionicons name="timer-outline" size={16} color={tintColor} />
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
  durationValue: {
    alignItems: 'center',
    marginBottom: 5,
  },
});