import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import DatabaseService from '@/services/database-service';
import { User } from '@/interface/user.interface';
import { ForceService, ForceData } from '@/services/force-service';
import { KYTOHeartRateService } from '@/services/kyto-heartrate-service';
import { useTokens } from '@/hooks/use-tokens';
import { useI18n } from '@/i18n';
import { Tokens, hrZoneColor, hrZoneKey } from '@/constants/theme';
import {
  AlertBanner,
  AppButton,
  Avatar,
  Card,
  Header,
  Metric,
  Stepper,
  Txt,
} from '@/components/ui/primitives';
import { TargetSettingModal } from '@/components/ui/target-setting-modal';
import { PostureCard } from '@/components/ui/posture-card';

const TOTAL_TIME = 60;
const MAX_HR = 150;
const TARGET_HR: [number, number] = [100, 130];

// Distance is derived from the Force machine's leg-carriage position feed (cm).
const M_PER_CM = 0.01; // 1 cm of carriage travel = 0.01 m

export default function ExerciseScreen() {
  const { c } = useTokens();
  const { t } = useI18n();
  const { selectedUser } = useUser();
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = params.id || selectedUser?.id;

  const [user, setUser] = useState<User | null>(null);
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(TOTAL_TIME);
  const [leftResistance, setLeftResistance] = useState(5);
  const [rightResistance, setRightResistance] = useState(4);
  const [heartRate, setHeartRate] = useState(0);
  const [distance, setDistance] = useState(0);
  const [showTargets, setShowTargets] = useState(false);
  const [targets, setTargets] = useState({ duration: 300, distance: 500, calories: 500 });
  const [ring, setRing] = useState(280);

  // latest Force-machine leg position (cm), sampled once per second to accumulate
  // distance. prevSampleLowerPos is the baseline from the previous tick; null until
  // the first sample after the assessment starts.
  const lowerPosRef = useRef(0);
  const prevSampleLowerPosRef = useRef<number | null>(null);

  useEffect(() => {
    if (userId) DatabaseService.getUserById(userId).then((u) => u && setUser(u));
  }, [userId, selectedUser]);

  // real heart-rate sensor — connection managed by BluetoothProvider
  useEffect(() => {
    KYTOHeartRateService.setHeartRateCallback(setHeartRate);
  }, []);

  // real leg-carriage position via ForceService — connection managed by
  // BluetoothProvider, this screen only registers its callback.
  const handleForceData = useCallback((f: ForceData) => {
    lowerPosRef.current = f.lowerPosition;
  }, []);

  useEffect(() => {
    ForceService.setForceCallback(handleForceData);
  }, [handleForceData]);

  // countdown
  useEffect(() => {
    if (started && remaining > 0) {
      const timer = setTimeout(() => setRemaining((p) => p - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (remaining === 0) setStarted(false);
  }, [started, remaining]);

  // per-second distance sampling — accumulates leg-carriage travel from the real
  // Force-machine position feed while the assessment runs. Distance stays at 0 until
  // a Force machine is connected and moving.
  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      const pos = lowerPosRef.current;
      const prev = prevSampleLowerPosRef.current;
      prevSampleLowerPosRef.current = pos;
      if (prev === null) return; // first tick establishes the baseline
      setDistance((d) => d + Math.abs(pos - prev) * M_PER_CM);
    }, 1000);
    return () => clearInterval(interval);
  }, [started]);

  // reset distance when the assessment starts
  useEffect(() => {
    if (started) {
      setDistance(0);
      prevSampleLowerPosRef.current = null;
    }
  }, [started]);

  // send resistance
  useEffect(() => {
    void ForceService.sendResistanceData({
      upperLeft: leftResistance,
      lowerLeft: leftResistance,
      upperRight: rightResistance,
      lowerRight: rightResistance,
    });
  }, [leftResistance, rightResistance]);

  const hrColor = hrZoneColor(heartRate, MAX_HR);
  const hrAlert = heartRate > 0 && hrZoneKey(heartRate, MAX_HR) === 'max';

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  const onRingLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setRing(Math.min(w * 0.7, 360));
  };

  const stroke = 14;
  const r = (ring - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const progress = (remaining / TOTAL_TIME) * circ;

  const handleEnd = () => {
    setStarted(false);
    setRemaining(TOTAL_TIME);
    setDistance(0);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={t('dynamicAssessmentTitle')}
        right={
          user ? (
            <View style={styles.headerUser}>
              <Avatar name={user.name} size={32} />
              <Txt variant="caption">{user.name}</Txt>
            </View>
          ) : undefined
        }
      />

      <AlertBanner message={t('hrTooHigh')} visible={hrAlert} />

      <View style={styles.body}>
        <View style={styles.ringWrap} onLayout={onRingLayout}>
          <Svg width={ring} height={ring}>
            <Circle cx={ring / 2} cy={ring / 2} r={r} stroke={c.surface2} strokeWidth={stroke} fill="none" />
            <Circle
              cx={ring / 2}
              cy={ring / 2}
              r={r}
              stroke={hrAlert ? c.danger : c.primary}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={circ}
              strokeDashoffset={started ? circ - progress : circ}
              strokeLinecap="round"
              rotation={-90}
              origin={`${ring / 2}, ${ring / 2}`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Txt variant="caption" color={c.textSecondary}>{t('duration')}</Txt>
            <Metric value={fmt(remaining)} size="metricLg" color={hrAlert ? c.danger : c.text} />
            <Txt variant="caption" color={c.textMuted}>{t('of')} {fmt(TOTAL_TIME)}</Txt>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <Card style={[styles.flex1, hrAlert ? { borderColor: c.danger, borderWidth: 1.5 } : null]}>
            <Txt variant="caption" color={c.textSecondary}>{t('heartRate')}</Txt>
            <Metric value={heartRate || '--'} size="metricMd" color={hrColor} />
            <Txt variant="caption" color={c.textMuted}>
              {t('target')} {TARGET_HR[0]}–{TARGET_HR[1]} · {t('max')} {MAX_HR}
            </Txt>
          </Card>
          <Card style={styles.flex1}>
            <Txt variant="caption" color={c.textSecondary}>{t('distance')}</Txt>
            <Metric value={Math.round(distance)} size="metricMd" />
            <Txt variant="caption" color={c.textMuted}>m · {t('target')} {targets.distance}m</Txt>
          </Card>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.flex1}>
            <Stepper label={t('leftResistance')} value={leftResistance} min={0} max={10} onChange={setLeftResistance} />
          </View>
          <View style={styles.flex1}>
            <Stepper label={t('rightResistance')} value={rightResistance} min={0} max={10} onChange={setRightResistance} />
          </View>
        </View>

        <PostureCard />
      </View>

      <View style={[styles.controlBar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        {!started ? (
          <AppButton label={t('start')} icon="play" full onPress={() => setStarted(true)} />
        ) : (
          <>
            <AppButton label={t('setTargets')} variant="secondary" icon="options-outline" full onPress={() => setShowTargets(true)} />
            <AppButton label={t('endSession')} variant="danger" icon="stop" full onPress={handleEnd} />
          </>
        )}
      </View>

      <TargetSettingModal
        visible={showTargets}
        initialTargets={targets}
        showOnlyDistance
        onClose={(next) => {
          setShowTargets(false);
          if (next) setTargets(next);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerUser: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  body: { flex: 1, padding: Tokens.space.base, gap: Tokens.space.lg },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: Tokens.space.lg },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  metricsRow: { flexDirection: 'row', gap: Tokens.space.md },
  flex1: { flex: 1 },
  controlBar: {
    flexDirection: 'row',
    gap: Tokens.space.md,
    padding: Tokens.space.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
