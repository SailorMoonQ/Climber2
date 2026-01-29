import React from 'react';
import { Modal, ScrollView, StyleSheet, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Device } from "react-native-ble-plx";


interface DeviceListModalProps {
  visible: boolean;
  devices: Device[];
  scanning: boolean;
  onRefresh: () => void;
  onSelectDevice: (device: Device) => void;
  onClose: () => void;
  tintColor?: string;
  title?: string;
  emptyText?: string;
  refreshText?: string;
  scanningText?: string;
  closeText?: string;
  modalOverlayStyle?: ViewStyle;
  modalContentStyle?: ViewStyle;
  modalTitleStyle?: TextStyle;
  refreshButtonStyle?: ViewStyle;
  deviceItemStyle?: ViewStyle;
  deviceInfoStyle?: ViewStyle;
  deviceNameStyle?: TextStyle;
  deviceIdStyle?: TextStyle;
  noDevicesTextStyle?: TextStyle;
  closeButtonStyle?: ViewStyle;
  closeButtonTextStyle?: TextStyle;
}

export const DeviceListModal: React.FC<DeviceListModalProps> = ({
  visible,
  devices,
  scanning,
  onRefresh,
  onSelectDevice,
  onClose,
  tintColor = '#007AFF',
  title = '选择设备',
  emptyText = '未找到设备',
  refreshText = '刷新设备',
  scanningText = '扫描中...',
  closeText = '关闭',
  modalOverlayStyle,
  modalContentStyle,
  modalTitleStyle,
  refreshButtonStyle,
  deviceItemStyle,
  deviceInfoStyle,
  deviceNameStyle,
  deviceIdStyle,
  noDevicesTextStyle,
  closeButtonStyle,
  closeButtonTextStyle,
}) => {
  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={true}
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.modalOverlay, modalOverlayStyle]}>
        <ThemedView style={[styles.modalContent, modalContentStyle]}>
          <ThemedText type="subtitle" style={[styles.modalTitle, modalTitleStyle]}>{title}</ThemedText>
          <TouchableOpacity 
            style={[styles.refreshButton, refreshButtonStyle]} 
            onPress={onRefresh}
            disabled={scanning}
          >
            <Ionicons 
              name={scanning ? "refresh-circle" : "refresh"} 
              size={20} 
              color={tintColor} 
            />
            <ThemedText>{scanning ? scanningText : refreshText}</ThemedText>
          </TouchableOpacity>
          <ScrollView style={styles.deviceList}>
            {devices.map((device) => (
              <TouchableOpacity 
                key={device.id} 
                style={[styles.deviceItem, deviceItemStyle]}
                onPress={() => onSelectDevice(device)}
              >
                <Ionicons name="bluetooth" size={20} color={tintColor} />
                <ThemedView style={[styles.deviceInfo, deviceInfoStyle]}>
                  <ThemedText style={[styles.deviceName, deviceNameStyle]}>{device.name || '未知设备'}</ThemedText>
                  <ThemedText style={[styles.deviceId, deviceIdStyle]}>{device.id}</ThemedText>
                </ThemedView>
              </TouchableOpacity>
            ))}
            {devices.length === 0 && !scanning && (
              <ThemedText style={[styles.noDevicesText, noDevicesTextStyle]}>{emptyText}</ThemedText>
            )}
          </ScrollView>
          <TouchableOpacity 
            style={[styles.closeButton, closeButtonStyle]} 
            onPress={onClose}
          >
            <ThemedText style={[styles.closeButtonText, closeButtonTextStyle]}>{closeText}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
});