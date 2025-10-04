
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Terminal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorLogsAction, type ErrorLog } from '@/actions/errors';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';


const ErrorsPage = () => {
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
  }, [currentPage]);
  
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Terminal className="h-6 w-6" />
            Application Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
            {fetchError && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Fetching Logs</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
            )}
            {!fetchError && (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Stack Trace</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : errors.length > 0 ? (
                        errors.map(error => (
                            <TableRow key={error.id}>
                            <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
                            <TableCell><span className="font-mono text-xs bg-muted px-2 py-1 rounded-md">{error.source || 'N/A'}</span></TableCell>
                            <TableCell>{error.message}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                                <pre className="whitespace-pre-wrap break-all">{error.stack || 'N/A'}</pre>
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                            No errors logged.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between">
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
            </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ErrorsPage;
