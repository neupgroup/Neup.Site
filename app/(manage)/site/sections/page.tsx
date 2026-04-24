
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSections, type Section } from '@/server/editor/sections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Layers, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      const result = await getSections();
      if (result.success && result.sections) {
        setSections(result.sections.sort((a, b) => (a.name > b.name ? 1 : -1)));
      } else {
        setError(result.error || 'Failed to fetch sections');
      }
      setLoading(false);
    };
    fetchSections();
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <header className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-40" />
        </header>
        <Card>
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="w-full max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Sections</h1>
        <Button asChild>
          <Link href="/site/sections/create">
            <Plus className="mr-2 h-4 w-4" /> Create New Section
          </Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Reusable Sections</CardTitle>
          <CardDescription>A list of all reusable sections you have created.</CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Sections Yet</h3>
                <p>Click "Create New Section" to get started.</p>
            </div>
          ) : (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium">{section.name}</TableCell>
                    <TableCell>{section.type}</TableCell>
                    <TableCell className="capitalize">{section.createdBy}</TableCell>
                    <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                            <Link href={`/site/sections/${section.id}`}>
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
