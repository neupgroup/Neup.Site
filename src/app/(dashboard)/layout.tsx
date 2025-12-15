
'use client';

import { ProfileProvider, useProfile } from '@/context/ProfileContext';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Dashboard } from '@/components/dashboard';
import { cn } from '@/lib/utils';
import type { Site } from '@/schemas/site';
import { useEffect } from 'react';
import { initializeUserAccount } from '@/actions/auth/initialize';

function ThemedDashboard({ children }: { children: React.ReactNode }) {
  const { site } = useProfile();
  
  useEffect(() => {
    // Ensure an account_id is set for the session
    initializeUserAccount();
  }, []);

  return <Dashboard theme={site?.theme}>{children}</Dashboard>;
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
