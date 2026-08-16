
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSections, type Section } from '@/services/editor/sections';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Layers, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePageTitle } from '@/core/hooks/use-page-title';

export default function SectionsPage() {
  usePageTitle('Sections');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      const result = await getSections();
      if (result.success && result.sections) {
        setSections(result.sections.sort((a, b) => (a.name > b.name ? 1 : -1)));
      } else {
        setError(result.error || 'Failed to fetch sections');
      }
      setLoading(false);
    };
    fetchSections();
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
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
      <header className="mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Sections</h1>
        <p className="mt-1 text-sm text-muted-foreground">Build reusable section blocks you can drop into pages across your site.</p>
      </header>
      <div className="space-y-0">
        <Link
          href="/site/sections/create"
          className={[
            'block border p-4 transition-colors hover:bg-muted/90',
            sections.length === 0 ? 'rounded-md' : 'rounded-t-md border-b-0',
          ].join(' ')}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Create New Section</h2>
                <p className="text-sm text-muted-foreground">Start a reusable section for repeated layouts and content blocks.</p>
              </div>
            </div>
          </div>
        </Link>
        {sections.length === 0 ? (
          <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12 mt-6">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Sections Yet</h3>
            <p>Use the first card to create your first reusable section.</p>
          </div>
        ) : (
          sections.map((section, index) => {
            const isLast = index === sections.length - 1;

            return (
              <Link
                key={section.id}
                href={`/site/sections/${section.id}`}
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
                      <Layers className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold">{section.name}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{section.type}</Badge>
                        <Badge variant="outline" className="capitalize">{section.createdBy}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0 self-start sm:self-start">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
