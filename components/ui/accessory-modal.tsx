import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBluetooth, BleDeviceKey } from '@/context/bluetooth-provider';
import { Elevation, Tokens } from '@/constants/theme';
import { useTokens } from '@/hooks/use-tokens';
import { AppButton, Txt } from '@/components/ui/primitives';

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
  const { c } = useTokens();
  const modes = ['热身', '力量', '有氧', '无氧'];

  // Live status + per-device on/off are owned by BluetoothProvider (single source of truth).
  // "Connect" enables + reconnects the device; "Disconnect" disables it so the drop sticks.
  const { devices, setDeviceEnabled } = useBluetooth();
  const statusOf = (key: BleDeviceKey): string =>
    devices.find((d) => d.key === key)?.status ?? 'disconnected';

  // Per-device connect/disconnect/connecting affordance, themed to the design system.
  const renderAccessoryAction = (
    status: string,
    onConnect: () => void,
    onDisconnect: () => void,
  ) => {
    if (status === 'connected') {
      return (
        <AppButton label="断开" variant="secondary" onPress={onDisconnect} style={styles.actionButton} />
      );
    }
    if (status === 'connecting') {
      return (
        <View style={[styles.statusPill, { backgroundColor: c.warningSoft }]}>
          <View style={[styles.statusDot, { backgroundColor: c.warning }]} />
          <Txt variant="caption" color={c.warning}>连接中...</Txt>
        </View>
      );
    }
    return (
      <AppButton label="连接" variant="primary" onPress={onConnect} style={styles.actionButton} />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: c.surface }, Elevation.sheet]}>
          <Txt variant="title" style={styles.modalTitle}>设置配件</Txt>

          {/* 最大心率 */}
          <View style={styles.modalRow}>
            <Txt variant="body" color={c.textSecondary}>最大心率</Txt>
            <Txt variant="subtitle">{maxHeartRate}bpm</Txt>
          </View>

          {/* 目标区间 */}
          <View style={styles.modalRow}>
            <Txt variant="body" color={c.textSecondary}>目标区间</Txt>
            <View style={styles.targetRange}>
              <Txt variant="subtitle">{targetHeartRateRange[0]}bpm</Txt>
              <Txt variant="subtitle" color={c.textMuted} style={styles.targetSeparator}>—</Txt>
              <Txt variant="subtitle">{targetHeartRateRange[1]}bpm</Txt>
            </View>
          </View>

          {/* 运动模式 */}
          <View style={styles.modeContainer}>
            {modes.map((mode) => {
              const active = selectedMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    { backgroundColor: active ? c.primary : c.primarySoft },
                  ]}
                  onPress={() => onModeSelect?.(mode)}
                >
                  <Txt variant="caption" color={active ? c.onPrimary : c.text}>
                    {mode}
                  </Txt>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 连接配件 */}
          <Txt variant="subtitle" style={styles.sectionTitle}>连接配件</Txt>
          <Txt variant="body" color={c.primary} style={styles.accessoryStatus}>得心应手</Txt>

          {/* 心率配件 */}
          <View style={[styles.accessoryRow, { borderBottomColor: c.border }]}>
            <Txt variant="caption" color={c.text} style={styles.accessoryLabel}>心率</Txt>
            <Txt variant="subtitle" style={styles.accessoryValue}>{`${maxHeartRate}bpm`}</Txt>
            {renderAccessoryAction(
              statusOf('heartRate'),
              () => setDeviceEnabled('heartRate', true),
              () => setDeviceEnabled('heartRate', false),
            )}
          </View>

          {/* 体姿配件 */}
          <View style={[styles.accessoryRow, { borderBottomColor: c.border }]}>
            <Txt variant="caption" color={c.text} style={styles.accessoryLabel}>体姿</Txt>
            {renderAccessoryAction(
              statusOf('pose'),
              () => setDeviceEnabled('pose', true),
              () => setDeviceEnabled('pose', false),
            )}
          </View>

          {/* Force配件 */}
          <View style={[styles.accessoryRow, { borderBottomColor: c.border }]}>
            <Txt variant="caption" color={c.text} style={styles.accessoryLabel}>Force</Txt>
            {renderAccessoryAction(
              statusOf('force'),
              () => setDeviceEnabled('force', true),
              () => setDeviceEnabled('force', false),
            )}
          </View>

          {/* 确认按钮 */}
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: c.primary }]}
            onPress={onClose}
          >
            <Ionicons name="checkmark" size={24} color={c.onPrimary}/>
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
    borderRadius: Tokens.radius.xl,
    padding: Tokens.space.lg,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: Tokens.space.lg,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.space.md,
  },
  targetRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetSeparator: {
    marginHorizontal: Tokens.space.sm,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Tokens.space.lg,
  },
  modeButton: {
    paddingVertical: Tokens.space.sm,
    paddingHorizontal: Tokens.space.md,
    borderRadius: Tokens.radius.md,
  },
  sectionTitle: {
    marginBottom: Tokens.space.sm,
  },
  accessoryStatus: {
    marginBottom: Tokens.space.base,
    fontWeight: '600',
  },
  accessoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Tokens.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  accessoryLabel: {
    flex: 1,
  },
  accessoryValue: {
    marginRight: Tokens.space.sm,
  },
  actionButton: {
    minHeight: undefined,
    paddingVertical: Tokens.space.sm,
    paddingHorizontal: Tokens.space.base,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Tokens.space.md,
    paddingVertical: 6,
    borderRadius: Tokens.radius.pill,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confirmButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: Tokens.space.lg,
  },
});
