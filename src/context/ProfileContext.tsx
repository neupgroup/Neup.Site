
'use client';

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { getSite } from '@/actions/editor/site';

const SESSION_STORAGE_KEY_NAME = 'profileName';
const SESSION_STORAGE_KEY_LOGO = 'logoUrl';


interface ProfileContextType {
  profileName: string;
  setProfileName: Dispatch<SetStateAction<string>>;
  logoUrl: string | null;
  setLogoUrl: Dispatch<SetStateAction<string | null>>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileName, setProfileName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeProfile() {
      setLoading(true);
      const cachedName = sessionStorage.getItem(SESSION_STORAGE_KEY_NAME);
      const cachedLogo = sessionStorage.getItem(SESSION_STORAGE_KEY_LOGO);
      
      if (cachedName) {
        setProfileName(cachedName);
      }
      if (cachedLogo) {
        setLogoUrl(cachedLogo);
      }

      if (cachedName && cachedLogo) {
        setLoading(false);
      } else {
        const { success, site } = await getSite();

        if (!cachedName) {
            const finalName = site?.name?.trim() ? site.name : 'Neup.Sites';
            setProfileName(finalName);
            if (success && site?.name) {
                sessionStorage.setItem(SESSION_STORAGE_KEY_NAME, site.name);
            }
        }
        
        if (!cachedLogo) {
             const finalLogo = site?.logoUrl || null;
             setLogoUrl(finalLogo);
             if (success && finalLogo) {
                 sessionStorage.setItem(SESSION_STORAGE_KEY_LOGO, finalLogo);
             }
        }
        setLoading(false);
      }
    }
    initializeProfile();
  }, []);

  // Effect to update sessionStorage whenever profileName changes
  useEffect(() => {
    if (profileName && profileName !== 'Neup.Sites') {
        sessionStorage.setItem(SESSION_STORAGE_KEY_NAME, profileName);
    }
  }, [profileName]);

  // Effect to update sessionStorage whenever logoUrl changes
  useEffect(() => {
    if (logoUrl) {
        sessionStorage.setItem(SESSION_STORAGE_KEY_LOGO, logoUrl);
    } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY_LOGO);
    }
  }, [logoUrl]);

  return (
    <ProfileContext.Provider value={{ profileName, setProfileName, logoUrl, setLogoUrl, loading }}>
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
