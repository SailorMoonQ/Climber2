import { StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import useBluetooth from '../hooks/useBluetooth';
import { BluetoothConnectionStatus, BLUETOOTH_COMMANDS } from '@/constants/bluetoothConfig';
import { useNavigation } from "expo-router";

export default function DynamicAssessmentScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [trainingData, setTrainingData] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // 评估流程状态管理
  const [assessmentState, setAssessmentState] = useState<'ready' | 'assessing' | 'levelResult' | 'trainingConfig' | 'training' | 'trainingResult'>('ready');
  const [countdown, setCountdown] = useState(60);
  const [assessmentLevel, setAssessmentLevel] = useState<1 | 2 | 3 | null>(null);
  const [selectedTrainingParams, setSelectedTrainingParams] = useState<any>(null);
  const [trainingDuration, setTrainingDuration] = useState(300); // 默认5分钟训练
  const [trainingCountdown, setTrainingCountdown] = useState(300);

  // 评估参数
  const [config, setConfig] = useState({
    duration: 60, // 评估时长（秒）
    resistanceLevel: 5, // 阻力级别
    speed: 5, // 速度
  });

  // 不同等级对应的训练参数
  const levelParams = {
    1: {resistance: 3, speed: 6, duration: 300},
    2: {resistance: 5, speed: 7, duration: 300},
    3: {resistance: 8, speed: 8, duration: 300}
  };

  const {
    manager,
    isEnabled,
    connectionStatus,
    connectedDevice,
    devices,
    scanning,
    startScan,
    connectToDevice,
    disconnectFromDevice,
    sendData
  } = useBluetooth();

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({title: '动态评估'});
  }, [navigation]);

  // 倒计时效果
  useEffect(() => {
    let timer: number;
    if (assessmentState === 'assessing' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (assessmentState === 'assessing' && countdown === 0) {
      // 评估结束，生成随机等级（1-3）
      const randomLevel = Math.floor(Math.random() * 3) + 1 as 1 | 2 | 3;
      setAssessmentLevel(randomLevel);
      setAssessmentState('levelResult');
    }
    return () => clearTimeout(timer);
  }, [assessmentState, countdown]);

  // 训练倒计时效果
  useEffect(() => {
    let timer: number;
    if (assessmentState === 'training' && trainingCountdown > 0) {
      timer = setTimeout(() => setTrainingCountdown(trainingCountdown - 1), 1000);
    } else if (assessmentState === 'training' && trainingCountdown === 0) {
      // 训练结束
      setAssessmentState('trainingResult');
    }
    return () => clearTimeout(timer);
  }, [assessmentState, trainingCountdown]);

  const handleStartAssessment = useCallback(async () => {
    if (!manager) {
      Alert.alert('蓝牙未初始化', '请稍候重试');
      return;
    }
    if (connectionStatus !== BluetoothConnectionStatus.CONNECTED) {
      Alert.alert('设备未连接', '请先连接设备');
      return;
    }

    // 发送开始评估命令
    const success = await sendData({
      type: BLUETOOTH_COMMANDS.START_TRAINING,
      mode: 'assessment',
      config: config,
    });

    if (success) {
      setCountdown(config.duration);
      setAssessmentState('assessing');
    } else {
      Alert.alert('发送失败', '无法发送开始评估命令');
    }
  }, [manager, connectionStatus, sendData, config]);

  const handleStopAssessment = useCallback(async () => {
    if (!manager) {
      Alert.alert('蓝牙未初始化', '请稍候重试');
      setAssessmentState('ready');
      return;
    }
    if (connectionStatus !== BluetoothConnectionStatus.CONNECTED) {
      Alert.alert('设备未连接', '设备已断开连接');
      setAssessmentState('ready');
      return;
    }

    // 发送停止评估命令
    const success = await sendData({
      type: BLUETOOTH_COMMANDS.STOP_TRAINING,
    });

    if (success) {
      setAssessmentState('ready');
    } else {
      Alert.alert('发送失败', '无法发送停止评估命令');
    }
  }, [manager, connectionStatus, sendData]);

  const handleConfirmLevel = useCallback(() => {
    if (!assessmentLevel) return;

    // 根据等级设置训练参数
    const params = levelParams[assessmentLevel];
    setSelectedTrainingParams(params);
    setTrainingDuration(params.duration);
    setTrainingCountdown(params.duration);

    // 等级1直接进入训练，等级2和3可以调整参数
    if (assessmentLevel === 1) {
      // 直接进入训练
      startTraining();
    } else {
      // 进入参数配置界面
      setAssessmentState('trainingConfig');
    }
  }, [assessmentLevel]);

  const handleAdjustParams = useCallback(() => {
    // 显示参数调整界面
    setShowConfigModal(true);
  }, []);

  const startTraining = useCallback(async () => {
    if (!manager || !selectedTrainingParams) {
      Alert.alert('错误', '无法开始训练');
      return;
    }
    if (connectionStatus !== BluetoothConnectionStatus.CONNECTED) {
      Alert.alert('设备未连接', '请先连接设备');
      return;
    }

    // 发送开始训练命令
    const success = await sendData({
      type: BLUETOOTH_COMMANDS.START_TRAINING,
      mode: 'training',
      config: selectedTrainingParams,
    });

    if (success) {
      setAssessmentState('training');
    } else {
      Alert.alert('发送失败', '无法发送开始训练命令');
    }
  }, [manager, connectionStatus, sendData, selectedTrainingParams]);

  const handleCompleteTraining = useCallback(() => {
    // 训练完成，回到初始状态
    setAssessmentState('ready');
    setAssessmentLevel(null);
    setSelectedTrainingParams(null);
  }, []);

  const handleConnectDevice = useCallback(async (device: any) => {
    if (!manager) {
      Alert.alert('蓝牙未初始化', '请稍候重试');
      return;
    }
    const success = await connectToDevice(device);
    if (success) {
      setShowDeviceList(false);
      Alert.alert('连接成功', `已连接到设备: ${device.name}`);
    } else {
      Alert.alert('连接失败', '无法连接到设备');
    }
  }, [manager, connectToDevice]);

  const handleDisconnectDevice = useCallback(async () => {
    if (!manager) {
      // setAssessmentStarted(false);
      return;
    }
    await disconnectFromDevice();
    // setAssessmentStarted(false);
  }, [manager, disconnectFromDevice]);

  const handleSaveConfig = useCallback(() => {
    if (assessmentState === 'trainingConfig' && selectedTrainingParams) {
      // 更新训练参数
      setSelectedTrainingParams((prev: any) => ({
        ...prev,
        resistance: config.resistanceLevel,
        speed: config.speed,
        duration: config.duration
      }));
      setTrainingCountdown(config.duration);
    }
    setShowConfigModal(false);
  }, [assessmentState, selectedTrainingParams, config]);

  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case BluetoothConnectionStatus.CONNECTED:
        return (
          <ThemedView style={[styles.statusContainer, styles.connectedStatus]}>
            <Ionicons name="bluetooth" size={16} color="white"/>
            <ThemedText style={styles.statusText}>已连接: {connectedDevice?.name}</ThemedText>
            <TouchableOpacity onPress={handleDisconnectDevice} style={styles.disconnectButton}>
              <Ionicons name="close" size={16} color="white"/>
            </TouchableOpacity>
          </ThemedView>
        );
      case BluetoothConnectionStatus.CONNECTING:
        return (
          <ThemedView style={[styles.statusContainer, styles.connectingStatus]}>
            <Ionicons name="bluetooth" size={16} color="white"/>
            <ThemedText style={styles.statusText}>正在连接...</ThemedText>
          </ThemedView>
        );
      case BluetoothConnectionStatus.DISCONNECTED:
        return (
          <ThemedView style={[styles.statusContainer, styles.disconnectedStatus]}>
            <Ionicons name="bluetooth-outline" size={16} color="white"/>
            <ThemedText style={styles.statusText}>未连接</ThemedText>
            <TouchableOpacity onPress={() => setShowDeviceList(true)} style={styles.connectButton}>
              <Ionicons name="search" size={16} color="white"/>
            </TouchableOpacity>
          </ThemedView>
        );
      default:
        return null;
    }
  };

  // 渲染评估流程的不同状态
  const renderAssessmentFlow = () => {
    switch (assessmentState) {
      case 'ready':
        return (
          <ThemedView style={styles.flowSection}>
            <ThemedText type="subtitle" style={styles.flowTitle}>准备开始动态评估</ThemedText>
            <ThemedView style={styles.countdownCircle}>
              <ThemedText type="title" style={styles.countdownText}>准备</ThemedText>
            </ThemedView>
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={handleStartAssessment}
            >
              <Ionicons name="play" size={24} color="white"/>
              <ThemedText style={styles.controlButtonText}>开始评估</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        );

      case 'assessing':
        return (
          <ThemedView style={styles.flowSection}>
            <ThemedText type="subtitle" style={styles.flowTitle}>动态评估进行中</ThemedText>
            <ThemedView style={styles.countdownCircle}>
              <ThemedText type="title" style={styles.countdownText}>{countdown}</ThemedText>
            </ThemedView>
            <ThemedText style={styles.countdownLabel}>秒</ThemedText>
            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={handleStopAssessment}
            >
              <Ionicons name="stop" size={24} color="white"/>
              <ThemedText style={styles.controlButtonText}>停止评估</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        );

      case 'levelResult':
        return (
          <ThemedView style={styles.flowSection}>
            <ThemedText type="subtitle" style={styles.flowTitle}>评估完成</ThemedText>
            <ThemedView style={styles.levelCircle}>
              <ThemedText type="title" style={styles.levelText}>{assessmentLevel}</ThemedText>
            </ThemedView>
            <ThemedText style={styles.levelLabel}>评估等级</ThemedText>
            <TouchableOpacity
              style={[styles.controlButton, styles.confirmButton]}
              onPress={handleConfirmLevel}
            >
              <ThemedText style={styles.controlButtonText}>确认</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        );

      case 'trainingConfig':
        return (
          <ThemedView style={styles.flowSection}>
            <ThemedText type="subtitle" style={styles.flowTitle}>训练参数</ThemedText>
            <ThemedView style={styles.paramsContainer}>
              <ThemedView style={styles.paramItem}>
                <ThemedText style={styles.paramLabel}>阻力</ThemedText>
                <ThemedText style={styles.paramValue}>{selectedTrainingParams?.resistance}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.paramItem}>
                <ThemedText style={styles.paramLabel}>速度</ThemedText>
                <ThemedText style={styles.paramValue}>{selectedTrainingParams?.speed}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.paramItem}>
                <ThemedText style={styles.paramLabel}>时长</ThemedText>
                <ThemedText style={styles.paramValue}>{selectedTrainingParams?.duration / 60}分钟</ThemedText>
              </ThemedView>
            </ThemedView>
            {assessmentLevel !== 1 && (
              <TouchableOpacity
                style={[styles.controlButton, styles.adjustButton]}
                onPress={handleAdjustParams}
              >
                <Ionicons name="settings-outline" size={20} color="white"/>
                <ThemedText style={styles.controlButtonText}>调整参数</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={startTraining}
            >
              <Ionicons name="play" size={24} color="white"/>
              <ThemedText style={styles.controlButtonText}>开始训练</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        );

      case 'training':
        return (
          <ThemedView style={styles.flowSection}>
            <ThemedText type="subtitle" style={styles.flowTitle}>训练进行中</ThemedText>
            <ThemedView style={styles.countdownCircle}>
              <ThemedText type="title" style={styles.countdownText}>
                {Math.floor(trainingCountdown / 60)}:{(trainingCountdown % 60).toString().padStart(2, '0')}
              </ThemedText>
            </ThemedView>
            <ThemedText style={styles.countdownLabel}>剩余时间</ThemedText>
          </ThemedView>
        );

      case 'trainingResult':
        return (
          <ThemedView style={styles.flowSection}>
            <ThemedView style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50"/>
            </ThemedView>
            <ThemedText type="subtitle" style={styles.flowTitle}>训练完成!</ThemedText>
            <ThemedText style={styles.resultText}>恭喜你完成了本次训练</ThemedText>
            <TouchableOpacity
              style={[styles.controlButton, styles.completeButton]}
              onPress={handleCompleteTraining}
            >
              <ThemedText style={styles.controlButtonText}>完成</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        );

      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">动态评估</ThemedText>

      {/* 蓝牙连接状态 */}
      {renderConnectionStatus()}

      {/* 评估参数设置 - 只在准备状态显示 */}
      {assessmentState === 'ready' && (
        <ThemedView style={styles.configSection}>
          <ThemedText type="subtitle">评估参数</ThemedText>
          <ThemedView style={styles.configRow}>
            <ThemedText>时长: {config.duration}秒</ThemedText>
            <ThemedText>阻力: {config.resistanceLevel}</ThemedText>
            <ThemedText>速度: {config.speed}</ThemedText>
          </ThemedView>
          <TouchableOpacity
            style={styles.configButton}
            onPress={() => setShowConfigModal(true)}
          >
            <Ionicons name="settings-outline" size={20} color={tintColor}/>
            <ThemedText style={styles.configButtonText}>调整参数</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {/* 评估流程 */}
      {renderAssessmentFlow()}

      {/* 实时数据展示 */}
      {(assessmentState === 'assessing' || assessmentState === 'training') && assessmentData && (
        <ThemedView style={styles.dataSection}>
          <ThemedText type="subtitle">实时数据</ThemedText>
          <ThemedView style={styles.dataItem}>
            <ThemedText>当前速度: {assessmentData.speed}</ThemedText>
            <ThemedText>当前阻力: {assessmentData.resistance}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.dataItem}>
            <ThemedText>心率: {assessmentData.heartRate}</ThemedText>
            <ThemedText>功率: {assessmentData.power}</ThemedText>
          </ThemedView>
        </ThemedView>
      )}

      {/* 设备列表模态框 */}
      <Modal
        visible={showDeviceList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeviceList(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>选择设备</ThemedText>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={startScan}
              disabled={scanning}
            >
              <Ionicons
                name={scanning ? "refresh-circle" : "refresh"}
                size={20}
                color={tintColor}
              />
              <ThemedText>{scanning ? "扫描中..." : "刷新设备"}</ThemedText>
            </TouchableOpacity>
            <ScrollView style={styles.deviceList}>
              {devices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={styles.deviceItem}
                  onPress={() => handleConnectDevice(device)}
                >
                  <Ionicons name="bluetooth" size={20} color={tintColor}/>
                  <ThemedView style={styles.deviceInfo}>
                    <ThemedText style={styles.deviceName}>{device.name}</ThemedText>
                    <ThemedText style={styles.deviceId}>{device.id}</ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              ))}
              {devices.length === 0 && !scanning && (
                <ThemedText style={styles.noDevicesText}>未找到设备</ThemedText>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDeviceList(false)}
            >
              <ThemedText style={styles.closeButtonText}>关闭</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* 参数设置模态框 */}
      <Modal
        visible={showConfigModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfigModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {assessmentState === 'trainingConfig' ? '调整训练参数' : '调整评估参数'}
            </ThemedText>
            <ThemedView style={styles.inputGroup}>
              <ThemedText>{assessmentState === 'trainingConfig' ? '训练时长 (秒):' : '评估时长 (秒):'}</ThemedText>
              <TextInput
                style={styles.input}
                value={String(config.duration)}
                onChangeText={(text) => setConfig(prev => ({...prev, duration: parseInt(text) || 60}))}
                keyboardType="numeric"
              />
            </ThemedView>
            <ThemedView style={styles.inputGroup}>
              <ThemedText>阻力级别 (1-10):</ThemedText>
              <TextInput
                style={styles.input}
                value={String(config.resistanceLevel)}
                onChangeText={(text) => setConfig(prev => ({
                  ...prev,
                  resistanceLevel: Math.max(1, Math.min(10, parseInt(text) || 5))
                }))}
                keyboardType="numeric"
              />
            </ThemedView>
            <ThemedView style={styles.inputGroup}>
              <ThemedText>速度 (1-10):</ThemedText>
              <TextInput
                style={styles.input}
                value={String(config.speed)}
                onChangeText={(text) => setConfig(prev => ({
                  ...prev,
                  speed: Math.max(1, Math.min(10, parseInt(text) || 5))
                }))}
                keyboardType="numeric"
              />
            </ThemedView>
            <ThemedView style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowConfigModal(false)}
              >
                <ThemedText>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveConfig}
              >
                <ThemedText style={styles.modalButtonPrimaryText}>确定</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* 评估完成后的详细结果模态框 */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResultModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>评估结果</ThemedText>
            <ThemedView style={styles.resultChartContainer}>
              {/* 这里可以添加实际的图表组件，暂时用模拟数据 */}
              <ThemedView style={styles.chartPlaceholder}>
                <ThemedText>评估结果图表</ThemedText>
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.resultDetails}>
              <ThemedText>平均心率: 120 BPM</ThemedText>
              <ThemedText>平均功率: 250 W</ThemedText>
              <ThemedText>总距离: 5.2 km</ThemedText>
              <ThemedText>能量消耗: 320 kcal</ThemedText>
            </ThemedView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowResultModal(false)}
            >
              <ThemedText style={styles.closeButtonText}>关闭</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  connectedStatus: {
    backgroundColor: '#4CAF50',
  },
  connectingStatus: {
    backgroundColor: '#2196F3',
  },
  disconnectedStatus: {
    backgroundColor: '#9E9E9E',
  },
  statusText: {
    color: 'white',
    marginLeft: 5,
    flex: 1,
  },
  connectButton: {
    marginLeft: 10,
    padding: 5,
  },
  disconnectButton: {
    marginLeft: 10,
    padding: 5,
  },
  configSection: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  configButtonText: {
    marginLeft: 5,
    fontWeight: '600',
  },
  flowSection: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  flowTitle: {
    marginBottom: 20,
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  countdownText: {
    color: 'white',
  },
  countdownLabel: {
    fontSize: 18,
    marginBottom: 20,
    opacity: 0.7,
  },
  levelCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelText: {
    color: 'white',
    fontSize: 80,
  },
  levelLabel: {
    fontSize: 18,
    marginBottom: 20,
    opacity: 0.7,
  },
  paramsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  paramItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 10,
  },
  paramLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  paramValue: {
    fontSize: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  adjustButton: {
    backgroundColor: '#FF9800',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '600',
  },
  dataSection: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  successIcon: {
    marginBottom: 20,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.7,
  },
  resultChartContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  chartPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultDetails: {
    width: '100%',
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
  },
  deviceList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  deviceInfo: {
    marginLeft: 10,
    flex: 1,
  },
  deviceName: {
    fontWeight: '600',
  },
  deviceId: {
    fontSize: 12,
    opacity: 0.7,
  },
  noDevicesText: {
    textAlign: 'center',
    padding: 20,
    opacity: 0.7,
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonPrimary: {
    backgroundColor: '#2196F3',
  },
  modalButtonPrimaryText: {
    color: 'white',
    fontWeight: '600',
  },
});