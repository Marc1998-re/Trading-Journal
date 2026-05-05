import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

const CookieConsentContext = createContext(null);

export const useConsentContext = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useConsentContext must be used within a ConsentProvider');
  }
  return context;
};

export const ConsentProvider = ({ children }) => {
  const [isCookieConsentGiven, setIsCookieConsentGiven] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConsent = () => {
      const storedConsent = localStorage.getItem('cookieConsent');
      if (storedConsent === 'true') {
        setIsCookieConsentGiven(true);
      }
      setIsLoading(false);
    };
    
    checkConsent();
  }, []);

  const saveConsentToDatabase = async (preferences) => {
    if (pb.authStore.isValid && pb.authStore.model?.id) {
      try {
        // Check if a record already exists for this user
        const existingRecords = await pb.collection('cookieConsent').getFullList({
          filter: `userId = "${pb.authStore.model.id}"`,
          $autoCancel: false
        });

        if (existingRecords.length > 0) {
          await pb.collection('cookieConsent').update(existingRecords[0].id, {
            consentGiven: true,
            preferences: JSON.stringify(preferences)
          }, { $autoCancel: false });
        } else {
          await pb.collection('cookieConsent').create({
            userId: pb.authStore.model.id,
            consentGiven: true,
            preferences: JSON.stringify(preferences)
          }, { $autoCancel: false });
        }
      } catch (error) {
        console.error('Failed to save cookie consent to database:', error);
      }
    }
  };

  const acceptCookies = (preferences = { essential: true, auth: true, email: true }) => {
    localStorage.setItem('cookieConsent', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    setIsCookieConsentGiven(true);
    setIsPreferencesOpen(false);
    saveConsentToDatabase(preferences);
  };

  const manageCookies = () => {
    setIsPreferencesOpen(true);
  };

  const closePreferences = () => {
    setIsPreferencesOpen(false);
  };

  const value = {
    isCookieConsentGiven,
    isPreferencesOpen,
    acceptCookies,
    manageCookies,
    closePreferences,
    isLoading
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};