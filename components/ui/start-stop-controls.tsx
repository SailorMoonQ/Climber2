import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';

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
  return (
    <View style={styles.footer}>
      {!isExerciseStarted ? (
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStart}
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