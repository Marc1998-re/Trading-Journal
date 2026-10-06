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
  const [verificationEmail, setVerificationEmail] = useState(()=>sessionStorage.getItem('verificationEmail')||'');
  useEffect(()=>{sessionStorage.setItem('verificationEmail',verificationEmail);},[verificationEmail]);

  useEffect(() => {
    const initAuth = async () => {
      if ((pb.usesCookies && !window.location.pathname.startsWith('/demo')) || pb.authStore.isValid) {
        try {
          const refreshed = await pb.collection('users').authRefresh({requestKey:null});
          setCurrentUser(refreshed.record);
        } catch (error) {
          if (error.status === 401 || error.status === 403) pb.authStore.clear();
          setInitialLoading(false);
          return;
        }
        
        // Fetch user settings on load to get theme and other preferences
        try {
          const res = await pb.collection('userSettings').getList(1, 1, {
            filter: { userId: pb.authStore.model.id },
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

    const unsubscribe=pb.authStore.onChange((_token,record)=>setCurrentUser(record));
    initAuth();
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      
      if (authData.record.verified === false) {
        setVerificationEmail(email);
        setIsVerificationPending(true);
        pb.authStore.clear();
        throw new Error('Bitte bestätige zuerst deine E-Mail-Adresse.');
      }
      
      setCurrentUser(authData.record);
      setIsVerificationPending(false);
      
      // Fetch settings after login
      try {
        const res = await pb.collection('userSettings').getList(1, 1, {
          filter: { userId: authData.record.id },
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
        errorMsg === 'Bitte bestätige zuerst deine E-Mail-Adresse.' ||
        errorMsg.toLowerCase().includes('verify') ||
        responseMsg.toLowerCase().includes('verify') ||
        dataMsg.toLowerCase().includes('verify') ||
        dataMsg.includes('verification_required') ||
        responseMsg.toLowerCase().includes('bestätige')
      ) {
        setVerificationEmail(email);
        setIsVerificationPending(true);
        const pendingError=new Error('Bitte bestätige zuerst deine E-Mail-Adresse.');
        pendingError.code='verification_required';
        throw pendingError;
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

      let verificationRequested=false;
      try {
        await requestVerificationEmail(email);
        verificationRequested=true;
      } catch (e) {
        // Account creation succeeded; a mail failure must not trigger another signup.
      }

      return {...record,verificationRequested};
    } catch (error) {
      let errorMessage = 'Konto konnte nicht erstellt werden. Bitte versuche es erneut.';
      if (error.response?.data) {
        const data = error.response.data;
        const messages = [];
        if (data.email?.message) messages.push(`E-Mail: ${data.email.message}`);
        if (data.password?.message) messages.push(`Passwort: ${data.password.message}`);
        if (data.passwordConfirm?.message) messages.push(`Passwortbestätigung: ${data.passwordConfirm.message}`);
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
    if (!emailToUse) throw new Error('Keine E-Mail-Adresse zum erneuten Senden verfügbar.');
    return await requestVerificationEmail(emailToUse);
  };

  const verifyAndAutoLogin = async (token) => {
    try {
      await pb.collection('users').confirmVerification(token, { $autoCancel: false });
    } catch (error) {
      throw new Error(error.message || 'Ungültiger oder abgelaufener Bestätigungs-Token.');
    }

    setIsVerificationPending(false);
    setVerificationEmail('');
    if (pb.authStore.isValid) {
      try {
        const authData = await pb.collection('users').authRefresh({ $autoCancel: false });
        setCurrentUser(authData.record);
        setIsVerificationPending(false);
        return authData;
      } catch {
        pb.authStore.clear();
      }
    }
    return {verified:true};
  };

  const logout = async () => {
    if (pb.logout) await pb.logout();
    else pb.authStore.clear();
    setCurrentUser(null);
    setUserSettings(null);
    setIsVerificationPending(false);
    setVerificationEmail('');
  };

  const refreshUserSettings = async () => {
    if (!currentUser) return;
    try {
      const res = await pb.collection('userSettings').getList(1, 1, {
        filter: { userId: currentUser.id },
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
    if (!currentUser) throw new Error("Kein eingeloggter Nutzer gefunden.");

    if (pb.deleteUser) {
      await pb.deleteUser(password);
      setCurrentUser(null);
      setUserSettings(null);
      setIsVerificationPending(false);
      setVerificationEmail('');
      return true;
    }

    // 1. Verify the user's password
    try {
      await pb.collection('users').authWithPassword(currentUser.email, password, { $autoCancel: false });
    } catch (error) {
      throw new Error("Falsches Passwort. Bitte versuche es erneut.");
    }

    // 2. Delete all associated data
    const collectionsToClear = ['trades', 'userSettings', 'symbols', 'cookieConsent', 'tradingAccounts'];
    
    for (const collection of collectionsToClear) {
      try {
        const records = await pb.collection(collection).getFullList({
          filter: { userId: currentUser.id },
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
      throw new Error("Konto konnte nicht gelöscht werden. Bitte versuche es später erneut.");
    }

    // 4. Clear auth state and logout
    await logout();
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
          <p className="text-muted-foreground font-medium">Sitzung wird geladen...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
