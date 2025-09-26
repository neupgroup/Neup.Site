import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import Link from 'next/link';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <nav className="bg-card border-b p-4">
            <ul className="flex space-x-4">
                <li><Link href="/site/editor" className="text-sm text-foreground hover:text-primary">Editor</Link></li>
                <li><Link href="/landing" className="text-sm text-foreground hover:text-primary">Landing</Link></li>
                <li><Link href="/errors" className="text-sm text-foreground hover:text-primary">Errors</Link></li>
            </ul>
        </nav>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
