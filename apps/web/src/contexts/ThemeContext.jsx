import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { currentUser, userSettings } = useAuth();
  
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Keep internal state in sync if AuthContext loads/updates it
  useEffect(() => {
    const handleSync = () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark') && savedTheme !== theme) {
        setThemeState(savedTheme);
      }
    };
    
    window.addEventListener('theme-updated', handleSync);
    return () => window.removeEventListener('theme-updated', handleSync);
  }, [theme]);

  // Apply theme to DOM document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    
    // Persist to database if logged in
    if (currentUser) {
      try {
        if (userSettings?.id) {
          await pb.collection('userSettings').update(userSettings.id, { theme: newTheme }, { $autoCancel: false });
        } else {
          // If no settings exist yet, create them with the new theme
          await pb.collection('userSettings').create({
            userId: currentUser.id,
            theme: newTheme,
            startingBalance: 10000, // Default required fields
            commissionPercentage: 0
          }, { $autoCancel: false });
        }
      } catch (error) {
        console.error('Failed to save theme preference to database', error);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};