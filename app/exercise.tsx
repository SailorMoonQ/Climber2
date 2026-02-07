import React, { useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ResistanceControl } from '@/components/ui/resistance-control';
import { Distance } from '@/components/training-data/distance';
import { HeartRate } from '@/components/training-data/heart-rate';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import useBluetooth from '@/hooks/useBluetooth';
import DatabaseService from '@/services/database-service';
import { User } from '@/interface/user.interface';

import { StartStopControls } from "@/components/ui/start-stop-controls";
import { PauseModal } from "@/components/ui/pause-modal";
import { EndModal } from "@/components/ui/end-modal";
import { AccessoryModal } from "@/components/ui/accessory-modal";
import { TargetSettingModal } from "@/components/ui/target-setting-modal";
import { useUser } from '@/contexts/UserContext';

export default function ExerciseScreen() {
  // 获取路由参数
  const params = useLocalSearchParams();
  const userId = params.id as string;
  
  // 使用全局用户上下文
  const { selectedUser } = useUser();

  // 状态管理
  const [user, setUser] = useState<User | null>(null);
  const [climbingDistance, setClimbingDistance] = useState(342);

  const [upperResistance, setUpperResistance] = useState(5);
  const [lowerResistance, setLowerResistance] = useState(4);
  const [isExerciseStarted, setIsExerciseStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [exerciseTime, setExerciseTime] = useState(60); // 1分钟
  const [remainingTime, setRemainingTime] = useState(60);
  const [isAccessoryModalVisible, setIsAccessoryModalVisible] = useState(false);
  const [isTargetSettingModalVisible, setIsTargetSettingModalVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>('力量'); // 默认选中力量模式
  const [trainingTargets, setTrainingTargets] = useState({ duration: 300, distance: 500, calories: 500 });
  const [accessories, setAccessories] = useState([
    { id: 'hr1', name: '心率带 SHD213', status: 'connected' as const, value: '72' },
    { id: 'pose1', name: '体姿态 A1313123', status: 'connecting' as const },
    { id: 'hr2', name: '心率带 SHD213', status: 'disconnected' as const },
  ]);
  const [heartRateAlert, setHeartRateAlert] = useState(false);
  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
  const [isEndModalVisible, setIsEndModalVisible] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);

  // 蓝牙功能
  const {sendResistanceData} = useBluetooth();

  // 圆形进度条配置
  const radius = 150;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;
  const progress = (remainingTime / exerciseTime) * circumference;

  // 处理开始运动
  const handleStartExercise = () => {
    // 现在倒计时逻辑在StartStopControls组件中处理
    // 这里直接开始运动
    setIsExerciseStarted(true);
    setIsPaused(false);
    setRemainingTime(exerciseTime);
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

  // 根据userId获取用户信息，优先使用路由参数，否则使用全局选中的用户
  useEffect(() => {
    const loadUser = async () => {
      let targetUserId = userId;
      
      // 如果路由参数中没有提供userId，使用全局选中的用户
      if (!targetUserId && selectedUser) {
        targetUserId = selectedUser.id;
      }
      
      if (targetUserId) {
        const userInfo = await DatabaseService.getUserById(targetUserId);
        setUser(userInfo);
      }
    };
    void loadUser();
  }, [userId, selectedUser]);

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({title: `动态姿势评估 ${user?.name || userId}`});
  }, [navigation, userId, user]);

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

        {/* 心率 */}
        <TouchableOpacity
          style={styles.heartRate}
          onPress={() => setIsAccessoryModalVisible(true)}
        >
          <HeartRate
            maxHeartRate={150}
            targetHeartRateRange={[100, 130]}
          />
        </TouchableOpacity>

        {/* Distance组件 */}
        <Distance
          style={styles.distance}
          distance={climbingDistance}
          targetDistance={trainingTargets.distance}
          onTargetPress={() => setIsTargetSettingModalVisible(true)}
        />

        {/* 阻力控制 */}
        <ResistanceControl
          style={styles.resistanceControlLeft}
          title="上肢阻力"
          initialValue={upperResistance}
          onValueChange={setUpperResistance}
          isLeft
        />
        <ResistanceControl
          style={styles.resistanceControlRight}
          title="下肢阻力"
          initialValue={lowerResistance}
          onValueChange={setLowerResistance}
          isRight
        />
      </View>

      {/* 开始运动/暂停/结束运动按钮 */}
      <StartStopControls
        isExerciseStarted={isExerciseStarted}
        isPaused={isPaused}
        onStart={handleStartExercise}
        onPauseResume={handlePauseResumeExercise}
        onEnd={() => {
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
      ></StartStopControls>

      

      {/* 连接配件弹窗 */}
      <AccessoryModal
        visible={isAccessoryModalVisible}
        onClose={() => setIsAccessoryModalVisible(false)}
        maxHeartRate={150}
        targetHeartRateRange={[100, 130]}
        accessories={accessories}
        selectedMode={selectedMode}
      />

      {/* 暂停运动弹窗 */}
      <PauseModal
        visible={isPauseModalVisible}
        onContinue={handleResumeFromModal}
        onEnd={handleEndFromModal}
      >
      </PauseModal>

      {/* 结束运动弹窗 */}
      <EndModal
        visible={isEndModalVisible}
        isSavingData={isSavingData}
      ></EndModal>

      {/* 目标设置弹窗 */}
      <TargetSettingModal
        visible={isTargetSettingModalVisible}
        initialTargets={trainingTargets}
        showOnlyDistance={true}
        onClose={(targets) => {
          setIsTargetSettingModalVisible(false);
          if (targets) {
            setTrainingTargets(targets);
            // 更新距离目标
            // 这里可以根据需要添加其他逻辑
          }
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: 100,
    padding: 20,
    paddingTop: 20,
    width: '100%',
  },
  timeCircle: {
    width: 450,
    height: 450,
    borderRadius: 225,
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
  heartRate: {
    position: 'absolute',
    bottom: 380,
    right: 0,
    width: '20%',
  },
  distance: {
    position: 'absolute',
    bottom: 380,
    left: 0,
    width: '20%',
  },
  resistanceControlLeft: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    width: '30%',
  },
  resistanceControlRight: {
    position: 'absolute',
    bottom: 200,
    right: 0,
    width: '30%',
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
  resistanceCard: {
    backgroundColor: '#F5E4DC',
    padding: 20,
    width: '48%',
    alignItems: 'center',
  },
  leftResistanceCard: {
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    borderTopRightRadius: 30,
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

});