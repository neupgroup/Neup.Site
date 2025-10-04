'use client';
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Suspense } from 'react';
import { ProgressBar } from '@/components/ui/progress-bar';

// Note: Metadata is not supported in client components.
// If you need to set metadata, you would move this to a server component parent.
// export const metadata: Metadata = {
//   title: 'Neup.Sites',
//   description: 'Visually build your website.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Neup.Sites</title>
        <meta name="description" content="Visually build your website." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
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
