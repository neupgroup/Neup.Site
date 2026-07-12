
'use client';

import { ProfileProvider, useProfile } from '@/core/context/ProfileContext';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Dashboard } from '@/components/dashboard';
import { cn } from '@/core/utils';
import type { Asset } from '@/schemas/asset';
import { useEffect } from 'react';
import { initializeUserAccount } from '@/services/auth/initialize';

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
    <ProfileProvider>
      <ThemedDashboard>{children}</ThemedDashboard>
    </ProfileProvider>
  );
}
