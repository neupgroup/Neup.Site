import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Suspense } from 'react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { getSite } from '@/actions/editor/site';
import { cn } from '@/lib/utils';


export const metadata: Metadata = {
  title: 'Neup.Sites',
  description: 'Visually build your website.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { site } = await getSite();
  const radiusClass = site?.theme?.radius ? `radius-${site.theme.radius}` : 'radius-medium';
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn("font-body antialiased", radiusClass)}>
        <Suspense fallback={null}>
            <ProgressBar />
        </Suspense>
        <SidebarProvider>
          {children}
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
