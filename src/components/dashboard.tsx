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
  List,
  Wrench,
  UploadCloud,
  BookOpen,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { Site, SiteTheme } from '@/schemas/site';
import { saveSite } from '@/actions/editor/site';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from './ui/button';
import { ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

function Header() {
  const { site, loading } = useProfile();

  const profileName = site?.name;
  const logoUrl = site?.logoUrl;
  const hideSitename = site?.hideSitename;
  const hideLogo = site?.hideLogo;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-background shadow">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 lg:px-6">
        <div className="flex flex-col items-start group">
          <Link href="/" className="flex items-center gap-4">
            {!hideLogo && (loading ? (
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
                {loading ? <Skeleton className="h-6 w-32" /> : (profileName?.trim() ? profileName : 'Neup.Sites')}
              </h1>
            )}
          </Link>
        </div>
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
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
        >
            {children}
        </Link>
    );
}

export function Dashboard({ children, theme }: { children: React.ReactNode, theme?: SiteTheme }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <Header />
      <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="hidden h-[calc(100vh-4rem)] flex-col border-r bg-card lg:sticky lg:top-16 lg:flex">
          <div className="flex flex-1 flex-col overflow-y-auto p-4 custom-scrollbar">
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
                <NavLink href="/site/datalists" currentPath={pathname}><List className="h-4 w-4" /><span>Datalists</span></NavLink>
                <NavLink href="/site/servers" currentPath={pathname}><Server className="h-4 w-4" /><span>Servers</span></NavLink>
                <NavLink href="/site/modules" currentPath={pathname}><Puzzle className="h-4 w-4" /><span>Modules</span></NavLink>
                 <NavLink href="/analytics" currentPath={pathname}><BarChart className="h-4 w-4" /><span>Analytics</span></NavLink>
                <NavLink href="/site/theme" currentPath={pathname}><Palette className="h-4 w-4" /><span>Theme</span></NavLink>
                 <NavLink href="/site/billing" currentPath={pathname}><CreditCard className="h-4 w-4" /><span>Billing</span></NavLink>
                <NavLink href="/site/sections" currentPath={pathname}><Layers className="h-4 w-4" /><span>Sections</span></NavLink>
                <NavLink href="/site/deploy" currentPath={pathname}><Rocket className="h-4 w-4" /><span>Deploy</span></NavLink>
                <NavLink href="/site/advanced" currentPath={pathname}><Wrench className="h-4 w-4" /><span>Advanced</span></NavLink>
                <NavLink href="/site/codebase" currentPath={pathname}><UploadCloud className="h-4 w-4" /><span>Codebase</span></NavLink>
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