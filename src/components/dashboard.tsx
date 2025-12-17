
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
  Users,
  Briefcase,
  Command as CommandIcon,
  Menu,
  X,
  Shield,
  User,
  Package,
  Mountain,
  UtensilsCrossed,
  Activity,
  Network,
  Redo,
  FolderJson,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { Site, SiteTheme } from '@/schemas/site';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from './ui/button';
import { ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';

function NavLink({ href, children, currentPath, onClick }: { href: string; children: React.ReactNode; currentPath: string, onClick?: () => void }) {
    const isActive = href === '/' ? currentPath === href : currentPath.startsWith(href);
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
        >
            {children}
        </Link>
    );
}

function MainNavContent({ currentPath, onLinkClick }: { currentPath: string, onLinkClick?: () => void }) {
    return (
        <nav className="flex flex-col gap-2">
            <NavLink href="/" currentPath={currentPath} onClick={onLinkClick}><Home className="h-4 w-4" /><span>Dashboard</span></NavLink>
            <NavLink href="/profile" currentPath={currentPath} onClick={onLinkClick}><User className="h-4 w-4" /><span>Profile</span></NavLink>
            <NavLink href="/status" currentPath={currentPath} onClick={onLinkClick}><Activity className="h-4 w-4" /><span>Status</span></NavLink>
            <NavLink href="/settings" currentPath={currentPath} onClick={onLinkClick}><Settings className="h-4 w-4" /><span>Settings</span></NavLink>

            <div className="mt-4 space-y-2">
            <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                Manage
            </div>
            <NavLink href="/manage/members" currentPath={currentPath} onClick={onLinkClick}><Users className="h-4 w-4" /><span>Members</span></NavLink>
            <NavLink href="/manage/team" currentPath={currentPath} onClick={onLinkClick}><Users className="h-4 w-4" /><span>Teams</span></NavLink>
            <NavLink href="/manage/hiring" currentPath={currentPath} onClick={onLinkClick}><Briefcase className="h-4 w-4" /><span>Hiring</span></NavLink>
            <NavLink href="/manage/permissions" currentPath={currentPath} onClick={onLinkClick}><Shield className="h-4 w-4" /><span>Permissions</span></NavLink>
            <NavLink href="/manage/redirects" currentPath={currentPath} onClick={onLinkClick}><Redo className="h-4 w-4" /><span>Redirects</span></NavLink>
            <NavLink href="/manage/contacts" currentPath={currentPath} onClick={onLinkClick}><Users className="h-4 w-4" /><span>Contacts</span></NavLink>
            <NavLink href="/manage/analytics" currentPath={currentPath} onClick={onLinkClick}><BarChart className="h-4 w-4" /><span>Analytics</span></NavLink>
            <NavLink href="/manage/products" currentPath={currentPath} onClick={onLinkClick}><Package className="h-4 w-4" /><span>Products</span></NavLink>
            <NavLink href="/manage/articles" currentPath={currentPath} onClick={onLinkClick}><Newspaper className="h-4 w-4" /><span>Articles</span></NavLink>
            <NavLink href="/manage/referrals" currentPath={currentPath} onClick={onLinkClick}><Share2 className="h-4 w-4" /><span>Referrals</span></NavLink>
            </div>

            <div className="mt-4 space-y-2">
            <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                News
            </div>
            <NavLink href="/news" currentPath={currentPath} onClick={onLinkClick}><Newspaper className="h-4 w-4" /><span>All Articles</span></NavLink>
            <NavLink href="/news/create" currentPath={currentPath} onClick={onLinkClick}><Plus className="h-4 w-4" /><span>Create New</span></NavLink>
            <NavLink href="/news/category" currentPath={currentPath} onClick={onLinkClick}><Tag className="h-4 w-4" /><span>Categories</span></NavLink>
            <NavLink href="/news/featured" currentPath={currentPath} onClick={onLinkClick}><Star className="h-4 w-4" /><span>Featured</span></NavLink>
            </div>

            <div className="mt-4 space-y-2">
            <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                Tourio
            </div>
            <NavLink href="/tourio/experience" currentPath={currentPath} onClick={onLinkClick}><Mountain className="h-4 w-4" /><span>Experiences</span></NavLink>
            <NavLink href="/tourio/dish" currentPath={currentPath} onClick={onLinkClick}><UtensilsCrossed className="h-4 w-4" /><span>Dishes</span></NavLink>
            </div>

            {/* Site Section */}
            <div className="mt-4 space-y-2">
            <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                Site
            </div>
            <NavLink href="/site/pages" currentPath={currentPath} onClick={onLinkClick}><Globe className="h-4 w-4" /><span>Pages</span></NavLink>
            <NavLink href="/site/sources" currentPath={currentPath} onClick={onLinkClick}><Database className="h-4 w-4" /><span>Sources</span></NavLink>
            <NavLink href="/site/datalists" currentPath={currentPath} onClick={onLinkClick}><List className="h-4 w-4" /><span>Datalists</span></NavLink>
            <NavLink href="/site/servers" currentPath={currentPath} onClick={onLinkClick}><Server className="h-4 w-4" /><span>Servers</span></NavLink>
            <NavLink href="/site/modules" currentPath={currentPath} onClick={onLinkClick}><Puzzle className="h-4 w-4" /><span>Modules</span></NavLink>
            <NavLink href="/site/uploads" currentPath={currentPath} onClick={onLinkClick}><UploadCloud className="h-4 w-4" /><span>Uploads</span></NavLink>
            <NavLink href="/site/appbase" currentPath={currentPath} onClick={onLinkClick}><FolderJson className="h-4 w-4" /><span>App Base</span></NavLink>
            <NavLink href="/analytics" currentPath={currentPath} onClick={onLinkClick}><BarChart className="h-4 w-4" /><span>Analytics</span></NavLink>
            <NavLink href="/site/theme" currentPath={currentPath} onClick={onLinkClick}><Palette className="h-4 w-4" /><span>Theme</span></NavLink>
            <NavLink href="/site/billing" currentPath={currentPath} onClick={onLinkClick}><CreditCard className="h-4 w-4" /><span>Billing</span></NavLink>
            <NavLink href="/site/sections" currentPath={currentPath} onClick={onLinkClick}><Layers className="h-4 w-4" /><span>Sections</span></NavLink>
            <NavLink href="/site/deploy" currentPath={currentPath} onClick={onLinkClick}><Rocket className="h-4 w-4" /><span>Deploy</span></NavLink>
            <NavLink href="/site/advanced" currentPath={currentPath} onClick={onLinkClick}><Wrench className="h-4 w-4" /><span>Advanced</span></NavLink>
            <NavLink href="/site/codebase" currentPath={currentPath} onClick={onLinkClick}><UploadCloud className="h-4 w-4" /><span>Codebase</span></NavLink>
            </div>

            {/* Root Section */}
            <div className="mt-4 space-y-2">
            <div className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                Root
            </div>
            <NavLink href="/root/pages" currentPath={currentPath} onClick={onLinkClick}><Globe className="h-4 w-4" /><span>Pages</span></NavLink>
            <NavLink href="/root/templates" currentPath={currentPath} onClick={onLinkClick}><LayoutTemplate className="h-4 w-4" /><span>Templates</span></NavLink>
            <NavLink href="/root/servers" currentPath={currentPath} onClick={onLinkClick}><Server className="h-4 w-4" /><span>Servers</span></NavLink>
            <NavLink href="/root/command" currentPath={currentPath} onClick={onLinkClick}><CommandIcon className="h-4 w-4" /><span>Commands</span></NavLink>
            <NavLink href="/root/servers/allocations" currentPath={currentPath} onClick={onLinkClick}><Share2 className="h-4 w-4" /><span>Allocations</span></NavLink>
            <NavLink href="/root/storage" currentPath={currentPath} onClick={onLinkClick}><HardDrive className="h-4 w-4" /><span>Storage</span></NavLink>
            <NavLink href="/root/billing" currentPath={currentPath} onClick={onLinkClick}><CreditCard className="h-4 w-4" /><span>Billing</span></NavLink>
            <NavLink href="/root/modules" currentPath={currentPath} onClick={onLinkClick}><Puzzle className="h-4 w-4" /><span>Modules</span></NavLink>
            <NavLink href="/root/errors" currentPath={currentPath} onClick={onLinkClick}><Bug className="h-4 w-4" /><span>Errors</span></NavLink>
            </div>
        </nav>
    );
}

