import { StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import useBluetooth from '../hooks/useBluetooth';
import { BluetoothConnectionStatus, BLUETOOTH_COMMANDS } from '@/constants/bluetoothConfig';
import { TargetSettingModal, TargetSettingModalProps } from '@/components/ui/target-setting-modal';
import { ExerciseDuration } from '@/components/training-data/exercise-duration';
import { Speed } from '@/components/training-data/speed';
import { Calories } from '@/components/training-data/calories';
import { Posture } from '@/components/training-data/posture';
import { Force } from '@/components/training-data/force';
import { Distance } from '@/components/training-data/distance';
import { HeartRate } from '@/components/training-data/heart-rate';
import { ResistanceControl } from '@/components/ui/resistance-control';

export default function FreeTrainingScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [trainingStarted, setTrainingStarted] = useState(false);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);
  
  // 训练参数
  const [params, setParams] = useState({
    resistanceLevel: 5, // 阻力级别
    speed: 5, // 速度
  });
  
  // 目标设置
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [trainingTargets, setTrainingTargets] = useState<TargetSettingModalProps['initialTargets']>({
    duration: 300, // 默认5分钟
    distance: 100, // 默认100米
    calories: 500, // 默认500千卡
  });
  
  // 实时训练数据
  const [currentDuration, setCurrentDuration] = useState(0); // 运动时长（秒）
  const [currentSpeed, setCurrentSpeed] = useState(0); // 速度（m/s）
  const [averageSpeed, setAverageSpeed] = useState(0); // 平均速度（m/s）
  const [currentDistance, setCurrentDistance] = useState(0); // 距离（m）
  const [currentCalories, setCurrentCalories] = useState(0); // 能量消耗（kcal）
  const [currentHeartRate, setCurrentHeartRate] = useState(0); // 心率（bpm）
  
  // 力量数据
  const [leftHandForce, setLeftHandForce] = useState(0); // 左手力（N）
  const [rightHandForce, setRightHandForce] = useState(0); // 右手力（N）
  const [leftLegForce, setLeftLegForce] = useState(0); // 左腿力（N）
  const [rightLegForce, setRightLegForce] = useState(0); // 右腿力（N）
  
  // 阻力数据
  const [upperResistance, setUpperResistance] = useState(5); // 上肢阻力
  const [lowerResistance, setLowerResistance] = useState(5); // 下肢阻力

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
    sendData,
    parsedData
  } = useBluetooth();
  
  // 计时器
  useEffect(() => {
    let interval: any;
    if (trainingStarted) {
      interval = setInterval(() => {
        setCurrentDuration(prev => prev + 1);
        // 模拟数据变化
        setCurrentSpeed(prev => Math.random() * 5 + 2);
        setCurrentDistance(prev => prev + Math.random() * 0.5);
        setCurrentCalories(prev => prev + Math.random() * 0.5);
        setCurrentHeartRate(prev => Math.floor(Math.random() * 30) + 90);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [trainingStarted]);
  
  // 处理蓝牙数据
  useEffect(() => {
    if (parsedData) {
      // 更新力量数据
      setLeftHandForce(parsedData.upperLeftForce || 0);
      setRightHandForce(parsedData.upperRightForce || 0);
      setLeftLegForce(parsedData.lowerLeftForce || 0);
      setRightLegForce(parsedData.lowerRightForce || 0);
      
      // 可以根据需要更新其他数据
    }
  }, [parsedData]);

  const handleStartTraining = useCallback(async () => {
    if (!manager) {
      Alert.alert('蓝牙未初始化', '请稍候重试');
      return;
    }
    if (connectionStatus !== BluetoothConnectionStatus.CONNECTED) {
      Alert.alert('设备未连接', '请先连接设备');
      return;
    }

    // 发送开始训练命令
    const success = await sendData({
      type: BLUETOOTH_COMMANDS.START_TRAINING,
      mode: 'free',
      params: {
        ...params,
        upperResistance,
        lowerResistance
      },
    });

    if (success) {
      setTrainingStarted(true);
    } else {
      Alert.alert('发送失败', '无法发送开始训练命令');
    }
  }, [manager, connectionStatus, sendData, params, upperResistance, lowerResistance]);

  const handleStopTraining = useCallback(async () => {
    if (!manager) {
      Alert.alert('蓝牙未初始化', '请稍候重试');
      setTrainingStarted(false);
      return;
    }
    if (connectionStatus !== BluetoothConnectionStatus.CONNECTED) {
      Alert.alert('设备未连接', '设备已断开连接');
      setTrainingStarted(false);
      return;
    }

    // 发送停止训练命令
    const success = await sendData({
      type: BLUETOOTH_COMMANDS.STOP_TRAINING,
    });

    if (success) {
      setTrainingStarted(false);
    } else {
      Alert.alert('发送失败', '无法发送停止训练命令');
    }
  }, [manager, connectionStatus, sendData]);

  const handleUpdateParams = useCallback(async () => {
    if (!manager) {
      Alert.alert('蓝牙未初始化', '请稍候重试');
      return;
    }
    if (connectionStatus !== BluetoothConnectionStatus.CONNECTED) {
      Alert.alert('设备未连接', '请先连接设备');
      return;
    }

    // 发送参数更新命令
    const success = await sendData({
      type: BLUETOOTH_COMMANDS.SEND_CONFIG,
      params: {
        ...params,
        upperResistance,
        lowerResistance
      },
    });

    if (success) {
      setShowControlPanel(false);
      Alert.alert('更新成功', '训练参数已更新');
    } else {
      Alert.alert('发送失败', '无法发送参数更新命令');
    }
  }, [manager, connectionStatus, sendData, params, upperResistance, lowerResistance]);

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
      setTrainingStarted(false);
      return;
    }
    await disconnectFromDevice();
    setTrainingStarted(false);
  }, [manager, disconnectFromDevice]);

  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case BluetoothConnectionStatus.CONNECTED:
        return (
          <ThemedView style={[styles.statusContainer, styles.connectedStatus]}>
            <Ionicons name="bluetooth" size={16} color="white" />
            <ThemedText style={styles.statusText}>已连接: {connectedDevice?.name}</ThemedText>
            <TouchableOpacity onPress={handleDisconnectDevice} style={styles.disconnectButton}>
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </ThemedView>
        );
      case BluetoothConnectionStatus.CONNECTING:
        return (
          <ThemedView style={[styles.statusContainer, styles.connectingStatus]}>
            <Ionicons name="bluetooth" size={16} color="white" />
            <ThemedText style={styles.statusText}>正在连接...</ThemedText>
          </ThemedView>
        );
      case BluetoothConnectionStatus.DISCONNECTED:
        return (
          <ThemedView style={[styles.statusContainer, styles.disconnectedStatus]}>
            <Ionicons name="bluetooth-outline" size={16} color="white" />
            <ThemedText style={styles.statusText}>未连接</ThemedText>
            <TouchableOpacity onPress={() => setShowDeviceList(true)} style={styles.connectButton}>
              <Ionicons name="search" size={16} color="white" />
            </TouchableOpacity>
          </ThemedView>
        );
      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* 蓝牙连接状态 */}
      {renderConnectionStatus()}

      {/* 训练控制 */}
      <ThemedView style={styles.controlSection}>
        {!trainingStarted ? (
          <TouchableOpacity 
            style={[styles.controlButton, styles.startButton]} 
            onPress={handleStartTraining}
          >
            <Ionicons name="play" size={24} color="white" />
            <ThemedText style={styles.controlButtonText}>开始训练</ThemedText>
          </TouchableOpacity>
        ) : (
          <ThemedView style={styles.trainingControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.pauseButton]} 
              onPress={() => {}}
            >
              <Ionicons name="pause" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.controlButton, styles.stopButton]} 
              onPress={handleStopTraining}
            >
              <Ionicons name="stop" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.paramButton} 
              onPress={() => setShowControlPanel(true)}
            >
              <Ionicons name="settings-outline" size={24} color={tintColor} />
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>

      {/* 实时数据展示 */}
      <ThemedView style={styles.dataSection}>
        
        {/* 两列布局 */}
        <ThemedView style={styles.twoColumnLayout}>
          {/* 左侧列 */}
          <ThemedView style={styles.leftColumn}>
            {/* 运动时长 */}
            <ExerciseDuration 
              duration={currentDuration} 
              targetDuration={trainingTargets.duration}
              onTargetPress={() => setShowTargetModal(true)}
            />
            
            {/* 能量消耗 */}
            <Calories 
              calories={currentCalories} 
              targetCalories={trainingTargets.calories}
              onTargetPress={() => setShowTargetModal(true)}
            />
          </ThemedView>
          
          {/* 中间列 - 力量数据 */}
          <ThemedView style={styles.middleColumn}>
            <ThemedView style={styles.forceRow}>
              <Force value={leftHandForce} label="左手力" />
            </ThemedView>
            <ThemedView style={styles.forceRow}>
              <Force value={leftLegForce} label="左腿力" />
            </ThemedView>
          </ThemedView>
          
          <ThemedView style={styles.middleColumn}>
            <ThemedView style={styles.forceRow}>
              <Force value={rightHandForce} label="右手力" />
            </ThemedView>
            <ThemedView style={styles.forceRow}>
              <Force value={rightLegForce} label="右腿力" />
            </ThemedView>
          </ThemedView>
          
          {/* 右侧列 */}
          <ThemedView style={styles.rightColumn}>
            {/* 速度 */}
            <Speed speed={currentSpeed} averageSpeed={averageSpeed} />
            
            {/* 心率 */}
            <HeartRate 
              heartRate={currentHeartRate} 
              maxHeartRate={150}
              targetHeartRateRange={[100, 130]}
            />
          </ThemedView>
          
          {/* 最右侧列 - 攀爬距离 */}
          <ThemedView style={styles.rightmostColumn}>
            <Distance 
              distance={currentDistance} 
              targetDistance={trainingTargets.distance}
              onTargetPress={() => setShowTargetModal(true)}
            />
          </ThemedView>
        </ThemedView>
        

        
        {/* 体姿态 */}
        <Posture />
        
        {/* 阻力控制 */}
        <ThemedView style={styles.resistanceSection}>
          <ThemedView style={styles.twoColumnLayout}>
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
          </ThemedView>
        </ThemedView>
      </ThemedView>

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
                  <Ionicons name="bluetooth" size={20} color={tintColor} />
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

      {/* 目标设置弹窗 */}
      <TargetSettingModal
        visible={showTargetModal}
        initialTargets={trainingTargets}
        onClose={(targets) => {
          setShowTargetModal(false);
          if (targets) {
            setTrainingTargets(targets);
            // 这里可以处理目标设置后的逻辑，比如发送到设备
            console.log('设置的目标:', targets);
          }
        }}
      />

      {/* 参数控制面板 */}
      <Modal 
        visible={showControlPanel} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setShowControlPanel(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>调整训练参数</ThemedText>
            <ThemedView style={styles.inputGroup}>
              <ThemedText>阻力级别 (1-10):</ThemedText>
              <ThemedView style={styles.sliderContainer}>
                <TouchableOpacity 
                  style={styles.sliderButton}
                  onPress={() => setParams(prev => ({...prev, resistanceLevel: Math.max(1, prev.resistanceLevel - 1)}))}
                >
                  <Ionicons name="remove" size={20} color={tintColor} />
                </TouchableOpacity>
                <ThemedText style={styles.sliderValue}>{params.resistanceLevel}</ThemedText>
                <TouchableOpacity 
                  style={styles.sliderButton}
                  onPress={() => setParams(prev => ({...prev, resistanceLevel: Math.min(10, prev.resistanceLevel + 1)}))}
                >
                  <Ionicons name="add" size={20} color={tintColor} />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.inputGroup}>
              <ThemedText>速度 (1-10):</ThemedText>
              <ThemedView style={styles.sliderContainer}>
                <TouchableOpacity 
                  style={styles.sliderButton}
                  onPress={() => setParams(prev => ({...prev, speed: Math.max(1, prev.speed - 1)}))}
                >
                  <Ionicons name="remove" size={20} color={tintColor} />
                </TouchableOpacity>
                <ThemedText style={styles.sliderValue}>{params.speed}</ThemedText>
                <TouchableOpacity 
                  style={styles.sliderButton}
                  onPress={() => setParams(prev => ({...prev, speed: Math.min(10, prev.speed + 1)}))}
                >
                  <Ionicons name="add" size={20} color={tintColor} />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => setShowControlPanel(false)}
              >
                <ThemedText>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]} 
                onPress={handleUpdateParams}
              >
                <ThemedText style={styles.modalButtonPrimaryText}>确定</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

