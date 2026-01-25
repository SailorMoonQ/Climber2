import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Link } from 'expo-router';
import { requestBluetoothPermission } from "@/hooks/bluetoothPermission";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  const buttonData = [
    { title: '动态评估', icon: 'speedometer-outline', href: '/dynamic-assessment' },
    { title: '自由训练', icon: 'fitness-outline', href: '/exercise' },
    { title: '情景游戏', icon: 'game-controller-outline', href: '/scenario-game' },
    { title: '用户管理/运动数据', icon: 'people-outline', href: '/user-management' },
  ];

  requestBluetoothPermission();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.buttonContainer}>
        {buttonData.map((button, index) => (
          // @ts-ignore
          <Link key={index} href={button.href} asChild>
            <TouchableOpacity style={styles.button}>
              <Ionicons name={button.icon as any} size={32} color={tintColor} style={styles.icon} />
              <ThemedText type="subtitle" style={styles.buttonText}>
                {button.title}
              </ThemedText>
            </TouchableOpacity>
          </Link>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 20,
  },
  button: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});