function Header({ isMobileMenuOpen, toggleMobileMenu }: { isMobileMenuOpen: boolean, toggleMobileMenu: () => void }) {
  const { site, loading } = useProfile();

  const profileName = site?.name;
  const logoUrl = site?.logoUrl;
  const hideSitename = site?.hideSitename;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background shadow">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 lg:px-6">
        <div className="flex flex-col items-start group">
          <Link href="/" className="flex items-center gap-4">
            {(loading ? (
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
        <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
        </div>
      </div>
    </header>
  );
}

export function Dashboard({ children, theme }: { children: React.ReactNode, theme?: SiteTheme }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <Header isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
      
      {/* Mobile Menu */}
      <div className={cn(
        "fixed top-16 left-0 right-0 bottom-0 z-30 bg-background/95 backdrop-blur-sm transition-all duration-300 ease-in-out md:hidden",
        isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      )}>
        <ScrollArea className="h-full">
            <div className="p-4">
                 <MainNavContent currentPath={pathname} onLinkClick={closeMobileMenu} />
            </div>
        </ScrollArea>
      </div>

      <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="hidden h-[calc(100vh-4rem)] flex-col border-r bg-card lg:sticky lg:top-16 lg:flex">
          <div className="flex flex-1 flex-col overflow-y-auto p-4 custom-scrollbar">
            <MainNavContent currentPath={pathname} />
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
