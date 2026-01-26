import { StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import DatabaseService from '@/services/database-service';
import { useNavigation } from "expo-router";
import UserListGrid from '@/components/user-list-grid';
import { User } from "@/interface/user.interface";
import { ExerciseRecord } from '@/interface/exercise-record.interface';

export default function UserManagementScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({title: '用户管理/运动数据'});
  }, [navigation]);

  // 初始化数据库和加载用户数据
  useEffect(() => {
    const loadData = async () => {
      try {
        await DatabaseService.init();
        const userList = await DatabaseService.getAllUsers();
        setUsers(userList);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

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
  }, []);

  // 编辑用户功能仍保留在主屏幕，因为它可能涉及更复杂的交互
  const handleEditUser = useCallback((user: User) => {
    // 这里可以直接导航到编辑页面或显示编辑弹窗
    // Alert.alert('编辑用户', `将编辑用户 ${user.name}`);
  }, []);

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
  },
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
