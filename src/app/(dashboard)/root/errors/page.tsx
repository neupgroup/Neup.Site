
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
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
  stack?: string;
  timestamp: string; // Changed to string
}

const ErrorsPage = () => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        const errorsCollection = collection(db, 'errors');
        const errorSnapshot = await getDocs(errorsCollection);
        const errorsList = errorSnapshot.docs.map(doc => {
          const data = doc.data();
          const timestamp = data.timestamp as Timestamp;
          return {
            id: doc.id,
            message: data.message,
            stack: data.stack,
            timestamp: timestamp?.toDate().toISOString() || new Date().toISOString(),
          };
        });
        setErrors(errorsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (e: any) {
        console.error("Error fetching errors: ", e);
        if (e.code === 'permission-denied' || e.code === 'unauthenticated') {
            setFetchError("Permission denied. Please check your Firestore security rules in the Firebase Console. You may need to create the 'errors' collection and ensure your rules allow read access.");
        } else if (e.message.includes('firestore/unavailable')) {
            setFetchError('Failed to connect to Firestore. Please ensure Firestore is enabled and properly configured for your project in the Firebase Console.');
        } else {
            setFetchError('An unexpected error occurred while fetching error logs from Firestore.');
        }
      } finally {
        setLoading(false);
      }
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
                        <TableHead>Message</TableHead>
                        <TableHead>Stack Trace</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : errors.length > 0 ? (
                        errors.map(error => (
                            <TableRow key={error.id}>
                            <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{error.message}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                                <pre className="whitespace-pre-wrap break-all">{error.stack || 'N/A'}</pre>
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
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
