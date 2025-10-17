'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDatalists } from '@/actions/datalists';
import { Datalist } from '@/schemas/datalist'; // Corrected import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, List, ArrowRight } from 'lucide-react';

export default function DatalistsPage() {
  const [datalists, setDatalists] = useState<Datalist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatalists = async () => {
      setLoading(true);
      const result = await getDatalists();
      if (result.success && result.datalists) {
        setDatalists(result.datalists);
      } else {
        setError(result.error || 'Failed to fetch datalists');
      }
      setLoading(false);
    };

    fetchDatalists();
  }, []);

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Datalists</h1>
        <Button asChild>
          <Link href="/site/datalists/create">
            <Plus className="mr-2 h-4 w-4" /> Create New Datalist
          </Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Your Datalists</CardTitle>
          <CardDescription>A list of all your custom data collections.</CardDescription>
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
          ) : datalists.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
              <List className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Datalists Yet</h3>
              <p>Click "Create New Datalist" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datalists.map((datalist: Datalist) => (
                  <TableRow key={datalist.id}>
                    <TableCell className="font-medium">{datalist.name}</TableCell>
                    <TableCell>{datalist.createdAt ? new Date(datalist.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/site/datalists/${datalist.id}`}>
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