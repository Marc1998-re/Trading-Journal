import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
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
  const { currentUser, userSettings, refreshUserSettings } = useAuth();
  const savingRef = useRef(false);
  const [savingTheme, setSavingTheme] = useState(false);
  
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
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
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('theme-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [theme]);

  // Apply theme to DOM document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = async (newTheme) => {
    if (!['light', 'dark'].includes(newTheme) || savingRef.current || newTheme === theme) return;
    setThemeState(newTheme);
    
    // Persist to database if logged in
    if (currentUser) {
      savingRef.current = true;
      setSavingTheme(true);
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
          await refreshUserSettings();
        }
      } catch (error) {
        console.error('Failed to save theme preference to database', error);
        toast.error('Design lokal gespeichert. Die Synchronisierung mit deinem Konto ist fehlgeschlagen.');
      } finally {
        savingRef.current = false;
        setSavingTheme(false);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, savingTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
