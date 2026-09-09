 'use client';

import { useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '#/components/ui/button';
import { useProfile } from '@/inapp/context/ProfileContext';

function createApplicationExport(asset: any) {
  const modules = asset.modules ?? {};
  const moduleConfig = modules as Record<string, unknown>;

  return {
    identity: {
      name: asset.name,
      description: asset.description,
      url: asset.url,
      logoUrl: asset.logoUrl,
      icons: asset.icons,
      hideSitename: asset.hideSitename,
      hideLogo: asset.hideLogo,
      socialProfiles: asset.socialProfiles,
      contactEmail: asset.contactEmail,
      contactPhone: asset.contactPhone,
    },
    design: asset.theme ?? {},
    storage: moduleConfig.storage ?? {},
    notifications: moduleConfig.notifications ?? {},
    features: {
      ...(asset.features ?? {}),
      fileStorage: moduleConfig.fileStorage ?? {},
      notifications: moduleConfig.notifications ?? {},
    },
    account: moduleConfig.account ?? asset.features?.accountSupport ?? {},
    logica: moduleConfig.logica ?? modules,
    // Preserve the complete source configuration so future settings are exported too.
    application: asset,
  };
}

function downloadApplication(asset: any) {
  const file = new Blob([JSON.stringify(createApplicationExport(asset), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'application.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ExportSettingsPage() {
  const { asset, loading } = useProfile();
  const exportProfile = useCallback(() => {
    if (asset) downloadApplication(asset);
  }, [asset]);

  return (
    <div className="w-full space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Export</h1>
        <p className="text-muted-foreground">Export your complete application configuration.</p>
      </header>
      <div className="space-y-6">
        <div className="max-w-2xl space-y-3 text-sm text-muted-foreground">
          <p>Use this profile when generating an application so its identity, features, and configuration are carried through.</p>
          <p>It also helps ensure your brand follows the same colors, typography, spacing, and corner treatments when creating designs.</p>
          <p>Share it with teams working on digital or physical marketing so campaigns stay aligned with your application.</p>
        </div>

        <div>
          <Button type="button" onClick={exportProfile} disabled={loading || !asset}>
            <Download className="mr-2 h-4 w-4" />
            {loading ? 'Preparing export...' : 'Download application.json'}
          </Button>
        </div>
      </div>
    </div>
  );
}
