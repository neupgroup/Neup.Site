
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
  const radius = site?.theme?.radius;
  const radiusClass = radius ? `radius-${radius}` : 'radius-medium';
  const themeMode = site?.theme?.mode || 'light';
  
  return (
    <html lang="en" suppressHydrationWarning className={cn(radiusClass, themeMode)}>
      <head />
      <body className={cn("font-body antialiased")}>
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
