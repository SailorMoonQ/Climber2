import * as SQLite from 'expo-sqlite';

// 打开或创建数据库
const db = SQLite.openDatabaseSync('climber.db');

// 初始化数据库
export const initDatabase = async () => {
  try {
    // 创建机构信息表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS organization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 创建蓝牙设备信息表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS bluetooth_device (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_type TEXT NOT NULL,
        device_id TEXT NOT NULL,
        device_name TEXT NOT NULL,
        connected_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// 保存机构名称
export const saveOrganizationName = async (name: string) => {
  try {
    // 检查是否已有机构信息
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM organization'
    );
    
    if (result?.count && result.count > 0) {
      // 更新现有记录
      await db.runAsync(
        'UPDATE organization SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
        [name]
      );
    } else {
      // 插入新记录
      await db.runAsync(
        'INSERT INTO organization (id, name) VALUES (1, ?)',
        [name]
      );
    }
    
    console.log('Organization name saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving organization name:', error);
    throw error;
  }
};

// 获取机构名称
export const getOrganizationName = async (): Promise<string | null> => {
  try {
    const result = await db.getFirstAsync<{ name: string }>(
      'SELECT name FROM organization WHERE id = 1'
    );
    
    return result?.name || null;
  } catch (error) {
    console.error('Error getting organization name:', error);
    throw error;
  }
};

// 保存蓝牙设备信息
export const saveBluetoothDevice = async (deviceType: string, deviceId: string, deviceName: string) => {
  try {
    // 检查是否已有该类型的设备信息
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bluetooth_device WHERE device_type = ?',
      [deviceType]
    );
    
    if (result?.count && result.count > 0) {
      // 更新现有记录
      await db.runAsync(
        'UPDATE bluetooth_device SET device_id = ?, device_name = ?, connected_at = CURRENT_TIMESTAMP WHERE device_type = ?',
        [deviceId, deviceName, deviceType]
      );
    } else {
      // 插入新记录
      await db.runAsync(
        'INSERT INTO bluetooth_device (device_type, device_id, device_name) VALUES (?, ?, ?)',
        [deviceType, deviceId, deviceName]
      );
    }
    
    console.log('Bluetooth device saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving bluetooth device:', error);
    throw error;
  }
};

// 获取蓝牙设备信息
export const getBluetoothDevice = async (deviceType: string): Promise<{ deviceId: string; deviceName: string } | null> => {
  try {
    const result = await db.getFirstAsync<{ device_id: string; device_name: string }>(
      'SELECT device_id, device_name FROM bluetooth_device WHERE device_type = ?',
      [deviceType]
    );
    
    if (result) {
      return {
        deviceId: result.device_id,
        deviceName: result.device_name
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting bluetooth device:', error);
    throw error;
  }
};

// 获取所有蓝牙设备信息
export const getAllBluetoothDevices = async (): Promise<Array<{ deviceType: string; deviceId: string; deviceName: string }>> => {
  try {
    const results = await db.getAllAsync<{ device_type: string; device_id: string; device_name: string }>(
      'SELECT device_type, device_id, device_name FROM bluetooth_device'
    );
    
    return results.map(result => ({
      deviceType: result.device_type,
      deviceId: result.device_id,
      deviceName: result.device_name
    }));
  } catch (error) {
    console.error('Error getting all bluetooth devices:', error);
    throw error;
  }
};