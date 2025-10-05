'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur">
      </header>

      {/* Main Content */}
      <main className={cn('flex-1 pt-[var(--header-height,4rem)]')}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
      </footer>
    </div>
  );
}
