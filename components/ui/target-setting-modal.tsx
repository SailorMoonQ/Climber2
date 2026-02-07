import React, { useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';

interface TargetSetting {
  duration: number; // 运动时长（秒）
  distance: number; // 攀爬距离（米）
  calories: number; // 能量消耗（千卡）
}

export interface TargetSettingModalProps {
  visible: boolean;
  onClose: (targets: TargetSetting | null) => void;
  initialTargets?: TargetSetting;
  showOnlyDistance?: boolean;
}

export const TargetSettingModal: React.FC<TargetSettingModalProps> = ({
  visible,
  onClose,
  initialTargets = { duration: 300, distance: 100, calories: 500 }, // 默认5分钟、100米、500千卡
  showOnlyDistance = false,
}) => {
  const [targets, setTargets] = useState<TargetSetting>(initialTargets);

  // 处理时长选择
  const handleDurationSelect = (minutes: number) => {
    setTargets(prev => ({ ...prev, duration: minutes * 60 }));
  };

  // 处理距离选择
  const handleDistanceSelect = (meters: number) => {
    setTargets(prev => ({ ...prev, distance: meters }));
  };

  // 处理卡路里选择
  const handleCaloriesSelect = (kcal: number) => {
    setTargets(prev => ({ ...prev, calories: kcal }));
  };

  // 处理时长输入
  const handleDurationInput = (text: string) => {
    const value = parseInt(text) || 0;
    setTargets(prev => ({ ...prev, duration: value * 60 }));
  };

  // 处理距离输入
  const handleDistanceInput = (text: string) => {
    const value = parseInt(text) || 0;
    setTargets(prev => ({ ...prev, distance: value }));
  };

  // 处理卡路里输入
  const handleCaloriesInput = (text: string) => {
    const value = parseInt(text) || 0;
    setTargets(prev => ({ ...prev, calories: value }));
  };

  // 确认设置
  const handleConfirm = () => {
    onClose(targets);
  };

  // 取消设置
  const handleCancel = () => {
    onClose(null);
  };

  // 格式化时长显示
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const mins = minutes.toString().padStart(2, '0');
    return `${mins}:00`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => onClose(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>运动目标</ThemedText>

          {/* 运动时长设置 */}
          {!showOnlyDistance && (
            <View style={styles.settingItem}>
              <View style={styles.settingItemTitle}>
                <ThemedText style={styles.settingLabel}>运动时长</ThemedText>
                <View style={styles.settingValueContainer}>
                  <TextInput
                    style={styles.settingInput}
                    value={formatDuration(targets.duration)}
                    editable={false}
                  />
                </View>
              </View>
              <View style={styles.settingOptions}>
                {[5, 10, 20, 30].map(minutes => (
                  <TouchableOpacity
                    key={`duration-${minutes}`}
                    style={[
                      styles.settingOption,
                      Math.floor(targets.duration / 60) === minutes && styles.activeOption,
                    ]}
                    onPress={() => handleDurationSelect(minutes)}
                  >
                    <ThemedText
                      style={[
                        styles.settingOptionText,
                        Math.floor(targets.duration / 60) === minutes && styles.activeOptionText,
                      ]}
                    >
                      {minutes}:00
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 攀爬距离设置 */}
          <View style={[styles.settingItem, showOnlyDistance && styles.settingItemLast]}>
            <View style={styles.settingItemTitle}>
              <ThemedText style={styles.settingLabel}>攀爬距离(m)</ThemedText>
              <View style={styles.settingValueContainer}>
                <TextInput
                  style={styles.settingInput}
                  value={targets.distance.toString()}
                  keyboardType="numeric"
                  onChangeText={handleDistanceInput}
                />
              </View>
            </View>
            <View style={styles.settingOptions}>
              {[100, 200, 500, 1000].map(meters => (
                <TouchableOpacity
                  key={`distance-${meters}`}
                  style={[
                    styles.settingOption,
                    targets.distance === meters && styles.activeOption,
                  ]}
                  onPress={() => handleDistanceSelect(meters)}
                >
                  <ThemedText
                    style={[
                      styles.settingOptionText,
                      targets.distance === meters && styles.activeOptionText,
                    ]}
                  >
                    {meters}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 能量消耗设置 */}
          {!showOnlyDistance && (
            <View style={[styles.settingItem, styles.settingItemLast]}>
              <View style={styles.settingItemTitle}>
                <ThemedText style={styles.settingLabel}>能量消耗(kcal)</ThemedText>
                <View style={styles.settingValueContainer}>
                  <TextInput
                    style={styles.settingInput}
                    value={targets.calories.toString()}
                    keyboardType="numeric"
                    onChangeText={handleCaloriesInput}
                  />
                </View>
              </View>
              <View style={styles.settingOptions}>
                {[100, 200, 500, 1000].map(kcal => (
                  <TouchableOpacity
                    key={`calories-${kcal}`}
                    style={[
                      styles.settingOption,
                      targets.calories === kcal && styles.activeOption,
                    ]}
                    onPress={() => handleCaloriesSelect(kcal)}
                  >
                    <ThemedText
                      style={[
                        styles.settingOptionText,
                        targets.calories === kcal && styles.activeOptionText,
                      ]}
                    >
                      {kcal}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 提示信息 */}
          <ThemedText style={styles.hintText}>
            同时设定多个目标时，完成任意一个即运动结束
          </ThemedText>

          {/* 按钮容器 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <ThemedText style={styles.buttonText}>取消</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <ThemedText style={[styles.buttonText, styles.confirmButtonText]}>
                确认
              </ThemedText>
            </TouchableOpacity>
          </View>
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
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItem: {
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingItemLast: {
    marginBottom: 28,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
    fontWeight: '600',
  },
  settingValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    width: 100,
    textAlign: 'center',
    fontSize: 18,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  settingOptions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingOption: {
    backgroundColor: '#f0e8e4',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 75,
    alignItems: 'center',
    marginBottom: 8,
  },
  activeOption: {
    backgroundColor: '#ff7f50',
    transform: [{ scale: 1.05 }],
  },
  settingOptionText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  activeOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  hintText: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginBottom: 24,
    backgroundColor: '#fff8f5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffe8d6',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
  },
  confirmButton: {
    backgroundColor: '#ff7f50',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmButtonText: {
    color: '#fff',
  },
  settingItemTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});