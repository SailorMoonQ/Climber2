import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ExerciseScreen() {
  // 状态管理
  const [climbingDistance, setClimbingDistance] = useState(0);
  const [heartRate, setHeartRate] = useState('连接配件');
  const [upperResistance, setUpperResistance] = useState(5);
  const [lowerResistance, setLowerResistance] = useState(4);
  const [isExerciseStarted, setIsExerciseStarted] = useState(false);
  const [exerciseTime, setExerciseTime] = useState(60); // 1分钟
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // 处理开始运动
  const handleStartExercise = () => {
    setCountdownVisible(true);
    setCountdown(3);
  };

  // 倒计时效果
  useEffect(() => {
    if (countdownVisible && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdownVisible && countdown === 0) {
      // 倒计时结束，开始运动
      setCountdownVisible(false);
      setIsExerciseStarted(true);
      // 这里可以添加开始运动的逻辑，比如启动计时器、连接设备等
    }
  }, [countdownVisible, countdown]);

  // 处理上肢阻力增减
  const handleUpperResistanceChange = (delta: number) => {
    const newResistance = upperResistance + delta;
    if (newResistance >= 0 && newResistance <= 10) {
      setUpperResistance(newResistance);
    }
  };

  // 处理下肢阻力增减
  const handleLowerResistanceChange = (delta: number) => {
    const newResistance = lowerResistance + delta;
    if (newResistance >= 0 && newResistance <= 10) {
      setLowerResistance(newResistance);
    }
  };

  return (
    <ThemedView style={styles.container}>

      {/* 主内容区域 */}
      <View style={styles.mainContent}>
        <View>
          <ThemedText style={styles.timeText}>
            01:00
          </ThemedText>
        </View>

        {/* 运动时长圆形显示 */}
        <View style={styles.timeCircle}>
          <ThemedText style={styles.timeLabel}>
            运动时长
          </ThemedText>
        </View>

        {/* 攀爬距离和心率 */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.leftStatCard]}>
            <ThemedText style={styles.statLabel}>
              攀爬距离(m)
            </ThemedText>
            <ThemedText style={styles.statValue}>
              {climbingDistance.toString().padStart(2, '0')}
            </ThemedText>
          </View>

          <View style={[styles.statCard, styles.rightStatCard]}>
            <ThemedText style={styles.statLabel}>
              心率(bpm)
            </ThemedText>
            <ThemedText style={styles.statValue}>
              {heartRate}
            </ThemedText>
            <ThemedText style={styles.heartRateMax}>
              MAX 150
            </ThemedText>
          </View>
        </View>

        {/* 阻力控制 */}
        <View style={styles.resistanceRow}>
          <View style={[styles.resistanceCard, styles.leftResistanceCard]}>
            <ThemedText style={styles.resistanceLabel}>
              上肢阻力
            </ThemedText>
            <View style={styles.resistanceControl}>
              <TouchableOpacity
                style={styles.resistanceButton}
                onPress={() => handleUpperResistanceChange(-1)}
              >
                <Ionicons name="remove" size={20} color="#FF7F50" />
              </TouchableOpacity>
              <ThemedText style={styles.resistanceValue}>
                {upperResistance}
              </ThemedText>
              <TouchableOpacity
                style={styles.resistanceButton}
                onPress={() => handleUpperResistanceChange(1)}
              >
                <Ionicons name="add" size={20} color="#FF7F50" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.resistanceCard, styles.rightResistanceCard]}>
            <ThemedText style={styles.resistanceLabel}>
              下肢阻力
            </ThemedText>
            <View style={styles.resistanceControl}>
              <TouchableOpacity
                style={styles.resistanceButton}
                onPress={() => handleLowerResistanceChange(-1)}
              >
                <Ionicons name="remove" size={20} color="#FF7F50" />
              </TouchableOpacity>
              <ThemedText style={styles.resistanceValue}>
                {lowerResistance}
              </ThemedText>
              <TouchableOpacity
                style={styles.resistanceButton}
                onPress={() => handleLowerResistanceChange(1)}
              >
                <Ionicons name="add" size={20} color="#FF7F50" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* 开始运动按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartExercise}
        >
          <ThemedText style={styles.startButtonText}>
            开始运动
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* 倒计时遮罩层 */}
      {countdownVisible && (
        <View style={styles.countdownOverlay}>
          <View style={styles.countdownContainer}>
            <ThemedText style={styles.countdownText}>
              {countdown}
            </ThemedText>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  timeCircle: {
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  timeText: {
    padding: 10,
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  timeLabel: {
    fontSize: 18,
    color: '#000',
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#F5E4DC',
    padding: 15,
    width: '48%',
    alignItems: 'center',
  },
  leftStatCard: {
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
  },
  rightStatCard: {
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
  },
  statLabel: {
    fontSize: 14,
    color: '#000',
    opacity: 0.7,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  heartRateMax: {
    fontSize: 12,
    color: '#000',
    opacity: 0.5,
    marginTop: 5,
  },
  resistanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  resistanceCard: {
    backgroundColor: '#F5E4DC',
    padding: 20,
    width: '48%',
    alignItems: 'center',
  },
  leftResistanceCard: {
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 30,
  },
  rightResistanceCard: {
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 15,
  },
  resistanceLabel: {
    fontSize: 14,
    color: '#000',
    opacity: 0.7,
    marginBottom: 15,
  },
  resistanceControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  resistanceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF7F50',
  },
  resistanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    minWidth: 30,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    padding: 20,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  countdownContainer: {
    marginTop: -200,
    width: 1000,
    height: 1500,
    padding: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    padding: 200,
    fontSize: 360,
    fontWeight: 'bold',
    color: '#FF7F50',
  },
});