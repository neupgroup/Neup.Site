
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Terminal, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorLogsAction, type ErrorLog } from '@/actions/errors';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { usePageTitle } from '@/hooks/use-page-title';

const ErrorsPage = () => {
  usePageTitle('Errors', 'NeupSites');
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
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
            </div>
        </div>
      </header>
        <div className="space-y-2">
            {loading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-3 border rounded-md">
                           <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
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
            ) : (
                errors.map(error => (
                    <div key={error.id} className="p-3 bg-muted/50 rounded-md hover:bg-muted flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" title={error.message}>
                                <Link href={`/root/errors/${error.id}`} className="hover:underline">
                                    {error.message}
                                </Link>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(error.timestamp).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 self-end sm:self-center">
                            <Badge variant="outline" className="font-mono">{error.source || 'N/A'}</Badge>
                            <Button asChild variant="ghost" size="icon">
                                <Link href={`/root/errors/${error.id}`}>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </div>
        {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
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
