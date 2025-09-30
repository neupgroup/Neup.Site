
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Rocket, LayoutTemplate, Bug, Home, Globe } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
             <div className="flex items-center gap-2">
                <Rocket className="h-6 w-6 text-primary" />
                <h1 className="font-headline text-xl font-semibold tracking-tight">Neup.Sites</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <SidebarMenuButton tooltip="Dashboard">
                    <Home />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <Link href="/site/pages" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Pages">
                        <Globe />
                        <span>Pages</span>
                    </SidebarMenuButton>
                 </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <Link href="/site/editor" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Site Editor">
                        <LayoutTemplate />
                        <span>Site Editor</span>
                    </SidebarMenuButton>
                 </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <Link href="/root/templates" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Templates">
                        <LayoutTemplate />
                        <span>Templates</span>
                    </SidebarMenuButton>
                 </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <Link href="/errors" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Error Logs">
                        <Bug />
                        <span>Error Logs</span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
                <SidebarTrigger />
                 <h1 className="text-lg font-semibold">Dashboard</h1>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-8">
                {children}
            </main>
        </SidebarInset>
      </div>
  );
}
