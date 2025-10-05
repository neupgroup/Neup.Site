
'use client';

import { ProfileProvider, useProfile } from '@/context/ProfileContext';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Dashboard } from '@/components/dashboard';
import { cn } from '@/lib/utils';
import type { Site } from '@/schemas/site';

function ThemedDashboard({ children }: { children: React.ReactNode }) {
  const { theme } = useProfile();
  return <Dashboard theme={theme}>{children}</Dashboard>;
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
