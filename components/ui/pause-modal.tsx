import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Elevation, Tokens } from '@/constants/theme';
import { useTokens } from '@/hooks/use-tokens';
import { AppButton, Txt } from './primitives';

interface PauseModalProps {
  visible: boolean;
  onContinue: () => void;
  onEnd: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  visible,
  onContinue,
  onEnd,
}) => {
  const { c } = useTokens();
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onContinue}
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
            运动已暂停
          </Txt>
          <View style={styles.modalButtonsContainer}>
            <AppButton
              label="继续运动"
              variant="secondary"
              onPress={onContinue}
              full
            />
            <AppButton
              label="结束运动"
              variant="danger"
              onPress={onEnd}
              full
            />
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
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Tokens.space.lg,
    gap: Tokens.space.md,
  },
});
