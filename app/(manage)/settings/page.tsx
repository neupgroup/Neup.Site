
'use client';
import Link from 'next/link';
import { ChevronRight, Users, Network, User, KeyRound, Terminal, RefreshCw } from 'lucide-react';
import { usePageTitle } from '@/core/hooks/use-page-title';

export default function SettingsPage() {
  usePageTitle('Settings');

  const settingsOptions = [
    {
      title: 'Profile',
      description: 'Manage your site profile and contact information.',
      icon: <User className="h-6 w-6 text-primary" />,
      href: '/settings/profile',
    },
    {
      title: 'Accounts',
      description: 'Manage your linked accounts like GitHub.',
      icon: <Users className="h-6 w-6 text-primary" />,
      href: '/settings/accounts',
    },
    {
      title: 'API Tokens',
      description: 'Generate and manage tokens for API access.',
      icon: <KeyRound className="h-6 w-6 text-primary" />,
      href: '/settings/tokens',
    },
    {
      title: 'Domains and Proxy',
      description: 'Manage your site domains and reverse proxy settings.',
      icon: <Network className="h-6 w-6 text-primary" />,
      href: '/settings/domain',
    },
    {
      title: 'Development Info',
      description: 'View technical details, server allocation, and ports.',
      icon: <Terminal className="h-6 w-6 text-primary" />,
      href: '/settings/info',
    },
    {
      title: 'Syncer',
      description: 'Manage synchronization workflows and sync-related controls.',
      icon: <RefreshCw className="h-6 w-6 text-primary" />,
      href: '/settings/syncer',
    },
  ];

  return (
    <div className="w-full">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings.</p>
      </header>

      <div className="space-y-0">
        {settingsOptions.map((option, index) => {
          const isFirst = index === 0;
          const isLast = index === settingsOptions.length - 1;

          return (
            <Link
              key={option.title}
              href={option.href}
              className={[
                'block w-full border p-4 transition-colors hover:bg-muted/90',
                isFirst ? 'rounded-t-md' : 'rounded-t-none',
                isLast ? 'rounded-b-md' : 'rounded-b-none',
                !isLast ? 'border-b-0' : '',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                    {option.icon}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h2 className="text-base font-semibold">{option.title}</h2>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
