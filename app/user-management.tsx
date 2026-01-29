import { ActivityIndicator, Alert, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import DatabaseService from '@/services/database-service';
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import UserListGrid from '@/components/user-list-grid';
import { User } from "@/interface/user.interface";
import { ExerciseRecord } from '@/interface/exercise-record.interface';
import { useUser } from '@/contexts/UserContext';

export default function UserManagementScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { selectedUser, setSelectedUser, currentUser, setCurrentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({title: '用户管理/运动数据'});
  }, [navigation]);

  // 加载用户数据的函数
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      await DatabaseService.init();
      const userList = await DatabaseService.getAllUsers();
      setUsers(userList);
      
      // 如果当前没有选中用户，且用户列表不为空，则设置第一个用户为选中用户
      if (userList.length > 0 && !selectedUser) {
        setSelectedUser(userList[0]);
      }
      
      // 如果当前没有当前用户，且用户列表不为空，则设置第一个用户为当前用户
      if (userList.length > 0 && !currentUser) {
        setCurrentUser(userList[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedUser, currentUser, setSelectedUser, setCurrentUser]);

  // 初始化数据库和加载用户数据
  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // 监听页面焦点变化，当从新增/编辑用户页面返回时刷新数据
  useFocusEffect(
    useCallback(() => {
      // 当页面获得焦点时刷新用户数据
      void loadUsers();
    }, [loadUsers])
  );

  // 加载选中用户的运动记录
  useEffect(() => {
    const loadExerciseRecords = async () => {
      if (selectedUser) {
        try {
          const records = await DatabaseService.getExerciseRecordsByUserId(selectedUser.id);
          setExerciseRecords(records);
        } catch (error) {
          console.error('Failed to load exercise records:', error);
          setExerciseRecords([]);
        }
      }
    };

    void loadExerciseRecords();
  }, [selectedUser]);

  const handleUserSelect = useCallback((user: User) => {
    setSelectedUser(user);
    // 加载选中用户的运动记录
    const loadExerciseRecords = async () => {
      try {
        const records = await DatabaseService.getExerciseRecordsByUserId(user.id);
        setExerciseRecords(records);
      } catch (error) {
        console.error('Failed to load exercise records:', error);
        setExerciseRecords([]);
      }
    };
    void loadExerciseRecords();
  }, [setSelectedUser]);

  // 编辑用户功能仍保留在主屏幕，因为它可能涉及更复杂的交互
  const handleEditUser = useCallback((user: User) => {
    // 导航到编辑用户的modal页面
    // @ts-ignore
    return router.push('/user?id=' + user.id + '&mode=edit');
  }, [router]);

  const handleUserDelete = useCallback(async (user: User) => {
    try {
      // 调用数据库服务删除用户
      await DatabaseService.deleteUser(user.id);
      // 重新加载用户列表
      const updatedUsers = await DatabaseService.getAllUsers();
      setUsers(updatedUsers);
      // 如果删除的是当前选中的用户，尝试设置下一个用户为选中用户
      if (selectedUser && selectedUser.id === user.id) {
        if (updatedUsers.length > 0) {
          // 设置第一个用户为选中用户
          setSelectedUser(updatedUsers[0]);
          // 同时更新当前用户
          setCurrentUser(updatedUsers[0]);
        } else {
          // 如果没有剩余用户，清空选中状态
          setSelectedUser(null);
          setCurrentUser(null);
          setExerciseRecords([]);
        }
      } else if (currentUser && currentUser.id === user.id) {
        // 如果删除的是当前用户但不是选中用户，也需要更新当前用户
        if (updatedUsers.length > 0) {
          setCurrentUser(updatedUsers[0]);
        } else {
          setCurrentUser(null);
        }
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      Alert.alert('错误', '删除用户失败，请重试');
    }
  }, [selectedUser, currentUser, setSelectedUser, setCurrentUser]);

  const renderExerciseItem = useCallback(({item}: { item: ExerciseRecord }) => (
    <ThemedView style={styles.exerciseItem}>
      <ThemedView style={styles.exerciseHeader}>
        <ThemedText style={styles.exerciseType}>{item.type}</ThemedText>
        <ThemedText style={styles.exerciseDate}>{item.date}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.exerciseDetails}>
        <ThemedView style={styles.exerciseDetail}>
          <Ionicons name="time-outline" size={16} color={tintColor}/>
          <ThemedText>{item.duration}分钟</ThemedText>
        </ThemedView>
        <ThemedView style={styles.exerciseDetail}>
          <Ionicons name="walk-outline" size={16} color={tintColor}/>
          <ThemedText>{item.distance}公里</ThemedText>
        </ThemedView>
        <ThemedView style={styles.exerciseDetail}>
          <Ionicons name="flame-outline" size={16} color={tintColor}/>
          <ThemedText>{item.calories}卡路里</ThemedText>
        </ThemedView>
        <ThemedView style={styles.exerciseDetail}>
          <Ionicons name="speedometer-outline" size={16} color={tintColor}/>
          <ThemedText>{item.averageSpeed}km/h</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  ), [tintColor]);

  const renderSelectedUserSection = useCallback(() => {
    if (!selectedUser) {
      return (
        <ThemedView style={styles.noSelection}>
          <Ionicons name="person-outline" size={40} color={tintColor}/>
          <ThemedText>请选择一个用户查看运动记录</ThemedText>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.selectedUserSection}>

        {/* 用户统计数据 */}
        <ThemedView style={styles.statsSection}>
          <ThemedText type="subtitle">运动统计</ThemedText>
          <ThemedView style={styles.statsGrid}>
            <ThemedView style={styles.statsCard}>
              <Ionicons name="time-outline" size={30} color={tintColor}/>
              <ThemedText style={styles.statsValue}>
                {exerciseRecords.reduce((sum, item) => sum + item.duration, 0)}
              </ThemedText>
              <ThemedText style={styles.statsLabel}>总时长(分钟)</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statsCard}>
              <Ionicons name="walk-outline" size={30} color={tintColor}/>
              <ThemedText style={styles.statsValue}>
                {exerciseRecords.reduce((sum, item) => sum + item.distance, 0).toFixed(1)}
              </ThemedText>
              <ThemedText style={styles.statsLabel}>总距离(公里)</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statsCard}>
              <Ionicons name="flame-outline" size={30} color={tintColor}/>
              <ThemedText style={styles.statsValue}>
                {exerciseRecords.reduce((sum, item) => sum + item.calories, 0)}
              </ThemedText>
              <ThemedText style={styles.statsLabel}>总卡路里</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statsCard}>
              <Ionicons name="calendar-outline" size={30} color={tintColor}/>
              <ThemedText style={styles.statsValue}>{exerciseRecords.length}</ThemedText>
              <ThemedText style={styles.statsLabel}>运动次数</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* 运动历史 */}
        <ThemedView style={styles.exerciseHistory}>
          <ThemedText type="subtitle">运动历史</ThemedText>
          {exerciseRecords.length > 0 ? (
            <FlatList
              data={exerciseRecords}
              renderItem={renderExerciseItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.exerciseList}
            />
          ) : (
            <ThemedView style={styles.emptyHistory}>
              <Ionicons name="document-text-outline" size={40} color={tintColor}/>
              <ThemedText>暂无运动记录</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    );
  }, [selectedUser, exerciseRecords, renderExerciseItem, tintColor]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor}/>
        <ThemedText style={styles.loadingText}>加载中...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* 用户列表网格 */}
      <UserListGrid
        users={users}
        onUserSelect={handleUserSelect}
        onUserEdit={handleEditUser}
        onUserDelete={handleUserDelete}
      />

      {/* 选中用户的运动记录 */}
      {renderSelectedUserSection()}
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
  userGrid: {
    marginTop: 20,
    justifyContent: 'space-between',
  },
  userItem: {
    width: '23%',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
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
  selectedUserSection: {
    marginTop: 20,
    flex: 1,
  },
  noSelection: {
    marginTop: 20,
    alignItems: 'center',
    padding: 40,
    flex: 1,
    justifyContent: 'center',
  },
  userProfile: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileDetails: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statsCard: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  statsLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  exerciseHistory: {
    flex: 1,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseItem: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  exerciseType: {
    fontWeight: '600',
    fontSize: 16,
  },
  exerciseDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  exerciseDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    width: '48%',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 40,
  }
});