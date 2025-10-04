
'use client';

import { useState, useEffect } from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { collection, getDocs, Timestamp, query, orderBy, limit } from 'firebase/firestore';
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

interface ErrorLog {
  id: string;
  message: string;
  source?: string;
  stack?: string;
  timestamp: string;
}

// Server action to fetch errors
async function getErrorLogs(): Promise<{ logs?: ErrorLog[], error?: string }> {
    try {
        const errorsCollection = collection(adminDb, 'errors');
        const q = query(errorsCollection, orderBy('timestamp', 'desc'), limit(50));
        const errorSnapshot = await getDocs(q);
        const errorsList = errorSnapshot.docs.map(doc => {
          const data = doc.data();
          const timestamp = data.timestamp as Timestamp;
          return {
            id: doc.id,
            message: data.message,
            source: data.source,
            stack: data.stack,
            timestamp: timestamp?.toDate().toISOString() || new Date().toISOString(),
          };
        });
        return { logs: errorsList };
    } catch (e: any) {
        console.error("Error fetching errors: ", e);
        if (e.code === 'permission-denied') {
            return { error: "Permission denied. Please check your Firestore security rules in the Firebase Console." };
        }
        if (e.message.includes('FIRESTORE_PROJECT_ID')) {
             return { error: 'Firebase project not configured on the server. Please check your service account setup.' };
        }
        return { error: 'An unexpected error occurred while fetching error logs.' };
    }
}


const ErrorsPage = () => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchErrors = async () => {
      setLoading(true);
      const { logs, error } = await getErrorLogs();
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