// 设置动态标题
export const options = {
  title: '自由训练',
};

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
  controlSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  targetSection: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  targetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  targetCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  targetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  targetLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
  },
  startButton: {
    backgroundColor: '#FF6B35', // 橙色，匹配设计图
    minWidth: 250,
    height: 60,
    justifyContent: 'center',
    borderRadius: 30,
    alignSelf: 'center',
    marginTop: 20,
  },
  pauseButton: {
    backgroundColor: '#FFC107',
  },
  stopButton: {
    backgroundColor: '#F44336',
    marginLeft: 10,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  trainingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paramButton: {
    marginLeft: 10,
    padding: 15,
  },
  dataSection: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dataCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  dataLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  chartTitle: {
    fontWeight: '600',
    marginBottom: 10,
  },
  chartPlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  doubleItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  resistanceSection: {
    marginTop: 20,
  },
  resistanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8E7E1', // 浅粉色背景，匹配设计图
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  resistanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resistanceControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resistanceButton: {
    backgroundColor: '#FF6B35', // 橙色按钮，匹配设计图
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  resistanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35', // 橙色文字，匹配设计图
    marginHorizontal: 10,
  },
  twoColumnLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  leftColumn: {
    width: '20%',
  },
  middleColumn: {
    width: '20%',
    alignItems: 'center',
  },
  rightColumn: {
    width: '20%',
  },
  rightmostColumn: {
    width: '20%',
  },
  noDevicesText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    opacity: 0.7,
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
    marginBottom: 20,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  sliderButton: {
    padding: 10,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    minWidth: 50,
    textAlign: 'center',
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