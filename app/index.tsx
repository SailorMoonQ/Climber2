import { useEffect } from 'react';
import { router, useNavigation } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function SplashScreen() {
  const navigation = useNavigation();
  navigation.setOptions({
    headerShown: false,
  });

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
      <ThemedView style={styles.logo}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={{width: '100%', height: '100%'}}
          contentFit="contain" />
      </ThemedView>
      <ThemedText type="title" style={styles.title}>攀爬康复仪</ThemedText>
      <ThemedText style={styles.subtitle}>
        发布版本: V1.0
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        完整版本: V1.0.0
      </ThemedText>
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
  logo: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 360,
    height: 100,
  },
  title: {
    fontSize: 80,
    height: 240,
    marginTop: 20,
    padding: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.7,
  },
});