/*
::neup.documentation::app-not-found-page

::public

Fallback 404 page for unresolved app routes.

It renders inside the shared dashboard shell so missing routes keep the current
header, sidebar, theme, and spacing.

::public end
::end
*/

import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[32rem] items-center justify-center">
      <div className="flex w-full max-w-3xl flex-col items-center gap-6 text-center">
        <div className="space-y-3">
          <p className="font-headline text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            404
          </p>
          <div className="space-y-3">
            <h1 className="font-headline text-4xl font-semibold tracking-tight sm:text-5xl">
              Page not found
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              This route does not exist for the current site.
            </p>
          </div>
        </div>

        <Button asChild variant="secondary" size="lg" className="px-6">
          <Link href="/">
            <Home />
            Return home
          </Link>
        </Button>
      </div>
    </div>
  );
}
