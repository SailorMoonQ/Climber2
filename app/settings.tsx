import React, { useContext, useEffect, useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import {
  AppButton,
  Card,
  Header,
  SegmentedControl,
  Txt,
} from '@/components/ui/primitives';
import { useTokens } from '@/hooks/use-tokens';
import { Tokens } from '@/constants/theme';
import { useI18n } from '@/i18n';

import { OrganizationContext } from '@/contexts/OrganizationContext';
import { getAllBluetoothDevices, saveBluetoothDevice } from '@/utils/database';

type LockOption = 'lock3' | 'lock10' | 'lockNever';
type VersionOption = 'standalone' | 'networked';
type LangOption = 'cn' | 'en';

export default function SettingsScreen() {
  const { c } = useTokens();
  const { t, lang, setLang } = useI18n();
  const organizationContext = useContext(OrganizationContext);

  const [organizationNameInput, setOrganizationNameInput] = useState('');
  const [selectedLock, setSelectedLock] = useState<LockOption>('lock3');
  const [versionMode, setVersionMode] = useState<VersionOption>('standalone');

  // Bluetooth
  const [heartRateDeviceId, setHeartRateDeviceId] = useState('');
  const [postureDeviceId, setPostureDeviceId] = useState('');
  const [forceDeviceId, setForceDeviceId] = useState('');

  // ---- Load org name from context
  useEffect(() => {
    if (organizationContext?.organizationName) {
      setOrganizationNameInput(organizationContext.organizationName);
    }
  }, [organizationContext?.organizationName]);

  // ---- Load saved BT devices
  useEffect(() => {
    const loadBluetoothSettings = async () => {
      try {
        const devices = await getAllBluetoothDevices();
        devices.forEach((device) => {
          switch (device.deviceType) {
            case 'heartRate':
              setHeartRateDeviceId(device.deviceId);
              break;
            case 'posture':
              setPostureDeviceId(device.deviceId);
              break;
            case 'force':
              setForceDeviceId(device.deviceId);
              break;
          }
        });
      } catch (error) {
        console.error('Error loading bluetooth settings:', error);
      }
    };
    loadBluetoothSettings();
  }, []);

  // ---- Save org name
  const handleSaveOrganizationName = async () => {
    try {
      if (!organizationNameInput.trim()) {
        Alert.alert(t('organizationName'), t('organizationName'));
        return;
      }
      if (organizationContext) {
        await organizationContext.setOrganizationName(organizationNameInput.trim());
        Alert.alert(t('saveSuccess'), '');
      }
    } catch (error) {
      console.error('Error saving organization name:', error);
      Alert.alert(t('saveFailed'), '');
    }
  };

  // ---- Save BT devices
  const handleSaveBluetoothSettings = async () => {
    try {
      if (heartRateDeviceId.trim()) {
        await saveBluetoothDevice('heartRate', heartRateDeviceId.trim(), t('heartRateDevice'));
      }
      if (postureDeviceId.trim()) {
        await saveBluetoothDevice('posture', postureDeviceId.trim(), t('postureDevice'));
      }
      if (forceDeviceId.trim()) {
        await saveBluetoothDevice('force', forceDeviceId.trim(), t('forceDevice'));
      }
      Alert.alert(t('saveSuccess'), '');
    } catch (error) {
      console.error('Error saving bluetooth settings:', error);
      Alert.alert(t('saveFailed'), '');
    }
  };

  const inputStyle = {
    backgroundColor: c.surface2,
    color: c.text,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: Tokens.radius.md,
    paddingHorizontal: Tokens.space.md,
    paddingVertical: Tokens.space.sm,
    minHeight: 48,
    fontSize: 16,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title={t('settings')} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: Tokens.space.base,
          gap: Tokens.space.base,
          paddingBottom: Tokens.space.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Organization ---- */}
        <Card>
          <Txt variant="label" color={c.textSecondary} style={{ marginBottom: Tokens.space.md }}>
            {t('organization')}
          </Txt>

          <View style={{ gap: Tokens.space.sm, marginBottom: Tokens.space.base }}>
            <Txt variant="caption" color={c.textSecondary}>{t('organizationName')}</Txt>
            <TextInput
              style={inputStyle}
              placeholder={t('organizationName')}
              placeholderTextColor={c.textMuted}
              value={organizationNameInput}
              onChangeText={setOrganizationNameInput}
            />
          </View>

          <AppButton
            label={t('save')}
            variant="primary"
            icon="checkmark-outline"
            onPress={handleSaveOrganizationName}
          />
        </Card>

        {/* ---- General ---- */}
        <Card>
          <Txt variant="label" color={c.textSecondary} style={{ marginBottom: Tokens.space.md }}>
            {t('general')}
          </Txt>

          {/* Auto-lock */}
          <View style={{ gap: Tokens.space.sm, marginBottom: Tokens.space.base }}>
            <Txt variant="caption" color={c.textSecondary}>{t('autoLock')}</Txt>
            <SegmentedControl<LockOption>
              options={[
                { key: 'lock3', label: t('lock3') },
                { key: 'lock10', label: t('lock10') },
                { key: 'lockNever', label: t('lockNever') },
              ]}
              value={selectedLock}
              onChange={setSelectedLock}
            />
          </View>

          {/* Version mode */}
          <View style={{ gap: Tokens.space.sm, marginBottom: Tokens.space.base }}>
            <Txt variant="caption" color={c.textSecondary}>{t('versionMode')}</Txt>
            <SegmentedControl<VersionOption>
              options={[
                { key: 'standalone', label: t('standalone') },
                { key: 'networked', label: t('networked') },
              ]}
              value={versionMode}
              onChange={setVersionMode}
            />
          </View>

          {/* Language */}
          <View style={{ gap: Tokens.space.sm }}>
            <Txt variant="caption" color={c.textSecondary}>{t('language')}</Txt>
            <SegmentedControl<LangOption>
              options={[
                { key: 'cn', label: t('langCN') },
                { key: 'en', label: t('langEN') },
              ]}
              value={lang}
              onChange={setLang}
            />
          </View>
        </Card>

        {/* ---- Bluetooth Devices ---- */}
        <Card>
          <Txt variant="label" color={c.textSecondary} style={{ marginBottom: Tokens.space.md }}>
            {t('bluetoothDevices')}
          </Txt>

          <View style={{ gap: Tokens.space.base, marginBottom: Tokens.space.base }}>
            {/* Heart-rate */}
            <View style={{ gap: Tokens.space.sm }}>
              <Txt variant="caption" color={c.textSecondary}>{t('heartRateDevice')}</Txt>
              <TextInput
                style={inputStyle}
                placeholder={t('heartRateDevice')}
                placeholderTextColor={c.textMuted}
                value={heartRateDeviceId}
                onChangeText={setHeartRateDeviceId}
              />
            </View>

            {/* Posture */}
            <View style={{ gap: Tokens.space.sm }}>
              <Txt variant="caption" color={c.textSecondary}>{t('postureDevice')}</Txt>
              <TextInput
                style={inputStyle}
                placeholder={t('postureDevice')}
                placeholderTextColor={c.textMuted}
                value={postureDeviceId}
                onChangeText={setPostureDeviceId}
              />
            </View>

            {/* Force */}
            <View style={{ gap: Tokens.space.sm }}>
              <Txt variant="caption" color={c.textSecondary}>{t('forceDevice')}</Txt>
              <TextInput
                style={inputStyle}
                placeholder={t('forceDevice')}
                placeholderTextColor={c.textMuted}
                value={forceDeviceId}
                onChangeText={setForceDeviceId}
              />
            </View>
          </View>

          <AppButton
            label={t('save')}
            variant="primary"
            icon="bluetooth-outline"
            onPress={handleSaveBluetoothSettings}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
