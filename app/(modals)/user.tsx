import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useEffect, useLayoutEffect, useState } from 'react';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import DatabaseService from '@/services/database-service';
import { User } from '@/interface/user.interface';
import { Ionicons } from '@expo/vector-icons';

export default function UserModalScreen() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const params = useLocalSearchParams();
  const isEditMode = params.mode === 'edit';
  const userId = params.id as string;
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    height: '',
    weight: '',
  });

  const [loading, setLoading] = useState(false);

  // 编辑模式下加载用户数据
  useEffect(() => {
    if (isEditMode && userId) {
      void loadUser();
    }
  }, [isEditMode, userId]);

  useLayoutEffect(() => {
    navigation.setOptions({title: (isEditMode ? '编辑用户信息' : '新增用户')});
  }, [isEditMode, navigation]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const user = await DatabaseService.getUserById(userId);
      if (user) {
        setFormData({
          name: user.name,
          gender: user.gender,
          age: user.age.toString(),
          height: user.height.toString(),
          weight: user.weight.toString(),
        });
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      Alert.alert('错误', '加载用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('提示', '请输入姓名');
      return false;
    }
    if (!formData.gender.trim()) {
      Alert.alert('提示', '请选择性别');
      return false;
    }
    if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
      Alert.alert('提示', '请输入有效的年龄');
      return false;
    }
    if (!formData.height || isNaN(Number(formData.height)) || Number(formData.height) <= 0) {
      Alert.alert('提示', '请输入有效的身高');
      return false;
    }
    if (!formData.weight || isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) {
      Alert.alert('提示', '请输入有效的体重');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const user: User = {
        id: isEditMode ? userId : Date.now().toString(),
        name: formData.name.trim(),
        gender: formData.gender,
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
      };

      let success;
      if (isEditMode) {
        success = await DatabaseService.updateUser(user);
      } else {
        success = await DatabaseService.addUser(user);
      }

      if (success) {
        Alert.alert('成功', isEditMode ? '用户信息已更新' : '用户已添加', [
          {
            text: '确定',
            onPress: () => {
              // 返回用户管理页面
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('错误', isEditMode ? '更新用户失败' : '添加用户失败');
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      Alert.alert('错误', '保存用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenderSelect = (gender: string) => {
    setFormData({...formData, gender});
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">
          {isEditMode ? '编辑用户信息' : '新增用户'}
        </ThemedText>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={tintColor}/>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.form}>
        {/* 姓名输入 */}
        <ThemedView style={styles.inputGroup}>
          <ThemedText>姓名</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            placeholder="请输入姓名"
            placeholderTextColor="#999"
          />
        </ThemedView>

        {/* 性别选择 */}
        <ThemedView style={styles.inputGroup}>
          <ThemedText>性别</ThemedText>
          <ThemedView style={styles.genderContainer}>
            <Pressable
              style={[
                styles.genderButton,
                formData.gender === '男' && {backgroundColor: tintColor},
              ]}
              onPress={() => handleGenderSelect('男')}
            >
              <ThemedText
                style={[
                  styles.genderButtonText,
                  formData.gender === '男' && {color: 'white'},
                ]}
              >
                男
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.genderButton,
                formData.gender === '女' && {backgroundColor: tintColor},
              ]}
              onPress={() => handleGenderSelect('女')}
            >
              <ThemedText
                style={[
                  styles.genderButtonText,
                  formData.gender === '女' && {color: 'white'},
                ]}
              >
                女
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        {/* 年龄输入 */}
        <ThemedView style={styles.inputGroup}>
          <ThemedText>年龄</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.age}
            onChangeText={(text) => setFormData({...formData, age: text})}
            placeholder="请输入年龄"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </ThemedView>

        {/* 身高输入 */}
        <ThemedView style={styles.inputGroup}>
          <ThemedText>身高 (cm)</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.height}
            onChangeText={(text) => setFormData({...formData, height: text})}
            placeholder="请输入身高"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </ThemedView>

        {/* 体重输入 */}
        <ThemedView style={styles.inputGroup}>
          <ThemedText>体重 (kg)</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.weight}
            onChangeText={(text) => setFormData({...formData, weight: text})}
            placeholder="请输入体重"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </ThemedView>

        {/* 提交按钮 */}
        <Pressable
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <ThemedText style={styles.submitButtonText} numberOfLines={1}>
            {loading ? '保存中...' : isEditMode ? '保存修改' : '添加用户'}
          </ThemedText>
        </Pressable>

        {/* 返回按钮 */}
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <ThemedText style={styles.cancelButtonText}>取消</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 10,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
    backgroundColor: 'white',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
  },
});