
'use client';

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { getProfile } from '@/actions/profile';

interface ProfileContextType {
  profileName: string;
  setProfileName: Dispatch<SetStateAction<string>>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileName, setProfileName] = useState('Neup.Sites');

  useEffect(() => {
    async function fetchProfileName() {
        const { success, profile } = await getProfile();
        if (success && profile?.name) {
            setProfileName(profile.name);
        }
    }
    fetchProfileName();
  }, []);

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
