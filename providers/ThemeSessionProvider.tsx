// providers/ThemeProvider.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Appearance } from 'react-native';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeSessionProvider = ({ children }: { children: ReactNode }) => {
  // Sett dark mode som standard her
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const systemColorScheme = Appearance.getColorScheme();
    // Overstyr med dark mode som standard
    if (systemColorScheme === 'dark') {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(true); // Tving dark mode som standard, selv om systemet er i lys modus
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
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
