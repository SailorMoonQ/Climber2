import { useEffect } from 'react';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function SplashScreen() {
  useEffect(() => {
    // 开屏界面显示时间（毫秒）
    const splashDuration = 2000;
    
    // 设置定时器，延迟后跳转到主界面
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, splashDuration);
    
    // 清理定时器
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        XX系统名称XX
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        欢迎使用
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.7,
  },
});