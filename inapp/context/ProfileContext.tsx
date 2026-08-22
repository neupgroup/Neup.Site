'use client';

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { validateSession, saveSessionData, getCookie } from '@/inapp/helpers/session-manager';

const SESSION_STORAGE_KEY_ARTIFACT = 'assetProfileData';

export type CoreAssetProfile = {
  id?: string;
  name?: string;
  theme?: any;
  domains?: any;
  hideSitename?: boolean;
  description?: string;
  socialProfiles?: any[];
  contactEmail?: any[];
  contactPhone?: any[];
  icons?: any;
  logoUrl?: string;
  [key: string]: any;
};

type LoadAssetProfile = () => Promise<{ success: boolean; asset?: CoreAssetProfile | null; error?: string }>;

interface ProfileContextType {
  asset: CoreAssetProfile | null;
  setAsset: Dispatch<SetStateAction<CoreAssetProfile | null>>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children, loadAsset }: { children: ReactNode; loadAsset?: LoadAssetProfile }) {
  const [asset, setAsset] = useState<CoreAssetProfile | null>(null);
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
            sessionStorage.removeItem(SESSION_STORAGE_KEY_ARTIFACT);
          }

          // Automatically fetch fresh data instead of showing banner
          console.log('Fetching fresh data due to invalid session...');
          const { success, asset: dbAsset } = loadAsset
            ? await loadAsset()
            : { success: true, asset: undefined };
          if (success && dbAsset) {
            setAsset(dbAsset);

            // Save to sessionStorage
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(SESSION_STORAGE_KEY_ARTIFACT, JSON.stringify(dbAsset));
            }

            // Save session metadata
            const cookieAssetId = getCookie('assetId');
            if (cookieAssetId) {
              saveSessionData(cookieAssetId);
            }
          }
          setLoading(false);
          return;
        }

        // Try to get from sessionStorage first
        const cachedAsset = typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem(SESSION_STORAGE_KEY_ARTIFACT)
          : null;

        if (cachedAsset && sessionValidation.valid) {
          const parsedAsset = JSON.parse(cachedAsset);
          setAsset(parsedAsset);
          setLoading(false);
        } else {
          // Fetch from server
          const { success, asset: dbAsset } = loadAsset
            ? await loadAsset()
            : { success: true, asset: undefined };
          if (success && dbAsset) {
            setAsset(dbAsset);

            // Save to sessionStorage
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(SESSION_STORAGE_KEY_ARTIFACT, JSON.stringify(dbAsset));
            }

            // Save session metadata
            const cookieAssetId = getCookie('assetId');
            if (cookieAssetId) {
              saveSessionData(cookieAssetId);
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
  }, [loadAsset]);

  // Update sessionStorage when asset changes
  useEffect(() => {
    if (asset && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY_ARTIFACT, JSON.stringify(asset));
    }
  }, [asset]);

  return (
    <ProfileContext.Provider value={{ asset, setAsset, loading }}>
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
