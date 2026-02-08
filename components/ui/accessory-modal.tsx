import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { Ionicons } from '@expo/vector-icons';
import { getBluetoothDevice } from '@/utils/database';
import { KYTOHeartRateService } from '@/services/kyto-heartrate-service';
import { WitMotionService } from '@/services/wit-motion-service';
import { ForceService } from '@/services/force-service';

interface AccessoryModalProps {
  visible: boolean;
  onClose: () => void;
  maxHeartRate?: number;
  targetHeartRateRange?: [number, number];
  onModeSelect?: (mode: string) => void;
  selectedMode?: string;
}

export const AccessoryModal: React.FC<AccessoryModalProps> = ({
  visible,
  onClose,
  maxHeartRate = 150,
  targetHeartRateRange = [100, 130],
  onModeSelect,
  selectedMode,
}) => {
  const modes = ['热身', '力量', '有氧', '无氧'];
  
  // 配件连接状态管理
  const [accessoryStatus, setAccessoryStatus] = React.useState<Record<string, string>>({
    heartRate: 'connected',
    posture: 'connected',
    force: 'connected'
  });

  const handleHeartRateConnection = async (deviceType: string) => {
    try {
      // 设置状态为连接中
      setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'connecting' }));
      
      // 从数据库中获取保存的蓝牙设备信息
      const savedDevice = await getBluetoothDevice('heartRate');
      
      if (savedDevice) {
        console.log('Found saved heart rate device:', savedDevice);
        
        // 使用KYTO心率服务进行连接
        await KYTOHeartRateService.scanAndConnect((heartRate) => {
          // 心率数据回调
          console.log('Received heart rate:', heartRate);
        });
        
        // 连接成功后更新状态
        setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'connected' }));
      } else {
        console.log('No saved heart rate device found, scanning for new devices...');
        
        // 如果没有保存的设备，扫描并连接
        await KYTOHeartRateService.scanAndConnect((heartRate) => {
          // 心率数据回调
          console.log('Received heart rate:', heartRate);
        });
        
        // 连接成功后更新状态
        setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'connected' }));
      }
    } catch (error) {
      console.error('Heart rate connection error:', error);
      // 连接失败，恢复为断开状态
      setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'disconnected' }));
    }
  };

  const handleHeartRateDisconnection = async (deviceType: string) => {
    try {
      // 断开心率设备连接
      await KYTOHeartRateService.disconnect();
      
      // 更新状态为断开
      setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'disconnected' }));
    } catch (error) {
      console.error('Heart rate disconnection error:', error);
    }
  };

  const handlePostureConnection = async (deviceType: string) => {
    try {
      // 设置状态为连接中
      setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'connecting' }));
      
      // 从数据库中获取保存的蓝牙设备信息
      const savedDevice = await getBluetoothDevice('posture');
      
      if (savedDevice) {
        console.log('Found saved posture device:', savedDevice);
        
        // 使用Wit Motion姿态服务进行连接
        await WitMotionService.scanAndConnect((poseData) => {
          // 体姿数据回调
          console.log('Received pose data:', poseData);
        });
        
        // 连接成功后更新状态
        setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'connected' }));
      } else {
        console.log('No saved posture device found, scanning for new devices...');
        
        // 如果没有保存的设备，扫描并连接
        await WitMotionService.scanAndConnect((poseData) => {
          // 体姿数据回调
          console.log('Received pose data:', poseData);
        });
        
        // 连接成功后更新状态
        setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'connected' }));
      }
    } catch (error) {
      console.error('Posture connection error:', error);
      // 连接失败，恢复为断开状态
      setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'disconnected' }));
    }
  };

  const handlePostureDisconnection = async (deviceType: string) => {
    try {
      // 断开体姿设备连接
      WitMotionService.disconnect();
      
      // 更新状态为断开
      setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'disconnected' }));
    } catch (error) {
      console.error('Posture disconnection error:', error);
    }
  };

  const handleForceConnection = async (deviceType: string) => {
    try {
      // 设置状态为连接中
      setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'connecting' }));
      
      // 从数据库中获取保存的蓝牙设备信息
      const savedDevice = await getBluetoothDevice('force');
      
      if (savedDevice) {
        console.log('Found saved force device:', savedDevice);
        
        // 使用Force服务进行连接
        await ForceService.scanAndConnect((forceData) => {
          // Force数据回调
          console.log('Received force data:', forceData);
        });
        
        // 连接成功后更新状态
        setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'connected' }));
      } else {
        console.log('No saved force device found, scanning for new devices...');
        
        // 如果没有保存的设备，扫描并连接
        await ForceService.scanAndConnect((forceData) => {
          // Force数据回调
          console.log('Received force data:', forceData);
        });
        
        // 连接成功后更新状态
        setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'connected' }));
      }
    } catch (error) {
      console.error('Force connection error:', error);
      // 连接失败，恢复为断开状态
      setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'disconnected' }));
    }
  };

  const handleForceDisconnection = async (deviceType: string) => {
    try {
      // 断开Force设备连接
      await ForceService.disconnect();
      
      // 更新状态为断开
      setAccessoryStatus(prev => ({ ...prev, [deviceType]: 'disconnected' }));
    } catch (error) {
      console.error('Force disconnection error:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>设置配件</ThemedText>

          {/* 最大心率 */}
          <View style={styles.modalRow}>
            <ThemedText style={styles.modalLabel}>最大心率</ThemedText>
            <ThemedText style={styles.modalValue}>{maxHeartRate}bpm</ThemedText>
          </View>

          {/* 目标区间 */}
          <View style={styles.modalRow}>
            <ThemedText style={styles.modalLabel}>目标区间</ThemedText>
            <View style={styles.targetRange}>
              <ThemedText style={styles.targetValue}>{targetHeartRateRange[0]}bpm</ThemedText>
              <ThemedText style={styles.targetSeparator}>—</ThemedText>
              <ThemedText style={styles.targetValue}>{targetHeartRateRange[1]}bpm</ThemedText>
            </View>
          </View>

          {/* 运动模式 */}
          <View style={styles.modeContainer}>
            {modes.map((mode) => (
              <TouchableOpacity 
                key={mode} 
                style={[
                  styles.modeButton, 
                  selectedMode === mode && styles.selectedModeButton
                ]}
                onPress={() => onModeSelect?.(mode)}
              >
                <ThemedText style={[
                  styles.modeText, 
                  selectedMode === mode && styles.selectedModeText
                ]}>
                  {mode}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* 连接配件 */}
          <ThemedText style={styles.sectionTitle}>连接配件</ThemedText>
          <ThemedText style={styles.accessoryStatus}>得心应手</ThemedText>

          {/* 心率配件 */}
          <View style={styles.accessoryRow}>
            <ThemedText style={styles.accessoryLabel}>心率</ThemedText>
            <ThemedText style={styles.accessoryValue}>{`${maxHeartRate}bpm`}</ThemedText>
            {accessoryStatus.heartRate === 'connected' ? (
              <TouchableOpacity 
                style={styles.disconnectButton}
                onPress={() => handleHeartRateDisconnection('heartRate')}
              >
                <ThemedText style={styles.disconnectText}>断开</ThemedText>
              </TouchableOpacity>
            ) : accessoryStatus.heartRate === 'connecting' ? (
              <ThemedText style={styles.connectingText}>连接中...</ThemedText>
            ) : (
              <TouchableOpacity 
                style={styles.connectButton}
                onPress={() => handleHeartRateConnection('heartRate')}
              >
                <ThemedText style={styles.connectText}>连接</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          
          {/* 体姿配件 */}
          <View style={styles.accessoryRow}>
            <ThemedText style={styles.accessoryLabel}>体姿</ThemedText>
            {accessoryStatus.posture === 'connected' ? (
              <TouchableOpacity 
                style={styles.disconnectButton}
                onPress={() => handlePostureDisconnection('posture')}
              >
                <ThemedText style={styles.disconnectText}>断开</ThemedText>
              </TouchableOpacity>
            ) : accessoryStatus.posture === 'connecting' ? (
              <ThemedText style={styles.connectingText}>连接中...</ThemedText>
            ) : (
              <TouchableOpacity 
                style={styles.connectButton}
                onPress={() => handlePostureConnection('posture')}
              >
                <ThemedText style={styles.connectText}>连接</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Force配件 */}
          <View style={styles.accessoryRow}>
            <ThemedText style={styles.accessoryLabel}>Force</ThemedText>
            {accessoryStatus.force === 'connected' ? (
              <TouchableOpacity 
                style={styles.disconnectButton}
                onPress={() => handleForceDisconnection('force')}
              >
                <ThemedText style={styles.disconnectText}>断开</ThemedText>
              </TouchableOpacity>
            ) : accessoryStatus.force === 'connecting' ? (
              <ThemedText style={styles.connectingText}>连接中...</ThemedText>
            ) : (
              <TouchableOpacity 
                style={styles.connectButton}
                onPress={() => handleForceConnection('force')}
              >
                <ThemedText style={styles.connectText}>连接</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* 确认按钮 */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={onClose}
          >
            <Ionicons name="checkmark" size={24} color="#fff"/>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  selectedModeButton: {
    backgroundColor: '#FF7F50',
  },
  modeText: {
    fontSize: 14,
    color: '#000',
  },
  selectedModeText: {
    color: '#fff',
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
    flex: 1,
  },
  accessoryValue: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
    marginRight: 10,
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
  }
});