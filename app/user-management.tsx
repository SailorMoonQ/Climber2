import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import Svg, { Line, Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import DatabaseService from '@/services/database-service';
import { useUser } from '@/contexts/UserContext';
import { useTokens } from '@/hooks/use-tokens';
import { useI18n } from '@/i18n';
import { Tokens, hrZoneColor } from '@/constants/theme';
import {
  AppButton,
  Avatar,
  Card,
  Header,
  Metric,
  Txt,
} from '@/components/ui/primitives';
import UserListGrid from '@/components/user-list-grid';
import { User } from '@/interface/user.interface';
import { ExerciseRecord } from '@/interface/exercise-record.interface';

// ---------- helpers ----------------------------------------------------------

function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}`;
  return `${h}h ${m}m`;
}

// ---------- component --------------------------------------------------------

export default function UserManagementScreen() {
  const { c } = useTokens();
  const { t } = useI18n();
  const router = useRouter();
  const { selectedUser, setSelectedUser, currentUser, setCurrentUser } = useUser();

  const [users, setUsers] = useState<User[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- load users ---------------------------------------------------------

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      await DatabaseService.init();
      const userList = await DatabaseService.getAllUsers();
      setUsers(userList);

      if (userList.length > 0 && !selectedUser) {
        setSelectedUser(userList[0]);
      }
      if (userList.length > 0 && !currentUser) {
        setCurrentUser(userList[0]);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedUser, currentUser, setSelectedUser, setCurrentUser]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  useFocusEffect(
    useCallback(() => { void loadUsers(); }, [loadUsers]),
  );

  // ---- load records for selected user -------------------------------------

  useEffect(() => {
    if (!selectedUser) { setExerciseRecords([]); return; }
    DatabaseService.getExerciseRecordsByUserId(selectedUser.id)
      .then(setExerciseRecords)
      .catch((err) => {
        console.error('Failed to load exercise records:', err);
        setExerciseRecords([]);
      });
  }, [selectedUser]);

  // ---- handlers -----------------------------------------------------------

  const handleUserSelect = useCallback(async (user: User) => {
    setSelectedUser(user);
    try {
      const records = await DatabaseService.getExerciseRecordsByUserId(user.id);
      setExerciseRecords(records);
    } catch {
      setExerciseRecords([]);
    }
  }, [setSelectedUser]);

  const handleEditUser = useCallback((user: User) => {
    // @ts-ignore
    router.push('/user?id=' + user.id + '&mode=edit');
  }, [router]);

  const handleDeleteUser = useCallback(async (user: User) => {
    try {
      await DatabaseService.deleteUser(user.id);
      const updated = await DatabaseService.getAllUsers();
      setUsers(updated);

      if (selectedUser?.id === user.id) {
        if (updated.length > 0) {
          setSelectedUser(updated[0]);
          setCurrentUser(updated[0]);
        } else {
          setSelectedUser(null);
          setCurrentUser(null);
          setExerciseRecords([]);
        }
      } else if (currentUser?.id === user.id) {
        setCurrentUser(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      console.error('Delete user failed:', err);
      Alert.alert(t('deleteUser'), String(err));
    }
  }, [selectedUser, currentUser, setSelectedUser, setCurrentUser, t]);

  // ---- derived stats ------------------------------------------------------

  const totalMinutes = exerciseRecords.reduce((s, r) => s + r.duration, 0);
  const totalDistance = exerciseRecords.reduce((s, r) => s + r.distance, 0);
  const totalCalories = exerciseRecords.reduce((s, r) => s + r.calories, 0);
  const sessionCount = exerciseRecords.length;

  // ---- trend chart data ---------------------------------------------------

  // Use the most recent record's detailedData for the chart
  const chartData = exerciseRecords[0]?.detailedData ?? [];

  const SVG_W = 320;
  const SVG_H = 130;
  const PADDING = 16;

  function buildPolyline(
    data: { time: number; heartRate: number; speed: number }[],
    field: 'heartRate' | 'speed',
  ): string {
    if (data.length < 2) return '';
    const values = data.map((d) => d[field]);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const plotW = SVG_W - PADDING * 2;
    const plotH = SVG_H - PADDING * 2;
    return data
      .map((d, i) => {
        const x = PADDING + (i / (data.length - 1)) * plotW;
        const y = PADDING + plotH - ((d[field] - minV) / range) * plotH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  const hrPolyline = buildPolyline(chartData, 'heartRate');
  const speedPolyline = buildPolyline(chartData, 'speed');

  // ---- loading state ------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
          <Txt variant="body" color={c.textSecondary} style={{ marginTop: Tokens.space.md }}>
            {t('loading')}
          </Txt>
        </View>
      </SafeAreaView>
    );
  }

  // ---- render -------------------------------------------------------------

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      <Header
        title={t('userManagement')}
        right={
          <AppButton
            label={t('addUser')}
            icon="person-add-outline"
            variant="primary"
            // @ts-ignore
            onPress={() => router.push('/user?mode=add')}
            style={styles.addBtn}
          />
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { backgroundColor: c.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Patient grid ---- */}
        <UserListGrid
          users={users}
          onUserSelect={handleUserSelect}
          onUserEdit={handleEditUser}
          onUserDelete={handleDeleteUser}
        />

        {/* ---- Action buttons ---- */}
        {selectedUser && (
          <View style={styles.actionRow}>
            <AppButton
              label={t('assess')}
              icon="clipboard-outline"
              variant="primary"
              style={styles.actionBtn}
              onPress={() => router.push(`/exercise?id=${selectedUser.id}` as any)}
            />
            <AppButton
              label={t('train')}
              icon="fitness-outline"
              variant="secondary"
              style={styles.actionBtn}
              onPress={() => router.push(`/free-training?id=${selectedUser.id}` as any)}
            />
          </View>
        )}

        {/* ---- Stats summary ---- */}
        {selectedUser && (
          <>
            <View style={styles.statsRow}>
              {/* Total Time */}
              <Card style={styles.statCard} inset elevated={false}>
                <Txt variant="caption" color={c.textMuted}>{t('totalTime')}</Txt>
                <Metric value={formatDuration(totalMinutes)} size="metricSm" color={c.primary} />
                <Txt variant="caption" color={c.textSecondary}>
                  {totalMinutes >= 60 ? 'h m' : 'min'}
                </Txt>
              </Card>

              {/* Total Distance */}
              <Card style={styles.statCard} inset elevated={false}>
                <Txt variant="caption" color={c.textMuted}>{t('totalDistance')}</Txt>
                <Metric value={totalDistance.toFixed(1)} size="metricSm" color={c.primary} />
                <Txt variant="caption" color={c.textSecondary}>km</Txt>
              </Card>

              {/* Total Calories */}
              <Card style={styles.statCard} inset elevated={false}>
                <Txt variant="caption" color={c.textMuted}>{t('totalCalories')}</Txt>
                <Metric value={totalCalories} size="metricSm" color={c.primary} />
                <Txt variant="caption" color={c.textSecondary}>kcal</Txt>
              </Card>

              {/* Sessions */}
              <Card style={styles.statCard} inset elevated={false}>
                <Txt variant="caption" color={c.textMuted}>{t('sessions')}</Txt>
                <Metric value={sessionCount} size="metricSm" color={c.primary} />
                <Txt variant="caption" color={c.textSecondary}> </Txt>
              </Card>
            </View>

            {/* ---- Trend chart ---- */}
            {chartData.length >= 2 && (
              <Card style={styles.chartCard}>
                {/* Legend */}
                <View style={styles.legend}>
                  <Txt variant="subtitle" color={c.text} style={{ flex: 1 }}>
                    {t('trend')}
                  </Txt>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: c.danger }]} />
                    <Txt variant="caption" color={c.textSecondary}>{t('heartRate')}</Txt>
                  </View>
                  <View style={[styles.legendItem, { marginLeft: Tokens.space.md }]}>
                    <View style={[styles.legendDot, { backgroundColor: c.primary }]} />
                    <Txt variant="caption" color={c.textSecondary}>{t('speed')}</Txt>
                  </View>
                </View>

                {/* SVG chart */}
                <View style={{ marginTop: Tokens.space.sm }}>
                  <Svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map((frac) => {
                      const y = PADDING + (SVG_H - PADDING * 2) * frac;
                      return (
                        <Line
                          key={frac}
                          x1={PADDING}
                          y1={y}
                          x2={SVG_W - PADDING}
                          y2={y}
                          stroke={c.border}
                          strokeWidth={1}
                        />
                      );
                    })}
                    {/* Heart rate line */}
                    {hrPolyline ? (
                      <Polyline
                        points={hrPolyline}
                        fill="none"
                        stroke={c.danger}
                        strokeWidth={2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    ) : null}
                    {/* Speed line */}
                    {speedPolyline ? (
                      <Polyline
                        points={speedPolyline}
                        fill="none"
                        stroke={c.primary}
                        strokeWidth={2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    ) : null}
                  </Svg>
                </View>
              </Card>
            )}

            {/* ---- History list ---- */}
            <Txt variant="subtitle" color={c.text} style={styles.sectionTitle}>
              {t('duration')} / {t('distance')} / {t('heartRate')}
            </Txt>

            {exerciseRecords.length === 0 ? (
              /* Empty state */
              <Card
                style={[
                  styles.emptyCard,
                  { borderStyle: 'dashed', borderWidth: 1.5, borderColor: c.border },
                ]}
                elevated={false}
              >
                <Ionicons name="document-text-outline" size={36} color={c.textMuted} />
                <Txt variant="body" color={c.textMuted} style={{ marginTop: Tokens.space.sm }}>
                  {t('noRecords')}
                </Txt>
              </Card>
            ) : (
              exerciseRecords.map((record) => {
                const hrColor = hrZoneColor(record.heartRate.max, 150);
                return (
                  <Card key={record.id} style={styles.historyRow}>
                    {/* Left: type + date */}
                    <View style={styles.historyLeft}>
                      <Txt variant="label" color={c.text}>{record.type}</Txt>
                      <Txt variant="caption" color={c.textMuted} style={{ marginTop: 2 }}>
                        {record.date}
                      </Txt>
                    </View>

                    {/* Right: metrics */}
                    <View style={styles.historyRight}>
                      <View style={styles.metricChip}>
                        <Txt variant="caption" color={c.textMuted}>{t('duration')}</Txt>
                        <Metric value={record.duration} size="metricSm" />
                        <Txt variant="caption" color={c.textSecondary}>min</Txt>
                      </View>
                      <View style={styles.metricChip}>
                        <Txt variant="caption" color={c.textMuted}>{t('distance')}</Txt>
                        <Metric value={record.distance.toFixed(1)} size="metricSm" />
                        <Txt variant="caption" color={c.textSecondary}>km</Txt>
                      </View>
                      <View style={styles.metricChip}>
                        <Txt variant="caption" color={c.textMuted}>{t('max')} HR</Txt>
                        <Metric value={record.heartRate.max} size="metricSm" color={hrColor} />
                        <Txt variant="caption" color={c.textSecondary}>bpm</Txt>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </>
        )}

        {/* No patient selected */}
        {!selectedUser && (
          <Card style={styles.emptyCard} elevated={false}>
            <Ionicons name="person-outline" size={40} color={c.textMuted} />
            <Txt variant="body" color={c.textMuted} style={{ marginTop: Tokens.space.sm }}>
              {t('noPatient')}
            </Txt>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- styles -----------------------------------------------------------

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Tokens.space.base,
    paddingTop: Tokens.space.md,
    paddingBottom: Tokens.space.xl,
    gap: Tokens.space.md,
  },
  addBtn: {
    minHeight: 40,
    paddingHorizontal: Tokens.space.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Tokens.space.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Tokens.space.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Tokens.space.md,
    paddingHorizontal: Tokens.space.xs,
  },
  chartCard: {
    gap: Tokens.space.xs,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.space.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    marginTop: Tokens.space.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.space.md,
  },
  historyLeft: {
    flex: 1,
  },
  historyRight: {
    flexDirection: 'row',
    gap: Tokens.space.md,
    alignItems: 'flex-end',
  },
  metricChip: {
    alignItems: 'center',
    gap: 1,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Tokens.space.xl,
    gap: Tokens.space.sm,
  },
});
