
'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Rocket,
  LayoutTemplate,
  Bug,
  Home,
  Globe,
  Settings,
  Link as LinkIcon,
  Database,
  Server,
  Layers,
  Puzzle,
  Palette,
  HardDrive,
  CreditCard,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ProfileProvider, useProfile } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { Site } from '@/actions/editor/site';

function Header() {
  const { profileName, logoUrl, hideSitename, loading } = useProfile();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-background shadow">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-3">
          {loading.logo ? (
            <Skeleton className="h-6 w-6" />
          ) : logoUrl ? (
             <div className="relative h-6 w-auto" style={{ aspectRatio: 'auto' }}>
                <Image src={logoUrl} alt="Site Logo" layout="fill" objectFit="contain" className="!relative !h-6 !w-auto" />
             </div>
          ) : (
            <Rocket className="h-6 w-6 text-primary" />
          )}

          {!hideSitename && (
            <h1 className="font-headline text-xl font-semibold tracking-tight">
              {loading.name ? <Skeleton className="h-6 w-32" /> : (profileName?.trim() ? profileName : 'Neup.Sites')}
            </h1>
          )}
        </Link>
        <div className="text-lg font-semibold">Dashboard</div>
      </div>
    </header>
  );
}

export function Dashboard({ children, theme }: { children: React.ReactNode; theme?: Site['theme'] }) {
  const pathname = usePathname();
  const isRootPage = pathname.startsWith('/root');
  
  const generatedTheme = theme?.generated;

  // For root pages, we don't pass a theme, so we can avoid rendering the style tag.
  // For site pages, the theme prop will be provided.
  const renderThemeStyles = !isRootPage && generatedTheme;


  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {renderThemeStyles && (
        <style jsx global>{`
          :root {
              --background: ${generatedTheme.light.background};
              --foreground: ${generatedTheme.light.foreground};
              --card: ${generatedTheme.light.card};
              --card-foreground: ${generatedTheme.light.cardForeground};
              --popover: ${generatedTheme.light.popover};
              --popover-foreground: ${generatedTheme.light.popoverForeground};
              --primary: ${generatedTheme.light.primary};
              --primary-foreground: ${generatedTheme.light.primaryForeground};
              --secondary: ${generatedTheme.light.secondary};
              --secondary-foreground: ${generatedTheme.light.secondaryForeground};
              --muted: ${generatedTheme.light.muted};
              --muted-foreground: ${generatedTheme.light.mutedForeground};
              --accent: ${generatedTheme.light.accent};
              --accent-foreground: ${generatedTheme.light.accentForeground};
              --destructive: ${generatedTheme.light.destructive};
              --destructive-foreground: ${generatedTheme.light.destructiveForeground};
              --border: ${generatedTheme.light.border};
              --input: ${generatedTheme.light.input};
              --ring: ${generatedTheme.light.ring};
          }
          .dark {
              --background: ${generatedTheme.dark.background};
              --foreground: ${generatedTheme.dark.foreground};
              --card: ${generatedTheme.dark.card};
              --card-foreground: ${generatedTheme.dark.cardForeground};
              --popover: ${generatedTheme.dark.popover};
              --popover-foreground: ${generatedTheme.dark.popoverForeground};
              --primary: ${generatedTheme.dark.primary};
              --primary-foreground: ${generatedTheme.dark.primaryForeground};
              --secondary: ${generatedTheme.dark.secondary};
              --secondary-foreground: ${generatedTheme.dark.secondaryForeground};
              --muted: ${generatedTheme.dark.muted};
              --muted-foreground: ${generatedTheme.dark.mutedForeground};
              --accent: ${generatedTheme.dark.accent};
              --accent-foreground: ${generatedTheme.dark.accentForeground};
              --destructive: ${generatedTheme.dark.destructive};
              --destructive-foreground: ${generatedTheme.dark.destructiveForeground};
              --border: ${generatedTheme.dark.border};
              --input: ${generatedTheme.dark.input};
              --ring: ${generatedTheme.dark.ring};
          }
      `}</style>
      )}
      <Header />
      <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="hidden h-[calc(100vh-4rem)] flex-col border-r bg-card lg:sticky lg:top-16 lg:flex">
          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                  pathname === '/' && 'bg-muted'
                )}
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/profile"
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                  pathname.startsWith('/profile') && 'bg-muted'
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Profile</span>
              </Link>

              {/* Site Section */}
              <div className="mt-4 space-y-2">
                <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                  Site
                </div>
                <Link
                  href="/site/pages"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/site/pages') && 'bg-muted'
                  )}
                >
                  <Globe className="h-4 w-4" />
                  <span>Pages</span>
                </Link>
                <Link
                  href="/site/paths"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/site/paths') && 'bg-muted'
                  )}
                >
                  <LinkIcon className="h-4 w-4" />
                  <span>Paths</span>
                </Link>
                <Link
                  href="/site/sources"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/site/sources') && 'bg-muted'
                  )}
                >
                  <Database className="h-4 w-4" />
                  <span>Sources</span>
                </Link>
                <Link
                  href="/site/modules"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/site/modules') && 'bg-muted'
                  )}
                >
                  <Puzzle className="h-4 w-4" />
                  <span>Modules</span>
                </Link>
                <Link
                  href="/site/theme"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/site/theme') && 'bg-muted'
                  )}
                >
                  <Palette className="h-4 w-4" />
                  <span>Theme</span>
                </Link>
                 <Link
                  href="/site/storage"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/site/storage') && 'bg-muted'
                  )}
                >
                  <HardDrive className="h-4 w-4" />
                  <span>Storage</span>
                </Link>
                 <Link
                  href="/site/billing"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/site/billing') && 'bg-muted'
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Billing</span>
                </Link>
                <Link
                  href="/site/editor/dragger"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/site/editor') && 'bg-muted'
                  )}
                >
                  <LayoutTemplate className="h-4 w-4" />
                  <span>Editor</span>
                </Link>
                <Link
                  href="/site/sections"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/site/sections') && 'bg-muted'
                  )}
                >
                  <Layers className="h-4 w-4" />
                  <span>Sections</span>
                </Link>
              </div>

              {/* Root Section */}
              <div className="mt-4 space-y-2">
                <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                  Root
                </div>
                <Link
                  href="/root/pages"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/root/pages') && 'bg-muted'
                  )}
                >
                  <Globe className="h-4 w-4" />
                  <span>Pages</span>
                </Link>
                <Link
                  href="/root/templates"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/root/templates') && 'bg-muted'
                  )}
                >
                  <LayoutTemplate className="h-4 w-4" />
                  <span>Templates</span>
                </Link>
                <Link
                  href="/root/servers"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/root/servers') && 'bg-muted'
                  )}
                >
                  <Server className="h-4 w-4" />
                  <span>Servers</span>
                </Link>
                 <Link
                  href="/root/storage"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/root/storage') && 'bg-muted'
                  )}
                >
                  <HardDrive className="h-4 w-4" />
                  <span>Storage</span>
                </Link>
                 <Link
                  href="/root/billing"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/root/billing') && 'bg-muted'
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Billing</span>
                </Link>
                <Link
                  href="/root/modules"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/root/modules') && 'bg-muted'
                  )}
                >
                  <Puzzle className="h-4 w-4" />
                  <span>Modules</span>
                </Link>
                <Link
                  href="/root/errors"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                    pathname.startsWith('/root/errors') && 'bg-muted'
                  )}
                >
                  <Bug className="h-4 w-4" />
                  <span>Errors</span>
                </Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-h-[calc(100vh-4rem)] p-6 lg:p-8">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
