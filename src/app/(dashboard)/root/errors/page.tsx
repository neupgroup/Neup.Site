
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Terminal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorLogsAction, type ErrorLog } from '@/actions/errors';


const ErrorsPage = () => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchErrors = async () => {
      setLoading(true);
      // Call the server action instead of the local function
      const { logs, error } = await getErrorLogsAction();
      if (logs) {
        setErrors(logs);
      } else {
        setFetchError(error || 'Unknown error occurred.');
      }
      setLoading(false);
    };

    fetchErrors();
  }, []);

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
      </Card>
    </div>
  );
};

export default ErrorsPage;
