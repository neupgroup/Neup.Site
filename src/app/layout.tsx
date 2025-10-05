import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Suspense } from 'react';
import { ProgressBar } from '@/components/ui/progress-bar';

export const metadata: Metadata = {
  title: 'Neup.Sites',
  description: 'Visually build your website.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
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
