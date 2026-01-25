import { StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import useBluetooth from '../hooks/useBluetooth';
import { BluetoothConnectionStatus, BLUETOOTH_COMMANDS } from '../constants/bluetoothConfig';

export default function FreeTrainingScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [trainingStarted, setTrainingStarted] = useState(false);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [trainingData, setTrainingData] = useState<any>(null);
  
  // 训练参数
  const [params, setParams] = useState({
    resistanceLevel: 5, // 阻力级别
    speed: 5, // 速度
  });

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
      params: params,
    });

    if (success) {
      setTrainingStarted(true);
    } else {
      Alert.alert('发送失败', '无法发送开始训练命令');
    }
  }, [manager, connectionStatus, sendData, params]);

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
      params: params,
    });

    if (success) {
      setShowControlPanel(false);
      Alert.alert('更新成功', '训练参数已更新');
    } else {
      Alert.alert('发送失败', '无法发送参数更新命令');
    }
  }, [manager, connectionStatus, sendData, params]);

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
      <ThemedText type="title">自由训练</ThemedText>
      
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
      {trainingData && (
        <ThemedView style={styles.dataSection}>
          <ThemedText type="subtitle">实时数据</ThemedText>
          <ThemedView style={styles.dataGrid}>
            <ThemedView style={styles.dataCard}>
              <Ionicons name="speedometer-outline" size={30} color={tintColor} />
              <ThemedText style={styles.dataValue}>{trainingData.speed || 0}</ThemedText>
              <ThemedText style={styles.dataLabel}>速度</ThemedText>
            </ThemedView>
            <ThemedView style={styles.dataCard}>
              <Ionicons name="fitness-outline" size={30} color={tintColor} />
              <ThemedText style={styles.dataValue}>{trainingData.resistance || 0}</ThemedText>
              <ThemedText style={styles.dataLabel}>阻力</ThemedText>
            </ThemedView>
            <ThemedView style={styles.dataCard}>
              <Ionicons name="heart-outline" size={30} color={tintColor} />
              <ThemedText style={styles.dataValue}>{trainingData.heartRate || 0}</ThemedText>
              <ThemedText style={styles.dataLabel}>心率</ThemedText>
            </ThemedView>
            <ThemedView style={styles.dataCard}>
              <Ionicons name="battery-full-outline" size={30} color={tintColor} />
              <ThemedText style={styles.dataValue}>{trainingData.power || 0}</ThemedText>
              <ThemedText style={styles.dataLabel}>功率</ThemedText>
            </ThemedView>
          </ThemedView>
          
          {/* 运动曲线 */}
          <ThemedView style={styles.chartContainer}>
            <ThemedText style={styles.chartTitle}>运动曲线</ThemedText>
            <ThemedView style={styles.chartPlaceholder}>
              <Ionicons name="analytics-outline" size={40} color={tintColor} />
              <ThemedText>图表占位符</ThemedText>
            </ThemedView>
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
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    minWidth: 200,
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
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '600',
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