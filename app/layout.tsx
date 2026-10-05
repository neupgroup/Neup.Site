
import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider } from '@neup/components/ui/sidebar';
import BaseRootLayout from '@neup/components/layout/RootLayout';
import { getAsset } from '@/services/editor/asset';
import { getSelfAccountBasics } from '@/services/accounts';
import { initializeUserAccount } from '@/services/auth/initialize';
import { cn } from '@neup/core/utils';
import { AppLayoutClient } from './layout-client';
import { getAppDescription } from '@neup/logica/base/identity';
import { getFavicon } from '@neup/logica/base/assets';


export const metadata: Metadata = {
  description: getAppDescription(),
  icons: { icon: getFavicon() },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ asset }, { accountId }, { basics: accountBasics }] = await Promise.all([
    getAsset(),
    initializeUserAccount(),
    getSelfAccountBasics(),
  ]);
  return (
    <html lang="en" suppressHydrationWarning className="radius-medium light typography-modern elevation-subtle">
      <head />
      <body className={cn("font-body antialiased")}>
        <BaseRootLayout>
          <SidebarProvider>
            <AppLayoutClient
              currentAccountId={accountId}
              initialAsset={asset}
              initialAccountBasics={accountBasics}
            >
              {children}
            </AppLayoutClient>
          </SidebarProvider>
        </BaseRootLayout>
      </body>
    </html>
  );
}
