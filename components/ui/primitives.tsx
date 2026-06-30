import React, { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Elevation, Fonts, HeartRateZones, Tokens } from '@/constants/theme';
import { useTokens } from '@/hooks/use-tokens';
import { useI18n, StringKey } from '@/i18n';

/* ---------------------------------------------------------------- Text ---- */
type TxtVariant = keyof typeof Tokens.type | 'label';
export function Txt({
  variant = 'body',
  color,
  mono,
  style,
  ...rest
}: TextProps & {
  variant?: TxtVariant;
  color?: string;
  mono?: boolean;
}) {
  const { c } = useTokens();
  const spec =
    variant === 'label'
      ? { size: 13, weight: '600' as const }
      : Tokens.type[variant];
  return (
    <Text
      style={[
        {
          color: color ?? c.text,
          fontSize: spec.size,
          fontWeight: spec.weight,
          fontFamily: mono ? Fonts.mono : Fonts.sans,
        },
        mono ? styles.tabular : null,
        style,
      ]}
      {...rest}
    />
  );
}

/** Live numeric readout: mono + tabular figures so digits don't jump. */
export function Metric({
  value,
  size = 'metricMd',
  color,
  style,
}: {
  value: string | number;
  size?: 'metricLg' | 'metricMd' | 'metricSm';
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  const { c } = useTokens();
  return (
    <Text
      style={[
        {
          color: color ?? c.text,
          fontSize: Tokens.type[size].size,
          fontWeight: Tokens.type[size].weight,
          fontFamily: Fonts.mono,
        },
        styles.tabular,
        style,
      ]}
    >
      {value}
    </Text>
  );
}

/* --------------------------------------------------------------- Card ----- */
export function Card({
  children,
  style,
  inset,
  elevated = true,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  inset?: boolean;
  elevated?: boolean;
}) {
  const { c } = useTokens();
  return (
    <View
      style={[
        {
          backgroundColor: inset ? c.surface2 : c.surface,
          borderRadius: Tokens.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.border,
          padding: Tokens.space.base,
        },
        elevated && !inset ? Elevation.card : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* -------------------------------------------------------------- Header ---- */
export function Header({
  title,
  right,
  onBack,
}: {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const { c } = useTokens();
  const router = useRouter();
  return (
    <View
      style={[
        styles.header,
        { backgroundColor: c.surface, borderBottomColor: c.border },
      ]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onBack ?? (() => router.back())}
        style={[styles.backBtn, { backgroundColor: c.surface2 }]}
      >
        <Ionicons name="chevron-back" size={24} color={c.text} />
      </TouchableOpacity>
      <Txt variant="subtitle" style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Txt>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

/* -------------------------------------------------------------- Button ---- */
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'warningOutline';
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  full,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTokens();
  let bg = c.primary;
  let fg = c.onPrimary;
  let border: string | undefined;
  if (variant === 'secondary') {
    bg = c.surface2;
    fg = c.text;
  } else if (variant === 'danger') {
    bg = c.danger;
    fg = '#FFFFFF';
  } else if (variant === 'warningOutline') {
    bg = 'transparent';
    fg = c.warning;
    border = c.warning;
  }
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border ?? 'transparent',
          borderWidth: border ? 1.5 : 0,
          opacity: disabled ? 0.5 : 1,
          flex: full ? 1 : undefined,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={22} color={fg} style={{ marginRight: 8 }} /> : null}
      <Txt variant="subtitle" color={fg}>
        {label}
      </Txt>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------- Stepper ---- */
export function Stepper({
  label,
  value,
  min = 0,
  max = 10,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const { c } = useTokens();
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <Card inset style={styles.stepperCard} elevated={false}>
      <Txt variant="caption" color={c.textSecondary} style={{ marginBottom: Tokens.space.sm }}>
        {label}
      </Txt>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          onPress={dec}
          style={[styles.stepCircle, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
        >
          <Ionicons name="remove" size={26} color={c.primary} />
        </TouchableOpacity>
        <Metric value={value} size="metricSm" />
        <TouchableOpacity onPress={inc} style={[styles.stepCircle, { backgroundColor: c.primary }]}>
          <Ionicons name="add" size={26} color={c.onPrimary} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

/* ------------------------------------------------------ ConnectionChip ---- */
export type ConnStatus = 'connected' | 'connecting' | 'disconnected' | 'notPaired';
export function ConnectionChip({ status }: { status: ConnStatus }) {
  const { c } = useTokens();
  const { t } = useI18n();
  const map: Record<ConnStatus, { dot: string; bg: string; fg: string; key: StringKey }> = {
    connected: { dot: c.success, bg: c.successSoft, fg: c.success, key: 'connected' },
    connecting: { dot: c.warning, bg: c.warningSoft, fg: c.warning, key: 'connecting' },
    disconnected: { dot: c.textMuted, bg: c.surface2, fg: c.textSecondary, key: 'disconnected' },
    notPaired: { dot: c.textMuted, bg: c.surface2, fg: c.textMuted, key: 'notPaired' },
  };
  const s = map[status];
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.dot }]} />
      <Txt variant="caption" color={s.fg}>
        {t(s.key)}
      </Txt>
    </View>
  );
}

/* ----------------------------------------------------- SegmentedControl --- */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const { c } = useTokens();
  return (
    <View style={[styles.segment, { backgroundColor: c.surface2 }]}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.segmentItem,
              active && { backgroundColor: c.primary },
            ]}
          >
            <Txt variant="caption" color={active ? c.onPrimary : c.textSecondary}>
              {opt.label}
            </Txt>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* --------------------------------------------------------- ProgressBar ---- */
export function ProgressBar({
  value,
  color,
  height = 8,
}: {
  value: number; // 0..1
  color?: string;
  height?: number;
}) {
  const { c } = useTokens();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: c.surface2, overflow: 'hidden' }}>
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          borderRadius: height,
          backgroundColor: color ?? c.primary,
        }}
      />
    </View>
  );
}

/* ----------------------------------------------------------- ForceTile ---- */
export function ForceTile({
  label,
  value,
  max = 40,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const { c } = useTokens();
  const v = Math.max(0, Math.min(value, max));
  return (
    <View style={[styles.forceTile, { backgroundColor: c.surface2 }]}>
      <View style={styles.forceTileTop}>
        <Txt variant="caption" color={c.textSecondary}>
          {label}
        </Txt>
        <Metric value={v.toFixed(0)} size="metricSm" />
      </View>
      <ProgressBar value={v / max} />
    </View>
  );
}

/* -------------------------------------------------------- HrZoneRamp ------ */
const ZONE_ORDER: (keyof typeof HeartRateZones)[] = [
  'resting',
  'light',
  'moderate',
  'vigorous',
  'max',
];
export function HrZoneRamp({ activeKey }: { activeKey: keyof typeof HeartRateZones }) {
  const { c } = useTokens();
  const activeIdx = ZONE_ORDER.indexOf(activeKey);
  return (
    <View style={styles.rampRow}>
      {ZONE_ORDER.map((k, i) => (
        <View
          key={k}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: i <= activeIdx ? HeartRateZones[k] : c.surface2,
          }}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------ Avatar ------ */
export function Avatar({
  name,
  size = 44,
  filled,
}: {
  name?: string | null;
  size?: number;
  filled?: boolean;
}) {
  const { c } = useTokens();
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: filled ? c.onPrimary : c.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt variant="subtitle" color={filled ? c.primary : c.primary}>
        {initial}
      </Txt>
    </View>
  );
}

/* -------------------------------------------------------- AlertBanner ----- */
export function AlertBanner({ message, visible }: { message: string; visible: boolean }) {
  const { c } = useTokens();
  if (!visible) return null;
  return (
    <View style={[styles.alert, { backgroundColor: c.danger }]}>
      <Ionicons name="warning" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
      <Txt variant="subtitle" color="#FFFFFF" style={{ flexShrink: 1 }}>
        {message}
      </Txt>
    </View>
  );
}

/* -------------------------------------------------------- BottomSheet ----- */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}) {
  const { c } = useTokens();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: c.surface }, Elevation.sheet]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
          {title ? (
            <Txt variant="title" style={{ marginBottom: Tokens.space.base }}>
              {title}
            </Txt>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ------------------------------------------------------------- styles ----- */
const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Tokens.space.base,
    paddingVertical: Tokens.space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Tokens.space.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Tokens.space.sm },
  button: {
    minHeight: Tokens.touch.control,
    borderRadius: Tokens.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.space.lg,
  },
  stepperCard: { alignItems: 'center' },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  stepCircle: {
    width: Tokens.touch.stepper,
    height: Tokens.touch.stepper,
    borderRadius: Tokens.touch.stepper / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Tokens.space.md,
    paddingVertical: 6,
    borderRadius: Tokens.radius.pill,
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  segment: {
    flexDirection: 'row',
    borderRadius: Tokens.radius.md,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Tokens.radius.sm,
    alignItems: 'center',
  },
  forceTile: {
    borderRadius: Tokens.radius.md,
    padding: Tokens.space.md,
    gap: Tokens.space.sm,
  },
  forceTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rampRow: { flexDirection: 'row', gap: 4 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Tokens.space.md,
    paddingHorizontal: Tokens.space.base,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Tokens.radius.xl,
    borderTopRightRadius: Tokens.radius.xl,
    padding: Tokens.space.lg,
    paddingBottom: Tokens.space.xl,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    marginBottom: Tokens.space.base,
  },
});
