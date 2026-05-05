import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      if (pb.authStore.isValid) {
        setCurrentUser(pb.authStore.model);
        
        // Fetch user settings on load to get theme and other preferences
        try {
          const res = await pb.collection('userSettings').getList(1, 1, {
            filter: `userId="${pb.authStore.model.id}"`,
            $autoCancel: false
          });
          
          if (res.items.length > 0) {
            const settings = res.items[0];
            setUserSettings(settings);
            
            // Pre-apply theme to localStorage so ThemeContext picks it up synchronously
            if (settings.theme && (settings.theme === 'light' || settings.theme === 'dark')) {
              localStorage.setItem('theme', settings.theme);
              // Also apply class immediately to prevent flash before ThemeContext mounts
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add(settings.theme);
            }
          }
        } catch (error) {
          console.error("Failed to fetch user settings during auth init:", error);
        }
      }
      setInitialLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      
      if (authData.record.verified === false) {
        setVerificationEmail(email);
        setIsVerificationPending(true);
        setCurrentUser(authData.record);
        throw new Error('Please verify your email first.');
      }
      
      setCurrentUser(authData.record);
      setIsVerificationPending(false);
      
      // Fetch settings after login
      try {
        const res = await pb.collection('userSettings').getList(1, 1, {
          filter: `userId="${authData.record.id}"`,
          $autoCancel: false
        });
        if (res.items.length > 0) {
          setUserSettings(res.items[0]);
          if (res.items[0].theme) {
            localStorage.setItem('theme', res.items[0].theme);
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(res.items[0].theme);
            // Dispatch a custom event so ThemeContext can sync immediately if already mounted
            window.dispatchEvent(new Event('theme-updated'));
          }
        }
      } catch (e) {
        console.error("Failed to fetch settings after login", e);
      }

      return authData;
    } catch (error) {
      const errorMsg = error.message || '';
      const responseMsg = error.response?.message || '';
      const dataMsg = JSON.stringify(error.response?.data || {});
      
      if (
        errorMsg === 'Please verify your email first.' ||
        errorMsg.toLowerCase().includes('verify') ||
        responseMsg.toLowerCase().includes('verify') ||
        dataMsg.toLowerCase().includes('verify')
      ) {
        setVerificationEmail(email);
        setIsVerificationPending(true);
        throw new Error('Please verify your email first.');
      }
      throw error;
    }
  };

  const signup = async (email, password, passwordConfirm, name) => {
    try {
      const record = await pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        name,
        verified: false,
      }, { $autoCancel: false });

      setVerificationEmail(email);
      setIsVerificationPending(true);

      try {
        await requestVerificationEmail(email);
      } catch (e) {
        console.warn("Manual verification request failed:", e);
      }

      return record;
    } catch (error) {
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.response?.data) {
        const data = error.response.data;
        const messages = [];
        if (data.email?.message) messages.push(`Email: ${data.email.message}`);
        if (data.password?.message) messages.push(`Password: ${data.password.message}`);
        if (data.passwordConfirm?.message) messages.push(`Password Confirmation: ${data.passwordConfirm.message}`);
        if (messages.length > 0) {
          errorMessage = messages.join(' | ');
        } else if (error.response?.message) {
          errorMessage = error.response.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  };

  const requestVerificationEmail = async (email) => {
    return await pb.collection('users').requestVerification(email, { $autoCancel: false });
  };

  const resendVerificationEmail = async (emailToUse = verificationEmail) => {
    if (!emailToUse) throw new Error('No email address available to resend verification.');
    return await requestVerificationEmail(emailToUse);
  };

  const verifyAndAutoLogin = async (token) => {
    try {
      await pb.collection('users').confirmVerification(token, { $autoCancel: false });
    } catch (error) {
      throw new Error(error.message || 'Invalid or expired verification token.');
    }

    try {
      if (pb.authStore.isValid) {
        const authData = await pb.collection('users').authRefresh({ $autoCancel: false });
        setCurrentUser(authData.record);
        setIsVerificationPending(false);
        return authData;
      } else {
        throw new Error('No active session found.');
      }
    } catch (error) {
      throw new Error('Verification successful but login failed. Please log in manually.');
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
    setUserSettings(null);
    setIsVerificationPending(false);
    setVerificationEmail('');
  };

  const refreshUserSettings = async () => {
    if (!currentUser) return;
    try {
      const res = await pb.collection('userSettings').getList(1, 1, {
        filter: `userId="${currentUser.id}"`,
        $autoCancel: false
      });
      if (res.items.length > 0) {
        setUserSettings(res.items[0]);
      }
    } catch (error) {
      console.error("Failed to refresh user settings", error);
    }
  };

  const deleteAccount = async (password) => {
    if (!currentUser) throw new Error("No authenticated user found.");

    // 1. Verify the user's password
    try {
      await pb.collection('users').authWithPassword(currentUser.email, password, { $autoCancel: false });
    } catch (error) {
      throw new Error("Incorrect password. Please try again.");
    }

    // 2. Delete all associated data
    const collectionsToClear = ['trades', 'userSettings', 'symbols', 'cookieConsent', 'tradingAccounts'];
    
    for (const collection of collectionsToClear) {
      try {
        const records = await pb.collection(collection).getFullList({
          filter: `userId="${currentUser.id}"`,
          $autoCancel: false
        });
        
        for (const record of records) {
          await pb.collection(collection).delete(record.id, { $autoCancel: false });
        }
      } catch (err) {
        console.error(`Failed to delete records in ${collection}:`, err);
        // Continue attempting to delete other collections even if one fails
      }
    }

    // 3. Delete the user account itself
    try {
      await pb.collection('users').delete(currentUser.id, { $autoCancel: false });
    } catch (err) {
      console.error("Failed to delete user record:", err);
      throw new Error("Failed to delete user account. Please try again later.");
    }

    // 4. Clear auth state and logout
    logout();
    return true;
  };

  const value = {
    currentUser,
    userSettings,
    refreshUserSettings,
    login,
    signup,
    logout,
    deleteAccount,
    isAuthenticated: !!currentUser,
    isVerificationPending,
    setIsVerificationPending,
    verificationEmail,
    requestVerificationEmail,
    resendVerificationEmail,
    verifyAndAutoLogin
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};