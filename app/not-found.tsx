import { Button } from '@/components/ui/button';
import { Home, SearchX } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-screen flex-col overflow-y-auto bg-background text-foreground">
      <header className="border-b">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
          <Link href="/landing" className="text-lg font-semibold tracking-tight">
            Neup Sites
          </Link>
          <Button asChild variant="ghost">
            <Link href="/landing">
              <Home className="mr-2 h-4 w-4" />
              Homepage
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <section className="w-full max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <SearchX className="h-10 w-10 text-destructive" />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Error 404</p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight text-destructive sm:text-6xl">Page not found</h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            The page you requested does not exist, was moved, or is no longer available.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <Button asChild size="lg">
              <Link href="/landing">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
