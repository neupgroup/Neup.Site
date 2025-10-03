
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
import { Rocket, LayoutTemplate, Bug, Home, Globe, Settings, Link as LinkIcon, Database } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="w-full bg-background">
        <div className="container mx-auto flex min-h-screen max-w-[1440px]">
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
                  <SidebarMenuButton tooltip="Dashboard" asChild>
                    <Link href="/">
                      <Home />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Pages" asChild>
                     <Link href="/site/pages">
                          <Globe />
                          <span>Pages</span>
                      </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                   <SidebarMenuButton tooltip="Paths" asChild>
                      <Link href="/site/paths">
                          <LinkIcon />
                          <span>Paths</span>
                      </Link>
                   </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Sources" asChild>
                      <Link href="/site/sources">
                          <Database />
                          <span>Sources</span>
                      </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Site Editor" asChild>
                      <Link href="/site/editor/dragger">
                          <LayoutTemplate />
                          <span>Site Editor</span>
                      </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Templates" asChild>
                      <Link href="/root/templates">
                          <LayoutTemplate />
                          <span>Templates</span>
                      </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Manage" asChild>
                      <Link href="/manage">
                          <Settings />
                          <span>Manage</span>
                      </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Error Logs" asChild>
                      <Link href="/errors">
                          <Bug />
                          <span>Error Logs</span>
                      </Link>
                  </SidebarMenuButton>
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
      </div>
  );
}
