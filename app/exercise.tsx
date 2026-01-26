import React, { useState, useEffect, useLayoutEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ResistanceControl } from '@/components/ui/resistance-control';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import useBluetooth from '@/hooks/useBluetooth';
import DatabaseService from '@/services/database-service';
import { User } from '@/interface/user.interface';

export default function ExerciseScreen() {
  // 获取路由参数
  const params = useLocalSearchParams();
  const userId = params.id as string;
  
  // 状态管理
  const [user, setUser] = useState<User | null>(null);
  const [climbingDistance, setClimbingDistance] = useState(342);
  const [heartRate, setHeartRate] = useState(134);
  const [upperResistance, setUpperResistance] = useState(5);
  const [lowerResistance, setLowerResistance] = useState(4);
  const [isExerciseStarted, setIsExerciseStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [exerciseTime, setExerciseTime] = useState(60); // 1分钟
  const [remainingTime, setRemainingTime] = useState(60);
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isAccessoryModalVisible, setIsAccessoryModalVisible] = useState(false);
  const [heartRateAlert, setHeartRateAlert] = useState(false);
  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
  const [isEndModalVisible, setIsEndModalVisible] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);

  // 蓝牙功能
  const { sendResistanceData } = useBluetooth();

  // 圆形进度条配置
  const radius = 150;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;
  const progress = (remainingTime / exerciseTime) * circumference;

  // 处理开始运动
  const handleStartExercise = () => {
    setCountdownVisible(true);
    setCountdown(3);
  };

  // 处理暂停/继续运动
  const handlePauseResumeExercise = () => {
    if (!isPaused) {
      // 点击暂停按钮，先设置暂停状态再显示弹窗
      setIsPaused(true);
      setIsPauseModalVisible(true);
    } else {
      // 从暂停状态继续运动
      setIsPaused(false);
    }
  };

  // 处理继续运动（从弹窗）
  const handleResumeFromModal = () => {
    setIsPauseModalVisible(false);
    setIsPaused(false);
  };

  // 处理结束运动（从弹窗）
  const handleEndFromModal = () => {
    setIsPauseModalVisible(false);
    // 从暂停弹窗点击结束运动时，倒计时已经暂停，直接显示结束弹窗
    setIsEndModalVisible(true);
    setIsSavingData(true);
    
    // 模拟数据存储过程
    setTimeout(() => {
      setIsSavingData(false);
      // 存储运动数据的逻辑可以在这里实现
      console.log('运动数据已保存');
      // 关闭弹窗并重置状态
      setTimeout(() => {
        setIsEndModalVisible(false);
        handleEndExercise();
      }, 1000);
    }, 2000);
  };

  // 处理结束运动
  const handleEndExercise = () => {
    setIsExerciseStarted(false);
    setIsPaused(false);
    setRemainingTime(exerciseTime);
    setHeartRateAlert(false);
  };

  // 根据userId获取用户信息
  useEffect(() => {
    const loadUser = async () => {
      if (userId) {
        const userInfo = await DatabaseService.getUserById(userId);
        setUser(userInfo);
      }
    };
    loadUser();
  }, [userId]);

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({title: `动态姿势评估 ${user?.name || userId}`});
  }, [navigation, userId, user]);

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
      setIsPaused(false);
      setRemainingTime(exerciseTime);
    }
  }, [countdownVisible, countdown]);

  // 运动计时
  useEffect(() => {
    if (isExerciseStarted && !isPaused && remainingTime > 0) {
      const timer = setTimeout(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (remainingTime === 0) {
      // 运动结束
      setIsExerciseStarted(false);
    }
  }, [isExerciseStarted, isPaused, remainingTime]);

  // 心率监测
  useEffect(() => {
    if (isExerciseStarted) {
      // 模拟心率变化
      const heartRateTimer = setInterval(() => {
        // 生成120-230之间的随机心率
        const newHeartRate = Math.floor(Math.random() * 110) + 120;
        setHeartRate(newHeartRate);
        setHeartRateAlert(newHeartRate > 150);
      }, 2000);

      return () => clearInterval(heartRateTimer);
    }
  }, [isExerciseStarted]);

  // 当阻力值变化时发送蓝牙信号
  useEffect(() => {
    // 发送阻力数据
    const sendResistance = async () => {
      await sendResistanceData({
        upperLeft: upperResistance,
        upperRight: upperResistance,
        lowerLeft: lowerResistance,
        lowerRight: lowerResistance
      });
    };

    sendResistance();
  }, [upperResistance, lowerResistance, sendResistanceData]);



  return (
    <ThemedView style={styles.container}>

      {/* 心率过高警报 */}
      {heartRateAlert && (
        <View style={styles.heartRateAlert}>
          <ThemedText style={styles.heartRateAlertText}>
            心率过高
            请停止运动
          </ThemedText>
        </View>
      )}

      {/* 主内容区域 */}
      <View style={styles.mainContent}>
        <View>
          <ThemedText style={styles.timeText}>
            {Math.floor(remainingTime / 60).toString().padStart(2, '0')}:{Math.floor(remainingTime % 60).toString().padStart(2, '0')}
          </ThemedText>
        </View>

        {/* 运动时长圆形显示 */}
        <View style={styles.timeCircle}>
          <Svg width={radius * 2} height={radius * 2} style={styles.progressCircle}>
            {/* 背景圆 */}
            <Circle
              cx={radius}
              cy={radius}
              r={radius - strokeWidth / 2}
              stroke="#E8E8E8"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* 进度圆 */}
            <Circle
              cx={radius}
              cy={radius}
              r={radius - strokeWidth / 2}
              stroke={heartRateAlert ? "#FF0000" : "#FF7F50"}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={isExerciseStarted ? progress : circumference}
              strokeLinecap="round"
              rotation={-90}
              origin={`${radius}, ${radius}`}
            />
          </Svg>
          <View style={styles.timeLabelContainer}>
            <ThemedText style={styles.timeLabel}>
              运动时长
            </ThemedText>
          </View>
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

          <TouchableOpacity
            style={[styles.statCard, styles.rightStatCard]}
            onPress={() => setIsAccessoryModalVisible(true)}
          >
            <ThemedText style={styles.statLabel}>
              心率(bpm)
            </ThemedText>
            <ThemedText style={styles.statValue}>
              {heartRate}
            </ThemedText>
            <ThemedText style={styles.heartRateMax}>
              MAX 150
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 阻力控制 */}
        <View style={styles.resistanceRow}>
          <ResistanceControl
            title="上肢阻力"
            initialValue={upperResistance}
            onValueChange={setUpperResistance}
            isLeft
          />
          <ResistanceControl
            title="下肢阻力"
            initialValue={lowerResistance}
            onValueChange={setLowerResistance}
            isRight
          />
        </View>
      </View>

      {/* 开始运动/暂停/结束运动按钮 */}
      <View style={styles.footer}>
        {!isExerciseStarted ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartExercise}
          >
            <ThemedText style={styles.startButtonText}>
              开始运动
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.exerciseControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePauseResumeExercise}
            >
              <ThemedText style={styles.controlButtonText}>
                {isPaused ? '继续运动' : '暂停'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.controlButton, styles.endButton]}
                onPress={() => {
                  // 点击结束运动按钮，立即暂停倒计时
                  setIsPaused(true);
                  setIsEndModalVisible(true);
                  setIsSavingData(true);
                  
                  // 模拟数据存储过程
                  setTimeout(() => {
                    setIsSavingData(false);
                    // 存储运动数据的逻辑可以在这里实现
                    console.log('运动数据已保存');
                    // 关闭弹窗并重置状态
                    setTimeout(() => {
                      setIsEndModalVisible(false);
                      handleEndExercise();
                    }, 1000);
                  }, 2000);
                }}
              >
              <ThemedText style={styles.controlButtonText}>
                结束运动
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
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

      {/* 连接配件弹窗 */}
      <Modal
        visible={isAccessoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAccessoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>设置配件</ThemedText>

            {/* 最大心率 */}
            <View style={styles.modalRow}>
              <ThemedText style={styles.modalLabel}>最大心率</ThemedText>
              <ThemedText style={styles.modalValue}>150bpm</ThemedText>
            </View>

            {/* 目标区间 */}
            <View style={styles.modalRow}>
              <ThemedText style={styles.modalLabel}>目标区间</ThemedText>
              <View style={styles.targetRange}>
                <ThemedText style={styles.targetValue}>100bpm</ThemedText>
                <ThemedText style={styles.targetSeparator}>—</ThemedText>
                <ThemedText style={styles.targetValue}>130bpm</ThemedText>
              </View>
            </View>

            {/* 运动模式 */}
            <View style={styles.modeContainer}>
              <TouchableOpacity style={styles.modeButton}>
                <ThemedText style={styles.modeText}>热身</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modeButton}>
                <ThemedText style={styles.modeText}>力量</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modeButton}>
                <ThemedText style={styles.modeText}>有氧</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modeButton}>
                <ThemedText style={styles.modeText}>无氧</ThemedText>
              </TouchableOpacity>
            </View>

            {/* 连接配件 */}
            <ThemedText style={styles.sectionTitle}>连接配件</ThemedText>
            <ThemedText style={styles.accessoryStatus}>得心应手</ThemedText>

            {/* 心率带 */}
            <View style={styles.accessoryRow}>
              <ThemedText style={styles.accessoryLabel}>心率带 SHD213</ThemedText>
              <ThemedText style={styles.accessoryValue}>72</ThemedText>
              <TouchableOpacity style={styles.disconnectButton}>
                <ThemedText style={styles.disconnectText}>断开</ThemedText>
              </TouchableOpacity>
            </View>

            {/* 体姿态 */}
            <View style={styles.accessoryRow}>
              <ThemedText style={styles.accessoryLabel}>体姿态 A1313123</ThemedText>
              <TouchableOpacity style={styles.connectingButton}>
                <ThemedText style={styles.connectingText}>连接中</ThemedText>
              </TouchableOpacity>
            </View>

            {/* 心率带 */}
            <View style={styles.accessoryRow}>
              <ThemedText style={styles.accessoryLabel}>心率带 SHD213</ThemedText>
              <TouchableOpacity style={styles.connectButton}>
                <ThemedText style={styles.connectText}>连接</ThemedText>
              </TouchableOpacity>
            </View>

            {/* 确认按钮 */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setIsAccessoryModalVisible(false)}
            >
              <Ionicons name="checkmark" size={24} color="#fff"/>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 暂停运动弹窗 */}
      <Modal
        visible={isPauseModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPauseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>运动已暂停</ThemedText>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.continueButton]}
                onPress={handleResumeFromModal}
              >
                <ThemedText style={styles.modalButtonText}>
                  继续运动
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.endModalButton]}
                onPress={handleEndFromModal}
              >
                <ThemedText style={styles.modalButtonText}>
                  结束运动
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 结束运动弹窗 */}
      <Modal
        visible={isEndModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEndModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>运动结束，请放松</ThemedText>
            <ThemedText style={styles.savingDataText}>
              正在保持运动数据...
            </ThemedText>
            {isSavingData && (
              <View style={styles.loadingContainer}>
                <Ionicons name="refresh" size={40} color="#FF7F50" style={styles.loadingIcon} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  heartRateAlert: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    paddingVertical: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  heartRateAlertText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  progressCircle: {
    position: 'absolute',
  },
  timeLabelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  controlButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  endButton: {
    backgroundColor: '#FF6B6B',
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
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 16,
    color: '#000',
  },
  modalValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  targetRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  targetSeparator: {
    fontSize: 16,
    color: '#000',
    marginHorizontal: 10,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modeButton: {
    backgroundColor: '#F5E4DC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  modeText: {
    fontSize: 14,
    color: '#000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  accessoryStatus: {
    fontSize: 16,
    color: '#FF7F50',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  accessoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  accessoryLabel: {
    fontSize: 14,
    color: '#000',
  },
  accessoryValue: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: '#F5E4DC',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  disconnectText: {
    fontSize: 12,
    color: '#FF7F50',
  },
  connectingButton: {
    backgroundColor: '#F5E4DC',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  connectingText: {
    fontSize: 12,
    color: '#008000',
  },
  connectButton: {
    backgroundColor: '#F5E4DC',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  connectText: {
    fontSize: 12,
    color: '#FF7F50',
  },
  confirmButton: {
    backgroundColor: '#FF7F50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  // 弹窗按钮容器
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  // 弹窗按钮
  modalButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  // 继续运动按钮
  continueButton: {
    backgroundColor: '#F5E4DC',
  },
  // 结束运动按钮
  endModalButton: {
    backgroundColor: '#FF6B6B',
  },
  // 弹窗按钮文字
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  // 保存数据文字
  savingDataText: {
    fontSize: 16,
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
  },
  // 加载容器
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 加载图标
  loadingIcon: {
    // animation: 'spin 1s linear infinite',
  },
});