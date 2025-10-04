
'use client';

import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-semibold mt-4">Page Not Found</h2>
        <p className="text-muted-foreground mt-2">
            The page you're looking for within the dashboard doesn't exist.
        </p>
        <Button asChild className="mt-6">
            <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Dashboard
            </Link>
        </Button>
    </div>
  );
}
