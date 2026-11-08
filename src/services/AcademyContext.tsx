import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';
import { AcademySettings } from '../types';

interface AcademyContextType {
  settings: AcademySettings | null;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AcademySettings>) => Promise<void>;
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AcademySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const data = await api.getAcademySettings();
      setSettings(data);
      
      // Sync with localStorage for speed and legacy support
      if (data) {
        localStorage.setItem('academy_name', data.name || '');
        localStorage.setItem('academy_logo', data.logo_url || '');
        if (data.theme) {
          document.documentElement.setAttribute('data-theme', data.theme);
          localStorage.setItem('academy_theme', data.theme);
        }
      }
    } catch (error) {
      console.error("Failed to load academy settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AcademySettings>) => {
    try {
      const updated = await api.updateAcademySettings(newSettings);
      if (updated) {
        setSettings(updated);
        // Sync immediate changes
        if (updated.theme) {
            document.documentElement.setAttribute('data-theme', updated.theme);
        }
      }
    } catch (error) {
      console.error("Failed to update academy settings:", error);
      throw error;
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <AcademyContext.Provider value={{ settings, isLoading, refreshSettings, updateSettings }}>
      {children}
    </AcademyContext.Provider>
  );
};

export const useAcademy = () => {
  const context = useContext(AcademyContext);
  if (context === undefined) {
    throw new Error('useAcademy must be used within an AcademyProvider');
  }
  return context;
};
