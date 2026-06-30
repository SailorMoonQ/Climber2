import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import DatabaseService from '@/services/database-service';
import { User } from '@/interface/user.interface';
import { ForceService, ForceData } from '@/services/force-service';
import { KYTOHeartRateService } from '@/services/kyto-heartrate-service';
import { useTokens } from '@/hooks/use-tokens';
import { useI18n, StringKey } from '@/i18n';
import { Tokens, hrZoneColor, hrZoneKey } from '@/constants/theme';
import {
  AlertBanner,
  AppButton,
  Avatar,
  Card,
  ConnectionChip,
  ForceTile,
  Header,
  HrZoneRamp,
  Metric,
  ProgressBar,
  Stepper,
  Txt,
} from '@/components/ui/primitives';
import { TargetSettingModal } from '@/components/ui/target-setting-modal';
import { PostureCard } from '@/components/ui/posture-card';
import { AccessoryModal } from '@/components/ui/accessory-modal';

const MAX_HR = 150;
const TARGET_HR: [number, number] = [100, 130];

// Speed/distance/calories are derived from the Force machine's leg-carriage position
// feed (reported in cm). Tune these to the machine's real spec if needed.
const M_PER_CM = 0.01; // 1 cm of carriage travel = 0.01 m
const CALORIE_EFFICIENCY = 0.25; // mechanical→metabolic efficiency (~25%)
const JOULES_PER_KCAL = 4184;

