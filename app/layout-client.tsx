'use client';

import { useEffect } from 'react';
import { Dashboard } from '@/components/dashboard';
import { ProfileProvider, useProfile } from '@/inapp/context/ProfileContext';
import { initializeUserAccount } from '@/services/auth/initialize';
import { getAsset } from '@/services/editor/asset';

function ThemedDashboard({ children }: { children: React.ReactNode }) {
  const { asset } = useProfile();

  useEffect(() => {
    initializeUserAccount();
  }, []);

  return <Dashboard theme={asset?.theme}>{children}</Dashboard>;
}

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider loadAsset={getAsset}>
      <ThemedDashboard>{children}</ThemedDashboard>
    </ProfileProvider>
  );
}
