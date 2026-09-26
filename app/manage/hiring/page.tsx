'use client';

import { useState, useEffect } from 'react';
import { getJobPostings, type JobPosting } from '@/services/hiring';
import { LinkButton } from "@neup/components/ui/link-button";
import { Skeleton } from '@neup/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@neup/components/ui/alert';
import { AlertCircle, Plus, Briefcase, ArrowRight } from 'lucide-react';
import { Badge } from '@neup/components/ui/badge';
import { format } from 'date-fns';
import { usePageTitle } from '@neup/core/hooks/use-page-title';
import { useSearchParams } from 'next/navigation';
import { appendProject } from '@/inapp/helpers/application-mode';

export default function HiringDashboardPage() {
  usePageTitle('Hiring');
  const searchParams = useSearchParams();
  const project = searchParams.get('project');

  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostings = async () => {
      setLoading(true);
      const result = await getJobPostings();
      if (result.success && result.postings) {
        setPostings(result.postings);
      } else {
        setError(result.error || 'Failed to fetch job postings');
      }
      setLoading(false);
    };

    fetchPostings();
  }, []);

  return (
    <div className="w-full space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Hiring</h1>
      </header>
      {loading ? (
        <div className="grid gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          <LinkButton
            variant="plain"
            className="grid h-auto justify-start gap-4 rounded-lg border border-dashed bg-card px-5 py-4 text-left transition-colors hover:border-primary hover:bg-primary/5 md:grid-cols-[auto_1fr] md:items-center"
            href={appendProject('/manage/hiring/create', project)}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </span>
            <span>
              <span className="block font-medium">Create a new listing</span>
              <span className="block text-sm text-muted-foreground">Add an open position to this project.</span>
            </span>
          </LinkButton>

          {postings.map((posting) => (
            <LinkButton
              key={posting.id}
              variant="plain"
              className="grid h-auto justify-start gap-4 rounded-lg border bg-card px-5 py-4 text-left transition-colors hover:border-primary hover:bg-primary/5 md:grid-cols-[auto_1fr_auto] md:items-center"
              href={appendProject(`/manage/hiring/${posting.id}`, project)}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{posting.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {[posting.location, posting.type].filter(Boolean).join(' · ') || 'Details coming soon'}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {posting.createdAt ? `Created ${format(new Date(posting.createdAt), 'PPP')}` : 'No date available'}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <Badge variant={posting.status === 'Open' ? 'default' : 'secondary'}>{posting.status}</Badge>
                <ArrowRight className="h-4 w-4" />
              </span>
            </LinkButton>
          ))}

          {!postings.length ? (
            <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
              <Briefcase className="mx-auto mb-4 h-12 w-12" />
              <p className="font-medium text-foreground">No listings found.</p>
              <p className="mt-1 text-sm">Create a new listing to show positions here.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
