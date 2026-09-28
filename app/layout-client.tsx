'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { Dashboard } from '@/components/dashboard';
import { ProfileProvider, useProfile } from '@/inapp/context/ProfileContext';
import { clearSession } from '@/inapp/helpers/session-manager';
import { initializeUserAccount } from '@/services/auth/initialize';
import { getAsset } from '@/services/editor/asset';
import type { Asset } from '@/services/asset/type';
import type { SelfAccountBasics } from '@/services/accounts';

function ThemedDashboard({
  children,
  initialAsset,
  initialAccountBasics,
}: {
  children: React.ReactNode;
  initialAsset?: Asset;
  initialAccountBasics?: SelfAccountBasics | null;
}) {
  const { asset } = useProfile();

  return (
    <Dashboard
      theme={asset?.theme ?? initialAsset?.theme}
      initialAsset={initialAsset}
      initialAccountBasics={initialAccountBasics}
    >
      {children}
    </Dashboard>
  );
}

export function AppLayoutClient({
  children,
  currentAccountId,
  initialAsset,
  initialAccountBasics,
}: {
  children: React.ReactNode;
  currentAccountId: string | null;
  initialAsset?: Asset;
  initialAccountBasics?: SelfAccountBasics | null;
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
      <ThemedDashboard initialAsset={initialAsset} initialAccountBasics={initialAccountBasics}>
        {children}
      </ThemedDashboard>
    </ProfileProvider>
  );
}
