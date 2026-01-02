

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Plus, Database, ArrowRight } from 'lucide-react';
import { getSources, type Source } from '@/actions/editor/sources';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const sourcesResult = await getSources();
      if (sourcesResult.success && sourcesResult.sources) {
        setSources(sourcesResult.sources);
      } else {
        setError(sourcesResult.error || 'Failed to fetch sources');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold font-headline">Data Sources</h1>
            <p className="text-muted-foreground">Manage your API and data sources.</p>
        </div>
        <Button asChild>
          <Link href="/site/sources/create">
            <Plus className="mr-2 h-4 w-4" /> Create New Source
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Existing Data Sources</CardTitle>
          <CardDescription>A list of all your currently configured data sources.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                        <Database className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        No data sources created yet.
                    </TableCell>
                  </TableRow>
                )}
                {sources.map(source => (
                  <TableRow key={source.id}>
                     <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell><Badge variant="outline">{source.type}</Badge></TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                            <Link href={`/site/sources/${source.id}`}>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
