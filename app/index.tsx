import { useEffect } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useTokens } from '@/hooks/use-tokens';
import { useI18n } from '@/i18n';
import { Tokens } from '@/constants/theme';
import { Metric, ProgressBar, Txt } from '@/components/ui/primitives';

export default function SplashScreen() {
  const { c } = useTokens();
  const { t } = useI18n();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/(tabs)'), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.glow, { backgroundColor: c.primarySoft }]} />
      <View style={[styles.logo, { backgroundColor: c.primary }]}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logoImg}
          contentFit="contain"
        />
      </View>
      <Txt variant="display" style={styles.title}>{t('appName')}</Txt>
      <Txt variant="body" color={c.textSecondary}>Climber Rehab</Txt>

      <View style={styles.bottom}>
        <ProgressBar value={0.6} height={4} />
        <Metric value="V 1.0.0" size="metricSm" color={c.textMuted} style={styles.version} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Tokens.space.xl },
  glow: {
    position: 'absolute',
    top: '18%',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.5,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Tokens.space.lg,
  },
  logoImg: { width: 64, height: 64 },
  title: { marginBottom: Tokens.space.xs },
  bottom: { position: 'absolute', bottom: 56, alignItems: 'center', width: 160 },
  version: { fontSize: 13, marginTop: Tokens.space.md },
});
