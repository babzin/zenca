import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const lightTheme = {
  background: '#ffffff',
  card: '#f9f9f9',
  text: '#333333',
  textSecondary: '#666666',
  border: '#eeeeee',
  primary: '#d32f2f',
  primaryLight: '#ffebee',
  inputBackground: '#f5f5f5',
  inputBorder: '#cccccc',
  modalOverlay: 'rgba(0,0,0,0.6)',
  tabBarActive: '#d32f2f',
  tabBarInactive: '#757575',
  headerBackground: '#ffffff',
  headerText: '#d32f2f',
  shadow: '#000000',
};

const darkTheme = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#e0e0e0',
  textSecondary: '#aaaaaa',
  border: '#333333',
  primary: '#d32f2f',
  primaryLight: '#4a2a2a',
  inputBackground: '#2a2a2a',
  inputBorder: '#444444',
  modalOverlay: 'rgba(0,0,0,0.8)',
  tabBarActive: '#d32f2f',
  tabBarInactive: '#aaaaaa',
  headerBackground: '#1a1a1a',
  headerText: '#d32f2f',
  shadow: '#000000',
};

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system');

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem('@zenca_theme_mode');
      if (saved) setThemeMode(saved);
    };
    loadTheme();
  }, []);

  const toggleTheme = (mode) => {
    setThemeMode(mode);
    AsyncStorage.setItem('@zenca_theme_mode', mode);
  };

  const getCurrentTheme = () => {
    if (themeMode === 'system') {
      return systemScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getCurrentTheme();
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};