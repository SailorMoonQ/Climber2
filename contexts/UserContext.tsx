import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/interface/user.interface';
import DatabaseService from '@/services/database-service';

interface UserContextType {
  selectedUser: User | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // 初始化数据库并加载所有用户
  useEffect(() => {
    const initializeDatabase = async () => {
      await DatabaseService.init();
      
      // 获取所有用户
      const users = await DatabaseService.getAllUsers();
      
      // 如果有用户，且当前没有选中的用户，则默认选择第一个用户
      if (users.length > 0 && !selectedUser) {
        setSelectedUser(users[0]);
      }
      
      // 如果有用户，且当前没有当前用户，则默认设置第一个用户为当前用户
      if (users.length > 0 && !currentUser) {
        setCurrentUser(users[0]);
      }
      
      setUsersLoaded(true);
    };

    initializeDatabase();
  }, []);

  // 当选中用户被设置为null时，自动设置当前用户为选中用户
  useEffect(() => {
    if (!selectedUser && currentUser) {
      setSelectedUser(currentUser);
    }
  }, [selectedUser, currentUser]);

  return (
    <UserContext.Provider
      value={{
        selectedUser,
        setSelectedUser,
        currentUser,
        setCurrentUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};