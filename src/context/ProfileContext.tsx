
'use client';

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { getSite, type Site, type SiteTheme } from '@/actions/editor/site';

const SESSION_STORAGE_KEY_SITE = 'siteProfileData';

interface ProfileContextType {
  site: Site | null;
  setSite: Dispatch<SetStateAction<Site | null>>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeProfile() {
      setLoading(true);
      try {
        const cachedSite = sessionStorage.getItem(SESSION_STORAGE_KEY_SITE);
        if (cachedSite) {
          setSite(JSON.parse(cachedSite));
        } else {
          const { success, site: dbSite } = await getSite();
          if (success && dbSite) {
            setSite(dbSite);
            sessionStorage.setItem(SESSION_STORAGE_KEY_SITE, JSON.stringify(dbSite));
          }
        }
      } catch (error) {
        console.error("Failed to initialize profile:", error);
      } finally {
        setLoading(false);
      }
    }
    initializeProfile();
  }, []);

  useEffect(() => {
    if (site) {
      sessionStorage.setItem(SESSION_STORAGE_KEY_SITE, JSON.stringify(site));
    }
  }, [site]);

  return (
    <ProfileContext.Provider value={{ site, setSite, loading }}>
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
