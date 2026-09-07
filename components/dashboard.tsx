
'use client';

/*
::neup.documentation::dashboard-shell

::public

Main dashboard shell and navigation for authenticated management routes.

The manage navigation links to `/manage/member` for team and member
management.

::public end
::end
*/

import Link from 'next/link';
import Image from 'next/image';
import {
  Rocket,
  LayoutTemplate,
  Bug,
  Home,
  Settings,
  Link as LinkIcon,
  Database,
  Server,
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
  Users,
  Briefcase,
  Menu,
  X,
  Shield,
  User,
  Package,
  Mountain,
  UtensilsCrossed,
  Activity,
  Redo,
  FolderKanban,
  FileLock,
  Replace,
  RefreshCw,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '#/core/utils';
import { useProfile } from '@/inapp/context/ProfileContext';
import { Skeleton } from '#/components/ui/skeleton';
import type { Asset, AssetTheme } from '@/services/asset/type';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '#/components/ui/collapsible';
import { Button } from '#/components/ui/button';
import { NavLink as SidebarNavLink } from '#/components/ui/nav-link';
import { Sidebar } from '#/components/ui/sidebar';
import { ChevronRight } from 'lucide-react';
import { useToast } from '#/core/hooks/useToast';
import { useState, useEffect } from 'react';
import { ScrollArea } from '#/components/ui/scroll-area';
import { isResolvedAssetLogoSvg, resolveAssetLogoUrl } from '@/inapp/helpers/asset/logo';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { getSelfAccountBasics, type SelfAccountBasics } from '@/services/accounts';
import { appendSelectedProject } from '@/inapp/helpers/application-mode';

const navLinkClassName = (isActive: boolean) => cn(
  'flex w-full items-center justify-start gap-2 rounded-md border border-transparent px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors duration-300 hover:bg-primary/10 hover:text-primary active:bg-primary/20 active:text-primary',
  isActive && 'bg-primary/25 text-primary hover:bg-primary/30 active:bg-primary/40'
);

function SidebarNavItem({ href, children, currentPath, selectedProject, onClick }: { href: string; children: React.ReactNode; currentPath: string, selectedProject: string | null, onClick?: () => void }) {
  const isActive = href === '/' ? currentPath === href : currentPath.startsWith(href);
  return (
    <div className="block w-full">
      <SidebarNavLink
        href={appendSelectedProject(href, selectedProject)}
        active={isActive}
        alignment="left"
        className={navLinkClassName(isActive)}
        onClick={onClick}
      >
        {children}
      </SidebarNavLink>
    </div>
  );
}

function buildAnalyticsUrl(propertyId: string | null, currentUrl: string) {
  const params = new URLSearchParams({
    property: propertyId ?? '',
    'backTo.app': 'site',
    'backTo.url': currentUrl,
  });

  return `https://neupgroup.com/analytics?${params.toString()}`;
}

function ExternalAnalyticsNavLink({ propertyId, currentUrl, children, onClick }: { propertyId: string | null; currentUrl: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div className="block w-full">
      <SidebarNavLink
        href={buildAnalyticsUrl(propertyId, currentUrl)}
        alignment="left"
        className={navLinkClassName(false)}
        onClick={(event) => {
          event.preventDefault();
          onClick?.();
          window.location.assign(buildAnalyticsUrl(propertyId, window.location.href));
        }}
      >
        {children}
      </SidebarNavLink>
    </div>
  );
}

function MainNavContent({ currentPath, currentUrl, isAuthenticated, propertyId, selectedProject, onLinkClick }: { currentPath: string, currentUrl: string, isAuthenticated: boolean, propertyId: string | null, selectedProject: string | null, onLinkClick?: () => void }) {
  return (
    <nav className="flex w-full flex-col items-stretch gap-2">
      <SidebarNavItem href="/home" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Home className="h-4 w-4" /><span>Dashboard</span></SidebarNavItem>
      <SidebarNavItem href="/settings" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Settings className="h-4 w-4" /><span>Settings</span></SidebarNavItem>
      <SidebarNavItem href="/status" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Activity className="h-4 w-4" /><span>Status</span></SidebarNavItem>

      {/* TODO: Add permission-based filtering when permissions are implemented */}
      {/* For now, showing all navigation items regardless of authentication status */}
      <div className="mt-4 space-y-2">
        <div className="px-3 text-sm font-semibold text-muted-foreground">
          Manage
        </div>
        <SidebarNavItem href="/manage/member" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Users className="h-4 w-4" /><span>Members</span></SidebarNavItem>
        <SidebarNavItem href="/manage/accounts" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><User className="h-4 w-4" /><span>Accounts</span></SidebarNavItem>
        <SidebarNavItem href="/manage/projects" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><FolderKanban className="h-4 w-4" /><span>Projects</span></SidebarNavItem>
        <SidebarNavItem href="/manage/hiring" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Briefcase className="h-4 w-4" /><span>Hiring</span></SidebarNavItem>
        <SidebarNavItem href="/manage/billing" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><CreditCard className="h-4 w-4" /><span>Billing</span></SidebarNavItem>
        <SidebarNavItem href="/manage/access" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Shield className="h-4 w-4" /><span>Access</span></SidebarNavItem>
        <SidebarNavItem href="/manage/permissions" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Shield className="h-4 w-4" /><span>Permissions</span></SidebarNavItem>
        <SidebarNavItem href="/manage/redirects" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Redo className="h-4 w-4" /><span>Redirects</span></SidebarNavItem>
        <SidebarNavItem href="/manage/contacts" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Users className="h-4 w-4" /><span>Contacts</span></SidebarNavItem>
        <ExternalAnalyticsNavLink propertyId={propertyId} currentUrl={currentUrl} onClick={onLinkClick}><BarChart className="h-4 w-4" /><span>Analytics</span><ExternalLink className="h-3.5 w-3.5" aria-label="Opens external page" /></ExternalAnalyticsNavLink>
        <SidebarNavItem href="/manage/products" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Package className="h-4 w-4" /><span>Products</span></SidebarNavItem>
        <SidebarNavItem href="/manage/syncer" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><RefreshCw className="h-4 w-4" /><span>Syncer</span></SidebarNavItem>
        <SidebarNavItem href="/manage/articles" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Newspaper className="h-4 w-4" /><span>Articles</span></SidebarNavItem>
        <SidebarNavItem href="/manage/referrals" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Share2 className="h-4 w-4" /><span>Referrals</span></SidebarNavItem>
      </div>

      <div className="mt-4 space-y-2">
        <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
          News
        </div>
        <SidebarNavItem href="/news" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Newspaper className="h-4 w-4" /><span>All Articles</span></SidebarNavItem>
        <SidebarNavItem href="/news/create" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Plus className="h-4 w-4" /><span>Create New</span></SidebarNavItem>
        <SidebarNavItem href="/news/category" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Tag className="h-4 w-4" /><span>Categories</span></SidebarNavItem>
        <SidebarNavItem href="/news/featured" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Star className="h-4 w-4" /><span>Featured</span></SidebarNavItem>
      </div>

      <div className="mt-4 space-y-2">
        <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
          Tourio
        </div>
        <SidebarNavItem href="/tourio/experience" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Mountain className="h-4 w-4" /><span>Experiences</span></SidebarNavItem>
        <SidebarNavItem href="/tourio/dish" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><UtensilsCrossed className="h-4 w-4" /><span>Dishes</span></SidebarNavItem>
      </div>

      {/* Asset Section */}
      <div className="mt-4 space-y-2">
        <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
          Asset
        </div>
        <SidebarNavItem href="/site/sources" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Database className="h-4 w-4" /><span>Sources</span></SidebarNavItem>
        <SidebarNavItem href="/site/datalists" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><List className="h-4 w-4" /><span>Datalists</span></SidebarNavItem>
        <SidebarNavItem href="/site/servers" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Server className="h-4 w-4" /><span>Servers</span></SidebarNavItem>
        <SidebarNavItem href="/site/modules" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Puzzle className="h-4 w-4" /><span>Modules</span></SidebarNavItem>
        <SidebarNavItem href="/site/uploads" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><UploadCloud className="h-4 w-4" /><span>Uploads</span></SidebarNavItem>
        <SidebarNavItem href="/site/appbase" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><FolderKanban className="h-4 w-4" /><span>App Base</span></SidebarNavItem>
        <SidebarNavItem href="/site/environment" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><FileLock className="h-4 w-4" /><span>Environments</span></SidebarNavItem>
        <SidebarNavItem href="/analytics" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><BarChart className="h-4 w-4" /><span>Analytics</span></SidebarNavItem>
        <SidebarNavItem href="/site/deploy" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Rocket className="h-4 w-4" /><span>Deploy</span></SidebarNavItem>
        <SidebarNavItem href="/site/advanced" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Wrench className="h-4 w-4" /><span>Advanced</span></SidebarNavItem>
      </div>

      <div className="mt-4 space-y-2">
        <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
          Site
        </div>
        <SidebarNavItem href="/site/codebase" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><UploadCloud className="h-4 w-4" /><span>Codebase</span></SidebarNavItem>
        <SidebarNavItem href="/site/theme" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Palette className="h-4 w-4" /><span>Theme</span></SidebarNavItem>
      </div>

      {/* Root Section */}
      <div className="mt-4 space-y-2">
        <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
          Root
        </div>
        <SidebarNavItem href="/root/pages" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Globe className="h-4 w-4" /><span>Pages</span></SidebarNavItem>
        <SidebarNavItem href="/root/templates" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><LayoutTemplate className="h-4 w-4" /><span>Templates</span></SidebarNavItem>
        <SidebarNavItem href="/root/servers" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Server className="h-4 w-4" /><span>Servers</span></SidebarNavItem>
        <SidebarNavItem href="/root/servers/allocations" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Share2 className="h-4 w-4" /><span>Allocations</span></SidebarNavItem>
        <SidebarNavItem href="/root/storage" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><HardDrive className="h-4 w-4" /><span>Storage</span></SidebarNavItem>
        <SidebarNavItem href="/root/billing" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><CreditCard className="h-4 w-4" /><span>Billing</span></SidebarNavItem>
        <SidebarNavItem href="/root/modules" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Puzzle className="h-4 w-4" /><span>Modules</span></SidebarNavItem>
        <SidebarNavItem href="/root/errors" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Bug className="h-4 w-4" /><span>Errors</span></SidebarNavItem>
      </div>

      <div className="mt-auto pt-8">
        <div className="mt-4 space-y-2">
          <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
            Account
          </div>
          <SidebarNavItem href="/switch" currentPath={currentPath} selectedProject={selectedProject} onClick={onLinkClick}><Replace className="h-4 w-4" /><span>Switch</span></SidebarNavItem>
        </div>
      </div>
    </nav>
  );
}

function Header({ isMobileMenuOpen, toggleMobileMenu, selectedProject }: { isMobileMenuOpen: boolean, toggleMobileMenu: () => void, selectedProject: string | null }) {
  const { asset, loading } = useProfile();
  const [accountBasics, setAccountBasics] = useState<SelfAccountBasics | null>(null);
  const [accountBasicsLoading, setAccountBasicsLoading] = useState(true);

  const profileName = asset?.name;
  const logoUrl = resolveAssetLogoUrl(asset?.logoUrl, asset?.theme);
  const isSvgLogo = isResolvedAssetLogoSvg(logoUrl);
  const hideSitename = asset?.hideSitename;

  useEffect(() => {
    let active = true;

    async function loadAccountBasics() {
      const result = await getSelfAccountBasics();
      if (!active) return;
      setAccountBasics(result.basics ?? null);
      setAccountBasicsLoading(false);
    }

    loadAccountBasics();

    return () => {
      active = false;
    };
  }, []);

  const displayName = accountBasics?.displayName?.trim() || null;
  const neupid = accountBasics?.neupid?.trim() || null;
  const displayImage = accountBasics?.displayImage?.trim() || null;
  const initials = (displayName || neupid || 'A')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'A';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background shadow-lg">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 lg:px-6">
        <div className="flex flex-col items-start group">
          <Link href={appendSelectedProject('/', selectedProject)} className="flex items-center gap-4">
            {(loading ? (
              <Skeleton className="h-6 w-6" />
            ) : logoUrl ? (
              <div className="relative h-7 w-auto" style={{ aspectRatio: 'auto' }}>
                <Image
                  src={logoUrl}
                  alt="Asset Logo"
                  width={160}
                  height={28}
                  unoptimized={isSvgLogo}
                  className="h-7 w-auto"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            ) : (
              <Rocket className="h-6 w-6 text-primary" />
            ))}

            {(!hideSitename && hideSitename !== null) && (
              loading ? (
                <div className="font-headline text-xl font-semibold tracking-tight">
                  <Skeleton className="h-6 w-32" />
                </div>
              ) : (
                <h1 className="font-headline text-xl font-semibold tracking-tight">
                  {profileName?.trim() ? profileName : 'Neup.Sites'}
                </h1>
              )
            )}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={appendSelectedProject('/profile', selectedProject)}
            className="hidden items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-muted/60 md:flex"
          >
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold text-foreground">
                {accountBasicsLoading ? <Skeleton className="ml-auto h-4 w-32" /> : (displayName || 'Account')}
              </div>
              <div className="text-xs text-muted-foreground">
                {accountBasicsLoading ? <Skeleton className="ml-auto mt-1 h-3 w-24" /> : (neupid ? `@${neupid}` : '')}
              </div>
            </div>
            <Avatar className="h-10 w-10 border border-border/60">
              {displayImage ? <AvatarImage src={displayImage} alt={displayName || neupid || 'Account'} /> : null}
              <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">{initials}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="md:hidden">
          <Button variant="plain" size="icon" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Dashboard({ children, theme }: { children: React.ReactNode, theme?: Partial<AssetTheme> }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const selectedProject = searchParams.get('selectedProject');

  useEffect(() => {
    setPropertyId(selectedProject);
    setCurrentUrl(window.location.href);
    setIsAuthenticated(!!selectedProject);
  }, [pathname, selectedProject]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <Header isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} selectedProject={selectedProject} />

      {/* Mobile Menu */}
      <div className={cn(
        "fixed top-16 left-0 right-0 bottom-0 z-30 bg-background transition-all duration-300 ease-in-out md:hidden",
        isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      )}>
        <ScrollArea className="h-full">
          <div className="p-4">
            <MainNavContent currentPath={pathname} currentUrl={currentUrl} isAuthenticated={isAuthenticated} propertyId={propertyId} selectedProject={selectedProject} onLinkClick={closeMobileMenu} />
          </div>
        </ScrollArea>
      </div>

      <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar */}
        <Sidebar
          collapsible="none"
          className="hidden h-[calc(100vh-4rem)] w-[280px] min-w-[280px] shrink-0 flex-col border-r bg-background lg:sticky lg:top-16 lg:flex"
        >
          <div className="flex flex-1 flex-col overflow-y-auto p-4 custom-scrollbar">
            <MainNavContent currentPath={pathname} currentUrl={currentUrl} isAuthenticated={isAuthenticated} propertyId={propertyId} selectedProject={selectedProject} />
          </div>
        </Sidebar>

        {/* Main Content */}
        <main className="min-w-0 min-h-[calc(100vh-4rem)] p-6 lg:p-8">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
