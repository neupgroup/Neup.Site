'use client';
import { usePathname } from 'next/navigation';
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import Link from 'next/link';

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
  const pathname = usePathname();
  const showNav = pathname !== '/site/editor';

  return (
    <html lang="en">
      <head>
        <title>Neup.Sites</title>
        <meta name="description" content="Visually build your website." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {showNav && (
            <nav className="bg-card border-b p-4">
                <ul className="flex space-x-4">
                    <li><Link href="/site/editor" className="text-sm text-foreground hover:text-primary">Editor</Link></li>
                    <li><Link href="/landing" className="text-sm text-foreground hover:text-primary">Landing</Link></li>
                    <li><Link href="/errors" className="text-sm text-foreground hover:text-primary">Errors</Link></li>
                </ul>
            </nav>
        )}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
