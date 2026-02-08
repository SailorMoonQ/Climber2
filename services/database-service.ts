import * as SQLite from 'expo-sqlite';
import { User } from "@/interface/user.interface";
import { ExerciseRecord } from "@/interface/exercise-record.interface";

// 创建数据库连接
const db = SQLite.openDatabaseSync('climber.db');

// 数据库是否已经初始化完成
let isDatabaseInitialized = false;

class DatabaseService {
  // 初始化数据库表
  static async init() {
    try {
      // 创建用户表
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          age INTEGER NOT NULL,
          gender TEXT NOT NULL,
          height INTEGER NOT NULL,
          weight INTEGER NOT NULL,
          avatar TEXT
        );
      `);

      // 创建运动记录表（兼容旧版本）
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exercise_records (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT NOT NULL,
          date TEXT NOT NULL,
          type TEXT NOT NULL,
          duration INTEGER NOT NULL,
          distance REAL NOT NULL,
          calories INTEGER NOT NULL,
          averageSpeed REAL NOT NULL,
          maxSpeed REAL NOT NULL,
          heartRate TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users (id)
        );
      `);

      // 检查并添加新字段（用于数据库迁移）
      try {
        // 尝试添加trainingTargets字段
        await db.execAsync(`
          ALTER TABLE exercise_records ADD COLUMN trainingTargets TEXT NOT NULL DEFAULT '{}';
        `);
      } catch (error) {
        console.log('trainingTargets column already exists or could not be added:', error);
      }

      try {
        // 尝试添加detailedData字段
        await db.execAsync(`
          ALTER TABLE exercise_records ADD COLUMN detailedData TEXT NOT NULL DEFAULT '[]';
        `);
      } catch (error) {
        console.log('detailedData column already exists or could not be added:', error);
      }

      // 添加一些初始数据
      await DatabaseService.seedInitialData();
      isDatabaseInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  // 添加初始数据
  static async seedInitialData() {
    const userCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (userCount?.count === 0) {
      // 添加测试用户
      const users: User[] = [
        { id: '1', name: '张三', age: 25, gender: '男', height: 175, weight: 70 },
        { id: '2', name: '李四', age: 30, gender: '女', height: 160, weight: 55 },
        { id: '3', name: '王五', age: 28, gender: '男', height: 180, weight: 80 },
      ];

      for (const user of users) {
        await db.runAsync(
          'INSERT INTO users (id, name, age, gender, height, weight) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, user.name, user.age, user.gender, user.height, user.weight]
        );
      }

      // 添加测试运动记录
      const exerciseRecords: ExerciseRecord[] = [
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
          trainingTargets: {},
          detailedData: [],
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
          trainingTargets: {},
          detailedData: [],
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
          trainingTargets: {},
          detailedData: [],
        },
      ];

      for (const record of exerciseRecords) {
        await db.runAsync(
          'INSERT INTO exercise_records (id, userId, date, type, duration, distance, calories, averageSpeed, maxSpeed, heartRate, trainingTargets, detailedData) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            record.id,
            record.userId,
            record.date,
            record.type,
            record.duration,
            record.distance,
            record.calories,
            record.averageSpeed,
            record.maxSpeed,
            JSON.stringify(record.heartRate),
            JSON.stringify(record.trainingTargets || {}),
            JSON.stringify(record.detailedData || []),
          ]
        );
      }
    }
  }

  // 用户相关操作
  static async getAllUsers(): Promise<User[]> {
    try {
      // 确保数据库已经初始化
      if (!isDatabaseInitialized) {
        await DatabaseService.init();
      }
      const result = await db.getAllAsync<User>('SELECT * FROM users');
      return result;
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      // 确保数据库已经初始化
      if (!isDatabaseInitialized) {
        await DatabaseService.init();
      }
      const result = await db.getFirstAsync<User>('SELECT * FROM users WHERE id = ?', [id]);
      return result;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  static async addUser(userData: Omit<User, 'id'>): Promise<User> {
    try {
      // 确保数据库已经初始化
      if (!isDatabaseInitialized) {
        await DatabaseService.init();
      }
      const id = Date.now().toString(); // 使用时间戳生成唯一ID
      await db.runAsync(
        'INSERT INTO users (id, name, age, gender, height, weight, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, userData.name, userData.age, userData.gender, userData.height, userData.weight, userData.avatar]
      );
      return { id, ...userData };
    } catch (error) {
      console.error('Failed to add user:', error);
      throw error;
    }
  }

  static async updateUser(user: User): Promise<boolean> {
    try {
      // 确保数据库已经初始化
      if (!isDatabaseInitialized) {
        await DatabaseService.init();
      }
      await db.runAsync(
        'UPDATE users SET name = ?, age = ?, gender = ?, height = ?, weight = ?, avatar = ? WHERE id = ?',
        [user.name, user.age, user.gender, user.height, user.weight, user.avatar, user.id]
      );
      return true;
    } catch (error) {
      console.error('Failed to update user:', error);
      return false;
    }
  }

  static async deleteUser(id: string): Promise<boolean> {
    try {
      // 确保数据库已经初始化
      if (!isDatabaseInitialized) {
        await DatabaseService.init();
      }
      await db.runAsync('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }

  // 运动记录相关操作
  static async getExerciseRecordsByUserId(userId: string): Promise<ExerciseRecord[]> {
    try {
      // 确保数据库已经初始化
      if (!isDatabaseInitialized) {
        await DatabaseService.init();
      }
      const result = await db.getAllAsync<any>('SELECT * FROM exercise_records WHERE userId = ? ORDER BY date DESC', [userId]);
      return result.map(record => ({
        ...record,
        heartRate: JSON.parse(record.heartRate),
        trainingTargets: JSON.parse(record.trainingTargets),
        detailedData: JSON.parse(record.detailedData),
      }));
    } catch (error) {
      console.error('Failed to get exercise records:', error);
      return [];
    }
  }

  static async addExerciseRecord(record: ExerciseRecord): Promise<boolean> {
    try {
      // 确保数据库已经初始化
      if (!isDatabaseInitialized) {
        await DatabaseService.init();
      }
      await db.runAsync(
        'INSERT INTO exercise_records (id, userId, date, type, duration, distance, calories, averageSpeed, maxSpeed, heartRate, trainingTargets, detailedData) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          record.id,
          record.userId,
          record.date,
          record.type,
          record.duration,
          record.distance,
          record.calories,
          record.averageSpeed,
          record.maxSpeed,
          JSON.stringify(record.heartRate),
          JSON.stringify(record.trainingTargets || {}),
          JSON.stringify(record.detailedData || []),
        ]
      );
      return true;
    } catch (error) {
      console.error('Failed to add exercise record:', error);
      return false;
    }
  }

  static async deleteExerciseRecord(id: string): Promise<boolean> {
    try {
      // 确保数据库已经初始化
      if (!isDatabaseInitialized) {
        await DatabaseService.init();
      }
      await db.runAsync('DELETE FROM exercise_records WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Failed to delete exercise record:', error);
      return false;
    }
  }
}

export default DatabaseService;