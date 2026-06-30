import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  AppButton,
  Avatar,
  BottomSheet,
  Card,
  Header,
  SegmentedControl,
  Txt,
} from '@/components/ui/primitives';
import { useTokens } from '@/hooks/use-tokens';
import { Tokens } from '@/constants/theme';
import { useI18n } from '@/i18n';

import DatabaseService from '@/services/database-service';
import { User } from '@/interface/user.interface';
import { useUser } from '@/contexts/UserContext';

const EMPTY_FORM = {
  id: '',
  name: '',
  gender: '男' as string,
  age: 30,
  height: 170,
  weight: 65.0,
};

export default function DynamicAssessmentScreen() {
  const { c } = useTokens();
  const { t } = useI18n();
  const { setSelectedUser, setCurrentUser } = useUser();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);

  // sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // ---------------------------------------------------------------- data load
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      await DatabaseService.init();
      const userList = await DatabaseService.getAllUsers();
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers])
  );

  // ---------------------------------------------------------------- search filter
  useEffect(() => {
    if (searchQuery === '') {
      setFilteredUsers(users);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.id.includes(searchQuery) ||
            u.age.toString().includes(searchQuery)
        )
      );
    }
  }, [searchQuery, users]);

  // ---------------------------------------------------------------- helpers
  const updateForm = (field: keyof typeof form, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openAddSheet = () => {
    setEditingUser(null);
    setForm({ ...EMPTY_FORM });
    setSheetVisible(true);
  };

  const openEditSheet = (user: User) => {
    setEditingUser(user);
    setForm({
      id: user.id,
      name: user.name,
      gender: user.gender,
      age: user.age,
      height: user.height,
      weight: user.weight,
    });
    setSheetVisible(true);
  };

  // ---------------------------------------------------------------- select patient
  const handleUserSelect = useCallback(
    (user: User) => {
      setSelectedPatient(user);
      setSelectedUser(user);
      setCurrentUser(user);
    },
    [setSelectedUser, setCurrentUser]
  );

  // ---------------------------------------------------------------- save user
  const handleSaveUser = async () => {
    try {
      await DatabaseService.init();
      let userToSave: User;

      if (editingUser) {
        userToSave = {
          id: editingUser.id,
          name: form.name,
          gender: form.gender,
          age: form.age,
          height: form.height,
          weight: form.weight,
        };
        await DatabaseService.updateUser(userToSave);
      } else {
        const newId = form.id.trim() || 'A' + Math.floor(10000 + Math.random() * 90000);
        userToSave = {
          id: newId,
          name: form.name,
          gender: form.gender,
          age: form.age,
          height: form.height,
          weight: form.weight,
        };
        await DatabaseService.addUser(userToSave);
      }

      setSheetVisible(false);
      await loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  // ---------------------------------------------------------------- delete user
  const handleDeleteUser = (user: User) => {
    Alert.alert(t('delete'), t('deleteUserConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await DatabaseService.init();
            await DatabaseService.deleteUser(user.id);
            if (selectedPatient?.id === user.id) {
              setSelectedPatient(null);
              setSelectedUser(null);
              setCurrentUser(null);
            }
            await loadUsers();
          } catch (error) {
            console.error('Failed to delete user:', error);
          }
        },
      },
    ]);
  };

  // ---------------------------------------------------------------- start assessment
  const enterAssessment = async () => {
    try {
      let userToUse: User;

      if (selectedPatient) {
        userToUse = selectedPatient;
      } else {
        await DatabaseService.init();
        const newId = 'A' + Math.floor(10000 + Math.random() * 90000);
        userToUse = {
          id: newId,
          name: form.name || '临时用户',
          gender: form.gender,
          age: form.age,
          height: form.height,
          weight: form.weight,
        };
        await DatabaseService.addUser(userToUse);
      }

      setSelectedUser(userToUse);
      setCurrentUser(userToUse);
      // @ts-ignore
      router.push('/exercise?id=' + userToUse.id);
    } catch (error) {
      console.error('Failed to enter assessment:', error);
    }
  };

  // ---------------------------------------------------------------- render patient row
  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedPatient?.id === item.id;
    return (
      <TouchableOpacity
        onPress={() => handleUserSelect(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Tokens.space.md,
          paddingVertical: Tokens.space.sm,
          paddingHorizontal: Tokens.space.md,
          borderRadius: Tokens.radius.md,
          backgroundColor: isSelected ? c.primarySoft : 'transparent',
          marginBottom: Tokens.space.xs,
        }}
      >
        <Avatar name={item.name} size={36} filled={isSelected} />
        <View style={{ flex: 1 }}>
          <Txt variant="body" color={isSelected ? c.primaryStrong : c.text}>
            {item.name}
          </Txt>
          <Txt variant="caption" color={c.textMuted}>
            {item.id} · {item.age}{t('years')} · {item.gender}
          </Txt>
        </View>
        <TouchableOpacity
          onPress={() => openEditSheet(item)}
          style={{ padding: Tokens.space.xs }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="pencil-outline" size={18} color={c.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteUser(item)}
          style={{ padding: Tokens.space.xs }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={c.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
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
      <Header
        title={t('dynamicAssessment')}
        right={
          <TouchableOpacity
            onPress={openAddSheet}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Tokens.space.xs,
              paddingHorizontal: Tokens.space.md,
              paddingVertical: Tokens.space.sm,
              backgroundColor: c.primarySoft,
              borderRadius: Tokens.radius.pill,
            }}
          >
            <Ionicons name="person-add-outline" size={18} color={c.primary} />
            <Txt variant="caption" color={c.primary}>{t('add')}</Txt>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Tokens.space.base, gap: Tokens.space.base, paddingBottom: Tokens.space.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Patient picker ---- */}
        <Card>
          <Txt variant="label" color={c.textSecondary} style={{ marginBottom: Tokens.space.sm }}>
            {t('selectPatient')}
          </Txt>

          {/* Search */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: c.surface2,
              borderRadius: Tokens.radius.md,
              borderWidth: 1,
              borderColor: c.border,
              paddingHorizontal: Tokens.space.md,
              marginBottom: Tokens.space.sm,
              minHeight: 44,
            }}
          >
            <Ionicons name="search-outline" size={18} color={c.textMuted} style={{ marginRight: Tokens.space.sm }} />
            <TextInput
              style={{ flex: 1, color: c.text, fontSize: 16, paddingVertical: Tokens.space.sm }}
              placeholder={t('searchUserPlaceholder')}
              placeholderTextColor={c.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={c.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: Tokens.space.lg }}>
              <ActivityIndicator color={c.primary} />
              <Txt variant="caption" color={c.textMuted} style={{ marginTop: Tokens.space.sm }}>
                {t('loading')}
              </Txt>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: Tokens.space.lg }}>
              <Ionicons name="people-outline" size={36} color={c.textMuted} />
              <Txt variant="caption" color={c.textMuted} style={{ marginTop: Tokens.space.sm }}>
                {t('noPatient')}
              </Txt>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Card>

        {/* ---- Selected patient summary ---- */}
        {selectedPatient && (
          <Card inset>
            <Txt variant="label" color={c.textSecondary} style={{ marginBottom: Tokens.space.sm }}>
              {t('currentPatient')}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Tokens.space.md }}>
              <Avatar name={selectedPatient.name} size={48} filled />
              <View style={{ flex: 1, gap: Tokens.space.xs }}>
                <Txt variant="subtitle" color={c.text}>{selectedPatient.name}</Txt>
                <Txt variant="caption" color={c.textSecondary}>
                  {selectedPatient.id} · {selectedPatient.age}{t('years')} · {selectedPatient.gender}
                </Txt>
                <Txt variant="caption" color={c.textMuted}>
                  {selectedPatient.height} cm · {selectedPatient.weight} kg
                </Txt>
              </View>
            </View>
          </Card>
        )}

        {/* ---- Start button ---- */}
        <AppButton
          label={t('startAssessment')}
          variant="primary"
          icon="play-circle-outline"
          full
          onPress={enterAssessment}
        />
      </ScrollView>

      {/* ---- Add / Edit BottomSheet ---- */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={editingUser ? t('edit') : t('addUser')}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
          <View style={{ gap: Tokens.space.base }}>
            {/* ID (only for new users) */}
            {!editingUser && (
              <View style={{ gap: Tokens.space.sm }}>
                <Txt variant="label" color={c.textSecondary}>ID</Txt>
                <TextInput
                  style={inputStyle}
                  value={form.id}
                  onChangeText={(v) => updateForm('id', v)}
                  placeholder="自动生成"
                  placeholderTextColor={c.textMuted}
                />
              </View>
            )}

            {/* Name */}
            <View style={{ gap: Tokens.space.sm }}>
              <Txt variant="label" color={c.textSecondary}>{t('name')}</Txt>
              <TextInput
                style={inputStyle}
                value={form.name}
                onChangeText={(v) => updateForm('name', v)}
                placeholderTextColor={c.textMuted}
              />
            </View>

            {/* Gender */}
            <View style={{ gap: Tokens.space.sm }}>
              <Txt variant="label" color={c.textSecondary}>{t('gender')}</Txt>
              <SegmentedControl
                options={[
                  { key: '男', label: t('male') },
                  { key: '女', label: t('female') },
                ]}
                value={form.gender}
                onChange={(v) => updateForm('gender', v)}
              />
            </View>

            {/* Age */}
            <View style={{ gap: Tokens.space.sm }}>
              <Txt variant="label" color={c.textSecondary}>{t('age')}</Txt>
              <TextInput
                style={inputStyle}
                value={form.age.toString()}
                onChangeText={(v) => updateForm('age', parseInt(v) || 0)}
                keyboardType="numeric"
                placeholderTextColor={c.textMuted}
              />
            </View>

            {/* Height */}
            <View style={{ gap: Tokens.space.sm }}>
              <Txt variant="label" color={c.textSecondary}>{t('height')} (cm)</Txt>
              <TextInput
                style={inputStyle}
                value={form.height.toString()}
                onChangeText={(v) => updateForm('height', parseFloat(v) || 0)}
                keyboardType="numeric"
                placeholderTextColor={c.textMuted}
              />
            </View>

            {/* Weight */}
            <View style={{ gap: Tokens.space.sm }}>
              <Txt variant="label" color={c.textSecondary}>{t('weight')} (kg)</Txt>
              <TextInput
                style={inputStyle}
                value={form.weight.toString()}
                onChangeText={(v) => updateForm('weight', parseFloat(v) || 0)}
                keyboardType="numeric"
                placeholderTextColor={c.textMuted}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: Tokens.space.md, marginTop: Tokens.space.sm }}>
              <AppButton
                label={t('cancel')}
                variant="secondary"
                full
                onPress={() => setSheetVisible(false)}
              />
              <AppButton
                label={t('save')}
                variant="primary"
                full
                onPress={handleSaveUser}
              />
            </View>
          </View>
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
