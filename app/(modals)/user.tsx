import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTokens } from '@/hooks/use-tokens';
import { Tokens } from '@/constants/theme';
import { AppButton, SegmentedControl, Txt } from '@/components/ui/primitives';
import { useEffect, useLayoutEffect, useState } from 'react';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import DatabaseService from '@/services/database-service';
import { User } from '@/interface/user.interface';
import { Ionicons } from '@expo/vector-icons';

export default function UserModalScreen() {
  const { c } = useTokens();
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
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Txt variant="title">
          {isEditMode ? '编辑用户信息' : '新增用户'}
        </Txt>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={c.text}/>
        </Pressable>
      </View>

      <View style={styles.form}>
        {/* 姓名输入 */}
        <View style={styles.inputGroup}>
          <Txt variant="label" color={c.textSecondary}>姓名</Txt>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: c.surface2, borderColor: c.border, color: c.text },
            ]}
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            placeholder="请输入姓名"
            placeholderTextColor={c.textMuted}
          />
        </View>

        {/* 性别选择 */}
        <View style={styles.inputGroup}>
          <Txt variant="label" color={c.textSecondary}>性别</Txt>
          <View style={styles.genderContainer}>
            <SegmentedControl
              options={[
                { key: '男', label: '男' },
                { key: '女', label: '女' },
              ]}
              value={formData.gender}
              onChange={handleGenderSelect}
            />
          </View>
        </View>

        {/* 年龄输入 */}
        <View style={styles.inputGroup}>
          <Txt variant="label" color={c.textSecondary}>年龄</Txt>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: c.surface2, borderColor: c.border, color: c.text },
            ]}
            value={formData.age}
            onChangeText={(text) => setFormData({...formData, age: text})}
            placeholder="请输入年龄"
            placeholderTextColor={c.textMuted}
            keyboardType="numeric"
          />
        </View>

        {/* 身高输入 */}
        <View style={styles.inputGroup}>
          <Txt variant="label" color={c.textSecondary}>身高 (cm)</Txt>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: c.surface2, borderColor: c.border, color: c.text },
            ]}
            value={formData.height}
            onChangeText={(text) => setFormData({...formData, height: text})}
            placeholder="请输入身高"
            placeholderTextColor={c.textMuted}
            keyboardType="numeric"
          />
        </View>

        {/* 体重输入 */}
        <View style={styles.inputGroup}>
          <Txt variant="label" color={c.textSecondary}>体重 (kg)</Txt>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: c.surface2, borderColor: c.border, color: c.text },
            ]}
            value={formData.weight}
            onChangeText={(text) => setFormData({...formData, weight: text})}
            placeholder="请输入体重"
            placeholderTextColor={c.textMuted}
            keyboardType="numeric"
          />
        </View>

        {/* 提交按钮 */}
        <AppButton
          label={loading ? '保存中...' : isEditMode ? '保存修改' : '添加用户'}
          onPress={handleSubmit}
          disabled={loading}
          full
          style={styles.submitButton}
        />

        {/* 返回按钮 */}
        <AppButton
          label="取消"
          variant="secondary"
          onPress={() => router.back()}
          full
          style={styles.cancelButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Tokens.space.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Tokens.space.lg,
  },
  closeButton: {
    padding: Tokens.space.sm,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Tokens.space.lg,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Tokens.radius.md,
    padding: Tokens.space.md,
    fontSize: 16,
    marginTop: Tokens.space.sm,
  },
  genderContainer: {
    marginTop: Tokens.space.sm,
  },
  submitButton: {
    marginTop: Tokens.space.lg,
  },
  cancelButton: {
    marginTop: Tokens.space.md,
  },
});
