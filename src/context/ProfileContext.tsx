
'use client';

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { getSites } from '@/actions/editor/site';

const SESSION_STORAGE_KEY = 'profileName';

interface ProfileContextType {
  profileName: string;
  setProfileName: Dispatch<SetStateAction<string>>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeProfile() {
      setLoading(true);
      const cachedName = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (cachedName) {
        setProfileName(cachedName);
        setLoading(false);
      } else {
        const { success, sites } = await getSites();
        // Assuming we use the first site for the profile name
        const site = sites && sites[0];
        const finalName = site?.name?.trim() ? site.name : 'Neup.Sites';
        setProfileName(finalName);
        if (success && site?.name) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, site.name);
        }
        setLoading(false);
      }
    }
    initializeProfile();
  }, []);

  // Effect to update sessionStorage whenever profileName changes
  useEffect(() => {
    if (profileName && profileName !== 'Neup.Sites') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, profileName);
    }
  }, [profileName]);

  return (
    <ProfileContext.Provider value={{ profileName, setProfileName, loading }}>
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
