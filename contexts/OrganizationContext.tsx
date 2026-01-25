import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { initDatabase, getOrganizationName, saveOrganizationName } from '@/utils/database';

interface OrganizationContextType {
  organizationName: string;
  setOrganizationName: (name: string) => Promise<void>;
}

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [organizationName, setOrganizationNameState] = useState('系统名称');

  // 初始化数据库并加载机构名称
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
        const savedName = await getOrganizationName();
        if (savedName) {
          setOrganizationNameState(savedName);
        }
      } catch (error) {
        console.error('Error setting up database:', error);
      }
    };

    setupDatabase();
  }, []);

  // 更新机构名称
  const updateOrganizationName = async (name: string) => {
    try {
      await saveOrganizationName(name);
      setOrganizationNameState(name);
    } catch (error) {
      console.error('Error updating organization name:', error);
      throw error;
    }
  };

  return (
    <OrganizationContext.Provider value={{ organizationName, setOrganizationName: updateOrganizationName }}>
      {children}
    </OrganizationContext.Provider>
  );
};