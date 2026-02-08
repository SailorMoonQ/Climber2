import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WitMotionService } from '../../services/wit-motion-service';
import { PoseData } from '../../services/pose';

export interface PostureProps {
  style?: StyleProp<ViewStyle>;
}

// 体姿态组件
export const Posture: React.FC<PostureProps> = ({
  style
}) => {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // 使用Wit Motion服务获取姿态数据
  useEffect(() => {
    // 连接Wit Motion设备并设置姿态回调
    WitMotionService.scanAndConnect((data) => {
      setPoseData(data);
      setIsConnected(true);
    });

    // 组件卸载时断开连接
    return () => {
      WitMotionService.disconnect();
    };
  }, []);
  
  // 格式化角度显示，保留一位小数
  const formatAngle = (angle: number): string => {
    return angle.toFixed(1);
  };
  
  return (
    <ThemedView style={[styles.dataItem, style]}>
      <ThemedText style={styles.dataLabel}>体姿态</ThemedText>
      <ThemedView style={styles.postureContainer}>
        {/* 姿态图标 */}
        <ThemedView style={styles.postureIcons}>
          <Ionicons name="body-outline" size={40} color={tintColor} />
          <ThemedView
            style={[styles.statusCircle, { backgroundColor: isConnected ? '#4CAF50' : '#E0E0E0', marginRight: 10 }]}
          >
            <Ionicons
              name={isConnected ? "checkmark" : "close"}
              size={12}
              color="white"
            />
          </ThemedView>
        </ThemedView>
        
        {/* 连接状态 */}
        <ThemedText style={styles.statusText}>
          {isConnected ? '已连接' : '连接配件'}
        </ThemedText>
        
        {/* 角度显示区域 */}
        {isConnected && poseData && (
          <ThemedView style={styles.anglesContainer}>
            <ThemedView style={styles.angleItem}>
              <ThemedText style={styles.angleLabel}>Pitch</ThemedText>
              <ThemedText style={[styles.angleValue, { color: tintColor }]}>
                {formatAngle(poseData.pitch)}°
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.angleItem}>
              <ThemedText style={styles.angleLabel}>Roll</ThemedText>
              <ThemedText style={[styles.angleValue, { color: tintColor }]}>
                {formatAngle(poseData.roll)}°
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.angleItem}>
              <ThemedText style={styles.angleLabel}>Yaw</ThemedText>
              <ThemedText style={[styles.angleValue, { color: tintColor }]}>
                {formatAngle(poseData.yaw)}°
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}
        
        {/* 连接提示 */}
        {!isConnected && (
          <ThemedText style={[styles.hintText, { fontSize: 10, marginTop: 5 }]}>
            蓝色标记表示连接成功
          </ThemedText>
        )}
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  dataItem: {
    backgroundColor: '#F8E7E1',
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 10,
    alignItems: 'center',
    minWidth: 200,
  },
  dataLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
  postureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'transparent'
  },
  postureIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent'
  },
  statusCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 5,
    marginBottom: 10,
  },
  hintText: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 5,
  },
  anglesContainer: {
    width: '100%',
    marginTop: 10,
  },
  angleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  angleLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  angleValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});