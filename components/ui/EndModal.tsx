import React from 'react';
import { StyleSheet, View, Modal, Animated } from 'react-native';
import { ThemedText } from '../themed-text';
import { Ionicons } from '@expo/vector-icons';

interface EndModalProps {
  visible: boolean;
  isSavingData: boolean;
}

export const EndModal: React.FC<EndModalProps> = ({
                                                    visible,
                                                    isSavingData,
                                                  }) => {
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
        <View style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>运动结束，请放松</ThemedText>
          <ThemedText style={styles.savingDataText}>
            {isSavingData ? '正在保存运动数据...' : '运动数据已保存'}
          </ThemedText>
          {isSavingData && (
            <View style={styles.loadingContainer}>
              <Animated.View style={{transform: [{rotate: spin}]}}>
                <Ionicons name="refresh" size={40} color="#FF7F50"/>
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
  savingDataText: {
    fontSize: 16,
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});