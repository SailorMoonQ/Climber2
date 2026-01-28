import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// 体姿态组件接口
export interface PostureProps {
  // 这里可以留空，只做样子
}

// 体姿态组件
export const Posture: React.FC<PostureProps> = () => {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  
  return (
    <ThemedView style={styles.dataItem}>
      <ThemedText style={styles.dataLabel}>体姿态</ThemedText>
      <ThemedView style={styles.posturePlaceholder}>
        <ThemedView style={styles.postureIcons}>
          <Ionicons name="body-outline" size={40} color={tintColor} />
          <ThemedView style={[styles.smallCircle, { backgroundColor: '#4CAF50', marginRight: 10 }]}>
            <Ionicons name="checkmark" size={12} color="white" />
          </ThemedView>
          <ThemedView style={[styles.smallCircle, { backgroundColor: '#E0E0E0' }]}>
            <Ionicons name="close" size={12} color="white" />
          </ThemedView>
        </ThemedView>
        <ThemedText style={styles.placeholderText}>连接配件</ThemedText>
        <ThemedText style={[styles.placeholderText, { fontSize: 10, marginTop: 5 }]}>蓝色标记表示连接成功</ThemedText>
      </ThemedView>
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
  posturePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  postureIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  smallCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 10,
  },
});