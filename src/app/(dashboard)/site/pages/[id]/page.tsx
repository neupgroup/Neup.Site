'use client';

import { useState, useEffect } from 'react';
import { getSite } from '@/actions/editor/site';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ViewPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [srcDoc, setSrcDoc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPage = async () => {
      setLoading(true);
      // We need to fetch the HTML content via a server action or API route
      // to use the `convertJsonToHtml` function which is not a client component.
      // A simple way is to just point the iframe to the existing preview URL.
      const result = await getSite(id);
      if (result.success && result.site) {
        // The preview page already generates the full HTML for us.
        // We can just use it as the source for our iframe.
        setSrcDoc(`/preview/${id}`);
      } else {
        setError(result.error || 'Failed to load page content.');
      }
      setLoading(false);
    };

    fetchPage();
  }, [id]);

  return (
    <div className="flex flex-col h-full">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Viewing Page</CardTitle>
                <CardDescription>Preview for page ID: {id}</CardDescription>
            </div>
            <Button asChild variant="outline">
                <Link href="/site/pages"><ArrowLeft className="mr-2 h-4 w-4" />Back to Pages</Link>
            </Button>
        </CardHeader>
        <CardContent>
             {loading && (
                <div className="w-full h-[60vh] flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                </div>
            )}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {!loading && !error && srcDoc && (
                <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
                    <iframe
                        src={srcDoc}
                        title={`Preview of page ${id}`}
                        className="w-full h-full"
                        sandbox="allow-scripts allow-same-origin" // Security precaution
                    />
                </div>
            )}
        </CardContent>
       </Card>
    </div>
  );
}
