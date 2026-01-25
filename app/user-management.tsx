import { StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

// 模拟用户数据
const mockUsers = [
  {
    id: '1',
    name: '张三',
    age: 25,
    gender: '男',
    height: 175,
    weight: 70,
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: '2',
    name: '李四',
    age: 30,
    gender: '女',
    height: 160,
    weight: 55,
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: '3',
    name: '王五',
    age: 28,
    gender: '男',
    height: 180,
    weight: 80,
    avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
  },
];

// 模拟运动数据
const mockExerciseData = [
  {
    id: '1',
    userId: '1',
    date: '2023-10-01',
    type: '自由训练',
    duration: 30,
    distance: 5.2,
    calories: 350,
    averageSpeed: 10.4,
    maxSpeed: 15.2,
    heartRate: { avg: 145, max: 175 },
  },
  {
    id: '2',
    userId: '1',
    date: '2023-09-28',
    type: '动态评估',
    duration: 20,
    distance: 3.8,
    calories: 280,
    averageSpeed: 11.4,
    maxSpeed: 16.8,
    heartRate: { avg: 152, max: 180 },
  },
  {
    id: '3',
    userId: '2',
    date: '2023-09-30',
    type: '自由训练',
    duration: 45,
    distance: 7.5,
    calories: 480,
    averageSpeed: 10.0,
    maxSpeed: 14.5,
    heartRate: { avg: 138, max: 165 },
  },
];

export default function UserManagementScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserData, setShowUserData] = useState(false);
  const [showUserList, setShowUserList] = useState(true);

  const handleUserSelect = useCallback((user: any) => {
    setSelectedUser(user);
    setShowUserList(false);
    setShowUserData(true);
  }, []);

  const handleBackToUserList = useCallback(() => {
    setShowUserList(true);
    setShowUserData(false);
    setSelectedUser(null);
  }, []);

  const getUserExerciseData = useCallback((userId: string) => {
    return mockExerciseData.filter(data => data.userId === userId);
  }, []);

  const renderUserItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
    >
      <ThemedView style={styles.userAvatar}>
        <Ionicons name="person" size={30} color={tintColor} />
      </ThemedView>
      <ThemedView style={styles.userInfo}>
        <ThemedText style={styles.userName}>{item.name}</ThemedText>
        <ThemedText style={styles.userDetails}>
          {item.gender} | {item.age}岁 | {item.height}cm | {item.weight}kg
        </ThemedText>
      </ThemedView>
      <Ionicons name="chevron-forward" size={20} color={tintColor} />
    </TouchableOpacity>
  ), [handleUserSelect, tintColor]);

  const renderExerciseItem = useCallback(({ item }: { item: any }) => (
    <ThemedView style={styles.exerciseItem}>
      <ThemedView style={styles.exerciseHeader}>
        <ThemedText style={styles.exerciseType}>{item.type}</ThemedText>
        <ThemedText style={styles.exerciseDate}>{item.date}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.exerciseDetails}>
        <ThemedView style={styles.exerciseDetail}>
          <Ionicons name="time-outline" size={16} color={tintColor} />
          <ThemedText>{item.duration}分钟</ThemedText>
        </ThemedView>
        <ThemedView style={styles.exerciseDetail}>
          <Ionicons name="walk-outline" size={16} color={tintColor} />
          <ThemedText>{item.distance}公里</ThemedText>
        </ThemedView>
        <ThemedView style={styles.exerciseDetail}>
          <Ionicons name="flame-outline" size={16} color={tintColor} />
          <ThemedText>{item.calories}卡路里</ThemedText>
        </ThemedView>
        <ThemedView style={styles.exerciseDetail}>
          <Ionicons name="speedometer-outline" size={16} color={tintColor} />
          <ThemedText>{item.averageSpeed}km/h</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  ), [tintColor]);

  const renderUserData = useCallback(() => {
    if (!selectedUser) return null;

    const userExerciseData = getUserExerciseData(selectedUser.id);

    return (
      <ThemedView style={styles.userDataContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackToUserList}
        >
          <Ionicons name="arrow-back" size={20} color={tintColor} />
          <ThemedText>返回用户列表</ThemedText>
        </TouchableOpacity>
        
        {/* 用户信息 */}
        <ThemedView style={styles.userProfile}>
          <ThemedView style={styles.profileAvatar}>
            <Ionicons name="person" size={60} color={tintColor} />
          </ThemedView>
          <ThemedText style={styles.profileName}>{selectedUser.name}</ThemedText>
          <ThemedText style={styles.profileDetails}>
            {selectedUser.gender} | {selectedUser.age}岁 | {selectedUser.height}cm | {selectedUser.weight}kg
          </ThemedText>
        </ThemedView>

        {/* 用户统计数据 */}
        <ThemedView style={styles.statsSection}>
          <ThemedText type="subtitle">运动统计</ThemedText>
          <ThemedView style={styles.statsGrid}>
            <ThemedView style={styles.statsCard}>
              <Ionicons name="time-outline" size={30} color={tintColor} />
              <ThemedText style={styles.statsValue}>{userExerciseData.reduce((sum, item) => sum + item.duration, 0)}</ThemedText>
              <ThemedText style={styles.statsLabel}>总时长(分钟)</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statsCard}>
              <Ionicons name="walk-outline" size={30} color={tintColor} />
              <ThemedText style={styles.statsValue}>{userExerciseData.reduce((sum, item) => sum + item.distance, 0).toFixed(1)}</ThemedText>
              <ThemedText style={styles.statsLabel}>总距离(公里)</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statsCard}>
              <Ionicons name="flame-outline" size={30} color={tintColor} />
              <ThemedText style={styles.statsValue}>{userExerciseData.reduce((sum, item) => sum + item.calories, 0)}</ThemedText>
              <ThemedText style={styles.statsLabel}>总卡路里</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statsCard}>
              <Ionicons name="calendar-outline" size={30} color={tintColor} />
              <ThemedText style={styles.statsValue}>{userExerciseData.length}</ThemedText>
              <ThemedText style={styles.statsLabel}>运动次数</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* 运动历史 */}
        <ThemedView style={styles.exerciseHistory}>
          <ThemedText type="subtitle">运动历史</ThemedText>
          {userExerciseData.length > 0 ? (
            <FlatList
              data={userExerciseData}
              renderItem={renderExerciseItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <ThemedView style={styles.emptyHistory}>
              <Ionicons name="document-text-outline" size={40} color={tintColor} />
              <ThemedText>暂无运动记录</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    );
  }, [selectedUser, getUserExerciseData, renderExerciseItem, tintColor, handleBackToUserList]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">用户管理/运动数据</ThemedText>
      
      {showUserList && (
        <FlatList
          data={mockUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.userList}
        />
      )}

      {showUserData && renderUserData()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  userList: {
    marginTop: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 5,
  },
  userDetails: {
    fontSize: 14,
    opacity: 0.7,
  },
  userDataContainer: {
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
});