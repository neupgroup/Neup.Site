
'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Users, Network, User, KeyRound, Terminal, RefreshCw, Palette, Home, Upload, Download, Sparkles } from 'lucide-react';
import { usePageTitle } from '#/core/hooks/use-page-title';
import { appendSelectedProject } from '@/inapp/helpers/application-mode';

export default function SettingsPage() {
  usePageTitle('Settings');
  const searchParams = useSearchParams();
  const selectedProject = searchParams.get('selectedProject');

  const settingsOptions = [
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
    <div className="w-full space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings.</p>
      </header>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">Manage your site profile, identity, and visual design.</p>
        </div>
        <div className="space-y-0">
          <Link href={appendSelectedProject('/home', selectedProject)} className="block w-full rounded-t-md border p-4 transition-colors hover:bg-muted/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted"><Home className="h-6 w-6 text-primary" /></div>
                <div><h3 className="font-semibold">Home</h3><p className="text-sm text-muted-foreground">View your site dashboard and overview.</p></div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          </Link>
          <Link href={appendSelectedProject('/settings/identity', selectedProject)} className="block w-full border-x border-b-0 p-4 transition-colors hover:bg-muted/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted"><User className="h-6 w-6 text-primary" /></div>
                <div><h3 className="font-semibold">Identity</h3><p className="text-sm text-muted-foreground">Manage your site identity and contact information.</p></div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          </Link>
          <Link href={appendSelectedProject('/settings/design', selectedProject)} className="block w-full border-x border-b-0 p-4 transition-colors hover:bg-muted/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted"><Palette className="h-6 w-6 text-primary" /></div>
                <div><h3 className="font-semibold">Design</h3><p className="text-sm text-muted-foreground">Customize colors, typography, spacing, and elevation.</p></div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          </Link>
          <Link href={appendSelectedProject('/settings/features', selectedProject)} className="block w-full rounded-b-md border-x border-b p-4 transition-colors hover:bg-muted/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted"><Sparkles className="h-6 w-6 text-primary" /></div>
                <div><h3 className="font-semibold">Features</h3><p className="text-sm text-muted-foreground">Configure the features available on your site.</p></div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Import / Export</h2>
          <p className="text-sm text-muted-foreground">Move configuration and content into or out of your site.</p>
        </div>
        <div className="space-y-0">
          <Link href={appendSelectedProject('/settings/import', selectedProject)} className="block w-full rounded-t-md border p-4 transition-colors hover:bg-muted/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted"><Upload className="h-6 w-6 text-primary" /></div>
                <div><h3 className="font-semibold">Import</h3><p className="text-sm text-muted-foreground">Import site configuration and content.</p></div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          </Link>
          <Link href={appendSelectedProject('/settings/export', selectedProject)} className="block w-full rounded-b-md border-x border-b p-4 transition-colors hover:bg-muted/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted"><Download className="h-6 w-6 text-primary" /></div>
                <div><h3 className="font-semibold">Export</h3><p className="text-sm text-muted-foreground">Export site configuration and content.</p></div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">More Details</h2>
          <p className="text-sm text-muted-foreground">More options for detailed configuration.</p>
        </div>
        <div className="space-y-0">
          {settingsOptions.map((option, index) => {
            const isFirst = index === 0;
            const isLast = index === settingsOptions.length - 1;

            return (
              <Link
                key={option.title}
                href={appendSelectedProject(option.href, selectedProject)}
                className={[
                  'block w-full border p-4 transition-colors hover:bg-muted/30',
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
      </section>
    </div>
  );
}
