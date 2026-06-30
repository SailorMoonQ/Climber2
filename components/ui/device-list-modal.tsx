import React from 'react';
import { Modal, ScrollView, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Device } from "react-native-ble-plx";
import { Elevation, Tokens } from '@/constants/theme';
import { useTokens } from '@/hooks/use-tokens';
import { Txt } from '@/components/ui/primitives';


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
  tintColor,
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
  const { c } = useTokens();
  const accent = tintColor ?? c.primary;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, modalOverlayStyle]}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: c.surface, borderColor: c.border },
            Elevation.sheet,
            modalContentStyle,
          ]}
        >
          <Txt variant="subtitle" style={[styles.modalTitle, modalTitleStyle]}>{title}</Txt>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: c.surface2 }, refreshButtonStyle]}
            onPress={onRefresh}
            disabled={scanning}
          >
            <Ionicons
              name={scanning ? "refresh-circle" : "refresh"}
              size={20}
              color={accent}
            />
            <Txt style={styles.refreshLabel}>{scanning ? scanningText : refreshText}</Txt>
          </TouchableOpacity>
          <ScrollView style={styles.deviceList}>
            {devices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={[styles.deviceItem, { borderBottomColor: c.border }, deviceItemStyle]}
                onPress={() => onSelectDevice(device)}
              >
                <Ionicons name="bluetooth" size={20} color={accent} />
                <View style={[styles.deviceInfo, deviceInfoStyle]}>
                  <Txt style={[styles.deviceName, deviceNameStyle]}>{device.name || '未知设备'}</Txt>
                  <Txt variant="caption" color={c.textSecondary} style={[styles.deviceId, deviceIdStyle]}>{device.id}</Txt>
                </View>
              </TouchableOpacity>
            ))}
            {devices.length === 0 && !scanning && (
              <Txt color={c.textSecondary} style={[styles.noDevicesText, noDevicesTextStyle]}>{emptyText}</Txt>
            )}
          </ScrollView>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: c.surface2 }, closeButtonStyle]}
            onPress={onClose}
          >
            <Txt style={[styles.closeButtonText, closeButtonTextStyle]}>{closeText}</Txt>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalContent: {
    borderRadius: Tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Tokens.space.lg,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: Tokens.space.lg,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Tokens.space.sm,
    padding: Tokens.space.md,
    borderRadius: Tokens.radius.md,
    marginBottom: Tokens.space.md,
  },
  refreshLabel: {
    fontWeight: '600',
  },
  deviceList: {
    maxHeight: 300,
    marginBottom: Tokens.space.lg,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Tokens.space.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  deviceInfo: {
    marginLeft: Tokens.space.md,
    flex: 1,
  },
  deviceName: {
    fontWeight: '600',
  },
  deviceId: {
    fontSize: 12,
  },
  noDevicesText: {
    textAlign: 'center',
    padding: Tokens.space.lg,
  },
  closeButton: {
    padding: Tokens.space.md,
    borderRadius: Tokens.radius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontWeight: '600',
  },
});
