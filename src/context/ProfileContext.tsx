
'use client';

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { getSite, type Site } from '@/actions/editor/site';
import { validateSession, saveSessionData, getCookie } from '@/lib/session-manager';

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
        // Validate session
        const sessionValidation = validateSession();

        if (!sessionValidation.valid) {
          console.log('Session invalid:', sessionValidation.reason);

          // Clear sessionStorage
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(SESSION_STORAGE_KEY_SITE);
          }

          // Automatically fetch fresh data instead of showing banner
          console.log('Fetching fresh data due to invalid session...');
          const { success, site: dbSite } = await getSite();
          if (success && dbSite) {
            setSite(dbSite);

            // Save to sessionStorage
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(SESSION_STORAGE_KEY_SITE, JSON.stringify(dbSite));
            }

            // Save session metadata
            const cookieSiteId = getCookie('siteId');
            if (cookieSiteId) {
              saveSessionData(cookieSiteId);
            }
          }
          setLoading(false);
          return;
        }

        // Try to get from sessionStorage first
        const cachedSite = typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem(SESSION_STORAGE_KEY_SITE)
          : null;

        if (cachedSite && sessionValidation.valid) {
          const parsedSite = JSON.parse(cachedSite);
          setSite(parsedSite);
          setLoading(false);
        } else {
          // Fetch from server
          const { success, site: dbSite } = await getSite();
          if (success && dbSite) {
            setSite(dbSite);

            // Save to sessionStorage
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(SESSION_STORAGE_KEY_SITE, JSON.stringify(dbSite));
            }

            // Save session metadata
            const cookieSiteId = getCookie('siteId');
            if (cookieSiteId) {
              saveSessionData(cookieSiteId);
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to initialize profile:", error);
        setLoading(false);
      }
    }

    initializeProfile();
  }, []);

  // Update sessionStorage when site changes
  useEffect(() => {
    if (site && typeof sessionStorage !== 'undefined') {
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
