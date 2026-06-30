import React, { useContext } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTokens } from '@/hooks/use-tokens';
import { useI18n, StringKey } from '@/i18n';
import { Tokens, Elevation } from '@/constants/theme';
import { Avatar, Card, ConnectionChip, Txt } from '@/components/ui/primitives';
import { OrganizationContext } from '@/contexts/OrganizationContext';
import { useUser } from '@/contexts/UserContext';

type Feature = {
  titleKey: StringKey;
  helpKey: StringKey;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  primary?: boolean;
  comingSoon?: boolean;
};

const FEATURES: Feature[] = [
  { titleKey: 'freeTraining', helpKey: 'freeTrainingHelp', icon: 'fitness', href: '/free-training', primary: true },
  { titleKey: 'dynamicAssessment', helpKey: 'dynamicAssessmentHelp', icon: 'speedometer', href: '/dynamic-assessment' },
  { titleKey: 'userManagement', helpKey: 'userManagementHelp', icon: 'people', href: '/user-management' },
  { titleKey: 'scenarioGame', helpKey: 'scenarioGameHelp', icon: 'game-controller', href: '/scenario-game', comingSoon: true },
];

export default function HomeScreen() {
  const { c } = useTokens();
  const { t } = useI18n();
  const router = useRouter();
  const org = useContext(OrganizationContext);
  const { selectedUser } = useUser();
  const orgName = org?.organizationName || t('systemName');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      {/* top bar */}
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={[styles.logoMark, { backgroundColor: c.primary }]}>
            <Ionicons name="trending-up" size={22} color={c.onPrimary} />
          </View>
          <View>
            <Txt variant="subtitle">{orgName}</Txt>
            <Txt variant="caption" color={c.textSecondary}>{t('appName')}</Txt>
          </View>
        </View>
        <View style={styles.topRight}>
          <ConnectionChip status="disconnected" />
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={[styles.gear, { backgroundColor: c.surface2 }]}
          >
            <Ionicons name="settings-outline" size={22} color={c.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* patient context */}
        <Card style={styles.patientCard}>
          <Avatar name={selectedUser?.name} size={48} />
          <View style={{ flex: 1 }}>
            <Txt variant="caption" color={c.textSecondary}>{t('currentPatient')}</Txt>
            <Txt variant="subtitle">{selectedUser?.name ?? t('noPatient')}</Txt>
            {selectedUser ? (
              <Txt variant="caption" color={c.textMuted}>
                {selectedUser.gender} · {selectedUser.age}{t('years')}
              </Txt>
            ) : null}
          </View>
          <TouchableOpacity style={styles.switch} onPress={() => router.push('/user-management')}>
            <Txt variant="caption" color={c.primary}>{t('switch')} ›</Txt>
          </TouchableOpacity>
        </Card>

        {/* feature grid */}
        <View style={styles.grid}>
          {FEATURES.map((f) => {
            const onPress = () => router.push(f.href as any);
            if (f.primary) {
              return (
                <TouchableOpacity
                  key={f.titleKey}
                  activeOpacity={0.9}
                  onPress={onPress}
                  style={[styles.cell, { backgroundColor: c.primary }, Elevation.card]}
                >
                  <View style={[styles.overlayCircle, { backgroundColor: c.onPrimary }]} />
                  <Txt variant="caption" color={c.onPrimary} style={{ opacity: 0.85, letterSpacing: 1 }}>
                    {t('primary')}
                  </Txt>
                  <Ionicons name={f.icon} size={40} color={c.onPrimary} style={{ marginVertical: 10 }} />
                  <Txt variant="subtitle" color={c.onPrimary}>{t(f.titleKey)}</Txt>
                  <Txt variant="caption" color={c.onPrimary} style={{ opacity: 0.85 }}>{t(f.helpKey)}</Txt>
                </TouchableOpacity>
              );
            }
            if (f.comingSoon) {
              return (
                <TouchableOpacity
                  key={f.titleKey}
                  activeOpacity={0.9}
                  onPress={onPress}
                  style={[styles.cell, { backgroundColor: c.surface2, borderColor: c.border, borderWidth: 1, borderStyle: 'dashed' }]}
                >
                  <View style={[styles.iconTile, { backgroundColor: c.surface }]}>
                    <Ionicons name={f.icon} size={26} color={c.textMuted} />
                  </View>
                  <View style={[styles.csPill, { backgroundColor: c.surface }]}>
                    <Txt variant="caption" color={c.textMuted}>{t('comingSoon')}</Txt>
                  </View>
                  <Txt variant="subtitle" color={c.textMuted}>{t(f.titleKey)}</Txt>
                  <Txt variant="caption" color={c.textMuted}>{t(f.helpKey)}</Txt>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={f.titleKey}
                activeOpacity={0.9}
                onPress={onPress}
                style={[styles.cell, { backgroundColor: c.surface, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth }, Elevation.card]}
              >
                <View style={[styles.iconTile, { backgroundColor: c.primarySoft }]}>
                  <Ionicons name={f.icon} size={26} color={c.primary} />
                </View>
                <Txt variant="subtitle">{t(f.titleKey)}</Txt>
                <Txt variant="caption" color={c.textSecondary}>{t(f.helpKey)}</Txt>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Txt variant="caption" color={c.textMuted}>{t('appName')} · v1.0.0</Txt>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Tokens.space.lg,
    paddingVertical: Tokens.space.base,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Tokens.space.md },
  logoMark: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: Tokens.space.md },
  gear: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  body: { padding: Tokens.space.lg, gap: Tokens.space.lg },
  patientCard: { flexDirection: 'row', alignItems: 'center', gap: Tokens.space.md },
  switch: { paddingHorizontal: Tokens.space.sm, paddingVertical: Tokens.space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Tokens.space.base },
  cell: {
    width: '47.5%',
    flexGrow: 1,
    minHeight: 150,
    borderRadius: Tokens.radius.lg,
    padding: Tokens.space.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlayCircle: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.12,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: Tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Tokens.space.md,
  },
  csPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Tokens.radius.pill,
    marginBottom: Tokens.space.sm,
  },
  footer: { alignItems: 'center', paddingVertical: Tokens.space.lg, opacity: 0.7 },
});
