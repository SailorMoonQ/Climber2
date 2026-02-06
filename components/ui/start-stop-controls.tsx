import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { CountdownOverlay } from './countdown-overlay';

interface StartStopControlsProps {
  isExerciseStarted: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPauseResume: () => void;
  onEnd: () => void;
}

export const StartStopControls: React.FC<StartStopControlsProps> = ({
  isExerciseStarted,
  isPaused,
  onStart,
  onPauseResume,
  onEnd,
}) => {
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // 处理开始运动按钮点击
  const handleStartPress = () => {
    setCountdownVisible(true);
    setCountdown(3);
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
              onPress={onPauseResume}
            >
              <ThemedText style={styles.controlButtonText}>
                {isPaused ? '继续运动' : '暂停'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.endButton]}
              onPress={onEnd}
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