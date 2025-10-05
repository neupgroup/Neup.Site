
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
  Newspaper,
  BarChart,
  Plus,
  Tag,
  Star,
  Eye,
  EyeOff,
  Loader2,
  Share2,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { Site } from '@/actions/editor/site';
import { saveSite } from '@/actions/editor/site';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from './ui/button';
import { ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

function Header() {
  const { profileName, logoUrl, hideSitename, hideLogo, loading } = useProfile();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-background shadow">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 lg:px-6">
        <div className="flex flex-col items-start group">
          <Link href="/" className="flex items-center gap-4">
            {!hideLogo && (loading.logo || logoUrl === null ? (
              <Skeleton className="h-6 w-6" />
            ) : logoUrl ? (
               <div className="relative h-6 w-auto" style={{ aspectRatio: 'auto' }}>
                  <Image src={logoUrl} alt="Site Logo" layout="fill" objectFit="contain" className="!relative !h-6 !w-auto" />
               </div>
            ) : (
              <Rocket className="h-6 w-6 text-primary" />
            ))}

            {(!hideSitename && hideSitename !== null) && (
              <h1 className="font-headline text-xl font-semibold tracking-tight">
                {loading.name || profileName === null ? <Skeleton className="h-6 w-32" /> : (profileName?.trim() ? profileName : 'Neup.Sites')}
              </h1>
            )}
          </Link>
        </div>
        <div className="text-lg font-semibold">Dashboard</div>
      </div>
    </header>
  );
}

function NavLink({ href, children, currentPath }: { href: string; children: React.ReactNode; currentPath: string }) {
    const isActive = href === '/' ? currentPath === href : currentPath.startsWith(href);
    return (
        <Link
            href={href}
            className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted',
                isActive && 'bg-muted'
            )}
        >
            {children}
        </Link>
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
              <NavLink href="/" currentPath={pathname}><Home className="h-4 w-4" /><span>Dashboard</span></NavLink>
              <NavLink href="/profile" currentPath={pathname}><Settings className="h-4 w-4" /><span>Profile</span></NavLink>

              <div className="mt-4 space-y-2">
                <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                  News
                </div>
                <NavLink href="/news" currentPath={pathname}><Newspaper className="h-4 w-4" /><span>All Articles</span></NavLink>
                <NavLink href="/news/create" currentPath={pathname}><Plus className="h-4 w-4" /><span>Create New</span></NavLink>
                <NavLink href="/news/category" currentPath={pathname}><Tag className="h-4 w-4" /><span>Categories</span></NavLink>
                <NavLink href="/news/featured" currentPath={pathname}><Star className="h-4 w-4" /><span>Featured</span></NavLink>
              </div>

              {/* Site Section */}
              <div className="mt-4 space-y-2">
                <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                  Site
                </div>
                <NavLink href="/site/pages" currentPath={pathname}><Globe className="h-4 w-4" /><span>Pages</span></NavLink>
                <NavLink href="/site/sources" currentPath={pathname}><Database className="h-4 w-4" /><span>Sources</span></NavLink>
                <NavLink href="/site/servers" currentPath={pathname}><Server className="h-4 w-4" /><span>Servers</span></NavLink>
                <NavLink href="/site/modules" currentPath={pathname}><Puzzle className="h-4 w-4" /><span>Modules</span></NavLink>
                 <NavLink href="/analytics" currentPath={pathname}><BarChart className="h-4 w-4" /><span>Analytics</span></NavLink>
                <NavLink href="/site/theme" currentPath={pathname}><Palette className="h-4 w-4" /><span>Theme</span></NavLink>
                 <NavLink href="/site/billing" currentPath={pathname}><CreditCard className="h-4 w-4" /><span>Billing</span></NavLink>
                <NavLink href="/site/sections" currentPath={pathname}><Layers className="h-4 w-4" /><span>Sections</span></NavLink>
              </div>

              {/* Root Section */}
              <div className="mt-4 space-y-2">
                <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                  Root
                </div>
                <NavLink href="/root/pages" currentPath={pathname}><Globe className="h-4 w-4" /><span>Pages</span></NavLink>
                <NavLink href="/root/templates" currentPath={pathname}><LayoutTemplate className="h-4 w-4" /><span>Templates</span></NavLink>
                <NavLink href="/root/servers" currentPath={pathname}><Server className="h-4 w-4" /><span>Servers</span></NavLink>
                <NavLink href="/root/servers/allocations" currentPath={pathname}><Share2 className="h-4 w-4" /><span>Allocations</span></NavLink>
                 <NavLink href="/root/storage" currentPath={pathname}><HardDrive className="h-4 w-4" /><span>Storage</span></NavLink>
                 <NavLink href="/root/billing" currentPath={pathname}><CreditCard className="h-4 w-4" /><span>Billing</span></NavLink>
                <NavLink href="/root/modules" currentPath={pathname}><Puzzle className="h-4 w-4" /><span>Modules</span></NavLink>
                <NavLink href="/root/errors" currentPath={pathname}><Bug className="h-4 w-4" /><span>Errors</span></NavLink>
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
