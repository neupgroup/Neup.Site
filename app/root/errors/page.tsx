
'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Terminal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorLogsAction, type ErrorLog } from '@/services/errors';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePageTitle } from '@/core/hooks/use-page-title';

const ErrorsPage = () => {
  usePageTitle('Errors', 'NeupSites');
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = 10;

  useEffect(() => {
    const fetchErrors = async () => {
      setLoading(true);
      const { logs, error, totalCount } = await getErrorLogsAction({ page: currentPage, pageSize });
      if (logs) {
        setErrors(logs);
        setTotalCount(totalCount || 0);
      } else {
        setFetchError(error || 'Unknown error occurred.');
      }
      setLoading(false);
    };

    fetchErrors();
  }, [currentPage, pageSize]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  const sourceTokens = Array.from(new Set(errors.map((error) => error.source || 'N/A')));
  const visibleErrors = selectedSource
    ? errors.filter((error) => (error.source || 'N/A') === selectedSource)
    : errors;

  const handlePageChange = (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            <div>
              <h1 className="font-headline text-2xl font-semibold tracking-tight">Application Errors</h1>
              <p className="text-muted-foreground">A list of errors logged by the application.</p>
              {loading ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="h-7 w-20 rounded-md" />
                  ))}
                </div>
              ) : sourceTokens.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {sourceTokens.map((source) => {
                    const isActive = selectedSource === source;

                    return (
                      <button
                        key={source}
                        type="button"
                        onClick={() => setSelectedSource(isActive ? null : source)}
                        className={[
                          'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-mono transition-colors',
                          isActive
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                        ].join(' ')}
                        aria-pressed={isActive}
                      >
                        {source}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
        </div>
      </header>
        <div className="space-y-0">
            {loading ? (
                [...Array(5)].map((_, index) => {
                    const isFirst = index === 0;
                    const isLast = index === 4;

                    return (
                        <div
                            key={index}
                            className={[
                                'p-3 bg-muted/50 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border',
                                isFirst ? 'rounded-t-md' : 'rounded-t-none',
                                isLast ? 'rounded-b-md' : 'rounded-b-none',
                                !isLast ? 'border-b-0' : '',
                            ].join(' ')}
                        >
                            <div className="flex-1 min-w-0 space-y-2">
                                <Skeleton className="h-4 w-full max-w-3xl" />
                                <Skeleton className="h-4 w-4/5 max-w-2xl" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <div className="flex w-full items-center justify-end sm:w-auto sm:self-start">
                                <Skeleton className="h-4 w-4 rounded-sm" />
                            </div>
                        </div>
                    );
                })
            ) : fetchError ? (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Fetching Logs</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            ) : errors.length === 0 ? (
                 <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                    <Terminal className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Errors Logged</h3>
                    <p>The application has not logged any errors.</p>
                </div>
            ) : visibleErrors.length === 0 ? (
                 <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                    <Terminal className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Matching Errors</h3>
                    <p>No errors match the selected token.</p>
                </div>
            ) : (
                visibleErrors.map((error, index) => {
                    const isFirst = index === 0;
                    const isLast = index === visibleErrors.length - 1;

                    return (
                    <Link
                        key={error.id}
                        href={`/root/errors/${error.id}`}
                        className={[
                            'block p-3 bg-muted/50 hover:bg-muted/90 transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border',
                            isFirst ? 'rounded-t-md' : 'rounded-t-none',
                            isLast ? 'rounded-b-md' : 'rounded-b-none',
                            !isLast ? 'border-b-0' : '',
                        ].join(' ')}
                    >
                        <div className="flex-1 min-w-0 space-y-2">
                            <p className="text-sm font-medium whitespace-normal break-all" title={error.message}>
                                {error.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true })}
                            </p>
                        </div>
                        <div className="flex w-full items-center justify-end sm:w-auto sm:self-start">
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                    </Link>
                    );
                })
            )}
        </div>
        {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )}
    </div>
  );
};

export default ErrorsPage;
