import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTokens } from '@/hooks/use-tokens';
import { useI18n } from '@/i18n';
import { Tokens } from '@/constants/theme';
import { AppButton, Header, Txt } from '@/components/ui/primitives';

export default function ScenarioGameScreen() {
  const { c } = useTokens();
  const { t } = useI18n();
  const pills = [t('featureMissions'), t('featureFeedback'), t('featureRewards')];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title={t('scenarioGame')} />

      <View style={styles.body}>
        <View style={[styles.iconTile, { backgroundColor: c.primarySoft }]}>
          <Ionicons name="game-controller" size={56} color={c.primary} />
        </View>
        <Txt variant="caption" color={c.primary} style={styles.eyebrow}>
          {t('comingSoon')}
        </Txt>
        <Txt variant="title" style={styles.heading}>{t('scenarioComingSoonTitle')}</Txt>
        <Txt variant="body" color={c.textSecondary} style={styles.bodyText}>
          {t('scenarioComingSoonBody')}
        </Txt>

        <View style={styles.pills}>
          {pills.map((p) => (
            <View key={p} style={[styles.pill, { backgroundColor: c.surface2, borderColor: c.border }]}>
              <Txt variant="caption" color={c.textSecondary}>{p}</Txt>
            </View>
          ))}
        </View>

        <AppButton label={t('notifyMe')} variant="secondary" disabled style={styles.notify} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Tokens.space.xl, gap: Tokens.space.md },
  iconTile: { width: 120, height: 120, borderRadius: Tokens.radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Tokens.space.sm },
  eyebrow: { letterSpacing: 2 },
  heading: { textAlign: 'center' },
  bodyText: { textAlign: 'center', lineHeight: 24, maxWidth: 420 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Tokens.space.sm, justifyContent: 'center', marginTop: Tokens.space.sm },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Tokens.radius.pill, borderWidth: StyleSheet.hairlineWidth },
  notify: { marginTop: Tokens.space.lg, alignSelf: 'stretch' },
});
