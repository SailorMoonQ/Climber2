import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { User } from '@/interface/user.interface';
import { useUser } from '@/contexts/UserContext';
import { useTokens } from '@/hooks/use-tokens';
import { useI18n } from '@/i18n';
import { Tokens } from '@/constants/theme';
import { Avatar, Txt } from '@/components/ui/primitives';

export interface UserListGridProps {
  users: User[];
  onUserSelect: (user: User) => void;
  onUserEdit: (user: User) => void;
  onUserDelete: (user: User) => void;
}

export default function UserListGrid({
  users,
  onUserSelect,
  onUserEdit,
  onUserDelete,
}: UserListGridProps) {
  const { c } = useTokens();
  const { t } = useI18n();
  const router = useRouter();
  const { selectedUser, setSelectedUser } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);

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
            u.age.toString().includes(searchQuery),
        ),
      );
    }
  }, [searchQuery, users]);

  const handleSelect = (user: User) => {
    setSelectedUser(user);
    onUserSelect(user);
  };

  const handleDelete = (user: User) => {
    Alert.alert(
      t('deleteUser'),
      t('deleteUserConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => onUserDelete(user),
        },
      ],
    );
  };

  return (
    <View>
      {/* Search bar */}
      <View style={[styles.searchRow, { backgroundColor: c.surface2, borderRadius: Tokens.radius.md }]}>
        <Ionicons name="search" size={18} color={c.textMuted} style={{ marginRight: Tokens.space.sm }} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          placeholder={t('searchUserPlaceholder')}
          placeholderTextColor={c.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Patient cards — flexWrap grid */}
      <View style={styles.grid}>
        {filteredUsers.map((user) => {
          const isSelected = selectedUser?.id === user.id;
          return (
            <TouchableOpacity
              key={user.id}
              activeOpacity={0.8}
              onPress={() => handleSelect(user)}
              style={[
                styles.card,
                {
                  backgroundColor: isSelected ? c.primary : c.surface,
                  borderColor: isSelected ? c.primary : c.border,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderRadius: Tokens.radius.md,
                },
              ]}
            >
              {/* Edit badge — absolute within card */}
              <TouchableOpacity
                style={[styles.editBadge, { backgroundColor: isSelected ? c.onPrimary : c.surface2 }]}
                onPress={() => onUserEdit(user)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons
                  name="create-outline"
                  size={13}
                  color={isSelected ? c.primary : c.textSecondary}
                />
              </TouchableOpacity>

              {/* Delete badge */}
              <TouchableOpacity
                style={[styles.deleteBadge, { backgroundColor: isSelected ? c.onPrimary : c.surface2 }]}
                onPress={() => handleDelete(user)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons
                  name="trash-outline"
                  size={13}
                  color={isSelected ? c.danger : c.textMuted}
                />
              </TouchableOpacity>

              <Avatar name={user.name} size={44} filled={isSelected} />

              <Txt
                variant="label"
                color={isSelected ? c.onPrimary : c.text}
                style={styles.cardName}
                numberOfLines={1}
              >
                {user.name}
              </Txt>
              <Txt
                variant="caption"
                color={isSelected ? c.onPrimary : c.textSecondary}
                style={styles.cardMeta}
                numberOfLines={1}
              >
                {user.gender} · {user.age}{t('years')}
              </Txt>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Tokens.space.md,
    minHeight: 48,
    marginBottom: Tokens.space.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    minHeight: 48,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.space.sm,
  },
  card: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Tokens.space.md,
    paddingHorizontal: Tokens.space.sm,
    position: 'relative',
    minWidth: 72,
  },
  cardName: {
    marginTop: Tokens.space.xs,
    textAlign: 'center',
  },
  cardMeta: {
    marginTop: 2,
    textAlign: 'center',
  },
  editBadge: {
    position: 'absolute',
    top: 6,
    right: 24,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBadge: {
    position: 'absolute',
    top: 6,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
