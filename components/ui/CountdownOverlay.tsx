import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed-text';

interface CountdownOverlayProps {
  visible: boolean;
  countdown: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  visible,
  countdown,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.countdownOverlay}>
      <View style={styles.countdownContainer}>
        <ThemedText style={styles.countdownText}>
          {countdown}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  countdownContainer: {
    marginTop: -200,
    width: 1000,
    height: 1500,
    padding: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    padding: 200,
    fontSize: 360,
    fontWeight: 'bold',
    color: '#FF7F50',
  },
});