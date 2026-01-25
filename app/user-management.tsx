import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function UserManagementScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">用户管理/运动数据</ThemedText>
      <ThemedText style={styles.content}>用户管理和运动数据页面内容</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
});