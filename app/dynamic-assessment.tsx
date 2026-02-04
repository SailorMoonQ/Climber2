import { ActivityIndicator, FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import DatabaseService from '@/services/database-service';
import { useNavigation, useRouter } from "expo-router";
import { User } from "@/interface/user.interface";
import { useUser } from '@/contexts/UserContext';

export default function DynamicAssessmentScreen() {
  const navigation = useNavigation();
  navigation.setOptions({
    title: '动态评估'
  });

  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { setSelectedUser, setCurrentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // 新用户表单状态
  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    gender: '男',
    age: 30,
    height: 170,
    weight: 65.0
  });

  // 加载用户数据的函数
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

  // 初始化加载用户数据
  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

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

  // 选择用户
  const handleUserSelect = useCallback((user: User) => {
    setSelectedUser(user);
    setCurrentUser(user);
    // 填充表单
    setNewUser({
      id: user.id,
      name: user.name,
      gender: user.gender,
      age: user.age,
      height: user.height,
      weight: user.weight
    });
  }, [setSelectedUser, setCurrentUser]);

  // 更新新用户表单字段
  const updateNewUserField = (field: keyof typeof newUser, value: any) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 进入评估页面
  const enterAssessment = async () => {
    try {
      // 如果是新用户，保存到数据库
      let userToUse = { ...newUser };
      
      if (!newUser.id.trim()) {
        // 生成唯一ID
        const newId = 'A' + Math.floor(10000 + Math.random() * 90000);
        userToUse.id = newId;
      }

      // 保存用户
      await DatabaseService.init();
      await DatabaseService.addUser(userToUse);
      
      // 设置当前用户
      setSelectedUser(userToUse);
      setCurrentUser(userToUse);
      
      // 导航到评估页面
      // @ts-ignore
      router.push('/exercise?id=' + userToUse.id);
    } catch (error) {
      console.error('Failed to enter assessment:', error);
    }
  };

  // 快速开始
  const quickStart = async () => {
    // 使用默认用户信息快速进入评估
    try {
      // 生成临时用户ID
      const tempId = 'TEMP' + Date.now().toString().slice(-5);
      const tempUser: User = {
        id: tempId,
        name: '临时用户',
        gender: newUser.gender,
        age: newUser.age,
        height: newUser.height,
        weight: newUser.weight
      };
      
      // 设置当前用户
      setSelectedUser(tempUser);
      setCurrentUser(tempUser);
      
      // 导航到评估页面
      // @ts-ignore
      router.push('/exercise?id=' + tempUser.id);
    } catch (error) {
      console.error('Failed to quick start:', error);
    }
  };

  // 渲染用户列表项
  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
    >
      <ThemedText style={styles.userId}>{item.id}</ThemedText>
      <ThemedText style={styles.userName}>{item.name}</ThemedText>
      <ThemedText style={styles.userGender}>{item.gender}</ThemedText>
      <ThemedText style={styles.userAge}>{item.age}岁</ThemedText>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.loadingText}>加载中...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* 顶部搜索栏 */}
      <ThemedView style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={tintColor} />
        <TextInput
          style={styles.searchInput}
          placeholder="输入姓名/ID/年龄搜索"
          placeholderTextColor={Colors[colorScheme ?? 'light'].text}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </ThemedView>

      {/* 用户列表 */}
      <ThemedView style={styles.userListContainer}>
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.userList}
        />
      </ThemedView>

      {/* 新建用户表单 */}
      <ScrollView style={styles.formContainer}>
        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>ID</ThemedText>
          <TextInput
            style={styles.textInput}
            value={newUser.id}
            onChangeText={(text) => updateNewUserField('id', text)}
            placeholder="输入用户ID"
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>姓名</ThemedText>
          <TextInput
            style={styles.textInput}
            value={newUser.name}
            onChangeText={(text) => updateNewUserField('name', text)}
            placeholder="输入姓名"
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>性别</ThemedText>
          <ThemedView style={styles.genderButtons}>
            <TouchableOpacity
              style={[styles.genderButton, newUser.gender === '男' && styles.genderButtonActive]}
              onPress={() => updateNewUserField('gender', '男')}
            >
              <Ionicons name="male" size={24} color={newUser.gender === '男' ? '#fff' : tintColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, newUser.gender === '女' && styles.genderButtonActive]}
              onPress={() => updateNewUserField('gender', '女')}
            >
              <Ionicons name="female" size={24} color={newUser.gender === '女' ? '#fff' : tintColor} />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>年龄</ThemedText>
          <TextInput
            style={styles.textInput}
            value={newUser.age.toString()}
            onChangeText={(text) => updateNewUserField('age', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="输入年龄"
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>身高</ThemedText>
          <ThemedView style={styles.inputWithUnit}>
            <TextInput
              style={styles.textInput}
              value={newUser.height.toString()}
              onChangeText={(text) => updateNewUserField('height', parseFloat(text) || 0)}
              keyboardType="numeric"
              placeholder="输入身高"
            />
            <ThemedText style={styles.unitText}>cm</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>体重</ThemedText>
          <ThemedView style={styles.inputWithUnit}>
            <TextInput
              style={styles.textInput}
              value={newUser.weight.toString()}
              onChangeText={(text) => updateNewUserField('weight', parseFloat(text) || 0)}
              keyboardType="numeric"
              placeholder="输入体重"
            />
            <ThemedText style={styles.unitText}>kg</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* 对号按钮 */}
        <TouchableOpacity
          style={styles.checkButton}
          onPress={enterAssessment}
        >
          <Ionicons name="checkmark" size={32} color="#fff" />
        </TouchableOpacity>

        {/* 快速开始按钮 */}
        <TouchableOpacity
          style={styles.quickStartButton}
          onPress={quickStart}
        >
          <ThemedText style={styles.quickStartText}>快速开始</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
  },
  userListContainer: {
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
    padding: 10,
  },
  userList: {
    paddingBottom: 10,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 5,
  },
  userId: {
    overflow: "hidden",
    width: 80,
    fontSize: 14,
    fontWeight: '600',
    textOverflow: 'ellipsis',
  },
  userName: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
  },
  userGender: {
    width: 40,
    fontSize: 14,
    textAlign: 'center',
  },
  userAge: {
    width: 60,
    fontSize: 14,
    textAlign: 'right',
  },
  formContainer: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  genderButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#007AFF',
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  unitText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#666',
  },
  checkButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  quickStartButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  quickStartText: {
    fontSize: 16,
    fontWeight: '600',
  },
});