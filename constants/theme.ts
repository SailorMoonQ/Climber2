/**
 * Climber Rehab — central design tokens.
 *
 * This file REPLACES the ad-hoc hardcoded colors scattered across the app
 * (#FF6B6B, #4ECDC4, #FF7F50, #FF6B35, #F8E7E1, #E8E8E8, etc.).
 * Import `Colors`, `Tokens`, `Elevation`, `hrZoneColor`, `Fonts` everywhere
 * instead of literals.
 *
 * Light + dark are full peers — never hardcode a white background or black text.
 */

import { Platform } from 'react-native';

export type ThemeName = 'light' | 'dark';

// ---- Semantic color tokens, per theme -------------------------------------
export const Colors = {
  light: {
    // surfaces
    background: '#EEF3F4',
    surface: '#FFFFFF',
    surface2: '#F1F6F7',
    border: '#E2E9EA',

    // text
    text: '#16282B',
    textSecondary: '#5D6E71',
    textMuted: '#93A3A6',

    // brand
    tint: '#2F8F9D',
    primary: '#2F8F9D',
    primaryStrong: '#237885',
    primarySoft: '#DBEDEF',
    onPrimary: '#FFFFFF',

    // status (semantic)
    success: '#3F9B6E',
    successSoft: '#E6F2EC',
    warning: '#BF8A1A',
    warningSoft: '#F6EDD6',
    danger: '#D8553F',
    dangerSoft: '#F7E2DC',

    // legacy keys kept for navigation/tab APIs
    icon: '#5D6E71',
    tabIconDefault: '#5D6E71',
    tabIconSelected: '#2F8F9D',
  },
  dark: {
    background: '#0E1718',
    surface: '#15201F',
    surface2: '#1C2A2B',
    border: '#28393B',

    text: '#E7EEF0',
    textSecondary: '#9FB2B5',
    textMuted: '#6F8487',

    tint: '#4DB8C6',
    primary: '#4DB8C6',
    primaryStrong: '#6FC7D2',
    primarySoft: '#143438',
    onPrimary: '#0E1718',

    success: '#54B88A',
    successSoft: '#16322A',
    warning: '#E0B052',
    warningSoft: '#33291A',
    danger: '#E8674F',
    dangerSoft: '#3A201B',

    icon: '#9FB2B5',
    tabIconDefault: '#9FB2B5',
    tabIconSelected: '#4DB8C6',
  },
};

export type ColorTokens = typeof Colors.light;

// ---- Heart-rate zone ramp (theme-independent) -----------------------------
// 5 stops. `pct` = heartRate / maxHeartRate.
export const HeartRateZones = {
  resting: '#6B8FB5', // < 0.50
  light: '#3F9B6E', // 0.50–0.60
  moderate: '#BF8A1A', // 0.60–0.70  (typical target band)
  vigorous: '#E0773A', // 0.70–0.85
  max: '#D8553F', // >= 0.85  -> show over-limit alert
};

export function hrZoneColor(heartRate: number, maxHeartRate: number): string {
  const pct = maxHeartRate > 0 ? heartRate / maxHeartRate : 0;
  if (pct >= 0.85) return HeartRateZones.max;
  if (pct >= 0.7) return HeartRateZones.vigorous;
  if (pct >= 0.6) return HeartRateZones.moderate;
  if (pct >= 0.5) return HeartRateZones.light;
  return HeartRateZones.resting;
}

// zone key + label key, used for the "中等强度/Moderate" pill
export function hrZoneKey(
  heartRate: number,
  maxHeartRate: number
): keyof typeof HeartRateZones {
  const pct = maxHeartRate > 0 ? heartRate / maxHeartRate : 0;
  if (pct >= 0.85) return 'max';
  if (pct >= 0.7) return 'vigorous';
  if (pct >= 0.6) return 'moderate';
  if (pct >= 0.5) return 'light';
  return 'resting';
}

// ---- Non-color tokens ------------------------------------------------------
export const Tokens = {
  space: { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 14, lg: 18, xl: 22, pill: 999 },
  touch: { min: 48, stepper: 52, control: 60 },
  type: {
    display: { size: 40, weight: '700' as const },
    title: { size: 28, weight: '700' as const },
    subtitle: { size: 20, weight: '600' as const },
    body: { size: 16, weight: '400' as const },
    caption: { size: 13, weight: '500' as const },
    metricLg: { size: 64, weight: '600' as const },
    metricMd: { size: 40, weight: '600' as const },
    metricSm: { size: 28, weight: '600' as const },
  },
};

// Card / sheet elevation. Spread into a style.
export const Elevation = {
  card: {
    shadowColor: '#143237',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 12,
  },
};

// ---- Fonts -----------------------------------------------------------------
// Uses platform-safe system families so the app builds with no extra font
// packages. `mono` + fontVariant:['tabular-nums'] for live numeric readouts so
// digits don't jump. To adopt IBM Plex / Noto Sans SC later, load them via
// expo-font and swap the values below — nothing else needs to change.
export const Fonts = Platform.select({
  ios: { sans: 'System', cjk: 'System', mono: 'Menlo' },
  android: { sans: 'sans-serif', cjk: 'sans-serif', mono: 'monospace' },
  default: { sans: 'System', cjk: 'System', mono: 'monospace' },
  web: {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    cjk: "'Noto Sans SC', system-ui, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
})!;
