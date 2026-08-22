'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { Dashboard } from '@/components/dashboard';
import { ProfileProvider, useProfile } from '@/inapp/context/ProfileContext';
import { clearSession } from '@/inapp/helpers/session-manager';
import { initializeUserAccount } from '@/services/auth/initialize';
import { getAsset } from '@/services/editor/asset';

function ThemedDashboard({ children }: { children: React.ReactNode }) {
  const { asset } = useProfile();

  return <Dashboard theme={asset?.theme}>{children}</Dashboard>;
}

export function AppLayoutClient({
  children,
  currentAccountId,
}: {
  children: React.ReactNode;
  currentAccountId: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeAccountId, setActiveAccountId] = useState<string | null>(currentAccountId);

  useEffect(() => {
    setActiveAccountId(currentAccountId);
  }, [currentAccountId]);

  useEffect(() => {
    let cancelled = false;

    async function syncAccountSession() {
      const result = await initializeUserAccount();
      if (cancelled) return;

      const nextAccountId = result.accountId ?? null;
      if (nextAccountId === activeAccountId) {
        return;
      }

      clearSession();
      setActiveAccountId(nextAccountId);
    }

    syncAccountSession();

    return () => {
      cancelled = true;
    };
  }, [activeAccountId, pathname, searchParams]);

  return (
    <ProfileProvider
      key={activeAccountId ?? 'no-account'}
      loadAsset={getAsset}
      currentAccountId={activeAccountId}
    >
      <ThemedDashboard>{children}</ThemedDashboard>
    </ProfileProvider>
  );
}
