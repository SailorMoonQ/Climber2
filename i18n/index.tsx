import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { getSetting, saveSetting } from '@/utils/database';

export type Lang = 'cn' | 'en';

type Entry = { cn: string; en: string };

// Bilingual string table (the redesign glossary). Add keys here; never hardcode
// user-facing text in screens.
export const strings = {
  // app / brand
  appName: { cn: '攀爬康复仪', en: 'Climber Rehab' },
  version: { cn: '版本', en: 'Version' },
  systemName: { cn: '系统名称', en: 'System' },

  // common
  start: { cn: '开始', en: 'Start' },
  pause: { cn: '暂停', en: 'Pause' },
  resume: { cn: '继续', en: 'Resume' },
  end: { cn: '结束', en: 'End' },
  endSession: { cn: '结束', en: 'End Session' },
  cancel: { cn: '取消', en: 'Cancel' },
  confirm: { cn: '确定', en: 'Confirm' },
  save: { cn: '保存', en: 'Save' },
  add: { cn: '添加', en: 'Add' },
  delete: { cn: '删除', en: 'Delete' },
  edit: { cn: '编辑', en: 'Edit' },
  search: { cn: '搜索', en: 'Search' },
  switch: { cn: '切换', en: 'Switch' },
  target: { cn: '目标', en: 'Target' },
  setTargets: { cn: '设置目标', en: 'Set Targets' },
  of: { cn: '/', en: 'of' },
  max: { cn: '最大', en: 'MAX' },
  avg: { cn: '平均', en: 'AVG' },

  // connection
  connected: { cn: '已连接', en: 'Connected' },
  connecting: { cn: '连接中', en: 'Scanning' },
  disconnected: { cn: '未连接', en: 'Disconnected' },
  notPaired: { cn: '未配对', en: 'Not paired' },
  pair: { cn: '配对', en: 'Pair' },

  // home
  currentPatient: { cn: '当前用户', en: 'Current patient' },
  noPatient: { cn: '未选择用户', en: 'No patient selected' },
  dynamicAssessment: { cn: '动态评估', en: 'Dynamic Assessment' },
  dynamicAssessmentHelp: { cn: '姿态与心率评估', en: 'Posture & heart-rate test' },
  freeTraining: { cn: '自由训练', en: 'Free Training' },
  freeTrainingHelp: { cn: '实时训练监测', en: 'Live training session' },
  userManagement: { cn: '用户管理', en: 'User Management' },
  userManagementHelp: { cn: '用户与运动数据', en: 'Patients & exercise data' },
  scenarioGame: { cn: '情景游戏', en: 'Scenario Game' },
  scenarioGameHelp: { cn: '游戏化训练', en: 'Gamified training' },
  primary: { cn: '主要', en: 'PRIMARY' },
  comingSoon: { cn: '即将推出', en: 'Coming Soon' },

  // metrics
  duration: { cn: '运动时长', en: 'Duration' },
  distance: { cn: '攀爬距离', en: 'Distance' },
  calories: { cn: '能量消耗', en: 'Calories' },
  speed: { cn: '速度', en: 'Speed' },
  heartRate: { cn: '心率', en: 'Heart Rate' },
  posture: { cn: '体姿态', en: 'Posture' },
  force: { cn: '力量', en: 'Force' },
  resistance: { cn: '阻力', en: 'Resistance' },
  leftResistance: { cn: '左侧阻力', en: 'Left Resistance' },
  rightResistance: { cn: '右侧阻力', en: 'Right Resistance' },
  bpm: { cn: 'bpm', en: 'bpm' },

  // force tiles
  leftHand: { cn: '左手力', en: 'Left Hand' },
  rightHand: { cn: '右手力', en: 'Right Hand' },
  leftLeg: { cn: '左腿力', en: 'Left Leg' },
  rightLeg: { cn: '右腿力', en: 'Right Leg' },
  forceUnit: { cn: '力量 (N · 0–40)', en: 'Force (N · 0–40)' },

  // hr zones
  zone_resting: { cn: '静息', en: 'Resting' },
  zone_light: { cn: '轻度', en: 'Light' },
  zone_moderate: { cn: '中等强度', en: 'Moderate' },
  zone_vigorous: { cn: '高强度', en: 'Vigorous' },
  zone_max: { cn: '极限', en: 'Max' },

  // alerts
  hrTooHigh: { cn: '心率过高，请停止运动', en: 'Heart rate too high — please stop' },

  // assessment
  dynamicAssessmentTitle: { cn: '动态姿势评估', en: 'Dynamic Assessment' },

  // user data
  totalTime: { cn: '总时长', en: 'Total Time' },
  totalDistance: { cn: '总距离', en: 'Total Distance' },
  totalCalories: { cn: '总消耗', en: 'Total Calories' },
  sessions: { cn: '训练次数', en: 'Sessions' },
  addUser: { cn: '添加用户', en: 'Add User' },
  deleteUser: { cn: '删除用户', en: 'Delete User' },
  assess: { cn: '评估', en: 'Assess' },
  train: { cn: '训练', en: 'Train' },
  noRecords: { cn: '暂无运动记录', en: 'No records yet' },
  trend: { cn: '趋势', en: 'Trend' },
  searchUserPlaceholder: { cn: '输入姓名/ID/年龄搜索', en: 'Search name / ID / age' },
  years: { cn: '岁', en: 'yrs' },
  deleteUserConfirm: { cn: '要删除该用户吗？', en: 'Delete this patient?' },

  // patient form / picker
  name: { cn: '姓名', en: 'Name' },
  gender: { cn: '性别', en: 'Gender' },
  age: { cn: '年龄', en: 'Age' },
  height: { cn: '身高', en: 'Height' },
  weight: { cn: '体重', en: 'Weight' },
  male: { cn: '男', en: 'Male' },
  female: { cn: '女', en: 'Female' },
  selectPatient: { cn: '选择用户', en: 'Select patient' },
  newPatient: { cn: '新增用户', en: 'New patient' },
  startAssessment: { cn: '开始评估', en: 'Start Assessment' },
  loading: { cn: '加载中', en: 'Loading' },

  // settings
  settings: { cn: '设置', en: 'Settings' },
  organization: { cn: '机构', en: 'Organization' },
  organizationName: { cn: '机构名称', en: 'Organization name' },
  general: { cn: '通用', en: 'General' },
  autoLock: { cn: '自动锁定', en: 'Auto-lock' },
  lock3: { cn: '3分钟', en: '3 min' },
  lock10: { cn: '10分钟', en: '10 min' },
  lockNever: { cn: '从不', en: 'Never' },
  versionMode: { cn: '版本模式', en: 'Version mode' },
  standalone: { cn: '单机版', en: 'Standalone' },
  networked: { cn: '联网版', en: 'Networked' },
  language: { cn: '语言', en: 'Language' },
  langCN: { cn: '中文', en: '中文' },
  langEN: { cn: 'English', en: 'English' },
  bluetoothDevices: { cn: '蓝牙设备', en: 'Bluetooth devices' },
  heartRateDevice: { cn: '心率设备', en: 'Heart-Rate Sensor' },
  postureDevice: { cn: '体姿设备', en: 'Posture Sensor' },
  forceDevice: { cn: '力量设备', en: 'Force Sensor' },
  saveSuccess: { cn: '保存成功', en: 'Saved' },
  saveFailed: { cn: '保存失败', en: 'Save failed' },

  // scenario game
  scenarioComingSoonTitle: { cn: '情景游戏即将推出', en: 'Scenario Game is coming' },
  scenarioComingSoonBody: {
    cn: '我们正在打造游戏化的康复训练体验：闯关任务、实时反馈与进度奖励，让训练更有动力。',
    en: 'We are building a gamified rehab experience — level missions, live feedback and progress rewards to keep training motivating.',
  },
  featureMissions: { cn: '闯关任务', en: 'Missions' },
  featureFeedback: { cn: '实时反馈', en: 'Live feedback' },
  featureRewards: { cn: '进度奖励', en: 'Rewards' },
  notifyMe: { cn: '上线时通知我', en: 'Notify me at launch' },
} as const satisfies Record<string, Entry>;

export type StringKey = keyof typeof strings;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_KEY = 'language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>('cn');

  useEffect(() => {
    getSetting(LANG_KEY).then((saved) => {
      if (saved === 'cn' || saved === 'en') setLangState(saved);
    });
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    void saveSetting(LANG_KEY, next);
  }, []);

  const t = useCallback(
    (key: StringKey) => strings[key]?.[lang] ?? (key as string),
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useI18n = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Safe fallback so a component used outside the provider still renders CN.
    return {
      lang: 'cn',
      setLang: () => {},
      t: (key: StringKey) => strings[key]?.cn ?? (key as string),
    };
  }
  return ctx;
};
