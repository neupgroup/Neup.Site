
'use client';

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { getSite } from '@/actions/editor/site';

const SESSION_STORAGE_KEY_NAME = 'profileName';
const SESSION_STORAGE_KEY_LOGO = 'logoUrl';
const SESSION_STORAGE_KEY_HIDE_SITENAME = 'hideSitename';


interface ProfileContextType {
  profileName: string;
  setProfileName: Dispatch<SetStateAction<string>>;
  logoUrl: string | null;
  setLogoUrl: Dispatch<SetStateAction<string | null>>;
  hideSitename: boolean;
  setHideSitename: Dispatch<SetStateAction<boolean>>;
  loading: { name: boolean, logo: boolean, hideSitename: boolean };
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileName, setProfileName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hideSitename, setHideSitename] = useState(false);
  const [loading, setLoading] = useState({ name: true, logo: true, hideSitename: true });

  useEffect(() => {
    async function initializeProfile() {
      setLoading({ name: true, logo: true, hideSitename: true });
      const cachedName = sessionStorage.getItem(SESSION_STORAGE_KEY_NAME);
      const cachedLogo = sessionStorage.getItem(SESSION_STORAGE_KEY_LOGO);
      const cachedHideSitename = sessionStorage.getItem(SESSION_STORAGE_KEY_HIDE_SITENAME);
      
      let needsFetch = false;

      if (cachedName) {
        setProfileName(cachedName);
        setLoading(prev => ({...prev, name: false}));
      } else {
        needsFetch = true;
      }
      
      if (cachedLogo) {
        setLogoUrl(cachedLogo);
         setLoading(prev => ({...prev, logo: false}));
      } else {
        needsFetch = true;
      }

      if (cachedHideSitename) {
          setHideSitename(cachedHideSitename === 'true');
          setLoading(prev => ({...prev, hideSitename: false}));
      } else {
          needsFetch = true;
      }

      if (needsFetch) {
        const { success, site } = await getSite();

        if (!cachedName) {
            const finalName = site?.name?.trim() ? site.name : 'Neup.Sites';
            setProfileName(finalName);
            if (success && site?.name) {
                sessionStorage.setItem(SESSION_STORAGE_KEY_NAME, site.name);
            }
            setLoading(prev => ({...prev, name: false}));
        }
        
        if (!cachedLogo) {
             const finalLogo = site?.logoUrl || null;
             setLogoUrl(finalLogo);
             if (success && finalLogo) {
                 sessionStorage.setItem(SESSION_STORAGE_KEY_LOGO, finalLogo);
             }
             setLoading(prev => ({...prev, logo: false}));
        }

         if (!cachedHideSitename) {
            const finalHideSitename = site?.hideSitename || false;
            setHideSitename(finalHideSitename);
            if (success) {
                sessionStorage.setItem(SESSION_STORAGE_KEY_HIDE_SITENAME, String(finalHideSitename));
            }
            setLoading(prev => ({...prev, hideSitename: false}));
        }
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

  // Effect to update sessionStorage whenever hideSitename changes
  useEffect(() => {
    sessionStorage.setItem(SESSION_STORAGE_KEY_HIDE_SITENAME, String(hideSitename));
  }, [hideSitename]);

  return (
    <ProfileContext.Provider value={{ profileName, setProfileName, logoUrl, setLogoUrl, hideSitename, setHideSitename, loading }}>
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
