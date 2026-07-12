
'use client';

import { ProfileProvider, useProfile } from '@/core/context/ProfileContext';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Dashboard } from '@/components/dashboard';
import { useEffect } from 'react';
import { initializeUserAccount } from '@/services/auth/initialize';
import { getAsset } from '@/services/editor/asset';

function ThemedDashboard({ children }: { children: React.ReactNode }) {
  const { asset } = useProfile();
  
  useEffect(() => {
    // Ensure an account_id is set for the session
    initializeUserAccount();
  }, []);

  return <Dashboard theme={asset?.theme}>{children}</Dashboard>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ProfileProvider loadAsset={getAsset}>
      <ThemedDashboard>{children}</ThemedDashboard>
    </ProfileProvider>
  );
}
