import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTokens } from '@/hooks/use-tokens';
import { useI18n } from '@/i18n';
import { Tokens } from '@/constants/theme';
import { Card, Txt } from '@/components/ui/primitives';
import { WitMotionService } from '@/services/wit-motion-service';
import { PoseData } from '@/services/pose';

// Live posture (pitch / roll / yaw) from the Wit Motion sensor. Connection is owned by
// BluetoothProvider — this card only registers the pose callback.
export const PostureCard: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const { c } = useTokens();
  const { lang } = useI18n();
  const [pose, setPose] = useState<PoseData | null>(null);

  useEffect(() => {
    WitMotionService.setPoseCallback(setPose);
  }, []);

  const angle = (v?: number) => (v === undefined ? '--' : `${v.toFixed(1)}°`);
  const axes: { key: keyof PoseData; label: string }[] = [
    { key: 'pitch', label: 'Pitch' },
    { key: 'roll', label: 'Roll' },
    { key: 'yaw', label: 'Yaw' },
  ];

  return (
    <Card style={style}>
      <Txt variant="label" color={c.textSecondary}>{lang === 'cn' ? '体姿' : 'Posture'}</Txt>
      <View style={styles.row}>
        {axes.map((a) => (
          <View key={a.key} style={styles.item}>
            <Txt variant="caption" color={c.textMuted}>{a.label}</Txt>
            <Txt variant="subtitle" color={c.text}>{angle(pose?.[a.key] as number | undefined)}</Txt>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginTop: Tokens.space.sm },
  item: { flex: 1, alignItems: 'center', gap: 2 },
});
