import React, { useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Elevation, Tokens } from '@/constants/theme';
import { useTokens } from '@/hooks/use-tokens';
import { AppButton, Card, Txt } from '@/components/ui/primitives';

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
  const { c } = useTokens();
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

  // 选项按钮渲染
  const renderOption = (active: boolean, key: string, label: string, onPress: () => void) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.settingOption,
        { backgroundColor: active ? c.primary : c.surface2 },
        active && styles.activeOption,
      ]}
      onPress={onPress}
    >
      <Txt
        variant="caption"
        color={active ? c.onPrimary : c.textSecondary}
        style={active ? styles.activeOptionText : undefined}
      >
        {label}
      </Txt>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => onClose(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: c.surface }, Elevation.sheet]}>
          <Txt variant="title" style={[styles.modalTitle, { borderBottomColor: c.border }]}>
            运动目标
          </Txt>

          {/* 运动时长设置 */}
          {!showOnlyDistance && (
            <View style={[styles.settingItem, { borderBottomColor: c.border }]}>
              <View style={styles.settingItemTitle}>
                <Txt variant="subtitle" style={styles.settingLabel}>
                  运动时长
                </Txt>
                <View style={styles.settingValueContainer}>
                  <TextInput
                    style={[
                      styles.settingInput,
                      { backgroundColor: c.surface2, borderColor: c.border, color: c.text },
                    ]}
                    value={formatDuration(targets.duration)}
                    editable={false}
                  />
                </View>
              </View>
              <View style={styles.settingOptions}>
                {[5, 10, 20, 30].map(minutes =>
                  renderOption(
                    Math.floor(targets.duration / 60) === minutes,
                    `duration-${minutes}`,
                    `${minutes}:00`,
                    () => handleDurationSelect(minutes)
                  )
                )}
              </View>
            </View>
          )}

          {/* 攀爬距离设置 */}
          <View
            style={[
              styles.settingItem,
              { borderBottomColor: c.border },
              showOnlyDistance && styles.settingItemLast,
            ]}
          >
            <View style={styles.settingItemTitle}>
              <Txt variant="subtitle" style={styles.settingLabel}>
                攀爬距离(m)
              </Txt>
              <View style={styles.settingValueContainer}>
                <TextInput
                  style={[
                    styles.settingInput,
                    { backgroundColor: c.surface2, borderColor: c.border, color: c.text },
                  ]}
                  value={targets.distance.toString()}
                  keyboardType="numeric"
                  onChangeText={handleDistanceInput}
                />
              </View>
            </View>
            <View style={styles.settingOptions}>
              {[100, 200, 500, 1000].map(meters =>
                renderOption(
                  targets.distance === meters,
                  `distance-${meters}`,
                  `${meters}`,
                  () => handleDistanceSelect(meters)
                )
              )}
            </View>
          </View>

          {/* 能量消耗设置 */}
          {!showOnlyDistance && (
            <View style={[styles.settingItem, styles.settingItemLast]}>
              <View style={styles.settingItemTitle}>
                <Txt variant="subtitle" style={styles.settingLabel}>
                  能量消耗(kcal)
                </Txt>
                <View style={styles.settingValueContainer}>
                  <TextInput
                    style={[
                      styles.settingInput,
                      { backgroundColor: c.surface2, borderColor: c.border, color: c.text },
                    ]}
                    value={targets.calories.toString()}
                    keyboardType="numeric"
                    onChangeText={handleCaloriesInput}
                  />
                </View>
              </View>
              <View style={styles.settingOptions}>
                {[100, 200, 500, 1000].map(kcal =>
                  renderOption(
                    targets.calories === kcal,
                    `calories-${kcal}`,
                    `${kcal}`,
                    () => handleCaloriesSelect(kcal)
                  )
                )}
              </View>
            </View>
          )}

          {/* 提示信息 */}
          <Card
            inset
            elevated={false}
            style={[styles.hintBox, { backgroundColor: c.warningSoft, borderColor: c.warning }]}
          >
            <Txt variant="caption" color={c.warning} style={styles.hintText}>
              同时设定多个目标时，完成任意一个即运动结束
            </Txt>
          </Card>

          {/* 按钮容器 */}
          <View style={styles.buttonContainer}>
            <AppButton label="取消" variant="secondary" full onPress={handleCancel} />
            <AppButton label="确认" variant="primary" full onPress={handleConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: Tokens.radius.xl,
    padding: Tokens.space.lg,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: Tokens.space.lg,
    textAlign: 'center',
    paddingBottom: Tokens.space.base,
    borderBottomWidth: 1,
  },
  settingItem: {
    marginBottom: Tokens.space.lg,
    paddingBottom: Tokens.space.base,
    borderBottomWidth: 1,
  },
  settingItemLast: {
    marginBottom: Tokens.space.lg,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  settingLabel: {
    marginBottom: Tokens.space.md,
  },
  settingValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.space.md,
  },
  settingInput: {
    borderRadius: Tokens.radius.sm,
    padding: Tokens.space.md,
    width: 100,
    textAlign: 'center',
    fontSize: 18,
    borderWidth: 1,
  },
  settingOptions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: Tokens.space.sm,
  },
  settingOption: {
    borderRadius: Tokens.radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 75,
    alignItems: 'center',
    marginBottom: Tokens.space.sm,
  },
  activeOption: {
    transform: [{ scale: 1.05 }],
  },
  activeOptionText: {
    fontWeight: 'bold',
  },
  hintBox: {
    marginBottom: Tokens.space.lg,
  },
  hintText: {
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Tokens.space.base,
  },
  settingItemTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
