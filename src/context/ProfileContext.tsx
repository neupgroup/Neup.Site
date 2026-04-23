
'use client';

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { getArtifact, type Artifact } from '@/actions/editor/artifact';
import { validateSession, saveSessionData, getCookie } from '@/lib/session-manager';

const SESSION_STORAGE_KEY_ARTIFACT = 'artifactProfileData';

interface ProfileContextType {
  artifact: Artifact | null;
  setArtifact: Dispatch<SetStateAction<Artifact | null>>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
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
          const { success, artifact: dbArtifact } = await getArtifact();
          if (success && dbArtifact) {
            setArtifact(dbArtifact);

            // Save to sessionStorage
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(SESSION_STORAGE_KEY_ARTIFACT, JSON.stringify(dbArtifact));
            }

            // Save session metadata
            const cookieArtifactId = getCookie('artifactId');
            if (cookieArtifactId) {
              saveSessionData(cookieArtifactId);
            }
          }
          setLoading(false);
          return;
        }

        // Try to get from sessionStorage first
        const cachedArtifact = typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem(SESSION_STORAGE_KEY_ARTIFACT)
          : null;

        if (cachedArtifact && sessionValidation.valid) {
          const parsedArtifact = JSON.parse(cachedArtifact);
          setArtifact(parsedArtifact);
          setLoading(false);
        } else {
          // Fetch from server
          const { success, artifact: dbArtifact } = await getArtifact();
          if (success && dbArtifact) {
            setArtifact(dbArtifact);

            // Save to sessionStorage
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(SESSION_STORAGE_KEY_ARTIFACT, JSON.stringify(dbArtifact));
            }

            // Save session metadata
            const cookieArtifactId = getCookie('artifactId');
            if (cookieArtifactId) {
              saveSessionData(cookieArtifactId);
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

  // Update sessionStorage when artifact changes
  useEffect(() => {
    if (artifact && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY_ARTIFACT, JSON.stringify(artifact));
    }
  }, [artifact]);

  return (
    <ProfileContext.Provider value={{ artifact, setArtifact, loading }}>
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
