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