
'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Skeleton } from '#/components/ui/skeleton';
import { getErrorLogById, type ErrorLog } from '@/services/errors';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import Link from 'next/link';
import { Separator } from '#/components/ui/separator';
import { usePageTitle } from '#/core/hooks/use-page-title';

export default function ErrorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [log, setLog] = useState<ErrorLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  usePageTitle(log ? `Error: ${log.source}` : 'Error Details', 'NeupSites');

  useEffect(() => {
    const fetchError = async () => {
      setLoading(true);
      const { log, error } = await getErrorLogById(id);
      if (log) {
        setLog(log);
      } else {
        setError(error || 'Unknown error occurred.');
      }
      setLoading(false);
    };

    fetchError();
  }, [id]);

  if (loading) {
    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-48 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (error || !log) {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
             <LinkButton variant="plain" className="mb-4" href="/root/errors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Errors
                </LinkButton>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Fetching Log</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
        <LinkButton variant="plain" href="/root/errors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Errors
            </LinkButton>
      <Card>
        <CardHeader>
          <CardTitle>Error Details</CardTitle>
          <CardDescription>
            <strong>ID:</strong> {log.id} <br />
            <strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-semibold text-lg">Message</h3>
                <p className="font-mono bg-muted p-3 rounded-md text-sm whitespace-pre-wrap break-words">{log.message}</p>
            </div>
            <Separator />
            <div className="space-y-2">
                <h3 className="font-semibold text-lg">Source</h3>
                <p className="font-mono bg-muted px-2 py-1 rounded-md text-sm w-fit">{log.source || 'N/A'}</p>
            </div>
            <Separator />
            <div className="space-y-2">
                <h3 className="font-semibold text-lg">Stack Trace</h3>
                <pre className="bg-muted p-4 rounded-md text-xs whitespace-pre-wrap break-all font-mono overflow-auto max-h-96">
                    {log.stack || 'No stack trace available.'}
                </pre>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
