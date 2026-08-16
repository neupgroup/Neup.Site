
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPages, type Page } from '@/services/editor/pages';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Globe, Link as LinkIcon, Plus, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePageTitle } from '@/core/hooks/use-page-title';

export default function PagesPage() {
  usePageTitle('Pages');
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = async () => {
    setLoading(true);
    const pagesResult = await getPages();
    if (pagesResult.success && pagesResult.pages) {
      const sortedPages = pagesResult.pages.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
          const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
          return dateB.getTime() - dateA.getTime();
      });
      setPages(sortedPages);
    } else {
      setError(pagesResult.error || 'Failed to fetch pages');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-0">
          {[...Array(3)].map((_, i) => {
            const isFirst = i === 0;
            const isLast = i === 2;

            return (
              <div
                key={i}
                className={[
                  'border p-4',
                  isFirst ? 'rounded-t-md' : 'rounded-t-none',
                  isLast ? 'rounded-b-md' : 'rounded-b-none',
                  !isLast ? 'border-b-0' : '',
                ].join(' ')}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-20 rounded-md" />
                        <Skeleton className="h-6 w-24 rounded-md" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 rounded-sm" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="w-full max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Pages</h1>
      </header>
      <div className="space-y-0">
          <Link
            href="/site/pages/create"
            className={[
              'block border p-4 transition-colors hover:bg-muted/90',
              pages.length === 0 ? 'rounded-md' : 'rounded-t-md border-b-0',
            ].join(' ')}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold">Create New Page</h2>
                  <p className="text-sm text-muted-foreground">Start a new page and assign paths later.</p>
                </div>
              </div>
            </div>
          </Link>
      {pages.length === 0 ? (
        <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12 mt-6">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Pages Yet</h3>
            <p>Use the first card to create your first page.</p>
        </div>
      ) : (
          pages.map((page, index) => {
            const isLast = index === pages.length - 1;

            return (
            <Link
              key={page.id}
              href={`/site/pages/${page.id}`}
              className={[
                'block border p-4 transition-colors hover:bg-muted/90',
                'rounded-t-none',
                isLast ? 'rounded-b-md' : 'rounded-b-none',
                !isLast ? 'border-b-0' : '',
              ].join(' ')}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                          <h2 className="truncate text-base font-semibold">{page.name || page.id}</h2>
                          <p className="text-sm text-muted-foreground">Last updated: {page.updatedAt ? new Date(page.updatedAt).toLocaleString() : 'N/A'}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            {page.paths && page.paths.length > 0 ? (
                               <>
                                {page.paths.slice(0, 3).map(path => (
                                    <Badge key={path.id} variant="secondary" className="font-mono">{path.path}</Badge>
                                ))}
                                {page.paths.length > 3 && (
                                    <Badge variant="outline">+{page.paths.length - 3} more</Badge>
                                )}
                               </>
                            ) : (
                                <span className="text-xs text-muted-foreground">No paths assigned</span>
                            )}
                          </div>
                      </div>
                  </div>
                   <div className="flex items-center flex-shrink-0 self-start sm:self-start">
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
              </div>
            </Link>
          )})
      )}
      </div>
    </div>
  );
}