export default function FreeTrainingScreen() {
  const { c } = useTokens();
  const { t } = useI18n();
  const { selectedUser } = useUser();

  const params = useLocalSearchParams<{ id?: string }>();
  const userId = params.id || selectedUser?.id;
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (userId) {
      DatabaseService.getUserById(userId).then((u) => u && setUser(u));
    }
  }, [userId, selectedUser]);

  const [trainingStarted, setTrainingStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [leftResistance, setLeftResistance] = useState(5);
  const [rightResistance, setRightResistance] = useState(5);

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showAccessory, setShowAccessory] = useState(false);
  const [selectedMode, setSelectedMode] = useState('有氧');
  const [trainingTargets, setTrainingTargets] = useState({
    duration: 300,
    distance: 100,
    calories: 500,
  });

  // live data
  const [currentDuration, setCurrentDuration] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [currentCalories, setCurrentCalories] = useState(0);
  const [currentHeartRate, setCurrentHeartRate] = useState(0);
  // latest HR kept in a ref so the 1Hz history sampler records a fresh value
  // without re-creating its interval on every BLE update
  const currentHeartRateRef = useRef(0);
  const [detailedData, setDetailedData] = useState<{ time: number; heartRate: number; speed: number }[]>([]);

  // force (real sensor via ForceService)
  const [leftHandForce, setLeftHandForce] = useState(0);
  const [rightHandForce, setRightHandForce] = useState(0);
  const [leftLegForce, setLeftLegForce] = useState(0);
  const [rightLegForce, setRightLegForce] = useState(0);

  // latest Force-machine leg position (cm) + force (N), sampled once per second
  // to derive speed/distance/calories. prevSampleLowerPos is the baseline from the
  // previous tick; null until the first sample after training starts.
  const lowerPosRef = useRef(0);
  const lowerForceMagRef = useRef(0);
  const prevSampleLowerPosRef = useRef<number | null>(null);

  // duration timer
  useEffect(() => {
    let interval: any;
    if (trainingStarted && !isPaused) {
      interval = setInterval(() => setCurrentDuration((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [trainingStarted, isPaused]);

  // per-second sampling — derives speed/distance/calories from the real Force-machine
  // position/force feed (refs below); heart rate comes from the real KYTO feed.
  // Values stay at 0 until a Force machine is connected and moving.
  useEffect(() => {
    let interval: any;
    if (trainingStarted && !isPaused) {
      interval = setInterval(() => {
        const pos = lowerPosRef.current;
        const prev = prevSampleLowerPosRef.current;
        prevSampleLowerPosRef.current = pos;
        // leg-carriage travel since the last sample (cm → m); one sample == 1s, so
        // distance-per-second is also the speed in m/s.
        const speed = prev === null ? 0 : Math.abs(pos - prev) * M_PER_CM;
        // calories from mechanical work (force × distance), adjusted for muscle efficiency
        const deltaCalories = (lowerForceMagRef.current * speed) / JOULES_PER_KCAL / CALORIE_EFFICIENCY;
        setCurrentSpeed(speed);
        setAverageSpeed((prevAvg) => (prevAvg * currentDuration + speed) / (currentDuration + 1));
        setCurrentDistance((d) => d + speed);
        setCurrentCalories((cal) => cal + deltaCalories);
        setDetailedData((prevData) => [
          ...prevData,
          { time: currentDuration + 1, heartRate: currentHeartRateRef.current, speed },
        ]);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [trainingStarted, isPaused, currentDuration]);

  useEffect(() => {
    if (trainingStarted) {
      setDetailedData([]);
      prevSampleLowerPosRef.current = null; // reset distance baseline
    }
  }, [trainingStarted]);

  // real force data
  const handleForceData = useCallback((f: ForceData) => {
    setLeftHandForce(f.upperLeftForce || 0);
    setRightHandForce(f.upperRightForce || 0);
    setLeftLegForce(f.lowerLeftForce || 0);
    setRightLegForce(f.lowerRightForce || 0);
    // feed the speed/distance/calories sampler
    lowerPosRef.current = f.lowerPosition;
    lowerForceMagRef.current = Math.abs(f.lowerForce);
  }, []);

  // (Re)assert this screen's force callback. The accessory modal connects the Force
  // machine but registers its own no-op callback, so reclaim the feed when it closes.
  useEffect(() => {
    ForceService.setForceCallback(handleForceData);
  }, [handleForceData, showAccessory]);

  // real heart rate via BLE — connection is managed by BluetoothProvider,
  // this screen only registers its callback.
  useEffect(() => {
    KYTOHeartRateService.setHeartRateCallback((hr) => {
      currentHeartRateRef.current = hr;
      setCurrentHeartRate(hr);
    });
  }, []);

  // send resistance to machine whenever it changes
  useEffect(() => {
    void ForceService.sendResistanceData({
      upperLeft: leftResistance,
      lowerLeft: leftResistance,
      upperRight: rightResistance,
      lowerRight: rightResistance,
    });
  }, [leftResistance, rightResistance]);

  const handleStop = useCallback(async () => {
    if (userId && currentDuration > 0) {
      const maxHeartRate = detailedData.length
        ? Math.max(...detailedData.map((d) => d.heartRate))
        : currentHeartRate;
      const maxSpeed = detailedData.length
        ? Math.max(...detailedData.map((d) => d.speed))
        : currentSpeed;
      const record = {
        id: Date.now().toString(),
        userId,
        date: new Date().toISOString().split('T')[0],
        type: t('freeTraining'),
        duration: currentDuration,
        distance: currentDistance,
        calories: Math.round(currentCalories),
        averageSpeed,
        maxSpeed,
        heartRate: {
          avg: Math.round(
            detailedData.length
              ? detailedData.reduce((s, d) => s + d.heartRate, 0) / detailedData.length
              : currentHeartRate
          ),
          max: maxHeartRate,
        },
        trainingTargets,
        detailedData,
      };
      await DatabaseService.addExerciseRecord(record);
    }
    setTrainingStarted(false);
    setIsPaused(false);
    setCurrentDuration(0);
    setCurrentDistance(0);
    setCurrentCalories(0);
    setAverageSpeed(0);
  }, [userId, currentDuration, currentDistance, currentCalories, averageSpeed, currentHeartRate, currentSpeed, trainingTargets, detailedData, t]);

  const hrColor = hrZoneColor(currentHeartRate, MAX_HR);
  const hrZone = hrZoneKey(currentHeartRate, MAX_HR);
  const hrAlert = currentHeartRate > 0 && hrZone === 'max';

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={t('freeTraining')}
        right={<ConnectionChip status={trainingStarted ? 'connected' : 'disconnected'} />}
      />

      {/* patient row */}
      <View style={styles.patientRow}>
        <Avatar name={user?.name} size={40} />
        <View style={{ flex: 1 }}>
          <Txt variant="subtitle">{user?.name ?? t('noPatient')}</Txt>
          {user ? (
            <Txt variant="caption" color={c.textSecondary}>
              {user.gender} · {user.age}{t('years')} · {user.height}cm · {user.weight}kg
            </Txt>
          ) : null}
        </View>
      </View>

      <AlertBanner message={t('hrTooHigh')} visible={hrAlert} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* primary metrics */}
        <View style={styles.primaryRow}>
          <Card style={styles.flex1}>
            <Txt variant="caption" color={c.textSecondary}>{t('duration')}</Txt>
            <Metric value={fmtTime(currentDuration)} size="metricMd" />
            <Txt variant="caption" color={c.textMuted}>{t('target')} {fmtTime(trainingTargets.duration)}</Txt>
          </Card>

          <Card style={[styles.flex125, { borderColor: c.warning, borderWidth: 1.5 }]}>
            <View style={styles.cardTopRow}>
              <Txt variant="caption" color={c.textSecondary}>{t('heartRate')}</Txt>
              <View style={[styles.zonePill, { backgroundColor: c.warningSoft }]}>
                <Txt variant="caption" color={c.warning}>{t(`zone_${hrZone}` as StringKey)}</Txt>
              </View>
            </View>
            <Metric value={currentHeartRate || '--'} size="metricMd" color={hrColor} />
            <View style={{ marginVertical: 6 }}>
              <HrZoneRamp activeKey={hrZone} />
            </View>
            <Txt variant="caption" color={c.textMuted}>
              {t('target')} {TARGET_HR[0]}–{TARGET_HR[1]} · {t('max')} {MAX_HR}
            </Txt>
          </Card>

          <Card style={styles.flex1}>
            <Txt variant="caption" color={c.textSecondary}>{t('distance')}</Txt>
            <Metric value={`${Math.round(currentDistance)}`} size="metricMd" />
            <Txt variant="caption" color={c.textMuted}>m · {t('target')} {trainingTargets.distance}m</Txt>
            <View style={{ marginTop: 6 }}>
              <ProgressBar
                value={trainingTargets.distance ? currentDistance / trainingTargets.distance : 0}
                color={c.success}
              />
            </View>
          </Card>
        </View>

        {/* secondary metrics */}
        <View style={styles.secondaryRow}>
          <Card style={styles.flex1}>
            <View style={styles.cardTopRow}>
              <Txt variant="caption" color={c.textSecondary}>{t('calories')}</Txt>
              <Metric value={Math.round(currentCalories)} size="metricSm" />
            </View>
            <Txt variant="caption" color={c.textMuted}>kcal · {t('target')} {trainingTargets.calories}</Txt>
          </Card>
          <Card style={styles.flex1}>
            <View style={styles.cardTopRow}>
              <Txt variant="caption" color={c.textSecondary}>{t('speed')}</Txt>
              <Metric value={currentSpeed.toFixed(2)} size="metricSm" />
            </View>
            <Txt variant="caption" color={c.textMuted}>m/s · {t('avg')} {averageSpeed.toFixed(2)}</Txt>
          </Card>
        </View>

        {/* force — anatomical 2x2 */}
        <Card style={{ gap: Tokens.space.md }}>
          <Txt variant="label" color={c.textSecondary}>{t('forceUnit')}</Txt>
          <View style={styles.forceGrid}>
            <View style={styles.forceCol}><ForceTile label={t('leftHand')} value={leftHandForce} /></View>
            <View style={styles.forceCol}><ForceTile label={t('rightHand')} value={rightHandForce} /></View>
          </View>
          <View style={styles.forceGrid}>
            <View style={styles.forceCol}><ForceTile label={t('leftLeg')} value={leftLegForce} /></View>
            <View style={styles.forceCol}><ForceTile label={t('rightLeg')} value={rightLegForce} /></View>
          </View>
        </Card>

        {/* posture (live Wit Motion) */}
        <PostureCard />

        {/* resistance */}
        <View style={styles.secondaryRow}>
          <View style={styles.flex1}>
            <Stepper label={t('leftResistance')} value={leftResistance} min={0} max={10} onChange={setLeftResistance} />
          </View>
          <View style={styles.flex1}>
            <Stepper label={t('rightResistance')} value={rightResistance} min={0} max={10} onChange={setRightResistance} />
          </View>
        </View>

        <AppButton
          label={t('setTargets')}
          variant="secondary"
          icon="options-outline"
          onPress={() => setShowTargetModal(true)}
        />
        <AppButton
          label={t('bluetoothDevices')}
          variant="secondary"
          icon="bluetooth-outline"
          onPress={() => setShowAccessory(true)}
        />
      </ScrollView>

      {/* control bar */}
      <View style={[styles.controlBar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        {!trainingStarted ? (
          <AppButton label={t('start')} icon="play" full onPress={() => setTrainingStarted(true)} />
        ) : (
          <>
            <AppButton
              label={isPaused ? t('resume') : t('pause')}
              variant="warningOutline"
              icon={isPaused ? 'play' : 'pause'}
              full
              onPress={() => setIsPaused((p) => !p)}
            />
            <AppButton label={t('end')} variant="danger" icon="stop" full onPress={handleStop} />
          </>
        )}
      </View>

      <TargetSettingModal
        visible={showTargetModal}
        initialTargets={trainingTargets}
        onClose={(targets) => {
          setShowTargetModal(false);
          if (targets) setTrainingTargets(targets);
        }}
      />
      <AccessoryModal
        visible={showAccessory}
        onClose={() => setShowAccessory(false)}
        onModeSelect={setSelectedMode}
        selectedMode={selectedMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.space.md,
    paddingHorizontal: Tokens.space.base,
    paddingVertical: Tokens.space.md,
  },
  body: { padding: Tokens.space.base, gap: Tokens.space.md, paddingBottom: Tokens.space.xl },
  primaryRow: { flexDirection: 'row', gap: Tokens.space.md },
  secondaryRow: { flexDirection: 'row', gap: Tokens.space.md },
  flex1: { flex: 1 },
  flex125: { flex: 1.25 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zonePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Tokens.radius.pill },
  forceGrid: { flexDirection: 'row', gap: Tokens.space.md },
  forceCol: { flex: 1 },
  controlBar: {
    flexDirection: 'row',
    gap: Tokens.space.md,
    padding: Tokens.space.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
