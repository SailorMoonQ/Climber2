import React from 'react';
import { Animated, Modal, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Elevation, Tokens } from '@/constants/theme';
import { useTokens } from '@/hooks/use-tokens';
import { Txt } from './primitives';

interface EndModalProps {
  visible: boolean;
  isSavingData: boolean;
}

export const EndModal: React.FC<EndModalProps> = ({
                                                    visible,
                                                    isSavingData,
                                                  }) => {
  const { c } = useTokens();
  const spinValue = new Animated.Value(0);

  // 创建旋转动画
  React.useEffect(() => {
    if (isSavingData) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isSavingData, spinValue]);

  // 计算旋转角度
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
      }}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: c.surface, borderColor: c.border },
            Elevation.sheet,
          ]}
        >
          <Txt variant="title" style={styles.modalTitle}>
            运动结束，请放松
          </Txt>
          <Txt variant="body" color={c.textSecondary} style={styles.savingDataText}>
            {isSavingData ? '正在保存运动数据...' : '运动数据已保存'}
          </Txt>
          {isSavingData && (
            <View style={styles.loadingContainer}>
              <Animated.View style={{transform: [{rotate: spin}]}}>
                <Ionicons name="refresh" size={40} color={c.primary}/>
              </Animated.View>
            </View>
          )}
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
    borderWidth: StyleSheet.hairlineWidth,
    padding: Tokens.space.lg,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: Tokens.space.lg,
    textAlign: 'center',
  },
  savingDataText: {
    marginTop: Tokens.space.lg,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: Tokens.space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
