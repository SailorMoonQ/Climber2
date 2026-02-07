import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { CountdownOverlay } from './countdown-overlay';
import { PauseModal } from './pause-modal';
import { EndModal } from './end-modal';

interface StartStopControlsProps {
  isExerciseStarted: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPauseResume: () => void;
  onEnd: () => void;
  onPausedChange: (isPaused: boolean) => void;
}

export const StartStopControls: React.FC<StartStopControlsProps> = ({
  isExerciseStarted,
  isPaused,
  onStart,
  onPauseResume,
  onEnd,
  onPausedChange,
}) => {
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isPauseModalVisible, setIsPauseModalVisible] = useState(false);
  const [isEndModalVisible, setIsEndModalVisible] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);

  // 处理开始运动按钮点击
  const handleStartPress = () => {
    setCountdownVisible(true);
    setCountdown(3);
  };

  // 处理暂停按钮点击
  const handlePausePress = () => {
    // 点击暂停按钮，先设置暂停状态再显示弹窗
    onPauseResume();
    onPausedChange(true);
    setIsPauseModalVisible(true);
  };

  // 处理继续运动（从弹窗）
  const handleResumeFromModal = () => {
    setIsPauseModalVisible(false);
    onPauseResume();
    onPausedChange(false);
  };

  // 处理结束运动（从暂停弹窗）
  const handleEndFromModal = () => {
    setIsPauseModalVisible(false);
    // 从暂停弹窗点击结束运动时，显示结束弹窗
    setIsEndModalVisible(true);
    setIsSavingData(true);

    // 模拟数据存储过程
    setTimeout(() => {
      setIsSavingData(false);
      // 存储运动数据的逻辑可以在这里实现
      console.log('运动数据已保存');
      // 关闭弹窗并重置状态
      setTimeout(() => {
        setIsEndModalVisible(false);
        onEnd();
        onPausedChange(false);
      }, 1000);
    }, 2000);
  };

  // 处理结束运动按钮点击
  const handleEndPress = () => {
    setIsEndModalVisible(true);
    setIsSavingData(true);

    // 模拟数据存储过程
    setTimeout(() => {
      setIsSavingData(false);
      // 存储运动数据的逻辑可以在这里实现
      console.log('运动数据已保存');
      // 关闭弹窗并重置状态
      setTimeout(() => {
        setIsEndModalVisible(false);
        onEnd();
        onPausedChange(false);
      }, 1000);
    }, 2000);
  };

  // 倒计时效果
  useEffect(() => {
    if (countdownVisible && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdownVisible && countdown === 0) {
      // 倒计时结束，调用外部onStart回调
      setCountdownVisible(false);
      onStart();
    }
  }, [countdownVisible, countdown, onStart]);

  return (
    <>
      <View style={styles.footer}>
        {!isExerciseStarted ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartPress}
          >
            <ThemedText style={styles.startButtonText}>
              开始运动
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.exerciseControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={isPaused ? handleResumeFromModal : handlePausePress}
            >
              <ThemedText style={styles.controlButtonText}>
                {isPaused ? '继续运动' : '暂停'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.endButton]}
              onPress={handleEndPress}
            >
              <ThemedText style={styles.controlButtonText}>
                结束运动
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 倒计时遮罩层 - 直接作为组件子元素，覆盖整个页面 */}
      <CountdownOverlay
        visible={countdownVisible}
        countdown={countdown}
      />

      {/* 暂停运动弹窗 */}
      <PauseModal
        visible={isPauseModalVisible}
        onContinue={handleResumeFromModal}
        onEnd={handleEndFromModal}
      />

      {/* 结束运动弹窗 */}
      <EndModal
        visible={isEndModalVisible}
        isSavingData={isSavingData}
      />
    </>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  exerciseControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  controlButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  endButton: {
    backgroundColor: '#FF6B6B',
  },
});