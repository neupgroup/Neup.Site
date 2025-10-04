
'use client';

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { getProfile } from '@/actions/profile';

const SESSION_STORAGE_KEY = 'profileName';

interface ProfileContextType {
  profileName: string;
  setProfileName: Dispatch<SetStateAction<string>>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileName, setProfileName] = useState('Neup.Sites');

  useEffect(() => {
    // Try to load from sessionStorage first
    const cachedName = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (cachedName) {
      setProfileName(cachedName);
    } else {
        // If not in session, fetch from the database
        async function fetchProfileName() {
            const { success, profile } = await getProfile();
            if (success && profile?.name) {
                setProfileName(profile.name);
                sessionStorage.setItem(SESSION_STORAGE_KEY, profile.name);
            }
        }
        fetchProfileName();
    }
  }, []);

  // Effect to update sessionStorage whenever profileName changes
  useEffect(() => {
    if (profileName !== 'Neup.Sites') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, profileName);
    }
  }, [profileName]);

  return (
    <ProfileContext.Provider value={{ profileName, setProfileName }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
