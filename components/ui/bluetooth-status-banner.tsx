import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTokens } from '@/hooks/use-tokens';
import { useI18n } from '@/i18n';
import { Tokens, Elevation } from '@/constants/theme';
import { useBluetooth, BleDeviceKey, BleStatus } from '@/context/bluetooth-provider';

const META: Record<BleDeviceKey, { icon: keyof typeof Ionicons.glyphMap; cn: string; en: string }> = {
  force: { icon: 'barbell', cn: '力量', en: 'Force' },
  heartRate: { icon: 'heart', cn: '心率', en: 'HR' },
  pose: { icon: 'body', cn: '姿态', en: 'Pose' },
};

// Floating pill shown only while one or more BLE devices are not connected. Each
// device chip is tinted by status (green/amber/red); tap anywhere to retry now.
export const BluetoothStatusBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { c } = useTokens();
  const { lang } = useI18n();
  const { devices, connectedCount, total, retry } = useBluetooth();

  // Show only while something is actively pending — ignore intentionally-disabled devices.
  const pending = devices.some((d) => d.status === 'connecting' || d.status === 'disconnected');
  if (!pending) return null;

  const tone = (s: BleStatus) =>
    s === 'connected'
      ? { fg: c.success, bg: c.successSoft }
      : s === 'connecting'
        ? { fg: c.warning, bg: c.warningSoft }
        : s === 'disabled'
          ? { fg: c.textMuted, bg: c.surface2 }
          : { fg: c.danger, bg: c.dangerSoft };

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
      <Pressable
        onPress={retry}
        android_ripple={{ color: c.border }}
        style={[styles.pill, { backgroundColor: c.surface, borderColor: c.border }, Elevation.card]}
      >
        <View style={[styles.badge, { backgroundColor: c.primarySoft }]}>
          <Ionicons name="bluetooth" size={14} color={c.primary} />
          <Text style={[styles.count, { color: c.primary }]}>{`${connectedCount}/${total}`}</Text>
        </View>

        {devices.map((d) => {
          const t = tone(d.status);
          const m = META[d.key];
          return (
            <View key={d.key} style={[styles.chip, { backgroundColor: t.bg }]}>
              {d.status === 'connecting' ? (
                <ActivityIndicator size="small" color={t.fg} style={styles.spinner} />
              ) : (
                <Ionicons name={m.icon} size={13} color={t.fg} />
              )}
              <Text style={[styles.label, { color: t.fg }]}>{lang === 'cn' ? m.cn : m.en}</Text>
            </View>
          );
        })}

        <Ionicons name="refresh" size={15} color={c.textSecondary} style={styles.refresh} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.space.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Tokens.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '94%',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Tokens.radius.pill,
  },
  count: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: Tokens.radius.pill,
  },
  label: { fontSize: 12, fontWeight: '600' },
  spinner: { width: 13, height: 13, transform: [{ scale: 0.62 }] },
  refresh: { marginLeft: 2 },
});
