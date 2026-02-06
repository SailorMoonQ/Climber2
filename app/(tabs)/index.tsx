import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link } from 'expo-router';
import { Image } from "expo-image";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const buttonData = [
    {
      title: '动态评估',
      icon: 'speedometer-outline',
      href: '/dynamic-assessment',
      color: '#FF6B6B',
    },
    {
      title: '自由训练',
      icon: 'fitness-outline',
      href: '/free-training',
      color: '#4ECDC4',
    },
    {
      title: '情景游戏',
      icon: 'game-controller-outline',
      href: '/scenario-game',
      color: '#45B7D1',
    },
    {
      title: '用户管理/运动数据',
      icon: 'people-outline',
      href: '/user-management',
      color: '#96CEB4',
    },
  ];

  return (
    <ThemedView style={[styles.container, {backgroundColor: isDark ? '#121212' : '#f9f9f9'}]}>
      <View style={styles.buttonContainer}>
        {buttonData.map((button, index) => (
          // @ts-ignore
          <Link key={index} href={button.href} asChild>
            <TouchableOpacity style={[
              styles.buttonWrapper,
              {
                backgroundColor: 'transparent',
                borderColor: button.color,
                shadowColor: button.color + '40'
              }
            ]}>
              <ThemedView style={[
                styles.button,
              ]}>
                <Ionicons name={button.icon as any} size={80} color={button.color} style={styles.icon}/>
                <ThemedText type="subtitle" style={[styles.buttonText, {color: isDark ? '#ffffff' : '#333333'}]}>
                  {button.title}
                </ThemedText>
              </ThemedView>
            </TouchableOpacity>
          </Link>
        ))}
      </View>

      {/* Logo 区域 */}
      <View
        style={styles.logoContainer}
      >
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"/>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 600,
    gap: 30,
    flex: 1,
    justifyContent: 'center',
  },
  buttonWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 25,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  button: {
    padding: 30,
    borderRadius: 23,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  logoContainer: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{translateX: -50}],
    width: 140,
    height: 50,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});