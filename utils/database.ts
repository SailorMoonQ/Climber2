import * as SQLite from 'expo-sqlite';

// 打开或创建数据库
const db = SQLite.openDatabaseSync('climber.db');

// 初始化数据库，添加重试机制处理表锁定问题
const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3, delay = 1000): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.message?.includes('database table is locked') && i < maxRetries - 1) {
        console.log(`Database table is locked, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 指数退避
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
};

export const initDatabase = async () => {
  try {
    // 创建机构信息表
    await retryWithBackoff(async () => {
      return await db.execAsync(`
        CREATE TABLE IF NOT EXISTS organization (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
    });
    
    // 检查蓝牙设备表是否存在且结构正确
    try {
      await retryWithBackoff(async () => {
        // 尝试查询 device_type 列
        return await db.getFirstAsync('SELECT device_type FROM bluetooth_device LIMIT 1');
      });
      console.log('bluetooth_device table already exists with correct structure');
    } catch (error) {
      console.log('bluetooth_device table structure is incorrect, recreating...');
      
      // 如果查询失败，删除旧表并重新创建
      await retryWithBackoff(async () => {
        await db.execAsync('DROP TABLE IF EXISTS bluetooth_device');
      });
      
      // 创建蓝牙设备信息表
      await retryWithBackoff(async () => {
        return await db.execAsync(`
          CREATE TABLE IF NOT EXISTS bluetooth_device (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_type TEXT NOT NULL,
            device_id TEXT NOT NULL,
            device_name TEXT NOT NULL,
            connected_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
        `);
      });
    }
    
    // 创建通用应用设置表（键值对，用于语言等偏好）
    await retryWithBackoff(async () => {
      return await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );
      `);
    });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// 确保 app_settings 表已存在（懒初始化，避免设置读写早于 initDatabase 的竞态）
let appSettingsReady: Promise<void> | null = null;
const ensureAppSettingsTable = (): Promise<void> => {
  if (!appSettingsReady) {
    appSettingsReady = retryWithBackoff(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );
      `);
    });
  }
  return appSettingsReady;
};

// 通用设置：保存键值
export const saveSetting = async (key: string, value: string): Promise<void> => {
  try {
    await ensureAppSettingsTable();
    await retryWithBackoff(async () => {
      return await db.runAsync(
        'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, value]
      );
    });
  } catch (error) {
    console.error('Error saving setting:', key, error);
  }
};

// 通用设置：读取键值
export const getSetting = async (key: string): Promise<string | null> => {
  try {
    await ensureAppSettingsTable();
    const result = await retryWithBackoff(async () => {
      return await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        [key]
      );
    });
    return result?.value ?? null;
  } catch (error) {
    console.error('Error getting setting:', key, error);
    return null;
  }
};

// 保存机构名称
export const saveOrganizationName = async (name: string) => {
  try {
    // 检查是否已有机构信息
    const result = await retryWithBackoff(async () => {
      return await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM organization'
      );
    });
    
    if (result?.count && result.count > 0) {
      // 更新现有记录
      await retryWithBackoff(async () => {
        return await db.runAsync(
          'UPDATE organization SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
          [name]
        );
      });
    } else {
      // 插入新记录
      await retryWithBackoff(async () => {
        return await db.runAsync(
          'INSERT INTO organization (name) VALUES (?)',
          [name]
        );
      });
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
    const result = await retryWithBackoff(async () => {
      return await db.getFirstAsync<{ name: string }>(
        'SELECT name FROM organization WHERE id = 1'
      );
    });
    
    return result?.name || null;
  } catch (error) {
    console.error('Error getting organization name:', error);
    return null;
  }
};

// 保存蓝牙设备信息
export const saveBluetoothDevice = async (deviceType: string, deviceId: string, deviceName: string) => {
  try {
    console.log(`Attempting to save bluetooth device: type=${deviceType}, id=${deviceId}, name=${deviceName}`);
    
    // 检查参数是否有效
    if (!deviceType || !deviceId || !deviceName) {
      throw new Error('Invalid parameters: deviceType, deviceId, and deviceName are required');
    }
    
    // 使用 JavaScript 获取当前时间
    const currentTimestamp = new Date().toISOString();
    
    // 检查是否已有该类型的设备信息
    const result = await retryWithBackoff(async () => {
      return await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM bluetooth_device WHERE device_type = ?',
        [deviceType]
      );
    });
    
    console.log(`Database check result: ${JSON.stringify(result)}`);
    
    if (result?.count && result.count > 0) {
      // 更新现有记录
      console.log('Updating existing record');
      await retryWithBackoff(async () => {
        return await db.runAsync(
          'UPDATE bluetooth_device SET device_id = ?, device_name = ?, connected_at = ? WHERE device_type = ?',
          [deviceId, deviceName, currentTimestamp, deviceType]
        );
      });
    } else {
      // 插入新记录
      console.log('Inserting new record');
      await retryWithBackoff(async () => {
        return await db.runAsync(
          'INSERT INTO bluetooth_device (device_type, device_id, device_name, connected_at) VALUES (?, ?, ?, ?)',
          [deviceType, deviceId, deviceName, currentTimestamp]
        );
      });
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
    const result = await retryWithBackoff(async () => {
      return await db.getFirstAsync<{ device_id: string; device_name: string }>(
        'SELECT device_id, device_name FROM bluetooth_device WHERE device_type = ?',
        [deviceType]
      );
    });
    
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
    const results = await retryWithBackoff(async () => {
      return await db.getAllAsync<{ device_type: string; device_id: string; device_name: string }>(
        'SELECT device_type, device_id, device_name FROM bluetooth_device'
      );
    });
    
    return results.map((result: { device_type: any; device_id: any; device_name: any; }) => ({
      deviceType: result.device_type,
      deviceId: result.device_id,
      deviceName: result.device_name
    }));
  } catch (error) {
    console.error('Error getting all bluetooth devices:', error);
    throw error;
  }
};