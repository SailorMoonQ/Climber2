import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView, Modal } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/interface/user.interface';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useNavigation, useRouter } from "expo-router";


interface UserListGridProps {
  users: User[];
  onUserSelect: (user: User) => void;
  onUserEdit: (user: User) => void;
  onUserDelete: (user: User) => void;
}

export default function UserListGrid({
                                       users,
                                       onUserSelect,
                                       onUserEdit,
                                       onUserDelete
                                     }: UserListGridProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  // 搜索功能
  useEffect(() => {
    if (searchQuery === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.includes(searchQuery) ||
        user.age.toString().includes(searchQuery)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // 更新选中用户
  useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0]);
    }
  }, [selectedUser, users]);

  const renderUserItem = ({item}: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        setSelectedUser(item);
        onUserSelect(item);
      }}
    >
      <ThemedView style={styles.userAvatar}>
        <Ionicons name="person" size={40} color={tintColor}/>
      </ThemedView>
      <ThemedText style={styles.userName}>{item.name}</ThemedText>
      <ThemedText style={styles.userDetails}>
        {item.gender} | {item.age}岁
      </ThemedText>
      <TouchableOpacity
        style={styles.editButton}
        onPress={(e) => {
          e.stopPropagation(); // 防止触发父元素的点击事件
          onUserEdit(item);
        }}
      >
        <Ionicons name="create-outline" size={16} color={tintColor}/>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const addNewUser = () => {
    router.push('/user?mode=add')
  };

  return (
    <ThemedView style={styles.container}>
      {/* 顶部搜索条和新增按钮 */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={tintColor}/>
          <TextInput
            style={styles.searchInput}
            placeholder="输入姓名/ID/年龄搜索"
            placeholderTextColor={Colors[colorScheme ?? 'light'].text}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </ThemedView>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addNewUser()}
        >
          <ThemedText style={styles.addButtonText}>新增</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView>
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.userGrid}
          numColumns={4}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* 底部按钮 */}
      <ThemedView style={styles.bottomButtons}>
        <TouchableOpacity
          style={[styles.bottomButton, styles.deleteButton]}
          onPress={() => setIsDeleteModalVisible(true)}
        >
          <Ionicons name="trash-outline" size={24} color="#fff"/>
          <ThemedText style={styles.bottomButtonText}>删除用户</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.assessmentButton]}
          onPress={() => {
            if (selectedUser) {
              router.push(`/exercise?id=${selectedUser.id}`);
            }
          }}
        >
          <Ionicons name="clipboard-outline" size={24} color="#fff"/>
          <ThemedText style={styles.bottomButtonText}>评估</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.trainingButton]}
        >
          <Ionicons name="fitness-outline" size={24} color="#fff"/>
          <ThemedText style={styles.bottomButtonText}>训练</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.gameButton]}
        >
          <Ionicons name="game-controller-outline" size={24} color="#fff"/>
          <ThemedText style={styles.bottomButtonText}>情景游戏</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* 删除确认模态框 */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>删除用户</ThemedText>
            <ThemedText style={styles.modalMessage}>要删除用户吗？</ThemedText>
            <ThemedView style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000"/>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.destructiveButton]}
                onPress={() => {
                  setIsDeleteModalVisible(false);
                  if (selectedUser) {
                    onUserDelete(selectedUser);
                  }
                }}
              >
                <Ionicons name="checkmark" size={24} color="#fff"/>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userGrid: {
    marginTop: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  userItem: {
    width: '23%',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 15,
    alignItems: 'center',
    position: 'relative',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    width: '90%',
  },
  searchInput: {
    height: 40,
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 3,
    textAlign: 'center',
  },
  userDetails: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  editButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 3,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 10,
  },
  bottomButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 10,
    width: '23%',
  },
  bottomButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  assessmentButton: {
    backgroundColor: '#007AFF',
  },
  trainingButton: {
    backgroundColor: '#34C759',
  },
  gameButton: {
    backgroundColor: '#AF52DE',
  },
  // 模态框样式
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: 'black',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  destructiveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});