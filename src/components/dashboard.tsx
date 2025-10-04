
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
        <Link href="/" className="flex items-center gap-2">
          {loading.logo ? (
            <Skeleton className="h-8 w-8" />
          ) : logoUrl ? (
             <div className="relative h-8 w-auto" style={{ aspectRatio: 'auto' }}>
                <Image src={logoUrl} alt="Site Logo" layout="fill" objectFit="contain" className="!relative !h-8 !w-auto" />
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

function hexToHsl(hex: string): string | null {
    if (!hex.startsWith('#')) return null;

    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    } else {
        return null;
    }

    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}


export function Dashboard({ children, theme }: { children: React.ReactNode; theme?: Site['theme'] }) {
  const pathname = usePathname();
  const primaryHsl = theme?.primary ? hexToHsl(theme.primary) : null;
  const accentHsl = theme?.accent ? hexToHsl(theme.accent) : null;

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
        <style jsx global>{`
          :root {
              ${primaryHsl ? `--primary: ${primaryHsl};` : ''}
              ${accentHsl ? `--accent: ${accentHsl};` : ''}
          }
      `}</style>
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
