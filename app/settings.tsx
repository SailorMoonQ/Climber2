import React, { useContext, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import { OrganizationContext } from '@/contexts/OrganizationContext';
import { getAllBluetoothDevices, saveBluetoothDevice } from '@/utils/database';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [selectedLockTime, setSelectedLockTime] = useState('3分钟');
  const [versionMode, setVersionMode] = useState('单机版');
  const [language, setLanguage] = useState('中文');
  const [organizationNameInput, setOrganizationNameInput] = useState('');
  
  // 蓝牙连接标识状态
  const [heartRateDeviceId, setHeartRateDeviceId] = useState('');
  const [postureDeviceId, setPostureDeviceId] = useState('');
  const [forceDeviceId, setForceDeviceId] = useState('');
  
  // 保存蓝牙设置
  const handleSaveBluetoothSettings = async () => {
    try {
      // 保存心率设备
      if (heartRateDeviceId.trim()) {
        await saveBluetoothDevice('heartRate', heartRateDeviceId.trim(), '心率设备');
      }
      
      // 保存体姿设备
      if (postureDeviceId.trim()) {
        await saveBluetoothDevice('posture', postureDeviceId.trim(), '体姿设备');
      }
      
      // 保存Force设备
      if (forceDeviceId.trim()) {
        await saveBluetoothDevice('force', forceDeviceId.trim(), 'Force设备');
      }
      
      Alert.alert('成功', '蓝牙设备标识已保存');
    } catch (error) {
      console.error('Error saving bluetooth settings:', error);
      Alert.alert('错误', '保存蓝牙设备标识失败');
    }
  };
  
  // 加载已保存的蓝牙设备设置
  useEffect(() => {
    const loadBluetoothSettings = async () => {
      try {
        const devices = await getAllBluetoothDevices();
        
        // 初始化设备ID
        devices.forEach(device => {
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
  
  const organizationContext = useContext(OrganizationContext);
  
  // 从Context中获取当前机构名称
  useEffect(() => {
    if (organizationContext?.organizationName) {
      setOrganizationNameInput(organizationContext.organizationName);
    }
  }, [organizationContext?.organizationName]);
  
  // 保存机构名称到数据库
  const handleSaveOrganizationName = async () => {
    try {
      if (!organizationNameInput.trim()) {
        Alert.alert('提示', '请输入机构名称');
        return;
      }
      
      if (organizationContext) {
        await organizationContext.setOrganizationName(organizationNameInput.trim());
        Alert.alert('成功', '机构名称已保存');
      }
    } catch (error) {
      console.error('Error saving organization name:', error);
      Alert.alert('错误', '保存机构名称失败');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? Colors.dark.background : Colors.light.background }]} contentContainerStyle={{ paddingBottom: 30 }}>
      <Stack.Screen 
        options={{
          title: '设置',
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: 'bold',
          },
        }}
      />
      
      {/* 机构信息 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>机构信息</Text>
        <View style={styles.formItem}>
          <Text style={[styles.label, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>机构名称:</Text>
          <View style={styles.inputContainer}>
            <TextInput 
              style={[styles.input, { backgroundColor: isDarkMode ? '#333' : '#fff', color: isDarkMode ? Colors.dark.text : Colors.light.text }]} 
              placeholder="请输入机构名称"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              value={organizationNameInput}
              onChangeText={setOrganizationNameInput}
            />
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: isDarkMode ? Colors.dark.tint : Colors.light.tint }]}
              onPress={handleSaveOrganizationName}
            >
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.formItem}>
          <Text style={[styles.label, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>Logo:</Text>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=' }} 
              style={styles.logoPlaceholder} 
            />
            <TouchableOpacity style={[styles.uploadButton, { backgroundColor: isDarkMode ? Colors.dark.tint : Colors.light.tint }]}>
              <Text style={styles.uploadButtonText}>上传</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 设置 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>设置</Text>
        <View style={styles.formItem}>
          <Text style={[styles.label, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>自动锁屏时长:</Text>
          <View style={styles.radioGroup}>
            {['3分钟', '10分钟', '30分钟', '不锁屏'].map((time) => (
              <TouchableOpacity 
                key={time}
                style={[
                  styles.radioButton, 
                  selectedLockTime === time && { backgroundColor: isDarkMode ? Colors.dark.tint : Colors.light.tint }
                ]}
                onPress={() => setSelectedLockTime(time)}
              >
                <Text style={[
                  styles.radioButtonText, 
                  selectedLockTime === time && { color: '#fff' }
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.formItem}>
          <Text style={[styles.label, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>版本切换:</Text>
          <View style={styles.radioGroup}>
            {['单机版', '智能版'].map((mode) => (
              <TouchableOpacity 
                key={mode}
                style={[
                  styles.radioButton, 
                  versionMode === mode && { backgroundColor: '#FF3B30' }
                ]}
                onPress={() => setVersionMode(mode)}
              >
                <Text style={[
                  styles.radioButtonText, 
                  versionMode === mode && { color: '#fff' }
                ]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.formItem}>
          <Text style={[styles.label, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>亮度</Text>
          {/* 亮度控制滑块可以在这里添加 */}
        </View>
        <View style={styles.formItem}>
          <Text style={[styles.label, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>声音</Text>
          {/* 声音控制可以在这里添加 */}
        </View>
        <View style={styles.formItem}>
          <Text style={[styles.label, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>语言</Text>
          <View style={styles.radioGroup}>
            {['中文', 'English'].map((lang) => (
              <TouchableOpacity 
                key={lang}
                style={[
                  styles.radioButton, 
                  language === lang && { backgroundColor: isDarkMode ? Colors.dark.tint : Colors.light.tint }
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[
                  styles.radioButtonText, 
                  language === lang && { color: '#fff' }
                ]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* 蓝牙设置 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>蓝牙设置</Text>
        <View style={styles.formItem}>
          <Text style={[styles.label, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>心率设备标识:</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: isDarkMode ? '#333' : '#fff', color: isDarkMode ? Colors.dark.text : Colors.light.text }]} 
            placeholder="请输入心率设备蓝牙标识"
            placeholderTextColor={isDarkMode ? '#888' : '#999'}
            value={heartRateDeviceId}
            onChangeText={setHeartRateDeviceId}
          />
        </View>
        <View style={styles.formItem}>
          <Text style={[styles.label, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>体姿设备标识:</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: isDarkMode ? '#333' : '#fff', color: isDarkMode ? Colors.dark.text : Colors.light.text }]} 
            placeholder="请输入体姿设备蓝牙标识"
            placeholderTextColor={isDarkMode ? '#888' : '#999'}
            value={postureDeviceId}
            onChangeText={setPostureDeviceId}
          />
        </View>
        <View style={styles.formItem}>
          <Text style={[styles.label, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>Force设备标识:</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: isDarkMode ? '#333' : '#fff', color: isDarkMode ? Colors.dark.text : Colors.light.text }]} 
            placeholder="请输入Force设备蓝牙标识"
            placeholderTextColor={isDarkMode ? '#888' : '#999'}
            value={forceDeviceId}
            onChangeText={setForceDeviceId}
          />
        </View>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: isDarkMode ? Colors.dark.tint : Colors.light.tint, marginTop: 10 }]}
          onPress={handleSaveBluetoothSettings}
        >
          <Text style={styles.saveButtonText}>保存蓝牙设置</Text>
        </TouchableOpacity>
      </View>

      {/* 设备信息 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>设备信息</Text>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>名称:</Text>
          <Text style={[styles.infoValue, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>发布版本:</Text>
          <Text style={[styles.infoValue, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>V1.0.0</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>完整版本:</Text>
          <Text style={[styles.infoValue, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>V1.0.0</Text>
        </View>
        <TouchableOpacity style={[styles.checkUpdateButton, { backgroundColor: isDarkMode ? Colors.dark.tint : Colors.light.tint }]}>
          <Text style={styles.checkUpdateText}>检查更新</Text>
        </TouchableOpacity>
        <Text style={[styles.updateHint, { color: isDarkMode ? '#888' : '#999' }]}>如需升级，请联系厂家</Text>
      </View>

      {/* 联系我们 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>联系我们</Text>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactText, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>北京首康科健医疗设备有限公司</Text>
          <Text style={[styles.contactText, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>服务热线: XXXXXXXX</Text>
        </View>
        <View style={styles.qrCodeContainer}>
          <Image 
            source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=' }} 
            style={styles.qrCode} 
          />
          <Text style={[styles.qrCodeText, { color: isDarkMode ? Colors.dark.text : Colors.light.text }]}>普康公众号二维码</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  formItem: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    marginBottom: 10,
  },
  radioButtonText: {
    fontSize: 14,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    width: 80,
  },
  infoValue: {
    fontSize: 16,
    flex: 1,
  },
  checkUpdateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  checkUpdateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateHint: {
    fontSize: 14,
  },
  contactInfo: {
    marginBottom: 20,
  },
  contactText: {
    fontSize: 16,
    marginBottom: 5,
  },
  qrCodeContainer: {
    alignItems: 'center',
  },
  qrCode: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  qrCodeText: {
    fontSize: 14,
  },
});